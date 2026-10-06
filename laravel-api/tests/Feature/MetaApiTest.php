<?php

namespace Tests\Feature;

use App\Models\Cuenta;
use App\Models\Meta;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActuaComoUsuarioAutenticado;
use Tests\TestCase;

class MetaApiTest extends TestCase
{
    use ActuaComoUsuarioAutenticado;
    use RefreshDatabase;

    public function test_lista_metas(): void
    {
        Meta::factory()->count(3)->create();

        $response = $this->getJson('/api/metas');

        $response->assertStatus(200)->assertJsonCount(3);
    }

    public function test_crea_una_meta(): void
    {
        $cuenta = Cuenta::factory()->create();

        $payload = [
            'cuenta_id' => $cuenta->id,
            'nombre' => 'Fondo de emergencia',
            'monto_objetivo' => 5000,
            'fecha_objetivo' => '2027-01-01',
        ];

        $response = $this->postJson('/api/metas', $payload);

        $response->assertStatus(201)->assertJsonFragment(['nombre' => 'Fondo de emergencia']);
        $this->assertDatabaseHas('metas', ['nombre' => 'Fondo de emergencia', 'cuenta_id' => $cuenta->id]);
    }

    public function test_rechaza_una_meta_invalida(): void
    {
        $response = $this->postJson('/api/metas', ['nombre' => '', 'monto_objetivo' => -10]);

        $response->assertStatus(422)->assertJsonValidationErrors(['nombre', 'monto_objetivo']);
    }

    public function test_muestra_una_meta_con_sus_aportes(): void
    {
        $meta = Meta::factory()->create();
        $meta->aportes()->create(['monto' => 100, 'fecha' => '2026-09-01']);

        $response = $this->getJson("/api/metas/{$meta->id}");

        $response->assertStatus(200)->assertJsonCount(1, 'aportes');
    }

    public function test_devuelve_404_si_la_meta_no_existe(): void
    {
        $response = $this->getJson('/api/metas/999');

        $response->assertStatus(404);
    }

    public function test_actualiza_una_meta(): void
    {
        $meta = Meta::factory()->create(['estado' => 'activa']);

        $response = $this->putJson("/api/metas/{$meta->id}", ['estado' => 'completada']);

        $response->assertStatus(200)->assertJsonFragment(['estado' => 'completada']);
        $this->assertDatabaseHas('metas', ['id' => $meta->id, 'estado' => 'completada']);
    }

    public function test_elimina_una_meta(): void
    {
        $meta = Meta::factory()->create();

        $response = $this->deleteJson("/api/metas/{$meta->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('metas', ['id' => $meta->id]);
    }
}
