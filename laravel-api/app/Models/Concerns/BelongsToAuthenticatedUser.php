<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait BelongsToAuthenticatedUser
{
    protected static function bootBelongsToAuthenticatedUser(): void
    {
        static::addGlobalScope('owner', function (Builder $query): void {
            if (Auth::check()) {
                $query->where($query->getModel()->qualifyColumn('user_id'), Auth::id());
            }
        });

        static::creating(function ($model): void {
            if (Auth::check()) {
                $model->user_id = Auth::id();
            }
        });
    }
}
