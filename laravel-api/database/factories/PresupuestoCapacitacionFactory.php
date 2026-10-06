<?php

namespace Database\Factories;

use App\Models\PresupuestoCapacitacion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PresupuestoCapacitacion>
 */
class PresupuestoCapacitacionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $montoAsignado = $this->faker->randomFloat(2, 200, 5000);
        $fechaInicio = $this->faker->dateTimeBetween('-2 months', '+1 month');

        return [
            'nombre' => 'Capacitación de ' . $this->faker->jobTitle(),
            'descripcion' => $this->faker->sentence(10),
            'monto_asignado' => $montoAsignado,
            'monto_ejecutado' => $this->faker->randomFloat(2, 0, (float) $montoAsignado),
            'fecha_inicio' => $fechaInicio->format('Y-m-d'),
            'fecha_fin' => $this->faker->dateTimeBetween($fechaInicio, '+3 months')->format('Y-m-d'),
            'estado' => $this->faker->randomElement(['planificada', 'en_curso', 'finalizada', 'cancelada']),
        ];
    }
}
