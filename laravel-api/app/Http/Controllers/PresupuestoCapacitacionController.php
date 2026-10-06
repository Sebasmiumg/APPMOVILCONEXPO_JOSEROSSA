<?php

namespace App\Http\Controllers;

use App\Models\PresupuestoCapacitacion;
use Illuminate\Http\Request;

class PresupuestoCapacitacionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return PresupuestoCapacitacion::latest('fecha_inicio')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'monto_asignado' => ['required', 'numeric', 'min:0'],
            'monto_ejecutado' => ['sometimes', 'numeric', 'min:0'],
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin' => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
            'estado' => ['sometimes', 'in:planificada,en_curso,finalizada,cancelada'],
        ]);

        $presupuesto = PresupuestoCapacitacion::create($validated);

        return response()->json($presupuesto, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(PresupuestoCapacitacion $presupuestos_capacitacion)
    {
        return $presupuestos_capacitacion;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PresupuestoCapacitacion $presupuestos_capacitacion)
    {
        $validated = $request->validate([
            'nombre' => ['sometimes', 'required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'monto_asignado' => ['sometimes', 'required', 'numeric', 'min:0'],
            'monto_ejecutado' => ['sometimes', 'numeric', 'min:0'],
            'fecha_inicio' => ['sometimes', 'required', 'date'],
            'fecha_fin' => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
            'estado' => ['sometimes', 'in:planificada,en_curso,finalizada,cancelada'],
        ]);

        $presupuestos_capacitacion->update($validated);

        return response()->json($presupuestos_capacitacion);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PresupuestoCapacitacion $presupuestos_capacitacion)
    {
        $presupuestos_capacitacion->delete();

        return response()->json(null, 204);
    }
}
