<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cuenta extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'tipo',
        'moneda',
        'saldo_inicial',
        'color',
        'icono',
        'activa',
    ];

    protected $casts = [
        'saldo_inicial' => 'decimal:2',
        'activa' => 'boolean',
    ];

    public function metas(): HasMany
    {
        return $this->hasMany(Meta::class);
    }
}
