<?php

namespace Database\Seeders;

use App\Models\Categoria;
use Illuminate\Database\Seeder;

class CategoriaSeeder extends Seeder
{
    /**
     * Paleta rotativa igual a la usada por la app móvil (src/base-datos/categoriasSemilla.ts).
     */
    private const PALETA = [
        '#7C4DFF', '#4C6FFF', '#EC4899', '#20D997',
        '#F8C15C', '#38BDF8', '#FB923C', '#A78BFA',
    ];

    /**
     * Mismas categorías, iconos y orden que src/base-datos/categoriasSemilla.ts,
     * para que los nombres coincidan con los que ya usa la app móvil.
     */
    private const GASTO = [
        ['nombre' => 'Alimentación', 'icono' => 'restaurant'],
        ['nombre' => 'Supermercado', 'icono' => 'local-grocery-store'],
        ['nombre' => 'Restaurantes', 'icono' => 'restaurant-menu'],
        ['nombre' => 'Transporte', 'icono' => 'directions-bus'],
        ['nombre' => 'Combustible', 'icono' => 'local-gas-station'],
        ['nombre' => 'Educación', 'icono' => 'school'],
        ['nombre' => 'Universidad', 'icono' => 'account-balance'],
        ['nombre' => 'Tecnología', 'icono' => 'devices'],
        ['nombre' => 'Salud', 'icono' => 'local-hospital'],
        ['nombre' => 'Medicamentos', 'icono' => 'medical-services'],
        ['nombre' => 'Vivienda', 'icono' => 'home'],
        ['nombre' => 'Alquiler', 'icono' => 'vpn-key'],
        ['nombre' => 'Servicios', 'icono' => 'build'],
        ['nombre' => 'Telefonía', 'icono' => 'phone-android'],
        ['nombre' => 'Internet', 'icono' => 'wifi'],
        ['nombre' => 'Entretenimiento', 'icono' => 'movie'],
        ['nombre' => 'Deporte', 'icono' => 'fitness-center'],
        ['nombre' => 'Ropa', 'icono' => 'checkroom'],
        ['nombre' => 'Mascotas', 'icono' => 'pets'],
        ['nombre' => 'Viajes', 'icono' => 'flight'],
        ['nombre' => 'Deudas', 'icono' => 'credit-card'],
        ['nombre' => 'Impuestos', 'icono' => 'receipt-long'],
        ['nombre' => 'Suscripciones', 'icono' => 'subscriptions'],
        ['nombre' => 'Regalos', 'icono' => 'card-giftcard'],
        ['nombre' => 'Negocio', 'icono' => 'storefront'],
        ['nombre' => 'Otros', 'icono' => 'category'],
    ];

    private const INGRESO = [
        ['nombre' => 'Salario', 'icono' => 'work'],
        ['nombre' => 'Ventas', 'icono' => 'sell'],
        ['nombre' => 'Trabajo independiente', 'icono' => 'laptop-mac'],
        ['nombre' => 'Comisiones', 'icono' => 'percent'],
        ['nombre' => 'Intereses', 'icono' => 'account-balance'],
        ['nombre' => 'Reembolsos', 'icono' => 'replay'],
        ['nombre' => 'Regalos', 'icono' => 'card-giftcard'],
        ['nombre' => 'Becas', 'icono' => 'school'],
        ['nombre' => 'Rentas', 'icono' => 'apartment'],
        ['nombre' => 'Dividendos', 'icono' => 'trending-up'],
        ['nombre' => 'Negocio', 'icono' => 'storefront'],
        ['nombre' => 'Otros', 'icono' => 'category'],
    ];

    public function run(): void
    {
        $indice = 0;

        foreach (self::GASTO as $categoria) {
            Categoria::create([
                'tipo' => 'gasto',
                'nombre' => $categoria['nombre'],
                'icono' => $categoria['icono'],
                'color' => self::PALETA[$indice++ % count(self::PALETA)],
                'activa' => true,
            ]);
        }

        foreach (self::INGRESO as $categoria) {
            Categoria::create([
                'tipo' => 'ingreso',
                'nombre' => $categoria['nombre'],
                'icono' => $categoria['icono'],
                'color' => self::PALETA[$indice++ % count(self::PALETA)],
                'activa' => true,
            ]);
        }
    }
}
