<?php

namespace App\Policies;

use App\Models\AipEntry;
use App\Models\Office;
use App\Models\Ppa;
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
        $user = $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
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
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('aip-summary.edit') &&
            $user->office_id === $aipEntry->ppa->office_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, AipEntry $aipEntry): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        return $permissions->contains('aip-summary.delete') &&
            $user->office_id === $aipEntry->ppa->office_id;
    }

    public function import(User $user, array $ppaIds): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        if (!$permissions->contains('aip-summary.import')) {
            return false;
        }

        $allowedOfficeIds = $this->getOfficeHierarchyIds($user->office_id);

        return !Ppa::whereIn('id', $ppaIds)
            ->whereNotIn('office_id', $allowedOfficeIds)
            ->exists();
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

    private function getOfficeHierarchyIds($officeId)
    {
        $officeIds = [$officeId];

        $childOfficeIds = $this->getChildOfficeIds($officeId);
        $officeIds = array_merge($officeIds, $childOfficeIds);

        return $officeIds;
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
}
