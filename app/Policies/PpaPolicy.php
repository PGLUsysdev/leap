<?php

namespace App\Policies;

use App\Models\Ppa;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Log;

class PpaPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('ppa.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Ppa $ppa): bool
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
        return $permissions->contains('ppa.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Ppa $ppa): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('ppa.edit') &&
            $user->office_id === $ppa->office_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Ppa $ppa): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('ppa.delete') &&
            $user->office_id === $ppa->office_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Ppa $ppa): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Ppa $ppa): bool
    {
        return false;
    }

    public function move(User $user, Ppa $ppa): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('ppa.move') &&
            $user->office_id === $ppa->office_id;
    }

    public function importLastYearPpa(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        // Log::info($permissions);
        return $permissions->contains('ppa.import');
    }
}
