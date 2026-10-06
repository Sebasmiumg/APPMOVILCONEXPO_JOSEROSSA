<?php

namespace Database\Factories;

use App\Models\Cuenta;
use App\Models\Meta;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Meta>
 */
class MetaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $montoObjetivo = $this->faker->randomFloat(2, 500, 20000);

        return [
            'cuenta_id' => Cuenta::factory(),
            'nombre' => $this->faker->randomElement(['Fondo de emergencia', 'Viaje', 'Nuevo laptop', 'Enganche de auto']),
            'monto_objetivo' => $montoObjetivo,
            'monto_actual' => $this->faker->randomFloat(2, 0, (float) $montoObjetivo),
            'fecha_objetivo' => $this->faker->dateTimeBetween('+1 month', '+1 year')->format('Y-m-d'),
            'estado' => $this->faker->randomElement(['activa', 'completada', 'archivada']),
        ];
    }
}
