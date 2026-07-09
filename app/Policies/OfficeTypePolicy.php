<?php

namespace App\Policies;

use App\Models\OfficeType;
use App\Models\User;

class OfficeTypePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('office-type.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, OfficeType $officeType): bool
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

        return $permissions->contains('office-type.add');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, OfficeType $officeType): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('office-type.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, OfficeType $officeType): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('office-type.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, OfficeType $officeType): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, OfficeType $officeType): bool
    {
        return false;
    }
}
