<?php

use App\Models\Permission;
use App\Models\PermissionRole;
use App\Models\Role;
use App\Models\User;

function rolePermUser(array $permissionNames): User
{
    static $seq = 0;

    $seq++;

    $role = Role::create(['name' => "role-perm-tester-{$seq}"]);

    foreach ($permissionNames as $name) {
        $permission = Permission::firstOrCreate(['name' => $name]);
        PermissionRole::create(['role_id' => $role->id, 'permission_id' => $permission->id]);
    }

    return User::factory()->create(['role_id' => $role->id]);
}

test('guests are redirected from the roles page', function () {
    $this->get('/roles')->assertRedirect('/login');
});

test('it forbids the roles index without role.view', function () {
    $user = rolePermUser([]);

    $this->actingAs($user)->get('/roles')->assertForbidden();
});

test('it renders the roles index with managePermissions reflecting edit.permissions', function () {
    $viewer = rolePermUser(['role.view']);
    $manager = rolePermUser(['role.view', 'role.edit.permissions']);

    $this->actingAs($viewer)->get('/roles')->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('can.managePermissions', false)
        );

    $this->actingAs($manager)->get('/roles')->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('can.managePermissions', true)
        );
});

test('it forbids reading permissions without role.edit.permissions', function () {
    $user = rolePermUser(['role.view']);
    $target = Role::create(['name' => 'role-perm-target-read']);

    $this->actingAs($user)->get("/roles/{$target->id}/permissions")->assertForbidden();
});

test('it forbids managing permissions with only role.edit.name', function () {
    $user = rolePermUser(['role.view', 'role.edit.name']);
    $target = Role::create(['name' => 'role-perm-target-name-only']);

    $this->actingAs($user)->get("/roles/{$target->id}/permissions")->assertForbidden();

    $this->actingAs($user)->post("/roles/{$target->id}/permissions", [
        'permissions' => ['role.view'],
    ])->assertForbidden();
});

test('it allows reading permissions with role.edit.permissions', function () {
    $user = rolePermUser(['role.view', 'role.edit.permissions']);
    $target = Role::create(['name' => 'role-perm-target-allowed']);
    $permission = Permission::firstOrCreate(['name' => 'role.view']);
    PermissionRole::create(['role_id' => $target->id, 'permission_id' => $permission->id]);

    $this->actingAs($user)->get("/roles/{$target->id}/permissions")
        ->assertOk()
        ->assertJsonPath('permissions.0', 'role.view');
});

test('it persists permission changes with role.edit.permissions', function () {
    $user = rolePermUser(['role.edit.permissions']);
    $target = Role::create(['name' => 'role-perm-target-write']);
    Permission::firstOrCreate(['name' => 'role.view']);
    Permission::firstOrCreate(['name' => 'dashboard.view']);

    $this->actingAs($user)->post("/roles/{$target->id}/permissions", [
        'permissions' => ['role.view', 'dashboard.view'],
    ])->assertRedirect();

    expect($target->permissionRoles()->with('permission')->get()->pluck('permission.name')->sort()->values()->all())
        ->toBe(['dashboard.view', 'role.view']);
});

test('it rejects unknown permission names', function () {
    $user = rolePermUser(['role.edit.permissions']);
    $target = Role::create(['name' => 'role-perm-target-invalid']);

    $this->actingAs($user)->post("/roles/{$target->id}/permissions", [
        'permissions' => ['no.such.permission'],
    ])->assertSessionHasErrors(['permissions.0']);

    expect($target->permissionRoles()->count())->toBe(0);
});

test('it forbids creating roles without role.add', function () {
    $user = rolePermUser(['role.view']);

    $this->actingAs($user)->post('/roles', ['name' => 'role-perm-no-add'])->assertForbidden();
});
