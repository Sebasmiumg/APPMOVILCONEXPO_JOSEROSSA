<?php

namespace App\Http\Controllers;

use App\Support\SupabaseFinance;
use App\Support\SupabaseResourceMapper;
use Illuminate\Http\Request;

class AporteMetaController extends Controller
{
    public function index(string $meta, SupabaseFinance $store, MetaController $metas)
    {
        abort_unless($metas->buscarMeta($meta, $store), 404);
        $rows = $store->rows('aportes_meta', ['meta_id' => 'eq.'.$meta, 'order' => 'fecha.desc']);

        return response()->json(array_map(SupabaseResourceMapper::aporte(...), $rows));
    }

    public function store(Request $request, string $meta, SupabaseFinance $store, MetaController $metas)
    {
        abort_unless($metas->buscarMeta($meta, $store), 404);
        $data = $request->validate([
            'monto' => ['required', 'numeric', 'gt:0'],
            'fecha' => ['required', 'date'],
            'nota' => ['nullable', 'string', 'max:255'],
        ]);
        $aporte = $store->create('aportes_meta', ['meta_id' => $meta, ...$data]);

        return response()->json(SupabaseResourceMapper::aporte($aporte), 201);
    }

    public function show(string $aporte, SupabaseFinance $store)
    {
        $row = $this->aportePropio($aporte, $store);

        return $row ? response()->json(SupabaseResourceMapper::aporte($row)) : response()->json(['message' => 'Not found.'], 404);
    }

    public function update(Request $request, string $aporte, SupabaseFinance $store)
    {
        if (! $this->aportePropio($aporte, $store)) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        $data = $request->validate([
            'monto' => ['sometimes', 'required', 'numeric', 'gt:0'],
            'fecha' => ['sometimes', 'required', 'date'],
            'nota' => ['nullable', 'string', 'max:255'],
        ]);
        $row = $this->aportePropio($aporte, $store);
        $updated = $store->updateWhere('aportes_meta', [
            'id' => 'eq.'.$aporte,
            'meta_id' => 'eq.'.$row['meta_id'],
        ], $data);

        return response()->json(SupabaseResourceMapper::aporte($updated));
    }

    public function destroy(string $aporte, SupabaseFinance $store)
    {
        $row = $this->aportePropio($aporte, $store);
        if ($row) {
            $store->deleteWhere('aportes_meta', [
                'id' => 'eq.'.$aporte,
                'meta_id' => 'eq.'.$row['meta_id'],
            ]);
        }

        return response()->noContent();
    }

    private function aportePropio(string $id, SupabaseFinance $store): ?array
    {
        $aporte = $store->first('aportes_meta', ['id' => 'eq.'.$id]);
        if (! $aporte) {
            return null;
        }
        $meta = $store->first('metas', [
            'id' => 'eq.'.$aporte['meta_id'],
            'usuario_id' => 'eq.'.$store->userId(),
        ], 'id');

        return $meta ? $aporte : null;
    }
}
