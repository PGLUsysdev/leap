<?php

namespace App\Policies;

use App\Models\PsBreakdownItem;
use App\Models\User;

class PsBreakdownItemPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('ps-breakdown.view');
    }

    /**
     * Determine whether the user can export LBP forms.
     */
    public function export(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('ps-breakdown.export');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, PsBreakdownItem $psBreakdownItem): bool
    {
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, PsBreakdownItem $psBreakdownItem): bool
    {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, PsBreakdownItem $psBreakdownItem): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, PsBreakdownItem $psBreakdownItem): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(
        User $user,
        PsBreakdownItem $psBreakdownItem,
    ): bool {
        return false;
    }
}
