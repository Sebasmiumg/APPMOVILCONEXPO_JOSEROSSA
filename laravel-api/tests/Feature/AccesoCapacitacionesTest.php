<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccesoCapacitacionesTest extends TestCase
{
    use RefreshDatabase;

    public function test_usuario_ajeno_a_ana_y_jose_no_puede_iniciar_sesion_en_la_api(): void
    {
        User::factory()->create(['email' => 'otra.persona@example.com']);

        $this->postJson('/api/login', [
            'email' => 'otra.persona@example.com',
            'password' => 'password',
        ])->assertUnprocessable();
    }

    public function test_token_sanctum_de_otro_usuario_no_accede_a_capacitaciones(): void
    {
        Sanctum::actingAs(User::factory()->create(['email' => 'otra.persona@example.com']));

        $this->getJson('/api/user')->assertForbidden();
    }

    public function test_ana_y_jose_pueden_usar_sus_tokens_sanctum(): void
    {
        foreach (['ana.lopez@example.com', 'jose.cayetano@example.com'] as $email) {
            Sanctum::actingAs(User::factory()->create(['email' => $email]));
            $this->getJson('/api/user')->assertOk()->assertJsonPath('email', $email);
        }
    }

    public function test_token_sanctum_sin_identidad_supabase_no_provoca_error_500_en_finanzas(): void
    {
        Sanctum::actingAs(User::factory()->create([
            'email' => 'ana.lopez@example.com',
            'supabase_user_id' => null,
        ]));

        $this->getJson('/api/cuentas')->assertForbidden();
    }

    public function test_usuario_supabase_no_autorizado_recibe_403_sin_crear_registro_local(): void
    {
        config([
            'services.supabase.url' => 'https://proyecto-prueba.supabase.co',
            'services.supabase.publishable_key' => 'sb_publishable_test',
        ]);
        Http::fake([
            'https://proyecto-prueba.supabase.co/auth/v1/user' => Http::response([
                'id' => '5a5d0113-e317-4071-91f1-e151c860abf1',
                'email' => 'otra.persona@example.com',
                'email_confirmed_at' => '2026-10-15T12:00:00Z',
            ]),
        ]);

        $this->withToken('supabase-access-token')->getJson('/api/user')->assertForbidden();
        $this->assertDatabaseMissing('users', ['email' => 'otra.persona@example.com']);
    }
}
