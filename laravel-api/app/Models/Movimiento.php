<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToAuthenticatedUser;

class Movimiento extends Model
{
    use HasFactory;
    use BelongsToAuthenticatedUser;

    protected $fillable = [
        'descripcion',
        'monto',
        'tipo',
        'categoria',
        'cuenta',
        'fecha',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
        'fecha' => 'date:Y-m-d',
    ];
}
