<?php

namespace Tests\Feature;

use App\Models\Movimiento;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActuaComoUsuarioAutenticado;
use Tests\TestCase;

class MovimientoApiTest extends TestCase
{
    use ActuaComoUsuarioAutenticado;
    use RefreshDatabase;

    public function test_lista_movimientos(): void
    {
        Movimiento::factory()->count(3)->create();

        $response = $this->getJson('/api/movimientos');

        $response->assertStatus(200)->assertJsonCount(3);
    }

    public function test_crea_un_movimiento(): void
    {
        $payload = [
            'descripcion' => 'Compra de supermercado',
            'monto' => 350.75,
            'tipo' => 'gasto',
            'categoria' => 'Comida',
            'cuenta' => 'Efectivo',
            'fecha' => '2026-08-20',
        ];

        $response = $this->postJson('/api/movimientos', $payload);

        $response->assertStatus(201)->assertJsonFragment(['descripcion' => 'Compra de supermercado']);
        $this->assertDatabaseHas('movimientos', ['descripcion' => 'Compra de supermercado']);
    }

    public function test_rechaza_un_movimiento_invalido(): void
    {
        $response = $this->postJson('/api/movimientos', [
            'descripcion' => '',
            'monto' => -50,
            'tipo' => 'otro',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['descripcion', 'monto', 'tipo', 'categoria', 'cuenta', 'fecha']);
    }

    public function test_muestra_un_movimiento(): void
    {
        $movimiento = Movimiento::factory()->create();

        $response = $this->getJson("/api/movimientos/{$movimiento->id}");

        $response->assertStatus(200)->assertJsonFragment(['id' => $movimiento->id]);
    }

    public function test_devuelve_404_si_el_movimiento_no_existe(): void
    {
        $response = $this->getJson('/api/movimientos/999');

        $response->assertStatus(404);
    }

    public function test_actualiza_un_movimiento(): void
    {
        $movimiento = Movimiento::factory()->create(['monto' => 100]);

        $response = $this->putJson("/api/movimientos/{$movimiento->id}", ['monto' => 400]);

        $response->assertStatus(200)->assertJsonFragment(['monto' => '400.00']);
        $this->assertDatabaseHas('movimientos', ['id' => $movimiento->id, 'monto' => 400]);
    }

    public function test_elimina_un_movimiento(): void
    {
        $movimiento = Movimiento::factory()->create();

        $response = $this->deleteJson("/api/movimientos/{$movimiento->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('movimientos', ['id' => $movimiento->id]);
    }
}
