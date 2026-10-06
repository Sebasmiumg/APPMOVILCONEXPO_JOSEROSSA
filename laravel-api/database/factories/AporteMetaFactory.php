<?php

namespace Database\Factories;

use App\Models\AporteMeta;
use App\Models\Meta;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AporteMeta>
 */
class AporteMetaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'meta_id' => Meta::factory(),
            'monto' => $this->faker->randomFloat(2, 10, 1000),
            'fecha' => $this->faker->dateTimeBetween('-2 months', 'now')->format('Y-m-d'),
            'nota' => $this->faker->optional()->sentence(4),
        ];
    }
}
