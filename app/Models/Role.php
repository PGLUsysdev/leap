<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    protected $fillable = ['name'];

    // hasMany
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'role_id');
    }

    public function permissionRoles(): HasMany
    {
        return $this->hasMany(PermissionRole::class, 'role_id');
    }
}
