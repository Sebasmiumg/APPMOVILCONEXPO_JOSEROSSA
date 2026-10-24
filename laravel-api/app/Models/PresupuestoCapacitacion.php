<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToAuthenticatedUser;

class PresupuestoCapacitacion extends Model
{
    use HasFactory;
    use BelongsToAuthenticatedUser;

    protected $table = 'presupuestos_capacitacion';

    protected $fillable = [
        'nombre',
        'descripcion',
        'monto_asignado',
        'monto_ejecutado',
        'fecha_inicio',
        'fecha_fin',
        'estado',
    ];

    protected $casts = [
        'monto_asignado' => 'decimal:2',
        'monto_ejecutado' => 'decimal:2',
        'fecha_inicio' => 'date:Y-m-d',
        'fecha_fin' => 'date:Y-m-d',
    ];
}
