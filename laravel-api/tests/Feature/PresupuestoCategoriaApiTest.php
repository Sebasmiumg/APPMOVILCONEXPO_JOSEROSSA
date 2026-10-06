<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\PresupuestoCategoria;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActuaComoUsuarioAutenticado;
use Tests\TestCase;

class PresupuestoCategoriaApiTest extends TestCase
{
    use ActuaComoUsuarioAutenticado;
    use RefreshDatabase;

    public function test_lista_presupuestos_de_categoria(): void
    {
        PresupuestoCategoria::factory()->count(3)->create();

        $response = $this->getJson('/api/presupuestos-categoria');

        $response->assertStatus(200)->assertJsonCount(3);
    }

    public function test_crea_un_presupuesto_de_categoria(): void
    {
        $categoria = Categoria::factory()->create(['tipo' => 'gasto']);

        $payload = [
            'categoria_id' => $categoria->id,
            'periodo' => '2026-09',
            'limite' => 800,
            'porcentaje_alerta' => 80,
        ];

        $response = $this->postJson('/api/presupuestos-categoria', $payload);

        $response->assertStatus(201)->assertJsonFragment(['periodo' => '2026-09']);
        $this->assertDatabaseHas('presupuestos_categoria', ['categoria_id' => $categoria->id, 'periodo' => '2026-09']);
    }

    public function test_rechaza_un_presupuesto_invalido(): void
    {
        $response = $this->postJson('/api/presupuestos-categoria', ['periodo' => 'no-es-periodo', 'limite' => -10]);

        $response->assertStatus(422)->assertJsonValidationErrors(['categoria_id', 'periodo', 'limite']);
    }

    public function test_muestra_un_presupuesto_de_categoria(): void
    {
        $presupuesto = PresupuestoCategoria::factory()->create();

        $response = $this->getJson("/api/presupuestos-categoria/{$presupuesto->id}");

        $response->assertStatus(200)->assertJsonFragment(['id' => $presupuesto->id]);
    }

    public function test_devuelve_404_si_el_presupuesto_no_existe(): void
    {
        $response = $this->getJson('/api/presupuestos-categoria/999');

        $response->assertStatus(404);
    }

    public function test_actualiza_un_presupuesto_de_categoria(): void
    {
        $presupuesto = PresupuestoCategoria::factory()->create(['limite' => 500]);

        $response = $this->putJson("/api/presupuestos-categoria/{$presupuesto->id}", ['limite' => 900]);

        $response->assertStatus(200)->assertJsonFragment(['limite' => '900.00']);
        $this->assertDatabaseHas('presupuestos_categoria', ['id' => $presupuesto->id, 'limite' => 900]);
    }

    public function test_elimina_un_presupuesto_de_categoria(): void
    {
        $presupuesto = PresupuestoCategoria::factory()->create();

        $response = $this->deleteJson("/api/presupuestos-categoria/{$presupuesto->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('presupuestos_categoria', ['id' => $presupuesto->id]);
    }
}
