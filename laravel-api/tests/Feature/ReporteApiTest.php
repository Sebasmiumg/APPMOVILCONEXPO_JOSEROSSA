<?php

namespace Tests\Feature;

use App\Models\Movimiento;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActuaComoUsuarioAutenticado;
use Tests\TestCase;

class ReporteApiTest extends TestCase
{
    use ActuaComoUsuarioAutenticado;
    use RefreshDatabase;

    public function test_agrupa_los_movimientos_por_mes(): void
    {
        Movimiento::factory()->create(['tipo' => 'ingreso', 'monto' => 1000, 'fecha' => '2026-08-05']);
        Movimiento::factory()->create(['tipo' => 'gasto', 'monto' => 300, 'fecha' => '2026-08-20']);
        Movimiento::factory()->create(['tipo' => 'ingreso', 'monto' => 500, 'fecha' => '2026-09-10']);

        $response = $this->getJson('/api/reportes/movimientos-por-mes');

        $response->assertStatus(200)->assertJsonCount(2);
        $response->assertJsonFragment([
            'periodo' => '2026-08',
            'total_ingresos' => 1000,
            'total_gastos' => 300,
            'saldo_neto' => 700,
            'cantidad_movimientos' => 2,
        ]);
        $response->assertJsonFragment([
            'periodo' => '2026-09',
            'total_ingresos' => 500,
            'total_gastos' => 0,
            'saldo_neto' => 500,
            'cantidad_movimientos' => 1,
        ]);
    }

    public function test_filtra_el_reporte_por_anio(): void
    {
        Movimiento::factory()->create(['tipo' => 'ingreso', 'monto' => 100, 'fecha' => '2025-01-10']);
        Movimiento::factory()->create(['tipo' => 'ingreso', 'monto' => 200, 'fecha' => '2026-01-10']);

        $response = $this->getJson('/api/reportes/movimientos-por-mes?anio=2026');

        $response->assertStatus(200)->assertJsonCount(1);
        $response->assertJsonFragment(['periodo' => '2026-01', 'total_ingresos' => 200]);
    }

    public function test_devuelve_arreglo_vacio_sin_movimientos(): void
    {
        $response = $this->getJson('/api/reportes/movimientos-por-mes');

        $response->assertStatus(200)->assertJsonCount(0);
    }
}
