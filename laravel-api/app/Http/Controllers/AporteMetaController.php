<?php

namespace App\Http\Controllers;

use App\Models\AporteMeta;
use App\Models\Meta;
use Illuminate\Http\Request;

class AporteMetaController extends Controller
{
    /**
     * Display a listing of the resource for the given meta.
     */
    public function index(Meta $meta)
    {
        return $meta->aportes()->latest('fecha')->get();
    }

    /**
     * Store a newly created resource in storage for the given meta.
     */
    public function store(Request $request, Meta $meta)
    {
        $validated = $request->validate([
            'monto' => ['required', 'numeric', 'gt:0'],
            'fecha' => ['required', 'date'],
            'nota' => ['nullable', 'string', 'max:255'],
        ]);

        $aporte = $meta->aportes()->create($validated);

        return response()->json($aporte, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(AporteMeta $aporte)
    {
        return $aporte;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, AporteMeta $aporte)
    {
        $validated = $request->validate([
            'monto' => ['sometimes', 'required', 'numeric', 'gt:0'],
            'fecha' => ['sometimes', 'required', 'date'],
            'nota' => ['nullable', 'string', 'max:255'],
        ]);

        $aporte->update($validated);

        return response()->json($aporte);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AporteMeta $aporte)
    {
        $aporte->delete();

        return response()->json(null, 204);
    }
}
