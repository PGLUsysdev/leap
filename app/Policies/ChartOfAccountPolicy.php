<?php

namespace App\Policies;

use App\Models\ChartOfAccount;
use App\Models\User;

class ChartOfAccountPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('chart-of-account.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ChartOfAccount $chartOfAccount): bool
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

        return $permissions->contains('chart-of-account.add');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ChartOfAccount $chartOfAccount): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('chart-of-account.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ChartOfAccount $chartOfAccount): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('chart-of-account.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, ChartOfAccount $chartOfAccount): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(
        User $user,
        ChartOfAccount $chartOfAccount,
    ): bool {
        return false;
    }
}
