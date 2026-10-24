<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrearUsuariosPruebaTest extends TestCase
{
    use RefreshDatabase;

    public function test_no_crea_cuentas_de_prueba_si_no_se_habilitan(): void
    {
        putenv('PRUEBA_USUARIOS_HABILITADOS=false');

        $this->artisan('usuarios:crear-prueba')
            ->expectsOutput('Cuentas de prueba deshabilitadas; no se crearon ni modificaron usuarios.')
            ->assertExitCode(0);

        $this->assertSame(0, User::count());

        putenv('PRUEBA_USUARIOS_HABILITADOS');
    }

    public function test_exige_ambos_secretos_antes_de_modificar_usuarios(): void
    {
        putenv('PRUEBA_USUARIOS_HABILITADOS=true');
        putenv('PRUEBA_ANA_PASSWORD=un-secreto-largo-unico');
        putenv('PRUEBA_JOSE_PASSWORD');

        $this->artisan('usuarios:crear-prueba')
            ->assertExitCode(1);

        $this->assertSame(0, User::count());

        putenv('PRUEBA_USUARIOS_HABILITADOS');
        putenv('PRUEBA_ANA_PASSWORD');
    }
}
