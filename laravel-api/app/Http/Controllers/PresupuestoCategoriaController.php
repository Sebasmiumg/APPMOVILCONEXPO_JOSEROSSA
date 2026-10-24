<?php

namespace App\Http\Controllers;

use App\Support\SupabaseFinance;
use App\Support\SupabaseResourceMapper;
use App\Support\SupabaseRowNotFound;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PresupuestoCategoriaController extends Controller
{
    public function index(SupabaseFinance $store)
    {
        $rows = $store->rows('presupuestos', [
            'usuario_id' => 'eq.'.$store->userId(),
            'order' => 'periodo.desc',
        ]);
        $categorias = $store->rows('categorias', ['or' => '(usuario_id.is.null,usuario_id.eq.'.$store->userId().')']);
        $mapa = [];
        foreach ($categorias as $categoria) {
            $normalizada = SupabaseResourceMapper::categoria($categoria);
            $mapa[$normalizada['id']] = $normalizada;
        }

        return response()->json(array_map(static fn (array $row): array => SupabaseResourceMapper::presupuesto($row, $mapa), $rows));
    }

    public function store(Request $request, SupabaseFinance $store)
    {
        $data = $request->validate([
            'categoria_id' => ['required', 'uuid'],
            'periodo' => ['required', 'date_format:Y-m'],
            'limite' => ['required', 'numeric', 'min:0'],
            'porcentaje_alerta' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);
        $this->validarCategoria($data['categoria_id'], $store);
        $row = $store->create('presupuestos', ['usuario_id' => $store->userId(), ...$data]);

        return response()->json($this->mapear($row, $store), 201);
    }

    public function show(string $presupuesto_categoria, SupabaseFinance $store)
    {
        $row = $store->first('presupuestos', [
            'id' => 'eq.'.$presupuesto_categoria,
            'usuario_id' => 'eq.'.$store->userId(),
        ]);

        return $row ? response()->json($this->mapear($row, $store)) : response()->json(['message' => 'Not found.'], 404);
    }

    public function update(Request $request, string $presupuesto_categoria, SupabaseFinance $store)
    {
        $data = $request->validate([
            'categoria_id' => ['sometimes', 'required', 'uuid'],
            'periodo' => ['sometimes', 'required', 'date_format:Y-m'],
            'limite' => ['sometimes', 'required', 'numeric', 'min:0'],
            'porcentaje_alerta' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);
        if (isset($data['categoria_id'])) {
            $this->validarCategoria($data['categoria_id'], $store);
        }
        try {
            return response()->json($this->mapear($store->update('presupuestos', $presupuesto_categoria, $data), $store));
        } catch (SupabaseRowNotFound) {
            return response()->json(['message' => 'Not found.'], 404);
        }
    }

    public function destroy(string $presupuesto_categoria, SupabaseFinance $store)
    {
        $store->delete('presupuestos', $presupuesto_categoria);

        return response()->noContent();
    }

    private function validarCategoria(string $id, SupabaseFinance $store): void
    {
        $categoria = $store->first('categorias', [
            'id' => 'eq.'.$id,
            'or' => '(usuario_id.is.null,usuario_id.eq.'.$store->userId().')',
            'activa' => 'eq.true',
        ], 'id');
        if (! $categoria) {
            throw ValidationException::withMessages(['categoria_id' => ['Selecciona una categoría activa y disponible para tu cuenta.']]);
        }
    }

    private function mapear(array $row, SupabaseFinance $store): array
    {
        $categorias = $store->rows('categorias', ['or' => '(usuario_id.is.null,usuario_id.eq.'.$store->userId().')']);
        $mapa = [];
        foreach ($categorias as $categoria) {
            $normalizada = SupabaseResourceMapper::categoria($categoria);
            $mapa[$normalizada['id']] = $normalizada;
        }

        return SupabaseResourceMapper::presupuesto($row, $mapa);
    }
}
