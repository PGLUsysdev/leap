<?php

namespace App\Policies;

use App\Models\LguLevel;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class LguLevelPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('lgu-level.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, LguLevel $lguLevel): bool
    {
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('lgu-level.add');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, LguLevel $lguLevel): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('lgu-level.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, LguLevel $lguLevel): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('lgu-level.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, LguLevel $lguLevel): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, LguLevel $lguLevel): bool
    {
        return false;
    }
}
