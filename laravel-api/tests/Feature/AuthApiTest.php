<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.supabase.url' => 'https://proyecto-prueba.supabase.co',
            'services.supabase.publishable_key' => 'sb_publishable_test',
        ]);
    }

    public function test_login_reenvia_credenciales_autorizadas_a_supabase_y_devuelve_su_sesion(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-16T12:00:00Z'));

        Http::fake([
            'https://proyecto-prueba.supabase.co/auth/v1/token*' => Http::response([
                'access_token' => 'access-token-test',
                'refresh_token' => 'refresh-token-test',
                'expires_in' => 3600,
                'user' => [
                    'id' => '11111111-1111-4111-8111-111111111111',
                    'email' => 'ana.lopez@example.com',
                    'user_metadata' => ['nombre' => 'Ana'],
                ],
            ]),
        ]);

        $this->postJson('/api/login', ['email' => 'ana.lopez@example.com', 'password' => 'secreto-de-prueba'])
            ->assertOk()
            ->assertJsonPath('usuario.email', 'ana.lopez@example.com')
            ->assertJsonPath('usuario.name', 'Ana')
            ->assertJsonPath('token', 'access-token-test')
            ->assertJsonPath('expires_in', 3600)
            ->assertJsonPath('expires_at', '2026-10-16T13:00:00+00:00');

        Carbon::setTestNow();

        Http::assertSent(fn ($request) => str_contains($request->url(), '/auth/v1/token?grant_type=password')
            && $request->hasHeader('apikey', 'sb_publishable_test')
            && $request['email'] === 'ana.lopez@example.com'
            && $request['password'] === 'secreto-de-prueba');
    }

    public function test_login_falla_cerrado_si_supabase_no_devuelve_expiracion(): void
    {
        Http::fake([
            'https://proyecto-prueba.supabase.co/auth/v1/token*' => Http::response([
                'access_token' => 'access-token-test',
                'user' => [
                    'id' => '11111111-1111-4111-8111-111111111111',
                    'email' => 'ana.lopez@example.com',
                ],
            ]),
        ]);

        $this->postJson('/api/login', ['email' => 'ana.lopez@example.com', 'password' => 'secreto-de-prueba'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_login_no_envia_a_supabase_credenciales_de_una_cuenta_no_autorizada(): void
    {
        $this->postJson('/api/login', ['email' => 'otra.persona@example.com', 'password' => 'no-enviar'])
            ->assertUnprocessable();

        Http::assertNothingSent();
    }

    public function test_login_rechaza_credenciales_invalidas_de_supabase(): void
    {
        Http::fake(['https://proyecto-prueba.supabase.co/auth/v1/token*' => Http::response(['msg' => 'Invalid login'], 400)]);

        $this->postJson('/api/login', ['email' => 'ana.lopez@example.com', 'password' => 'incorrecta'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_login_falla_cerrado_si_la_autenticacion_no_esta_configurada(): void
    {
        config(['services.supabase.url' => '', 'services.supabase.publishable_key' => '']);

        $this->postJson('/api/login', ['email' => 'ana.lopez@example.com', 'password' => 'secreto'])
            ->assertServiceUnavailable();

        Http::assertNothingSent();
    }
}
