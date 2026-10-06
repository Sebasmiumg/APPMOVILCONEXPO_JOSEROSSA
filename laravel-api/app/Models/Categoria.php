<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Categoria extends Model
{
    use HasFactory;

    protected $fillable = [
        'tipo',
        'nombre',
        'icono',
        'color',
        'activa',
    ];

    protected $casts = [
        'activa' => 'boolean',
    ];

    public function presupuestos(): HasMany
    {
        return $this->hasMany(PresupuestoCategoria::class);
    }
}
