<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AutenticacionSupabaseApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.supabase.url' => 'https://proyecto-prueba.supabase.co',
            'services.supabase.publishable_key' => 'sb_publishable_test',
        ]);
    }

    public function test_ana_confirmada_se_enlaza_a_su_usuario_local(): void
    {
        $usuario = User::factory()->create([
            'email' => 'ana.lopez@example.com',
            'supabase_user_id' => null,
        ]);
        Http::fake([
            'https://proyecto-prueba.supabase.co/auth/v1/user' => Http::response([
                'id' => 'd9a3f8b7-a1bc-4c5e-9d78-8f12c4e56789',
                'email' => 'ana.lopez@example.com',
                'email_confirmed_at' => '2026-10-15T12:00:00Z',
                'user_metadata' => ['nombre' => 'Usuario Normal'],
            ]),
        ]);

        $response = $this->withToken('supabase-access-token')->getJson('/api/user');

        $response->assertOk()
            ->assertJsonPath('id', $usuario->id)
            ->assertJsonPath('email', 'ana.lopez@example.com')
            ->assertJsonMissingPath('supabase_user_id');
        $this->assertSame('d9a3f8b7-a1bc-4c5e-9d78-8f12c4e56789', $usuario->fresh()->supabase_user_id);
        Http::assertSent(fn ($request) => $request->url() === 'https://proyecto-prueba.supabase.co/auth/v1/user'
            && $request->hasHeader('apikey', 'sb_publishable_test')
            && $request->hasHeader('Authorization', 'Bearer supabase-access-token'));
    }

    public function test_jose_confirmado_se_enlaza_a_su_usuario_local_sin_correo_previo(): void
    {
        Http::fake([
            'https://proyecto-prueba.supabase.co/auth/v1/user' => Http::response([
                'id' => '91e5b65a-8369-4aaf-96bb-c1fab06fa472',
                'email' => 'jose.cayetano@example.com',
                'email_confirmed_at' => '2026-10-15T12:00:00Z',
                'user_metadata' => ['name' => 'Nueva Persona'],
            ]),
        ]);

        $response = $this->withToken('supabase-access-token')->getJson('/api/user');

        $response->assertOk()->assertJsonPath('name', 'Nueva Persona');
        $this->assertDatabaseHas('users', [
            'email' => 'jose.cayetano@example.com',
            'supabase_user_id' => '91e5b65a-8369-4aaf-96bb-c1fab06fa472',
        ]);
    }

    public function test_rechaza_usuario_supabase_con_correo_no_confirmado(): void
    {
        Http::fake([
            'https://proyecto-prueba.supabase.co/auth/v1/user' => Http::response([
                'id' => '61d9cde8-8084-4d11-ae0f-14c841cf38a3',
                'email' => 'ana.lopez@example.com',
                'email_confirmed_at' => null,
            ]),
        ]);

        $this->withToken('supabase-access-token')->getJson('/api/user')->assertUnauthorized();
        $this->assertDatabaseMissing('users', ['email' => 'ana.lopez@example.com']);
    }

    public function test_rechaza_usuarios_supabase_distintos_a_ana_y_jose_antes_de_crearlos(): void
    {
        Http::fake([
            'https://proyecto-prueba.supabase.co/auth/v1/user' => Http::response([
                'id' => '692bdba7-622b-4681-b7ed-7f5ea107bc2d',
                'email' => 'otra.persona@example.com',
                'email_confirmed_at' => '2026-10-15T12:00:00Z',
            ]),
        ]);

        $this->withToken('supabase-access-token')->getJson('/api/user')->assertForbidden();
        $this->assertDatabaseMissing('users', ['email' => 'otra.persona@example.com']);
    }
}
