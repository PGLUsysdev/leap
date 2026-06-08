<?php

namespace App\Policies;

use App\Models\Office;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OfficePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        // dd([
        //     'user_id' => $user->id,
        //     'permissions' => $permissions->all(),
        //     'contains' => $permissions->contains('office.edit.office'),
        //     'office_id' => $office->id,
        //     'user_office_id' => $user->office_id,
        //     'office_id_match' => $user->office_id === $office->id,
        // ]);

        return $permissions->contains('office.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Office $office): bool
    {
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function createOffice(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('office.create.office');
    }

    public function createSubUnit(User $user, Office $parentOffice): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('office.create.sub-unit.all') ||
            ($permissions->contains('office.create.sub-unit.own') && $user->office_id === $parentOffice->id);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function updateOffice(User $user, Office $office): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('office.edit.office.all') ||
            ($permissions->contains('office.edit.office.own') && $user->office_id === $office->id);
    }

    public function updateSubUnit(User $user, Office $parentOffice): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('office.edit.sub-unit.all') ||
            ($permissions->contains('office.edit.sub-unit.own') && $user->office_id === $parentOffice->id);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function deleteOffice(User $user, Office $office): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('office.delete.office');
    }

    public function deleteSubUnit(User $user, Office $parentOffice): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('office.delete.sub-unit.all') ||
            ($permissions->contains('office.delete.sub-unit.own') && $user->office_id === $parentOffice->id);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Office $office): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Office $office): bool
    {
        return false;
    }
}
