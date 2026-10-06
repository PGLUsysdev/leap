<?php

namespace App\Policies;

use App\Models\User;

class ImportPolicy
{
    /**
     * The permission each gated ability checks, keyed by ability name.
     *
     * Role editing only accepts permission names that exist in the database,
     * so every one of these must also be listed in PermissionSeeder.
     *
     * @var array<string, string>
     */
    public const ABILITIES = [
        'viewHub' => 'imports.view',
        'category' => 'imports.category',
        'categoryCoaMapping' => 'imports.category-coa-mapping',
        'priceList' => 'imports.price-list',
        'priceListQuantities' => 'imports.price-list-quantities',
        'aipSummary' => 'imports.aip-summary',
    ];

    public function viewHub(User $user): bool
    {
        return $this->has($user, self::ABILITIES['viewHub']);
    }

    public function category(User $user): bool
    {
        return $this->has($user, self::ABILITIES['category']);
    }

    public function categoryCoaMapping(User $user): bool
    {
        return $this->has($user, self::ABILITIES['categoryCoaMapping']);
    }

    public function priceList(User $user): bool
    {
        return $this->has($user, self::ABILITIES['priceList']);
    }

    public function priceListQuantities(User $user): bool
    {
        return $this->has($user, self::ABILITIES['priceListQuantities']);
    }

    public function aipSummary(User $user): bool
    {
        return $this->has($user, self::ABILITIES['aipSummary']);
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
