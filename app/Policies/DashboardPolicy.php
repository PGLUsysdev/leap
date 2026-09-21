<?php

namespace App\Policies;

use App\Models\User;

class DashboardPolicy
{
    public function viewAny(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');

        return $user->role?->permissionRoles->pluck('permission.name')->contains('dashboard.view') ?? false;
    }
}
