<?php

namespace Database\Factories;

use App\Models\Categoria;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Categoria>
 */
class CategoriaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $tipo = $this->faker->randomElement(['ingreso', 'gasto']);

        return [
            'tipo' => $tipo,
            'nombre' => $tipo === 'ingreso'
                ? $this->faker->randomElement(['Salario', 'Ventas', 'Regalo'])
                : $this->faker->randomElement(['Comida', 'Transporte', 'Servicios', 'Entretenimiento']),
            'icono' => 'category',
            'color' => $this->faker->hexColor(),
            'activa' => true,
        ];
    }
}
