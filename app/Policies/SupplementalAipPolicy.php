<?php

namespace App\Policies;

use App\Models\SupplementalAip;
use App\Models\User;

class SupplementalAipPolicy
{
    public function view(User $user, SupplementalAip $supplementalAip): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('aip-summary.view.supplemental') &&
            $user->office_id === $supplementalAip->office_id;
    }

    public function create(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('aip-summary.create.supplemental');
    }

    public function delete(User $user, SupplementalAip $supplementalAip): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('aip-summary.delete.supplemental') &&
            $user->office_id === $supplementalAip->office_id;
    }
}
