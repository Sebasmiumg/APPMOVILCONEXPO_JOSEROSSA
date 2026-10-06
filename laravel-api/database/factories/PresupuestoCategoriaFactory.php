<?php

namespace Database\Factories;

use App\Models\Categoria;
use App\Models\PresupuestoCategoria;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PresupuestoCategoria>
 */
class PresupuestoCategoriaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'categoria_id' => Categoria::factory(['tipo' => 'gasto']),
            'periodo' => $this->faker->date('Y-m'),
            'limite' => $this->faker->randomFloat(2, 100, 5000),
            'porcentaje_alerta' => $this->faker->randomElement([50, 75, 80, 90, 100]),
        ];
    }
}
