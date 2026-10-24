<?php

namespace Tests\Support;

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/** Small in-memory PostgREST substitute for controller contract tests. */
final class FakeSupabasePostgrest
{
    /** @var array<string, array<int, array<string, mixed>>> */
    private array $tables = [];

    /** @param array<int, array<string, mixed>> $rows */
    public function seed(string $table, array $rows): void
    {
        $this->tables[$table] = array_values($rows);
    }

    /** @return array<int, array<string, mixed>> */
    public function rows(string $table): array
    {
        return $this->tables[$table] ?? [];
    }

    public function handle(Request $request)
    {
        $path = (string) parse_url($request->url(), PHP_URL_PATH);
        if (! str_starts_with($path, '/rest/v1/')) {
            return $this->jsonResponse(['message' => 'No fake configured for this Supabase endpoint.'], 404);
        }
        $table = basename($path);
        $query = [];
        parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $query);
        $matches = $this->matchingIndexes($table, $query);

        return match ($request->method()) {
            'GET' => $this->jsonResponse(array_map(fn (int $i) => $this->tables[$table][$i], $matches)),
            'POST' => $this->insert($table, $request->data()),
            'PATCH' => $this->patch($table, $matches, $request->data(), $request->hasHeader('Prefer', 'return=representation')),
            'DELETE' => $this->delete($table, $matches),
            default => $this->jsonResponse(['message' => 'Unsupported fake PostgREST method.'], 405),
        };
    }

    /** @return array<int, int> */
    private function matchingIndexes(string $table, array $query): array
    {
        $rows = $this->tables[$table] ?? [];
        $indexes = [];
        foreach ($rows as $index => $row) {
            if ($this->matches($row, $query)) {
                $indexes[] = $index;
            }
        }

        return $indexes;
    }

    private function matches(array $row, array $query): bool
    {
        foreach ($query as $field => $filter) {
            if (in_array($field, ['select', 'order', 'limit'], true)) {
                continue;
            }
            if ($field === 'or') {
                $alternatives = explode(',', trim((string) $filter, '()'));
                $matched = false;
                foreach ($alternatives as $alternative) {
                    [$column, $operator, $expected] = array_pad(explode('.', $alternative, 3), 3, null);
                    if ($operator === 'is' && $expected === 'null' && ($row[$column] ?? null) === null) {
                        $matched = true;
                    }
                    if ($operator === 'eq' && (string) ($row[$column] ?? '') === (string) $expected) {
                        $matched = true;
                    }
                }
                if (! $matched) {
                    return false;
                }
                continue;
            }

            [$operator, $expected] = array_pad(explode('.', (string) $filter, 2), 2, null);
            $actual = $row[$field] ?? null;
            $matches = match ($operator) {
                'eq' => $this->equal($actual, $expected),
                'is' => $expected === 'null' ? $actual === null : (string) $actual === (string) $expected,
                'in' => in_array((string) $actual, explode(',', trim((string) $expected, '()')), true),
                'gte' => (string) $actual >= (string) $expected,
                'lte' => (string) $actual <= (string) $expected,
                default => true,
            };
            if (! $matches) {
                return false;
            }
        }

        return true;
    }

    private function equal(mixed $actual, mixed $expected): bool
    {
        if ($expected === 'true') {
            return $actual === true || $actual === 1 || $actual === '1' || $actual === 'true';
        }
        if ($expected === 'false') {
            return $actual === false || $actual === 0 || $actual === '0' || $actual === 'false';
        }

        return (string) $actual === (string) $expected;
    }

    private function insert(string $table, array $data)
    {
        $defaults = [
            'id' => (string) Str::uuid(),
            'creada_en' => now()->toIso8601String(),
            'actualizado_en' => now()->toIso8601String(),
            'creado_en' => now()->toIso8601String(),
            'activa' => true,
            'moneda' => 'GTQ',
            'saldo_inicial' => 0,
            'monto_actual' => 0,
            'fecha_objetivo' => null,
            'estado' => 'activa',
            'porcentaje_alerta' => 80,
            'categoria_id' => null,
            'nombre_clave_traduccion' => null,
            'nombre_personalizado' => null,
            'color' => null,
            'icono' => null,
            'notas' => null,
            'recurrente' => false,
            'comprobante_url' => null,
        ];
        $row = [...$defaults, ...$data];
        $this->tables[$table] ??= [];
        $this->tables[$table][] = $row;

        return $this->jsonResponse([$row], 201);
    }

    private function patch(string $table, array $indexes, array $data, bool $representation)
    {
        $updated = [];
        foreach ($indexes as $index) {
            $this->tables[$table][$index] = [...$this->tables[$table][$index], ...$data];
            $updated[] = $this->tables[$table][$index];
        }

        return $representation ? $this->jsonResponse($updated) : $this->jsonResponse([], 204);
    }

    private function delete(string $table, array $indexes)
    {
        foreach (array_reverse($indexes) as $index) {
            unset($this->tables[$table][$index]);
        }
        $this->tables[$table] = array_values($this->tables[$table] ?? []);

        return $this->jsonResponse([], 204);
    }

    private function jsonResponse(array $data, int $status = 200)
    {
        return Http::response($data, $status);
    }
}
