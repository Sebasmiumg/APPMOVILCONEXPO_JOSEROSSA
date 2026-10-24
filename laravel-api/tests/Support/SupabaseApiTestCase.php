<?php

namespace Tests\Support;

use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

abstract class SupabaseApiTestCase extends TestCase
{
    protected FakeSupabasePostgrest $postgrest;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.supabase.url' => 'https://proyecto-prueba.supabase.co',
            'services.supabase.publishable_key' => 'sb_publishable_test',
        ]);
        $this->postgrest = new FakeSupabasePostgrest;
        Http::fake(fn (Request $request) => $this->postgrest->handle($request));
    }

    protected function actuarComoUsuario(string $email = 'ana.lopez@example.com', string $supabaseId = '11111111-1111-4111-8111-111111111111'): User
    {
        $usuario = User::factory()->create(['email' => $email, 'supabase_user_id' => $supabaseId]);
        Sanctum::actingAs($usuario);
        $this->withToken('token-de-prueba');

        return $usuario;
    }
}
