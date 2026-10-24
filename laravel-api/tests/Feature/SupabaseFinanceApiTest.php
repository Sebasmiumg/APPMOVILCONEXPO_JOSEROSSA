<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\Support\SupabaseApiTestCase;

class SupabaseFinanceApiTest extends SupabaseApiTestCase
{
    use RefreshDatabase;

    private const USER_ID = '11111111-1111-4111-8111-111111111111';
    private const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
    private const ACCOUNT_ID = '33333333-3333-4333-8333-333333333333';
    private const OTHER_ACCOUNT_ID = '44444444-4444-4444-8444-444444444444';
    private const CATEGORY_ID = '55555555-5555-4555-8555-555555555555';
    private const OTHER_CATEGORY_ID = '66666666-6666-4666-8666-666666666666';
    private const GOAL_ID = '77777777-7777-4777-8777-777777777777';
    private const OTHER_GOAL_ID = '88888888-8888-4888-8888-888888888888';
    private const MOVE_ID = '99999999-9999-4999-8999-999999999999';

    public function test_listado_de_cuentas_solo_devuelve_las_del_usuario_autenticado(): void
    {
        $this->actuarComoUsuario();
        $this->postgrest->seed('cuentas', [
            $this->cuenta(self::ACCOUNT_ID, self::USER_ID, 'Propia'),
            $this->cuenta(self::OTHER_ACCOUNT_ID, self::OTHER_USER_ID, 'Ajena'),
        ]);

        $this->getJson('/api/cuentas')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.nombre', 'Propia');

        Http::assertSent(fn (Request $request) => str_contains($request->url(), '/rest/v1/cuentas')
            && str_contains($request->url(), 'usuario_id=eq.'.self::USER_ID));
    }

    public function test_categorias_listan_categorias_globales_y_propias_pero_no_las_ajenas(): void
    {
        $this->actuarComoUsuario();
        $global = $this->categoria(self::CATEGORY_ID, null, 'Global');
        $propia = $this->categoria(self::OTHER_CATEGORY_ID, self::USER_ID, 'Propia');
        $ajena = $this->categoria(self::GOAL_ID, self::OTHER_USER_ID, 'Ajena');
        $this->postgrest->seed('categorias', [$global, $propia, $ajena]);

        $this->getJson('/api/categorias')->assertOk()->assertJsonCount(2);
    }

    public function test_crea_edita_y_archiva_una_cuenta_en_supabase(): void
    {
        $this->actuarComoUsuario();
        $this->postJson('/api/cuentas', [
            'nombre' => 'Ahorro', 'tipo' => 'cuentaAhorro', 'moneda' => 'GTQ', 'saldo_inicial' => 1500,
        ])->assertCreated()->assertJsonPath('nombre', 'Ahorro');
        $id = $this->postgrest->rows('cuentas')[0]['id'];

        $this->putJson('/api/cuentas/'.$id, ['nombre' => 'Ahorro editado'])
            ->assertOk()->assertJsonPath('nombre', 'Ahorro editado');
        $this->deleteJson('/api/cuentas/'.$id)->assertNoContent();

        $this->assertSame('Ahorro editado', $this->postgrest->rows('cuentas')[0]['nombre']);
        $this->assertFalse($this->postgrest->rows('cuentas')[0]['activa']);
    }

    public function test_crea_movimiento_con_referencias_propias_y_rechaza_cuenta_ajena(): void
    {
        $this->actuarComoUsuario();
        $this->postgrest->seed('cuentas', [
            $this->cuenta(self::ACCOUNT_ID, self::USER_ID, 'Efectivo'),
            $this->cuenta(self::OTHER_ACCOUNT_ID, self::OTHER_USER_ID, 'Otra cuenta'),
        ]);
        $this->postgrest->seed('categorias', [
            $this->categoria(self::CATEGORY_ID, self::USER_ID, 'Comida'),
            $this->categoria(self::OTHER_CATEGORY_ID, self::OTHER_USER_ID, 'Privada ajena'),
        ]);

        $payload = [
            'descripcion' => 'Compra', 'monto' => 25.50, 'tipo' => 'gasto', 'fecha' => '2026-10-15',
            'cuenta_id' => self::ACCOUNT_ID, 'categoria_id' => self::CATEGORY_ID,
        ];
        $this->postJson('/api/movimientos', $payload)
            ->assertCreated()->assertJsonPath('cuenta', 'Efectivo')->assertJsonPath('categoria', 'Comida');

        $guardado = $this->postgrest->rows('movimientos')[0];
        $this->assertSame(self::USER_ID, $guardado['usuario_id']);
        $this->assertSame(self::ACCOUNT_ID, $guardado['cuenta_id']);
        $this->putJson('/api/movimientos/'.$guardado['id'], ['descripcion' => 'Compra editada'])
            ->assertOk()->assertJsonPath('descripcion', 'Compra editada');

        $this->postJson('/api/movimientos', [...$payload, 'cuenta_id' => self::OTHER_ACCOUNT_ID])
            ->assertUnprocessable();
        $this->postJson('/api/movimientos', [...$payload, 'categoria_id' => self::OTHER_CATEGORY_ID])
            ->assertUnprocessable();
        $this->assertCount(1, $this->postgrest->rows('movimientos'));
        $this->deleteJson('/api/movimientos/'.$guardado['id'])->assertNoContent();
        $this->assertSame([], $this->postgrest->rows('movimientos'));
    }

    public function test_meta_y_presupuesto_rechazan_referencias_de_otro_usuario(): void
    {
        $this->actuarComoUsuario();
        $this->postgrest->seed('cuentas', [$this->cuenta(self::OTHER_ACCOUNT_ID, self::OTHER_USER_ID, 'Ajena')]);
        $this->postgrest->seed('categorias', [$this->categoria(self::OTHER_CATEGORY_ID, self::OTHER_USER_ID, 'Ajena')]);

        $this->postJson('/api/metas', [
            'cuenta_id' => self::OTHER_ACCOUNT_ID, 'nombre' => 'Fondo', 'monto_objetivo' => 1000,
        ])->assertUnprocessable();
        $this->postJson('/api/presupuestos-categoria', [
            'categoria_id' => self::OTHER_CATEGORY_ID, 'periodo' => '2026-10', 'limite' => 500,
        ])->assertUnprocessable();

        $this->assertSame([], $this->postgrest->rows('metas'));
        $this->assertSame([], $this->postgrest->rows('presupuestos'));
    }

    public function test_meta_con_cuenta_propia_y_aporte_guardan_y_devuelven_importes(): void
    {
        $this->actuarComoUsuario();
        $this->postgrest->seed('cuentas', [$this->cuenta(self::ACCOUNT_ID, self::USER_ID, 'Ahorro')]);

        $this->postJson('/api/metas', [
            'cuenta_id' => self::ACCOUNT_ID, 'nombre' => 'Emergencia', 'monto_objetivo' => 5000,
        ])->assertCreated()->assertJsonPath('nombre', 'Emergencia');
        $this->postgrest->seed('metas', [[
            'id' => self::GOAL_ID, 'usuario_id' => self::USER_ID, 'cuenta_id' => self::ACCOUNT_ID,
            'nombre' => 'Emergencia', 'monto_objetivo' => 5000, 'monto_actual' => 0,
            'estado' => 'activa', 'creada_en' => now()->toIso8601String(),
        ]]);

        $this->postJson('/api/metas/'.self::GOAL_ID.'/aportes', [
            'monto' => 250, 'fecha' => '2026-10-15', 'nota' => 'Aporte de prueba',
        ])->assertCreated()->assertJsonPath('nota', 'Aporte de prueba');
        $this->getJson('/api/metas/'.self::GOAL_ID.'/aportes')->assertOk()->assertJsonCount(1);
        $this->getJson('/api/metas/'.self::OTHER_GOAL_ID.'/aportes')->assertNotFound();

        $aporteId = $this->postgrest->rows('aportes_meta')[0]['id'];
        $this->putJson('/api/aportes/'.$aporteId, ['monto' => 300])->assertOk()->assertJsonPath('monto', 300);
        $this->deleteJson('/api/aportes/'.$aporteId)->assertNoContent();
        $this->assertSame([], $this->postgrest->rows('aportes_meta'));
    }

    public function test_meta_se_puede_listar_editar_y_archivar(): void
    {
        $this->actuarComoUsuario();
        $this->postgrest->seed('metas', [[
            'id' => self::GOAL_ID, 'usuario_id' => self::USER_ID, 'cuenta_id' => null,
            'nombre' => 'Viaje', 'monto_objetivo' => 2000, 'monto_actual' => 500,
            'estado' => 'activa', 'creada_en' => now()->toIso8601String(),
        ]]);

        $this->getJson('/api/metas')->assertOk()->assertJsonCount(1)->assertJsonPath('0.nombre', 'Viaje');
        $this->putJson('/api/metas/'.self::GOAL_ID, ['monto_objetivo' => 3000])
            ->assertOk()->assertJsonPath('monto_objetivo', 3000);
        $this->deleteJson('/api/metas/'.self::GOAL_ID)->assertNoContent();
        $this->assertSame('archivada', $this->postgrest->rows('metas')[0]['estado']);
    }

    public function test_presupuesto_acepta_categoria_global_y_reporte_solo_suma_movimientos_del_usuario(): void
    {
        $this->actuarComoUsuario();
        $this->postgrest->seed('categorias', [
            $this->categoria(self::CATEGORY_ID, null, 'Global'),
        ]);

        $this->postJson('/api/presupuestos-categoria', [
            'categoria_id' => self::CATEGORY_ID, 'periodo' => '2026-10', 'limite' => 800,
        ])->assertCreated()->assertJsonPath('categoria', 'Global');
        $presupuestoId = $this->postgrest->rows('presupuestos')[0]['id'];
        $this->getJson('/api/presupuestos-categoria')->assertOk()->assertJsonCount(1);
        $this->putJson('/api/presupuestos-categoria/'.$presupuestoId, ['limite' => 900])
            ->assertOk()->assertJsonPath('limite', 900);
        $this->deleteJson('/api/presupuestos-categoria/'.$presupuestoId)->assertNoContent();
        $this->assertSame([], $this->postgrest->rows('presupuestos'));

        $this->postgrest->seed('movimientos', [
            $this->movimiento(self::MOVE_ID, self::USER_ID, 'ingreso', 1000, '2026-10-01'),
            $this->movimiento('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', self::USER_ID, 'gasto', 250, '2026-10-02'),
            $this->movimiento('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', self::OTHER_USER_ID, 'ingreso', 9000, '2026-10-03'),
        ]);
        $this->getJson('/api/reportes/movimientos-por-mes?anio=2026')
            ->assertOk()->assertJsonCount(1)
            ->assertJsonPath('0.total_ingresos', 1000)
            ->assertJsonPath('0.total_gastos', 250)
            ->assertJsonPath('0.saldo_neto', 750)
            ->assertJsonPath('0.cantidad_movimientos', 2);
    }

    private function cuenta(string $id, string $userId, string $nombre): array
    {
        return [
            'id' => $id, 'usuario_id' => $userId, 'nombre' => $nombre, 'tipo' => 'efectivo',
            'moneda' => 'GTQ', 'saldo_inicial' => 100, 'activa' => true,
        ];
    }

    private function categoria(string $id, ?string $userId, string $nombre): array
    {
        return [
            'id' => $id, 'usuario_id' => $userId, 'tipo' => 'gasto',
            'nombre_clave_traduccion' => null, 'nombre_personalizado' => $nombre,
            'icono' => 'tag', 'color' => '#123456', 'activa' => true,
        ];
    }

    private function movimiento(string $id, string $userId, string $tipo, float $monto, string $fecha): array
    {
        return [
            'id' => $id, 'usuario_id' => $userId, 'cuenta_id' => self::ACCOUNT_ID,
            'categoria_id' => self::CATEGORY_ID, 'tipo' => $tipo, 'monto' => $monto,
            'descripcion' => 'Movimiento', 'fecha_movimiento' => $fecha.'T12:00:00Z',
        ];
    }
}
