<?php

namespace App\Policies;

use App\Models\PpmpPriceList;
use App\Models\User;

class PpmpPriceListPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('price-list.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, PpmpPriceList $ppmpPriceList): bool
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

        return $permissions->contains('price-list.add');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, PpmpPriceList $ppmpPriceList): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('price-list.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, PpmpPriceList $ppmpPriceList): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('price-list.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, PpmpPriceList $ppmpPriceList): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, PpmpPriceList $ppmpPriceList): bool
    {
        return false;
    }

    public function move(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('price-list.move');
    }
}
