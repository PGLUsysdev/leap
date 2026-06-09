<?php

namespace App\Policies;

use App\Models\CcStrategicPriority;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class CcStrategicPriorityPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('cc-strategic-priority.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(
        User $user,
        CcStrategicPriority $ccStrategicPriority,
    ): bool {
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('cc-strategic-priority.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        CcStrategicPriority $ccStrategicPriority,
    ): bool {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('cc-strategic-priority.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(
        User $user,
        CcStrategicPriority $ccStrategicPriority,
    ): bool {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('cc-strategic-priority.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(
        User $user,
        CcStrategicPriority $ccStrategicPriority,
    ): bool {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(
        User $user,
        CcStrategicPriority $ccStrategicPriority,
    ): bool {
        return false;
    }
}
