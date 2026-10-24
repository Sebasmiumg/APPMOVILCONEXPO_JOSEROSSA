<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OwnershipSecurityTest extends TestCase
{
    use RefreshDatabase;

    private const USER_ID = '11111111-1111-4111-8111-111111111111';
    private const OTRO_REGISTRO_ID = '22222222-2222-4222-8222-222222222222';

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.supabase.url' => 'https://proyecto-prueba.supabase.co',
            'services.supabase.publishable_key' => 'sb_publishable_test',
        ]);
        Http::fake(fn () => Http::response([], 200));
    }

    public function test_listado_y_detalle_de_finanzas_se_filtran_por_el_usuario_supabase_autenticado(): void
    {
        $this->actuarComoPropietario();

        $this->getJson('/api/movimientos')->assertOk()->assertExactJson([]);
        $this->getJson('/api/movimientos/'.self::OTRO_REGISTRO_ID)->assertNotFound();
        $this->putJson('/api/movimientos/'.self::OTRO_REGISTRO_ID, ['descripcion' => 'Alterado'])->assertNotFound();

        Http::assertSent(fn (Request $request) => $this->tieneFiltroUsuario($request, self::USER_ID)
            && str_contains($request->url(), '/rest/v1/movimientos'));
        Http::assertNotSent(fn (Request $request) => $request->method() === 'PATCH'
            && str_contains($request->url(), '/rest/v1/movimientos'));
    }

    public function test_eliminar_un_registro_ajeno_solo_emite_borrado_con_filtro_de_propietario(): void
    {
        $this->actuarComoPropietario();

        $this->deleteJson('/api/movimientos/'.self::OTRO_REGISTRO_ID)->assertNoContent();

        Http::assertSent(fn (Request $request) => $request->method() === 'DELETE'
            && str_contains($request->url(), '/rest/v1/movimientos')
            && $this->tieneFiltroUsuario($request, self::USER_ID)
            && str_contains($request->url(), 'id=eq.'.self::OTRO_REGISTRO_ID));
    }

    public function test_categoria_global_no_se_puede_editar_ni_desactivar(): void
    {
        $this->actuarComoPropietario();

        $this->putJson('/api/categorias/'.self::OTRO_REGISTRO_ID, ['nombre' => 'Manipulada'])->assertNotFound();
        $this->deleteJson('/api/categorias/'.self::OTRO_REGISTRO_ID)->assertNotFound();

        Http::assertSent(fn (Request $request) => $request->method() === 'PATCH'
            && str_contains($request->url(), '/rest/v1/categorias')
            && $this->tieneFiltroUsuario($request, self::USER_ID)
            && str_contains($request->url(), 'id=eq.'.self::OTRO_REGISTRO_ID));
    }

    private function actuarComoPropietario(): void
    {
        $usuario = User::factory()->create([
            'email' => 'ana.lopez@example.com',
            'supabase_user_id' => self::USER_ID,
        ]);
        Sanctum::actingAs($usuario);
        $this->withToken('token-de-prueba');
    }

    private function tieneFiltroUsuario(Request $request, string $userId): bool
    {
        parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $query);

        return ($query['usuario_id'] ?? null) === 'eq.'.$userId;
    }
}
