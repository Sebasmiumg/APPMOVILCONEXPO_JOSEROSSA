<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    // Sin WithoutModelEvents: DatosDemoSeeder depende del evento `creating`
    // de Eloquent (vía BelongsToAuthenticatedUser(OrGlobal)) para asignar
    // user_id automáticamente a cada registro sembrado.

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            CategoriaSeeder::class,
            DatosDemoSeeder::class,
        ]);
    }
}
