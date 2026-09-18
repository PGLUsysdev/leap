<?php

use App\Models\Permission;
use App\Models\PermissionRole;
use App\Models\Role;
use App\Models\User;

function dashboardTestUser(array $permissionNames = []): User
{
    static $seq = 0;

    $seq++;

    $role = Role::create(['name' => "dashboard-tester-{$seq}"]);

    foreach ($permissionNames as $name) {
        $permission = Permission::firstOrCreate(['name' => $name]);
        PermissionRole::create(['role_id' => $role->id, 'permission_id' => $permission->id]);
    }

    return User::factory()->create(['role_id' => $role->id]);
}

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('it forbids the dashboard without dashboard.view', function () {
    $user = dashboardTestUser();

    $this->actingAs($user)->get(route('dashboard'))->assertForbidden();
});

test('it renders the dashboard with dashboard.view', function () {
    $user = dashboardTestUser(['dashboard.view']);

    $this->actingAs($user)->get(route('dashboard'))->assertOk();
});
