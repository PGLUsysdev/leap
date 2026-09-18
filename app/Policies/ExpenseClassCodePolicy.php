<?php

namespace App\Policies;

use App\Models\User;

class ExpenseClassCodePolicy
{
    public function viewAny(User $user): bool
    {
        return $this->has($user, 'expense-class-code.view');
    }

    public function create(User $user): bool
    {
        return $this->has($user, 'expense-class-code.add');
    }

    public function delete(User $user): bool
    {
        return $this->has($user, 'expense-class-code.delete');
    }

    private function has(User $user, string $permission): bool
    {
        $user->loadMissing('role.permissionRoles.permission');

        return $user->role?->permissionRoles->pluck('permission.name')->contains($permission) ?? false;
    }
}
