<?php

namespace App\Policies;

use App\Models\AipEntry;
use App\Models\Office;
use App\Models\Ppa;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class AipEntryPolicy
{
    public function viewAny(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('aip-summary.view');
    }

    public function view(User $user, AipEntry $aipEntry): bool
    {
        return false;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, AipEntry $aipEntry): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        if (!$permissions->contains('aip-summary.edit')) {
            return false;
        }

        // Super admin with show.all bypasses office restriction
        if ($permissions->contains('aip-summary.show.all')) {
            return true;
        }

        return in_array(
            $user->office_id,
            $this->getOfficeAncestorIds($aipEntry->ppa->office_id),
        );
    }

    public function delete(User $user, AipEntry $aipEntry): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        if (!$permissions->contains('aip-summary.delete')) {
            return false;
        }

        // Super admin bypass
        if ($permissions->contains('aip-summary.show.all')) {
            return true;
        }

        return in_array(
            $user->office_id,
            $this->getOfficeAncestorIds($aipEntry->ppa->office_id),
        );
    }

    public function editFundingSources(User $user, AipEntry $aipEntry): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        if (!$permissions->contains('aip-summary.edit.funding-source')) {
            return false;
        }

        // Super admin bypass
        if ($permissions->contains('aip-summary.show.all')) {
            return true;
        }

        return in_array(
            $user->office_id,
            $this->getOfficeAncestorIds($aipEntry->ppa->office_id),
        );
    }

    public function import(User $user, array $ppaIds): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        if (!$permissions->contains('aip-summary.import')) {
            return false;
        }

        // Super admin can import PPAs from any office
        if ($permissions->contains('aip-summary.show.all')) {
            return true;
        }

        $allowedOfficeIds = $this->getOfficeHierarchyIds($user->office_id);

        return !Ppa::whereIn('id', $ppaIds)
            ->whereNotIn('office_id', $allowedOfficeIds)
            ->exists();
    }

    public function showSummaryAll(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('aip-summary.show.all');
    }

    public function showSummaryOwn(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('aip-summary.show.own');
    }

    public function export(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('aip-summary.export');
    }

    public function restore(User $user, AipEntry $aipEntry): bool
    {
        return false;
    }

    public function forceDelete(User $user, AipEntry $aipEntry): bool
    {
        return false;
    }

    private function getOfficeHierarchyIds($officeId)
    {
        $officeIds = [$officeId];
        $childOfficeIds = $this->getChildOfficeIds($officeId);
        return array_merge($officeIds, $childOfficeIds);
    }

    private function getChildOfficeIds($parentId)
    {
        $children = Office::where('parent_id', $parentId)
            ->pluck('id')
            ->toArray();

        $descendants = $children;
        foreach ($children as $childId) {
            $descendants = array_merge(
                $descendants,
                $this->getChildOfficeIds($childId),
            );
        }

        return $descendants;
    }

    private function getOfficeAncestorIds($officeId): array
    {
        $ids = [$officeId];
        $current = $officeId;

        while ($current) {
            $parentId = Office::where('id', $current)->value('parent_id');
            if (!$parentId) {
                break;
            }
            $ids[] = $parentId;
            $current = $parentId;
        }

        return $ids;
    }
}
