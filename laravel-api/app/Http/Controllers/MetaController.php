<?php

namespace App\Http\Controllers;

use App\Support\SupabaseFinance;
use App\Support\SupabaseResourceMapper;
use App\Support\SupabaseRowNotFound;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MetaController extends Controller
{
    public function index(SupabaseFinance $store)
    {
        $rows = $store->rows('metas', ['usuario_id' => 'eq.'.$store->userId(), 'order' => 'creada_en.desc']);
        $aportes = $this->aportesPorMeta($rows, $store);

        return response()->json(array_map(
            static fn (array $row): array => SupabaseResourceMapper::meta($row, $aportes[$row['id']] ?? []),
            $rows
        ));
    }

    public function store(Request $request, SupabaseFinance $store)
    {
        $data = $this->validateData($request, true, $store);
        $data['usuario_id'] = $store->userId();
        $row = $store->create('metas', $data);

        return response()->json(SupabaseResourceMapper::meta($row), 201);
    }

    public function show(string $meta, SupabaseFinance $store)
    {
        $row = $this->buscarMeta($meta, $store);
        if (! $row) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        $aportes = $store->rows('aportes_meta', ['meta_id' => 'eq.'.$meta, 'order' => 'fecha.desc']);

        return response()->json(SupabaseResourceMapper::meta($row, array_map(SupabaseResourceMapper::aporte(...), $aportes)));
    }

    public function update(Request $request, string $meta, SupabaseFinance $store)
    {
        $data = $this->validateData($request, false, $store);
        try {
            return response()->json(SupabaseResourceMapper::meta($store->update('metas', $meta, $data)));
        } catch (SupabaseRowNotFound) {
            return response()->json(['message' => 'Not found.'], 404);
        }
    }

    public function destroy(string $meta, SupabaseFinance $store)
    {
        try {
            $store->update('metas', $meta, ['estado' => 'archivada']);
        } catch (SupabaseRowNotFound) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->noContent();
    }

    /** @return array<string, mixed>|null */
    public function buscarMeta(string $id, SupabaseFinance $store): ?array
    {
        return $store->first('metas', ['id' => 'eq.'.$id, 'usuario_id' => 'eq.'.$store->userId()]);
    }

    private function validateData(Request $request, bool $required, SupabaseFinance $store): array
    {
        $presence = $required ? ['required'] : ['sometimes', 'required'];
        $data = $request->validate([
            'cuenta_id' => ['nullable', 'uuid'],
            'nombre' => [...$presence, 'string', 'max:255'],
            'monto_objetivo' => [...$presence, 'numeric', 'gt:0'],
            'monto_actual' => ['sometimes', 'numeric', 'min:0'],
            'fecha_objetivo' => ['nullable', 'date'],
            'estado' => ['sometimes', 'in:activa,completada,archivada'],
        ]);

        if (! empty($data['cuenta_id'])) {
            $cuenta = $store->first('cuentas', [
                'id' => 'eq.'.$data['cuenta_id'],
                'usuario_id' => 'eq.'.$store->userId(),
            ], 'id');
            if (! $cuenta) {
                abort(422, 'The selected account does not belong to this user.');
            }
        }

        return $data;
    }

    private function aportesPorMeta(array $metas, SupabaseFinance $store): array
    {
        if ($metas === []) {
            return [];
        }
        $ids = array_map(static fn (array $meta): string => $meta['id'], $metas);
        $aportes = $store->rows('aportes_meta', [
            'meta_id' => 'in.('.implode(',', $ids).')',
            'order' => 'fecha.desc',
        ]);
        $porMeta = [];
        foreach ($aportes as $aporte) {
            $porMeta[$aporte['meta_id']][] = SupabaseResourceMapper::aporte($aporte);
        }

        return $porMeta;
    }
}
