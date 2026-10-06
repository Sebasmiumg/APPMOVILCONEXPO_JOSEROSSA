<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('metas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cuenta_id')->nullable()->constrained('cuentas')->nullOnDelete();
            $table->string('nombre');
            $table->decimal('monto_objetivo', 12, 2);
            $table->decimal('monto_actual', 12, 2)->default(0);
            $table->date('fecha_objetivo')->nullable();
            $table->enum('estado', ['activa', 'completada', 'archivada'])->default('activa');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('metas');
    }
};
