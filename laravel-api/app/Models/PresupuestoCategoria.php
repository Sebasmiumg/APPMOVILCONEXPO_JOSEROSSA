<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Concerns\BelongsToAuthenticatedUser;

class PresupuestoCategoria extends Model
{
    use HasFactory;
    use BelongsToAuthenticatedUser;

    protected $table = 'presupuestos_categoria';

    protected $fillable = [
        'categoria_id',
        'periodo',
        'limite',
        'porcentaje_alerta',
    ];

    protected $casts = [
        'limite' => 'decimal:2',
        'porcentaje_alerta' => 'integer',
    ];

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }
}
