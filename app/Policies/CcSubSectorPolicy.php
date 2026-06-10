<?php

namespace App\Policies;

use App\Models\CcSubSector;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class CcSubSectorPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('cc-sub-sector.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, CcSubSector $ccSubSector): bool
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
        return $permissions->contains('cc-sub-sector.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, CcSubSector $ccSubSector): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('cc-sub-sector.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, CcSubSector $ccSubSector): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('cc-sub-sector.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, CcSubSector $ccSubSector): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, CcSubSector $ccSubSector): bool
    {
        return false;
    }
}
