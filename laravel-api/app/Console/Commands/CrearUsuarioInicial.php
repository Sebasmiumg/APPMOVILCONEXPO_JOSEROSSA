<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class CrearUsuarioInicial extends Command
{
    protected $signature = 'usuarios:crear-inicial';

    protected $description = 'Crea (si no existe) el primer usuario a partir de ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NAME del entorno';

    public function handle(): int
    {
        $email = env('ADMIN_EMAIL');
        $password = env('ADMIN_PASSWORD');
        $name = env('ADMIN_NAME', 'Administrador');

        if (! $email || ! $password) {
            $this->info('ADMIN_EMAIL/ADMIN_PASSWORD no configuradas, no se crea ningún usuario.');

            return self::SUCCESS;
        }

        if (User::where('email', $email)->exists()) {
            $this->info("El usuario {$email} ya existe, no se modifica.");

            return self::SUCCESS;
        }

        User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ]);

        $this->info("Usuario {$email} creado.");

        return self::SUCCESS;
    }
}
