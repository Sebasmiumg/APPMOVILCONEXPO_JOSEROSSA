<?php

namespace App\Http\Controllers;

use App\Support\SupabaseFinance;
use App\Support\SupabaseResourceMapper;
use App\Support\SupabaseRowNotFound;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CuentaController extends Controller
{
    public function index(SupabaseFinance $store)
    {
        $rows = $store->rows('cuentas', [
            'usuario_id' => 'eq.'.$store->userId(),
            'activa' => 'eq.true',
            'order' => 'creada_en.desc',
        ]);

        return response()->json(array_map(SupabaseResourceMapper::cuenta(...), $rows));
    }

    public function store(Request $request, SupabaseFinance $store)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'tipo' => ['required', Rule::in(['efectivo', 'cuentaBancaria', 'cuentaAhorro', 'tarjetaCredito', 'negocio', 'billeteraDigital'])],
            'moneda' => ['sometimes', 'string', 'size:3'],
            'saldo_inicial' => ['sometimes', 'numeric'],
            'color' => ['nullable', 'string', 'max:20'],
            'icono' => ['nullable', 'string', 'max:100'],
            'activa' => ['sometimes', 'boolean'],
        ]);
        $data['usuario_id'] = $store->userId();

        $row = $store->create('cuentas', $data);

        return response()->json(SupabaseResourceMapper::cuenta($row), 201);
    }

    public function show(string $cuenta, SupabaseFinance $store)
    {
        $row = $store->first('cuentas', [
            'id' => 'eq.'.$cuenta,
            'usuario_id' => 'eq.'.$store->userId(),
        ]);

        return $row ? response()->json(SupabaseResourceMapper::cuenta($row)) : response()->json(['message' => 'Not found.'], 404);
    }

    public function update(Request $request, string $cuenta, SupabaseFinance $store)
    {
        $data = $request->validate([
            'nombre' => ['sometimes', 'required', 'string', 'max:255'],
            'tipo' => ['sometimes', 'required', Rule::in(['efectivo', 'cuentaBancaria', 'cuentaAhorro', 'tarjetaCredito', 'negocio', 'billeteraDigital'])],
            'moneda' => ['sometimes', 'required', 'string', 'size:3'],
            'saldo_inicial' => ['sometimes', 'numeric'],
            'color' => ['nullable', 'string', 'max:20'],
            'icono' => ['nullable', 'string', 'max:100'],
            'activa' => ['sometimes', 'boolean'],
        ]);

        try {
            return response()->json(SupabaseResourceMapper::cuenta($store->update('cuentas', $cuenta, $data)));
        } catch (SupabaseRowNotFound) {
            return response()->json(['message' => 'Not found.'], 404);
        }
    }

    public function destroy(string $cuenta, SupabaseFinance $store)
    {
        try {
            $store->update('cuentas', $cuenta, ['activa' => false, 'actualizado_en' => now()->toIso8601String()]);
        } catch (SupabaseRowNotFound) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->noContent();
    }
}
