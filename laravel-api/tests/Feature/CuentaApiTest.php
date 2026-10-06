<?php

namespace Tests\Feature;

use App\Models\Cuenta;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActuaComoUsuarioAutenticado;
use Tests\TestCase;

class CuentaApiTest extends TestCase
{
    use ActuaComoUsuarioAutenticado;
    use RefreshDatabase;

    public function test_lista_cuentas(): void
    {
        Cuenta::factory()->count(3)->create();

        $response = $this->getJson('/api/cuentas');

        $response->assertStatus(200)->assertJsonCount(3);
    }

    public function test_crea_una_cuenta(): void
    {
        $payload = [
            'nombre' => 'Cuenta de ahorro',
            'tipo' => 'cuenta_ahorro',
            'moneda' => 'GTQ',
            'saldo_inicial' => 1500,
        ];

        $response = $this->postJson('/api/cuentas', $payload);

        $response->assertStatus(201)->assertJsonFragment(['nombre' => 'Cuenta de ahorro']);
        $this->assertDatabaseHas('cuentas', ['nombre' => 'Cuenta de ahorro']);
    }

    public function test_rechaza_una_cuenta_invalida(): void
    {
        $response = $this->postJson('/api/cuentas', ['nombre' => '', 'tipo' => '']);

        $response->assertStatus(422)->assertJsonValidationErrors(['nombre', 'tipo']);
    }

    public function test_muestra_una_cuenta(): void
    {
        $cuenta = Cuenta::factory()->create();

        $response = $this->getJson("/api/cuentas/{$cuenta->id}");

        $response->assertStatus(200)->assertJsonFragment(['id' => $cuenta->id]);
    }

    public function test_devuelve_404_si_la_cuenta_no_existe(): void
    {
        $response = $this->getJson('/api/cuentas/999');

        $response->assertStatus(404);
    }

    public function test_actualiza_una_cuenta(): void
    {
        $cuenta = Cuenta::factory()->create(['activa' => true]);

        $response = $this->putJson("/api/cuentas/{$cuenta->id}", ['activa' => false]);

        $response->assertStatus(200)->assertJsonFragment(['activa' => false]);
        $this->assertDatabaseHas('cuentas', ['id' => $cuenta->id, 'activa' => false]);
    }

    public function test_elimina_una_cuenta(): void
    {
        $cuenta = Cuenta::factory()->create();

        $response = $this->deleteJson("/api/cuentas/{$cuenta->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('cuentas', ['id' => $cuenta->id]);
    }
}
