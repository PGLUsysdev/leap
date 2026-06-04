<?php

namespace App\Policies;

use App\Models\FiscalYear;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class FiscalYearPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('fiscal-year.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, FiscalYear $fiscalYear): bool
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
        return $permissions->contains('fiscal-year.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, FiscalYear $fiscalYear): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('fiscal-year.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, FiscalYear $fiscalYear): bool
    {
        return false;
    }

    public function updateStatus(User $user, FiscalYear $fiscalYear): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('fiscal-year.edit.status');
    }

    public function generateApp(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('fiscal-year.generate-app');
    }

    // public function openAipSummary(User $user): bool
    // {
    //     $user->loadMissing('role.permissionRoles.permission');
    //     $permissions = $user->role->permissionRoles->pluck('permission.name');
    //     return $permissions->contains('fiscal-year.aip-summary');
    // }

    // public function generatePpa(User $user): bool
    // {
    //     $user->loadMissing('role.permissionRoles.permission');
    //     $permissions = $user->role->permissionRoles->pluck('permission.name');
    //     return $permissions->contains('fiscal-year.generate-ppa');
    // }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, FiscalYear $fiscalYear): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, FiscalYear $fiscalYear): bool
    {
        return false;
    }
}
