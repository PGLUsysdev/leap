<?php

namespace App\Policies;

use App\Models\User;

class ImportPolicy
{
    public function viewHub(User $user): bool
    {
        return $this->has($user, 'imports.view');
    }

    public function category(User $user): bool
    {
        return $this->has($user, 'imports.category');
    }

    public function categoryCoaMapping(User $user): bool
    {
        return $this->has($user, 'imports.category-coa-mapping');
    }

    public function priceList(User $user): bool
    {
        return $this->has($user, 'imports.price-list');
    }

    public function priceListQuantities(User $user): bool
    {
        return $this->has($user, 'imports.price-list-quantities');
    }

    public function aipSummary(User $user): bool
    {
        return $this->has($user, 'imports.aip-summary');
    }

    private function has(User $user, string $permission): bool
    {
        $user->loadMissing('role.permissionRoles.permission');

        // Super admin bypass — mirrors the show.all pattern in AipEntryPolicy.
        if ($user->role?->name === 'super admin') {
            return true;
        }

        return $user->role?->permissionRoles
            ->pluck('permission.name')
            ->contains($permission) ?? false;
    }
}
