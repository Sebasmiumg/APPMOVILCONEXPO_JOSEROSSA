<?php

namespace App\Support;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Access to the same Supabase rows used by the MiPresupuesto app.
 * The caller's JWT is forwarded so Postgres RLS remains the final owner check.
 */
final class SupabaseFinance
{
    private const TABLES = [
        'cuentas', 'categorias', 'movimientos', 'metas', 'aportes_meta', 'presupuestos',
    ];

    public function userId(): string
    {
        $id = Auth::user()?->supabase_user_id;
        if (! is_string($id) || ! Str::isUuid($id)) {
            throw new HttpException(403, 'A verified Supabase identity is required for financial data.');
        }

        return $id;
    }

    /** @return array<int, array<string, mixed>> */
    public function rows(string $table, array $filters = [], string $select = '*'): array
    {
        $this->assertTable($table);
        $filters = ['select' => $select, ...$filters];
        $response = $this->request()->get($table, $filters);

        return $this->decode($response->status(), $response->json());
    }

    /** @return array<string, mixed> */
    public function create(string $table, array $attributes): array
    {
        $this->assertTable($table);
        $response = $this->request()->withHeaders(['Prefer' => 'return=representation'])->post($table, $attributes);
        $rows = $this->decode($response->status(), $response->json());

        return $rows[0] ?? throw new RuntimeException('Supabase did not return the created row.');
    }

    /** @return array<string, mixed> */
    public function update(string $table, string $id, array $attributes): array
    {
        return $this->updateWhere($table, [
            'id' => 'eq.'.$id,
            'usuario_id' => 'eq.'.$this->userId(),
        ], $attributes);
    }

    /** @return array<string, mixed> */
    public function updateWhere(string $table, array $filters, array $attributes): array
    {
        $this->assertTable($table);
        $query = http_build_query($filters);
        $response = $this->request()
            ->withHeaders(['Prefer' => 'return=representation'])
            ->patch($table.'?'.$query, $attributes);
        $rows = $this->decode($response->status(), $response->json());

        return $rows[0] ?? throw new SupabaseRowNotFound;
    }

    public function delete(string $table, string $id): void
    {
        $this->deleteWhere($table, [
            'id' => 'eq.'.$id,
            'usuario_id' => 'eq.'.$this->userId(),
        ]);
    }

    public function deleteWhere(string $table, array $filters): void
    {
        $this->assertTable($table);
        $query = http_build_query($filters);
        $response = $this->request()->delete($table.'?'.$query);
        $this->decode($response->status(), $response->json());
    }

    /** @return array<string, mixed>|null */
    public function first(string $table, array $filters, string $select = '*'): ?array
    {
        return $this->rows($table, ['limit' => '1', ...$filters], $select)[0] ?? null;
    }

    private function request(): PendingRequest
    {
        $baseUrl = rtrim((string) config('services.supabase.url'), '/');
        $publishableKey = (string) config('services.supabase.publishable_key');
        $token = request()->bearerToken();
        if ($baseUrl === '' || $publishableKey === '' || ! $token) {
            throw new RuntimeException('Supabase financial data service is not configured.');
        }

        return Http::baseUrl($baseUrl.'/rest/v1/')
            ->acceptJson()
            ->asJson()
            ->withHeaders([
                'apikey' => $publishableKey,
                'Authorization' => 'Bearer '.$token,
            ])
            ->connectTimeout(2)
            ->timeout(8);
    }

    private function assertTable(string $table): void
    {
        if (! in_array($table, self::TABLES, true)) {
            throw new RuntimeException('Unsupported Supabase table.');
        }
    }

    /** @return array<int, array<string, mixed>> */
    private function decode(int $status, mixed $body): array
    {
        if ($status < 200 || $status >= 300) {
            if ($status === 404 || ($status === 406 && $body === null)) {
                return [];
            }

            throw new RuntimeException('Supabase financial data request failed with status '.$status.'.');
        }

        if ($body === null || $body === '') {
            return [];
        }
        if (! is_array($body)) {
            throw new RuntimeException('Supabase returned an invalid financial data response.');
        }

        return array_is_list($body) ? $body : [$body];
    }
}

final class SupabaseRowNotFound extends RuntimeException
{
}
