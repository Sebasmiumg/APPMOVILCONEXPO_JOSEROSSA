<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\AccesoCapacitaciones;
use Closure;
use Illuminate\Database\QueryException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AutenticarBearerHibrido
{
    public function handle(Request $request, Closure $next): Response
    {
        $usuarioSanctum = Auth::guard('sanctum')->user();
        if ($usuarioSanctum) {
            if (! AccesoCapacitaciones::emailPermitido($usuarioSanctum->email)) {
                return response()->json(['message' => 'This account cannot access Capacitaciones.'], 403);
            }

            Auth::shouldUse('sanctum');

            return $next($request);
        }

        $token = $request->bearerToken();
        if (! $token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $url = rtrim((string) config('services.supabase.url'), '/');
        $publishableKey = (string) config('services.supabase.publishable_key');
        if ($url === '' || $publishableKey === '') {
            return response()->json(['message' => 'Authentication service is not configured.'], 503);
        }

        try {
            $respuesta = Http::acceptJson()
                ->withHeaders(['apikey' => $publishableKey])
                ->withToken($token)
                ->connectTimeout(2)
                ->timeout(5)
                ->get($url.'/auth/v1/user');
        } catch (ConnectionException) {
            return response()->json(['message' => 'Authentication service unavailable.'], 503);
        }

        if ($respuesta->unauthorized() || $respuesta->forbidden()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
        if (! $respuesta->successful()) {
            return response()->json(['message' => 'Authentication service unavailable.'], 503);
        }

        $identidad = $respuesta->json();
        if (is_array($identidad) && ! AccesoCapacitaciones::emailPermitido($identidad['email'] ?? null)) {
            return response()->json(['message' => 'This account cannot access Capacitaciones.'], 403);
        }

        $usuario = is_array($identidad) ? $this->resolverUsuario($identidad) : null;
        if (! $usuario) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        Auth::shouldUse('web');
        Auth::guard('web')->setUser($usuario);
        $request->setUserResolver(static fn () => $usuario);

        return $next($request);
    }

    private function resolverUsuario(array $identidad): ?User
    {
        $supabaseId = $identidad['id'] ?? null;
        $email = isset($identidad['email']) ? mb_strtolower(trim($identidad['email'])) : '';
        $emailConfirmado = $identidad['email_confirmed_at'] ?? $identidad['confirmed_at'] ?? null;

        if (! is_string($supabaseId) || ! Str::isUuid($supabaseId) || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return null;
        }

        $usuario = User::where('supabase_user_id', $supabaseId)->first();
        if ($usuario) {
            return $usuario;
        }

        // Solo se enlaza por correo cuando Supabase confirma que pertenece al usuario.
        if (! $emailConfirmado) {
            return null;
        }

        try {
            return DB::transaction(function () use ($identidad, $supabaseId, $email, $emailConfirmado): User {
                $usuario = User::where('supabase_user_id', $supabaseId)->lockForUpdate()->first();
                if ($usuario) {
                    return $usuario;
                }

                $usuario = User::where('email', $email)->lockForUpdate()->first();
                if ($usuario) {
                    if ($usuario->supabase_user_id && $usuario->supabase_user_id !== $supabaseId) {
                        throw new IdentityConflict;
                    }

                    $usuario->supabase_user_id = $supabaseId;
                    $usuario->email_verified_at = $emailConfirmado;
                    $usuario->save();

                    return $usuario;
                }

                $metadata = is_array($identidad['user_metadata'] ?? null) ? $identidad['user_metadata'] : [];
                $nombre = $metadata['nombre'] ?? $metadata['name'] ?? $metadata['full_name'] ?? strtok($email, '@');

                return User::create([
                    'name' => is_string($nombre) && trim($nombre) !== '' ? trim($nombre) : 'Usuario',
                    'email' => $email,
                    'email_verified_at' => $emailConfirmado,
                    'password' => Str::random(64),
                    'supabase_user_id' => $supabaseId,
                ]);
            });
        } catch (IdentityConflict) {
            return null;
        } catch (QueryException) {
            // Tolera dos primeras peticiones concurrentes del mismo usuario.
            return User::where('supabase_user_id', $supabaseId)->first();
        }
    }
}

class IdentityConflict extends \RuntimeException {}
