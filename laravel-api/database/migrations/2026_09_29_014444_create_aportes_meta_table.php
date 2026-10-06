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
        Schema::create('aportes_meta', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meta_id')->constrained('metas')->cascadeOnDelete();
            $table->decimal('monto', 12, 2);
            $table->date('fecha');
            $table->string('nota')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('aportes_meta');
    }
};
