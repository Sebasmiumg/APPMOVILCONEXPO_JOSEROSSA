<?php

namespace Tests\Feature;

use App\Models\AporteMeta;
use App\Models\Meta;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActuaComoUsuarioAutenticado;
use Tests\TestCase;

class AporteMetaApiTest extends TestCase
{
    use ActuaComoUsuarioAutenticado;
    use RefreshDatabase;

    public function test_lista_los_aportes_de_una_meta(): void
    {
        $meta = Meta::factory()->create();
        AporteMeta::factory()->count(2)->create(['meta_id' => $meta->id]);
        AporteMeta::factory()->create();

        $response = $this->getJson("/api/metas/{$meta->id}/aportes");

        $response->assertStatus(200)->assertJsonCount(2);
    }

    public function test_crea_un_aporte_para_una_meta(): void
    {
        $meta = Meta::factory()->create();

        $payload = ['monto' => 250, 'fecha' => '2026-09-15', 'nota' => 'Ahorro quincenal'];

        $response = $this->postJson("/api/metas/{$meta->id}/aportes", $payload);

        $response->assertStatus(201)->assertJsonFragment(['nota' => 'Ahorro quincenal']);
        $this->assertDatabaseHas('aportes_meta', ['meta_id' => $meta->id, 'nota' => 'Ahorro quincenal']);
    }

    public function test_rechaza_un_aporte_invalido(): void
    {
        $meta = Meta::factory()->create();

        $response = $this->postJson("/api/metas/{$meta->id}/aportes", ['monto' => -5, 'fecha' => 'no-es-fecha']);

        $response->assertStatus(422)->assertJsonValidationErrors(['monto', 'fecha']);
    }

    public function test_actualiza_un_aporte(): void
    {
        $aporte = AporteMeta::factory()->create(['monto' => 100]);

        $response = $this->putJson("/api/aportes/{$aporte->id}", ['monto' => 300]);

        $response->assertStatus(200)->assertJsonFragment(['monto' => '300.00']);
        $this->assertDatabaseHas('aportes_meta', ['id' => $aporte->id, 'monto' => 300]);
    }

    public function test_elimina_un_aporte(): void
    {
        $aporte = AporteMeta::factory()->create();

        $response = $this->deleteJson("/api/aportes/{$aporte->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('aportes_meta', ['id' => $aporte->id]);
    }
}
