<?php

namespace App\Policies;

use App\Models\Sector;
use App\Models\User;

class SectorPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('sector.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Sector $sector): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('sector.add');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Sector $sector): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('sector.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Sector $sector): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('sector.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Sector $sector): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Sector $sector): bool
    {
        return false;
    }
}
