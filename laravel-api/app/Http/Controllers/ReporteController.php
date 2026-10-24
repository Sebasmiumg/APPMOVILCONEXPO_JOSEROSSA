<?php

namespace App\Http\Controllers;

use App\Support\SupabaseFinance;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ReporteController extends Controller
{
    public function movimientosPorMes(Request $request, SupabaseFinance $store)
    {
        $validated = $request->validate(['anio' => ['sometimes', 'integer', 'digits:4']]);
        $movimientos = $store->rows('movimientos', ['usuario_id' => 'eq.'.$store->userId()]);
        $agrupados = [];

        foreach ($movimientos as $movimiento) {
            if (! in_array($movimiento['tipo'] ?? null, ['ingreso', 'gasto'], true)) {
                continue;
            }
            $periodo = Carbon::parse($movimiento['fecha_movimiento'])->format('Y-m');
            if (isset($validated['anio']) && ! str_starts_with($periodo, (string) $validated['anio'].'-')) {
                continue;
            }
            $agrupados[$periodo] ??= ['ingresos' => 0.0, 'gastos' => 0.0, 'cantidad' => 0];
            $tipo = $movimiento['tipo'] === 'ingreso' ? 'ingresos' : 'gastos';
            $agrupados[$periodo][$tipo] += (float) $movimiento['monto'];
            $agrupados[$periodo]['cantidad']++;
        }

        krsort($agrupados);
        $reporte = [];
        foreach ($agrupados as $periodo => $totales) {
            $ingresos = round($totales['ingresos'], 2);
            $gastos = round($totales['gastos'], 2);
            $reporte[] = [
                'periodo' => $periodo,
                'total_ingresos' => $ingresos,
                'total_gastos' => $gastos,
                'saldo_neto' => round($ingresos - $gastos, 2),
                'cantidad_movimientos' => $totales['cantidad'],
            ];
        }

        return response()->json($reporte);
    }
}
