<?php

namespace App\Policies;

use App\Models\SalaryStandard;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class SalaryStandardPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('salary-standard.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, SalaryStandard $salaryStandard): bool
    {
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, SalaryStandard $salaryStandard): bool
    {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, SalaryStandard $salaryStandard): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, SalaryStandard $salaryStandard): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(
        User $user,
        SalaryStandard $salaryStandard,
    ): bool {
        return false;
    }
}
