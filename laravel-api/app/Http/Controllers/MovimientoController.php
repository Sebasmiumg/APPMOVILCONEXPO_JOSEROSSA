<?php

namespace App\Http\Controllers;

use App\Support\SupabaseFinance;
use App\Support\SupabaseResourceMapper;
use App\Support\SupabaseRowNotFound;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MovimientoController extends Controller
{
    public function index(SupabaseFinance $store)
    {
        $rows = $store->rows('movimientos', [
            'usuario_id' => 'eq.'.$store->userId(),
            'order' => 'fecha_movimiento.desc,creado_en.desc',
        ]);

        return response()->json($this->mapRows($rows, $store));
    }

    public function store(Request $request, SupabaseFinance $store)
    {
        $data = $this->validateData($request, true);
        $row = $store->create('movimientos', $this->toSupabase($data, $store));

        return response()->json($this->mapRows([$row], $store)[0], 201);
    }

    public function show(string $movimiento, SupabaseFinance $store)
    {
        $row = $store->first('movimientos', [
            'id' => 'eq.'.$movimiento,
            'usuario_id' => 'eq.'.$store->userId(),
        ]);

        return $row ? response()->json($this->mapRows([$row], $store)[0]) : response()->json(['message' => 'Not found.'], 404);
    }

    public function update(Request $request, string $movimiento, SupabaseFinance $store)
    {
        $actual = $store->first('movimientos', [
            'id' => 'eq.'.$movimiento,
            'usuario_id' => 'eq.'.$store->userId(),
        ]);
        if (! $actual) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $actualApi = $this->mapRows([$actual], $store)[0];
        $data = $this->validateData($request, false);
        $data = [...$actualApi, ...$data];

        try {
            $row = $store->update('movimientos', $movimiento, $this->toSupabase($data, $store));
        } catch (SupabaseRowNotFound) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->json($this->mapRows([$row], $store)[0]);
    }

    public function destroy(string $movimiento, SupabaseFinance $store)
    {
        $store->delete('movimientos', $movimiento);

        return response()->noContent();
    }

    private function validateData(Request $request, bool $required): array
    {
        $presence = $required ? ['required'] : ['sometimes', 'required'];
        $data = Validator::make($request->all(), [
            'descripcion' => [...$presence, 'string', 'max:255'],
            'monto' => [...$presence, 'numeric', 'min:0'],
            'tipo' => [...$presence, 'in:ingreso,gasto,transferencia,ajuste'],
            'fecha' => [...$presence, 'date'],
            'fecha_movimiento' => ['sometimes', 'date'],
            'cuenta_id' => ['sometimes', 'uuid'],
            'categoria_id' => ['nullable', 'uuid'],
            'cuenta' => ['sometimes', 'string', 'max:255'],
            'categoria' => ['nullable', 'string', 'max:255'],
            'notas' => ['nullable', 'string', 'max:2000'],
            'recurrente' => ['sometimes', 'boolean'],
        ])->validate();

        if ($required && empty($data['cuenta_id']) && empty($data['cuenta'])) {
            throw ValidationException::withMessages(['cuenta' => ['Selecciona una cuenta propia.']]);
        }
        if ($required && ! array_key_exists('categoria_id', $data) && ! array_key_exists('categoria', $data)) {
            $data['categoria_id'] = null;
        }

        return $data;
    }

    private function toSupabase(array $data, SupabaseFinance $store): array
    {
        $userId = $store->userId();
        $cuentas = $store->rows('cuentas', [
            'usuario_id' => 'eq.'.$userId,
            'activa' => 'eq.true',
        ]);
        $categorias = $store->rows('categorias', [
            'or' => '(usuario_id.is.null,usuario_id.eq.'.$userId.')',
        ]);
        $cuenta = $this->resolve($cuentas, $data['cuenta_id'] ?? null, $data['cuenta'] ?? null, 'cuenta');
        $categoria = $this->resolve($categorias, $data['categoria_id'] ?? null, $data['categoria'] ?? null, 'categoria', true);

        $resultado = [
            'usuario_id' => $userId,
            'cuenta_id' => $cuenta['id'],
            'categoria_id' => $categoria['id'] ?? null,
            'tipo' => $data['tipo'],
            'monto' => $data['monto'],
            'descripcion' => $data['descripcion'] ?? '',
            'notas' => $data['notas'] ?? null,
            'fecha_movimiento' => $data['fecha_movimiento'] ?? $data['fecha'] ?? now()->toIso8601String(),
            'recurrente' => (bool) ($data['recurrente'] ?? false),
        ];

        return $resultado;
    }

    private function resolve(array $rows, ?string $id, ?string $name, string $field, bool $nullable = false): ?array
    {
        if ($id) {
            foreach ($rows as $row) {
                if (($row['id'] ?? null) === $id && ($row['activa'] ?? true)) {
                    return $row;
                }
            }
            throw ValidationException::withMessages([$field => ['El registro no pertenece a esta cuenta.']]);
        }
        if ($name !== null && trim($name) !== '') {
            $target = mb_strtolower(trim($name));
            foreach ($rows as $row) {
                $label = $row['nombre_personalizado'] ?? SupabaseResourceMapper::nombreClave((string) ($row['nombre_clave_traduccion'] ?? ''));
                if ($target === mb_strtolower(trim((string) $label)) && ($row['activa'] ?? true)) {
                    return $row;
                }
            }
        }
        if ($nullable && ($id === null && ($name === null || trim($name) === ''))) {
            return null;
        }
        throw ValidationException::withMessages([$field => ['No se encontró un registro activo con ese nombre para esta cuenta.']]);
    }

    private function mapRows(array $rows, SupabaseFinance $store): array
    {
        $userId = $store->userId();
        $cuentas = $store->rows('cuentas', ['usuario_id' => 'eq.'.$userId]);
        $categorias = $store->rows('categorias', ['or' => '(usuario_id.is.null,usuario_id.eq.'.$userId.')']);
        $cuentaPorId = [];
        foreach ($cuentas as $cuenta) {
            $cuentaPorId[$cuenta['id']] = SupabaseResourceMapper::cuenta($cuenta);
        }
        $categoriaPorId = [];
        foreach ($categorias as $categoria) {
            $categoriaPorId[$categoria['id']] = SupabaseResourceMapper::categoria($categoria);
        }

        return array_map(
            static fn (array $row): array => SupabaseResourceMapper::movimiento($row, $cuentaPorId, $categoriaPorId),
            $rows
        );
    }
}
