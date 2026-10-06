<?php

namespace App\Http\Controllers;

use App\Models\PresupuestoCategoria;
use Illuminate\Http\Request;

class PresupuestoCategoriaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return PresupuestoCategoria::latest('periodo')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'categoria_id' => ['required', 'exists:categorias,id'],
            'periodo' => ['required', 'date_format:Y-m'],
            'limite' => ['required', 'numeric', 'min:0'],
            'porcentaje_alerta' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $presupuesto = PresupuestoCategoria::create($validated);

        return response()->json($presupuesto, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(PresupuestoCategoria $presupuesto_categoria)
    {
        return $presupuesto_categoria;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PresupuestoCategoria $presupuesto_categoria)
    {
        $validated = $request->validate([
            'categoria_id' => ['sometimes', 'required', 'exists:categorias,id'],
            'periodo' => ['sometimes', 'required', 'date_format:Y-m'],
            'limite' => ['sometimes', 'required', 'numeric', 'min:0'],
            'porcentaje_alerta' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $presupuesto_categoria->update($validated);

        return response()->json($presupuesto_categoria);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PresupuestoCategoria $presupuesto_categoria)
    {
        $presupuesto_categoria->delete();

        return response()->json(null, 204);
    }
}
