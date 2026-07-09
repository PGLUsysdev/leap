<?php

namespace App\Policies;

use App\Models\CcTypology;
use App\Models\User;

class CcTypologyPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('cc-typology.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, CcTypology $ccTypology): bool
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

        return $permissions->contains('cc-typology.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, CcTypology $ccTypology): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('cc-typology.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, CcTypology $ccTypology): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('cc-typology.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, CcTypology $ccTypology): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, CcTypology $ccTypology): bool
    {
        return false;
    }
}
