<?php

namespace App\Http\Controllers;

use App\Models\Movimiento;
use Illuminate\Http\Request;

class MovimientoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Movimiento::latest('fecha')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'descripcion' => ['required', 'string', 'max:255'],
            'monto' => ['required', 'numeric', 'min:0'],
            'tipo' => ['required', 'in:ingreso,gasto'],
            'categoria' => ['required', 'string', 'max:100'],
            'cuenta' => ['required', 'string', 'max:100'],
            'fecha' => ['required', 'date'],
        ]);

        $movimiento = Movimiento::create($validated);

        return response()->json($movimiento, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Movimiento $movimiento)
    {
        return $movimiento;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Movimiento $movimiento)
    {
        $validated = $request->validate([
            'descripcion' => ['sometimes', 'required', 'string', 'max:255'],
            'monto' => ['sometimes', 'required', 'numeric', 'min:0'],
            'tipo' => ['sometimes', 'required', 'in:ingreso,gasto'],
            'categoria' => ['sometimes', 'required', 'string', 'max:100'],
            'cuenta' => ['sometimes', 'required', 'string', 'max:100'],
            'fecha' => ['sometimes', 'required', 'date'],
        ]);

        $movimiento->update($validated);

        return response()->json($movimiento);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Movimiento $movimiento)
    {
        $movimiento->delete();

        return response()->json(null, 204);
    }
}
