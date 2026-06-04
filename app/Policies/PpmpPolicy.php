<?php

namespace App\Policies;

use App\Models\AipEntry;
use App\Models\Office;
use App\Models\Ppmp;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PpmpPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, ?AipEntry $aipEntry = null): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        if (!$permissions->contains('ppmp.view')) {
            return false;
        }

        if (!$aipEntry) {
            return true;
        }

        $office = $aipEntry->ppa->office;
        if ($office->parent_id) {
            $office = $office->parent;
        }

        // return false;
        return $user->office_id === $office->id;
    }

    public function viewSupplemental(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('ppmp.view.supplemental');
    }

    public function export(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('ppmp.export');
    }

    public function generateSummary(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('ppmp.generate-summary');
    }

    public function addPriceList(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('ppmp.add.price-list');
    }

    public function editPriceListQuantity(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('ppmp.edit.price-list-quantity');
    }

    public function deletePriceList(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('ppmp.delete.price-list');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Ppmp $ppmp): bool
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
    public function update(User $user, Ppmp $ppmp): bool
    {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Ppmp $ppmp): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Ppmp $ppmp): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Ppmp $ppmp): bool
    {
        return false;
    }
}
