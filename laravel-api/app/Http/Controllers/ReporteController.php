<?php

namespace App\Http\Controllers;

use App\Models\Movimiento;
use Illuminate\Http\Request;

class ReporteController extends Controller
{
    /**
     * Reporte de movimientos de caja de efectivo agrupados por mes.
     *
     * Acepta opcionalmente ?anio=YYYY para filtrar un año específico.
     */
    public function movimientosPorMes(Request $request)
    {
        $validated = $request->validate([
            'anio' => ['sometimes', 'integer', 'digits:4'],
        ]);

        $consulta = Movimiento::query()
            ->selectRaw("strftime('%Y-%m', fecha) as periodo")
            ->selectRaw("SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as total_ingresos")
            ->selectRaw("SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as total_gastos")
            ->selectRaw('COUNT(*) as cantidad_movimientos');

        if (isset($validated['anio'])) {
            $consulta->whereRaw("strftime('%Y', fecha) = ?", [(string) $validated['anio']]);
        }

        $filas = $consulta
            ->groupBy('periodo')
            ->orderByDesc('periodo')
            ->get();

        $reporte = $filas->map(function ($fila) {
            $ingresos = round((float) $fila->total_ingresos, 2);
            $gastos = round((float) $fila->total_gastos, 2);

            return [
                'periodo' => $fila->periodo,
                'total_ingresos' => $ingresos,
                'total_gastos' => $gastos,
                'saldo_neto' => round($ingresos - $gastos, 2),
                'cantidad_movimientos' => (int) $fila->cantidad_movimientos,
            ];
        });

        return response()->json($reporte);
    }
}
