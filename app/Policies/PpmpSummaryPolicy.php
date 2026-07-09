<?php

namespace App\Policies;

use App\Models\PpmpSummary;
use App\Models\User;

class PpmpSummaryPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('ppmp-summary.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, PpmpSummary $ppmpSummary): bool
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
    public function update(User $user, PpmpSummary $ppmpSummary): bool
    {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, PpmpSummary $ppmpSummary): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, PpmpSummary $ppmpSummary): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, PpmpSummary $ppmpSummary): bool
    {
        return false;
    }
}
