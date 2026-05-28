<?php

namespace App\Policies;

use App\Models\AipEntry;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Log;

class AipEntryPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        /** @var \App\Models\User $user */
        $user = $user->loadMissing('role.permissionRoles.permission');

        // Log::info($user);

        $permissions = $user->role->permissionRoles->pluck('permission.name');

        // Log::info($permissions);

        return $permissions->contains('aip-summary.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, AipEntry $aipEntry): bool
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
    public function update(User $user, AipEntry $aipEntry): bool
    {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, AipEntry $aipEntry): bool
    {
        return true;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, AipEntry $aipEntry): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, AipEntry $aipEntry): bool
    {
        return false;
    }
}
