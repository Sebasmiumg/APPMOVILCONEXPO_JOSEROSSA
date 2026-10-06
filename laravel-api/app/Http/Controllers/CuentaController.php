<?php

namespace App\Http\Controllers;

use App\Models\Cuenta;
use Illuminate\Http\Request;

class CuentaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Cuenta::latest()->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'tipo' => ['required', 'string', 'max:100'],
            'moneda' => ['sometimes', 'string', 'size:3'],
            'saldo_inicial' => ['sometimes', 'numeric'],
            'color' => ['nullable', 'string', 'max:20'],
            'icono' => ['nullable', 'string', 'max:100'],
            'activa' => ['sometimes', 'boolean'],
        ]);

        $cuenta = Cuenta::create($validated);

        return response()->json($cuenta, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Cuenta $cuenta)
    {
        return $cuenta;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Cuenta $cuenta)
    {
        $validated = $request->validate([
            'nombre' => ['sometimes', 'required', 'string', 'max:255'],
            'tipo' => ['sometimes', 'required', 'string', 'max:100'],
            'moneda' => ['sometimes', 'string', 'size:3'],
            'saldo_inicial' => ['sometimes', 'numeric'],
            'color' => ['nullable', 'string', 'max:20'],
            'icono' => ['nullable', 'string', 'max:100'],
            'activa' => ['sometimes', 'boolean'],
        ]);

        $cuenta->update($validated);

        return response()->json($cuenta);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Cuenta $cuenta)
    {
        $cuenta->delete();

        return response()->json(null, 204);
    }
}
