<?php

namespace Tests\Feature;

use App\Models\Categoria;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\ActuaComoUsuarioAutenticado;
use Tests\TestCase;

class CategoriaApiTest extends TestCase
{
    use ActuaComoUsuarioAutenticado;
    use RefreshDatabase;

    public function test_lista_categorias(): void
    {
        Categoria::factory()->count(3)->create();

        $response = $this->getJson('/api/categorias');

        $response->assertStatus(200)->assertJsonCount(3);
    }

    public function test_crea_una_categoria(): void
    {
        $payload = [
            'tipo' => 'gasto',
            'nombre' => 'Comida',
            'icono' => 'restaurant',
            'color' => '#FF5733',
        ];

        $response = $this->postJson('/api/categorias', $payload);

        $response->assertStatus(201)->assertJsonFragment(['nombre' => 'Comida']);
        $this->assertDatabaseHas('categorias', ['nombre' => 'Comida']);
    }

    public function test_rechaza_una_categoria_invalida(): void
    {
        $response = $this->postJson('/api/categorias', ['tipo' => 'otro', 'nombre' => '']);

        $response->assertStatus(422)->assertJsonValidationErrors(['tipo', 'nombre', 'icono', 'color']);
    }

    public function test_muestra_una_categoria(): void
    {
        $categoria = Categoria::factory()->create();

        $response = $this->getJson("/api/categorias/{$categoria->id}");

        $response->assertStatus(200)->assertJsonFragment(['id' => $categoria->id]);
    }

    public function test_devuelve_404_si_la_categoria_no_existe(): void
    {
        $response = $this->getJson('/api/categorias/999');

        $response->assertStatus(404);
    }

    public function test_actualiza_una_categoria(): void
    {
        $categoria = Categoria::factory()->create(['nombre' => 'Comida']);

        $response = $this->putJson("/api/categorias/{$categoria->id}", ['nombre' => 'Restaurantes']);

        $response->assertStatus(200)->assertJsonFragment(['nombre' => 'Restaurantes']);
        $this->assertDatabaseHas('categorias', ['id' => $categoria->id, 'nombre' => 'Restaurantes']);
    }

    public function test_elimina_una_categoria(): void
    {
        $categoria = Categoria::factory()->create();

        $response = $this->deleteJson("/api/categorias/{$categoria->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('categorias', ['id' => $categoria->id]);
    }
}
