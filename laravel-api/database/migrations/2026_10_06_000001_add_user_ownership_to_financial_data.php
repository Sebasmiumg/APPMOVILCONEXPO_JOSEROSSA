<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = [
        'movimientos',
        'cuentas',
        'categorias',
        'metas',
        'aportes_meta',
        'presupuestos_categoria',
        'presupuestos_capacitacion',
    ];

    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->foreignId('user_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
                $table->index(['user_id', 'id']);
            });
        }
    }

    public function down(): void
    {
        foreach (array_reverse($this->tables) as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->dropForeign(['user_id']);
                $table->dropIndex(['user_id', 'id']);
                $table->dropColumn('user_id');
            });
        }
    }
};
