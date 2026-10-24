<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait BelongsToAuthenticatedUserOrGlobal
{
    protected static function bootBelongsToAuthenticatedUserOrGlobal(): void
    {
        static::addGlobalScope('owner_or_global', function (Builder $query): void {
            if (Auth::check()) {
                $column = $query->getModel()->qualifyColumn('user_id');
                $query->where(fn (Builder $builder) => $builder->whereNull($column)->orWhere($column, Auth::id()));
            }
        });

        static::creating(function ($model): void {
            if (Auth::check()) {
                $model->user_id = Auth::id();
            }
        });
    }
}
