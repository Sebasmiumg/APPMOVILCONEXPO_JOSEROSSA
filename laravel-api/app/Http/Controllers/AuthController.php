<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\AccesoCapacitaciones;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $datos = $request->validate([
            'email' => ['required', 'email', 'max:254'],
            'password' => ['required', 'string', 'max:1024'],
        ]);

        if (! AccesoCapacitaciones::emailPermitido($datos['email'])) {
            Log::warning('login_fallido');

            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        $url = rtrim((string) config('services.supabase.url'), '/');
        $publishableKey = (string) config('services.supabase.publishable_key');
        if ($url === '' || $publishableKey === '') {
            return response()->json(['message' => 'Authentication service is not configured.'], 503);
        }

        try {
            $respuesta = Http::acceptJson()
                ->asJson()
                ->withHeaders(['apikey' => $publishableKey])
                ->connectTimeout(2)
                ->timeout(8)
                ->post($url.'/auth/v1/token?grant_type=password', $datos);
        } catch (ConnectionException) {
            return response()->json(['message' => 'Authentication service unavailable.'], 503);
        }

        $sesion = $respuesta->json();
        $expiresIn = is_array($sesion) ? filter_var($sesion['expires_in'] ?? null, FILTER_VALIDATE_INT) : false;
        if (! $respuesta->successful() || ! is_array($sesion) || ! is_string($sesion['access_token'] ?? null)
            || ! is_array($sesion['user'] ?? null) || ! is_string($sesion['user']['id'] ?? null)
            || $expiresIn === false || $expiresIn < 1) {
            Log::warning('login_fallido');

            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        $identidad = $sesion['user'];
        $nombre = data_get($identidad, 'user_metadata.nombre')
            ?? data_get($identidad, 'user_metadata.name')
            ?? data_get($identidad, 'user_metadata.full_name')
            ?? strtok($datos['email'], '@');

        return response()->json([
            'usuario' => [
                'id' => $identidad['id'],
                'name' => is_string($nombre) && trim($nombre) !== '' ? trim($nombre) : 'Usuario',
                'email' => $identidad['email'] ?? $datos['email'],
            ],
            'token' => $sesion['access_token'],
            'refresh_token' => $sesion['refresh_token'] ?? null,
            'expires_in' => $expiresIn,
            'expires_at' => now()->addSeconds($expiresIn)->toIso8601String(),
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
            return response()->noContent();
        }

        $url = rtrim((string) config('services.supabase.url'), '/');
        $publishableKey = (string) config('services.supabase.publishable_key');
        if ($url !== '' && $publishableKey !== '') {
            Http::acceptJson()
                ->withHeaders(['apikey' => $publishableKey])
                ->withToken((string) $request->bearerToken())
                ->connectTimeout(2)
                ->timeout(5)
                ->post($url.'/auth/v1/logout');
        }

        return response()->noContent();
    }
}
