<?php

namespace App\Http\Controllers;

use App\Support\SupabaseFinance;
use App\Support\SupabaseResourceMapper;
use App\Support\SupabaseRowNotFound;
use Illuminate\Http\Request;

class CategoriaController extends Controller
{
    public function index(SupabaseFinance $store)
    {
        $rows = $store->rows('categorias', [
            'or' => '(usuario_id.is.null,usuario_id.eq.'.$store->userId().')',
            'activa' => 'eq.true',
            'order' => 'tipo.asc,nombre_clave_traduccion.asc,nombre_personalizado.asc',
        ]);

        return response()->json(array_map(SupabaseResourceMapper::categoria(...), $rows));
    }

    public function store(Request $request, SupabaseFinance $store)
    {
        $data = $request->validate([
            'tipo' => ['required', 'in:ingreso,gasto'],
            'nombre' => ['required', 'string', 'max:100'],
            'icono' => ['required', 'string', 'max:100'],
            'color' => ['required', 'string', 'max:20'],
            'activa' => ['sometimes', 'boolean'],
        ]);
        $row = $store->create('categorias', [
            'usuario_id' => $store->userId(),
            'tipo' => $data['tipo'],
            'nombre_clave_traduccion' => null,
            'nombre_personalizado' => $data['nombre'],
            'icono' => $data['icono'],
            'color' => $data['color'],
            'activa' => $data['activa'] ?? true,
        ]);

        return response()->json(SupabaseResourceMapper::categoria($row), 201);
    }

    public function show(string $categoria, SupabaseFinance $store)
    {
        $row = $store->first('categorias', [
            'id' => 'eq.'.$categoria,
            'or' => '(usuario_id.is.null,usuario_id.eq.'.$store->userId().')',
        ]);

        return $row ? response()->json(SupabaseResourceMapper::categoria($row)) : response()->json(['message' => 'Not found.'], 404);
    }

    public function update(Request $request, string $categoria, SupabaseFinance $store)
    {
        $data = $request->validate([
            'tipo' => ['sometimes', 'required', 'in:ingreso,gasto'],
            'nombre' => ['sometimes', 'required', 'string', 'max:100'],
            'icono' => ['sometimes', 'required', 'string', 'max:100'],
            'color' => ['sometimes', 'required', 'string', 'max:20'],
            'activa' => ['sometimes', 'boolean'],
        ]);
        if (array_key_exists('nombre', $data)) {
            $data['nombre_personalizado'] = $data['nombre'];
            $data['nombre_clave_traduccion'] = null;
            unset($data['nombre']);
        }

        try {
            return response()->json(SupabaseResourceMapper::categoria($store->update('categorias', $categoria, $data)));
        } catch (SupabaseRowNotFound) {
            return response()->json(['message' => 'Not found.'], 404);
        }
    }

    public function destroy(string $categoria, SupabaseFinance $store)
    {
        try {
            $store->update('categorias', $categoria, ['activa' => false, 'actualizado_en' => now()->toIso8601String()]);
        } catch (SupabaseRowNotFound) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->noContent();
    }
}
