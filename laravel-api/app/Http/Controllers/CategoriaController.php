<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use Illuminate\Http\Request;

class CategoriaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Categoria::orderBy('nombre')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'tipo' => ['required', 'in:ingreso,gasto'],
            'nombre' => ['required', 'string', 'max:100'],
            'icono' => ['required', 'string', 'max:100'],
            'color' => ['required', 'string', 'max:20'],
            'activa' => ['sometimes', 'boolean'],
        ]);

        $categoria = Categoria::create($validated);

        return response()->json($categoria, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Categoria $categoria)
    {
        return $categoria;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Categoria $categoria)
    {
        $validated = $request->validate([
            'tipo' => ['sometimes', 'required', 'in:ingreso,gasto'],
            'nombre' => ['sometimes', 'required', 'string', 'max:100'],
            'icono' => ['sometimes', 'required', 'string', 'max:100'],
            'color' => ['sometimes', 'required', 'string', 'max:20'],
            'activa' => ['sometimes', 'boolean'],
        ]);

        $categoria->update($validated);

        return response()->json($categoria);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Categoria $categoria)
    {
        $categoria->delete();

        return response()->json(null, 204);
    }
}
