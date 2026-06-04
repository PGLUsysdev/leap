<?php

namespace App\Policies;

use App\Models\Ppa;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\DB;
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

        $mainOfficeId = DB::table('offices')
            ->where('id', $ppa->office_id)
            ->value(DB::raw('COALESCE(parent_id, id)'));

        return $permissions->contains('ppa.edit') &&
            ($permissions->contains('ppa.show.all') ||
                $user->office_id === $mainOfficeId);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Ppa $ppa): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        $mainOfficeId = DB::table('offices')
            ->where('id', $ppa->office_id)
            ->value(DB::raw('COALESCE(parent_id, id)'));

        return $permissions->contains('ppa.delete') &&
            ($permissions->contains('ppa.show.all') ||
                $user->office_id === $mainOfficeId);
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

        $mainOfficeId = DB::table('offices')
            ->where('id', $ppa->office_id)
            ->value(DB::raw('COALESCE(parent_id, id)'));

        return $permissions->contains('ppa.move') &&
            ($permissions->contains('ppa.show.all') ||
                $user->office_id === $mainOfficeId);
    }

    public function importLastYearPpa(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        // Log::info($permissions);
        return $permissions->contains('ppa.import');
    }
}
