<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Concerns\BelongsToAuthenticatedUser;

class AporteMeta extends Model
{
    use HasFactory;
    use BelongsToAuthenticatedUser;

    protected $table = 'aportes_meta';

    protected $fillable = [
        'meta_id',
        'monto',
        'fecha',
        'nota',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
        'fecha' => 'date:Y-m-d',
    ];

    public function meta(): BelongsTo
    {
        return $this->belongsTo(Meta::class);
    }
}
