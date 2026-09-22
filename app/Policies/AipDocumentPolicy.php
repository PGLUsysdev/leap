<?php

namespace App\Policies;

use App\Models\AipDocument;
use App\Models\User;

class AipDocumentPolicy
{
    public function view(User $user, AipDocument $aipDocument): bool
    {
        // Regular documents follow normal AIP summary access; supplemental
        // documents additionally require the supplemental view permission.
        if ($aipDocument->kind !== 'supplemental') {
            return true;
        }

        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('aip-summary.view.supplemental') &&
            $user->office_id === $aipDocument->office_id;
    }

    public function create(User $user): bool
    {
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('aip-summary.create.supplemental');
    }

    public function delete(User $user, AipDocument $aipDocument): bool
    {
        // The regular document is never deletable.
        if ($aipDocument->kind !== 'supplemental') {
            return false;
        }

        // Supplementals form a chain: only the latest one per
        // fiscal year + office can be deleted, since newer ones
        // build on top of the earlier ones.
        $latestId = AipDocument::where(
            'fiscal_year_id',
            $aipDocument->fiscal_year_id,
        )
            ->where('office_id', $aipDocument->office_id)
            ->supplemental()
            ->max('id');

        if ($aipDocument->id !== $latestId) {
            return false;
        }

        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');

        return $permissions->contains('aip-summary.delete.supplemental') &&
            $user->office_id === $aipDocument->office_id;
    }
}
