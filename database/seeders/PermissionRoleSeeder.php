<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Permission;
use App\Models\Role;
use App\Models\PermissionRole;

class PermissionRoleSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Find the super admin role
        $role = Role::where('name', 'super admin')->first();

        if ($role) {
            // 2. Get all permission IDs
            $permissionIds = Permission::pluck('id');

            // 3. Clear out existing permissions for this role to prevent duplicates
            PermissionRole::where('role_id', $role->id)->delete();

            // 4. Create an entry for each permission for this 1 role
            foreach ($permissionIds as $permissionId) {
                PermissionRole::create([
                    'role_id' => $role->id,
                    'permission_id' => $permissionId,
                ]);
            }
        }
    }
}
