<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_inicia_sesion_con_credenciales_correctas(): void
    {
        $usuario = User::factory()->create(['password' => Hash::make('clave-secreta')]);

        $response = $this->postJson('/api/login', [
            'email' => $usuario->email,
            'password' => 'clave-secreta',
        ]);

        $response->assertStatus(200)->assertJsonStructure(['usuario', 'token']);
    }

    public function test_rechaza_credenciales_incorrectas(): void
    {
        $usuario = User::factory()->create(['password' => Hash::make('clave-secreta')]);

        $response = $this->postJson('/api/login', [
            'email' => $usuario->email,
            'password' => 'incorrecta',
        ]);

        $response->assertStatus(422);
    }

    public function test_rutas_protegidas_rechazan_peticiones_sin_token(): void
    {
        $response = $this->getJson('/api/cuentas');

        $response->assertStatus(401);
    }

    public function test_cierra_sesion_y_revoca_el_token(): void
    {
        $usuario = User::factory()->create();
        $tokenModelo = $usuario->createToken('token-prueba');
        $token = $tokenModelo->plainTextToken;

        $logout = $this->withHeader('Authorization', "Bearer {$token}")->postJson('/api/logout');

        $logout->assertStatus(204);
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $tokenModelo->accessToken->id]);
    }
}
