<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Concerns\BelongsToAuthenticatedUser;

class Meta extends Model
{
    use HasFactory;
    use BelongsToAuthenticatedUser;

    protected $fillable = [
        'cuenta_id',
        'nombre',
        'monto_objetivo',
        'monto_actual',
        'fecha_objetivo',
        'estado',
    ];

    protected $casts = [
        'monto_objetivo' => 'decimal:2',
        'monto_actual' => 'decimal:2',
        'fecha_objetivo' => 'date:Y-m-d',
    ];

    public function cuenta(): BelongsTo
    {
        return $this->belongsTo(Cuenta::class);
    }

    public function aportes(): HasMany
    {
        return $this->hasMany(AporteMeta::class);
    }
}
