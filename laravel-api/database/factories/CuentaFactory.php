<?php

namespace Database\Factories;

use App\Models\Cuenta;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Cuenta>
 */
class CuentaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre' => $this->faker->randomElement(['Efectivo', 'Cuenta de ahorro', 'Tarjeta de crédito', 'Billetera digital']),
            'tipo' => $this->faker->randomElement(['efectivo', 'cuenta_bancaria', 'cuenta_ahorro', 'tarjeta_credito', 'billetera_digital']),
            'moneda' => $this->faker->randomElement(['GTQ', 'USD']),
            'saldo_inicial' => $this->faker->randomFloat(2, 0, 10000),
            'color' => $this->faker->hexColor(),
            'icono' => 'account-balance-wallet',
            'activa' => true,
        ];
    }
}
