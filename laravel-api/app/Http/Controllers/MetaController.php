<?php

namespace App\Http\Controllers;

use App\Models\Meta;
use Illuminate\Http\Request;

class MetaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Meta::with('aportes')->latest()->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'cuenta_id' => ['nullable', 'exists:cuentas,id'],
            'nombre' => ['required', 'string', 'max:255'],
            'monto_objetivo' => ['required', 'numeric', 'gt:0'],
            'monto_actual' => ['sometimes', 'numeric', 'min:0'],
            'fecha_objetivo' => ['nullable', 'date'],
            'estado' => ['sometimes', 'in:activa,completada,archivada'],
        ]);

        $meta = Meta::create($validated);

        return response()->json($meta, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Meta $meta)
    {
        return $meta->load('aportes');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Meta $meta)
    {
        $validated = $request->validate([
            'cuenta_id' => ['nullable', 'exists:cuentas,id'],
            'nombre' => ['sometimes', 'required', 'string', 'max:255'],
            'monto_objetivo' => ['sometimes', 'required', 'numeric', 'gt:0'],
            'monto_actual' => ['sometimes', 'numeric', 'min:0'],
            'fecha_objetivo' => ['nullable', 'date'],
            'estado' => ['sometimes', 'in:activa,completada,archivada'],
        ]);

        $meta->update($validated);

        return response()->json($meta);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Meta $meta)
    {
        $meta->delete();

        return response()->json(null, 204);
    }
}
