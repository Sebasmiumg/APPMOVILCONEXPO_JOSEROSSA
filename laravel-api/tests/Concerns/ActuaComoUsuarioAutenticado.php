<?php

namespace Tests\Concerns;

use App\Models\User;
use Laravel\Sanctum\Sanctum;

trait ActuaComoUsuarioAutenticado
{
    protected function setUp(): void
    {
        parent::setUp();

        Sanctum::actingAs(User::factory()->create(['email' => 'ana.lopez@example.com']));
    }
}
