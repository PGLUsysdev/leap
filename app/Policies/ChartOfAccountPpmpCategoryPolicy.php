<?php

namespace App\Policies;

use App\Models\ChartOfAccountPpmpCategory;
use App\Models\User;

class ChartOfAccountPpmpCategoryPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $this->has($user, 'ppmp-category-mapping.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ChartOfAccountPpmpCategory $chartOfAccountPpmpCategory): bool
    {
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $this->has($user, 'ppmp-category-mapping.add');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ChartOfAccountPpmpCategory $chartOfAccountPpmpCategory): bool
    {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ChartOfAccountPpmpCategory $chartOfAccountPpmpCategory): bool
    {
        return $this->has($user, 'ppmp-category-mapping.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, ChartOfAccountPpmpCategory $chartOfAccountPpmpCategory): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model,
     * including cascading dependent price list items.
     */
    public function forceDelete(User $user, ChartOfAccountPpmpCategory $chartOfAccountPpmpCategory): bool
    {
        return $this->has($user, 'ppmp-category-mapping.delete')
            && $this->has($user, 'price-list.delete');
    }

    private function has(User $user, string $permission): bool
    {
        $user->loadMissing('role.permissionRoles.permission');

        return $user->role?->permissionRoles->pluck('permission.name')->contains($permission) ?? false;
    }
}
