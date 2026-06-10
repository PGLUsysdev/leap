<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Permission extends Model
{
    protected $fillable = ['name'];

    // hasMany
    public function permissionRole(): HasMany
    {
        return $this->hasMany(PermissionRole::class, 'permission_id');
    }
}
