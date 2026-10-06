<?php

namespace Database\Factories;

use App\Models\Movimiento;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Movimiento>
 */
class MovimientoFactory extends Factory
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
            'descripcion' => $this->faker->sentence(3),
            'monto' => $this->faker->randomFloat(2, 5, 2000),
            'tipo' => $tipo,
            'categoria' => $tipo === 'ingreso'
                ? $this->faker->randomElement(['Salario', 'Ventas', 'Regalo'])
                : $this->faker->randomElement(['Comida', 'Transporte', 'Servicios', 'Entretenimiento']),
            'cuenta' => $this->faker->randomElement(['Efectivo', 'Cuenta de ahorro', 'Tarjeta de credito']),
            'fecha' => $this->faker->dateTimeBetween('-2 months', 'now')->format('Y-m-d'),
        ];
    }
}
