<?php

namespace Tests\Feature;

use App\Models\PresupuestoCapacitacion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActuaComoUsuarioAutenticado;
use Tests\TestCase;

class PresupuestoCapacitacionApiTest extends TestCase
{
    use ActuaComoUsuarioAutenticado;
    use RefreshDatabase;

    public function test_lista_presupuestos_de_capacitacion(): void
    {
        PresupuestoCapacitacion::factory()->count(3)->create();

        $response = $this->getJson('/api/presupuestos-capacitacion');

        $response->assertStatus(200)->assertJsonCount(3);
    }

    public function test_crea_un_presupuesto_de_capacitacion(): void
    {
        $payload = [
            'nombre' => 'Capacitación de Laravel avanzado',
            'descripcion' => 'Taller interno para el equipo de backend',
            'monto_asignado' => 1500,
            'fecha_inicio' => '2026-10-01',
            'fecha_fin' => '2026-10-15',
            'estado' => 'planificada',
        ];

        $response = $this->postJson('/api/presupuestos-capacitacion', $payload);

        $response->assertStatus(201)->assertJsonFragment(['nombre' => 'Capacitación de Laravel avanzado']);
        $this->assertDatabaseHas('presupuestos_capacitacion', ['nombre' => 'Capacitación de Laravel avanzado']);
    }

    public function test_rechaza_un_presupuesto_invalido(): void
    {
        $response = $this->postJson('/api/presupuestos-capacitacion', [
            'nombre' => '',
            'monto_asignado' => -50,
            'fecha_inicio' => 'no-es-una-fecha',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['nombre', 'monto_asignado', 'fecha_inicio']);
    }

    public function test_muestra_un_presupuesto_de_capacitacion(): void
    {
        $presupuesto = PresupuestoCapacitacion::factory()->create();

        $response = $this->getJson("/api/presupuestos-capacitacion/{$presupuesto->id}");

        $response->assertStatus(200)->assertJsonFragment(['id' => $presupuesto->id]);
    }

    public function test_devuelve_404_si_el_presupuesto_no_existe(): void
    {
        $response = $this->getJson('/api/presupuestos-capacitacion/999');

        $response->assertStatus(404);
    }

    public function test_actualiza_un_presupuesto_de_capacitacion(): void
    {
        $presupuesto = PresupuestoCapacitacion::factory()->create(['estado' => 'planificada']);

        $response = $this->putJson("/api/presupuestos-capacitacion/{$presupuesto->id}", ['estado' => 'en_curso']);

        $response->assertStatus(200)->assertJsonFragment(['estado' => 'en_curso']);
        $this->assertDatabaseHas('presupuestos_capacitacion', ['id' => $presupuesto->id, 'estado' => 'en_curso']);
    }

    public function test_elimina_un_presupuesto_de_capacitacion(): void
    {
        $presupuesto = PresupuestoCapacitacion::factory()->create();

        $response = $this->deleteJson("/api/presupuestos-capacitacion/{$presupuesto->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('presupuestos_capacitacion', ['id' => $presupuesto->id]);
    }
}
