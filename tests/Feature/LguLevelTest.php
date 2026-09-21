<?php

use App\Models\LguLevel;
use App\Models\Office;
use App\Models\OfficeType;
use App\Models\Permission;
use App\Models\PermissionRole;
use App\Models\Role;
use App\Models\Sector;
use App\Models\User;

function lguTestUser(array $permissionNames): User
{
    static $seq = 0;

    $seq++;

    $role = Role::create(['name' => "lgu-tester-{$seq}"]);

    foreach ($permissionNames as $name) {
        $permission = Permission::firstOrCreate(['name' => $name]);
        PermissionRole::create(['role_id' => $role->id, 'permission_id' => $permission->id]);
    }

    return User::factory()->create(['role_id' => $role->id]);
}

test('guests are redirected from the lgu levels page', function () {
    $this->get('/lgu-levels')->assertRedirect('/login');
});

test('it forbids the lgu levels index without lgu-level.view', function () {
    $user = lguTestUser([]);

    $this->actingAs($user)->get('/lgu-levels')->assertForbidden();
});

test('it forbids writing lgu levels with only lgu-level.view', function () {
    $user = lguTestUser(['lgu-level.view']);
    $level = LguLevel::create(['code' => '2', 'name' => 'City']);

    $this->actingAs($user)->get('/lgu-levels')->assertOk();

    $this->actingAs($user)->post('/lgu-levels', [
        'code' => '3',
        'name' => 'Municipal',
    ])->assertForbidden();

    $this->actingAs($user)->patch("/lgu-levels/{$level->id}", [
        'code' => '2',
        'name' => 'Renamed',
    ])->assertForbidden();

    $this->actingAs($user)->delete("/lgu-levels/{$level->id}")->assertForbidden();

    expect(LguLevel::where('name', 'Municipal')->exists())->toBeFalse();
    expect($level->fresh()->name)->toBe('City');
});

test('it stores, updates, and deletes lgu levels with the right permissions', function () {
    $user = lguTestUser(['lgu-level.view', 'lgu-level.add', 'lgu-level.edit', 'lgu-level.delete']);

    $this->actingAs($user)->post('/lgu-levels', [
        'code' => '4',
        'name' => 'Barangay',
    ])->assertOk();

    $level = LguLevel::where('code', '4')->firstOrFail();

    $this->actingAs($user)->patch("/lgu-levels/{$level->id}", [
        'code' => '4',
        'name' => 'Renamed Barangay',
    ])->assertOk();

    expect($level->fresh()->name)->toBe('Renamed Barangay');

    $this->actingAs($user)->delete("/lgu-levels/{$level->id}")->assertOk();

    expect(LguLevel::find($level->id))->toBeNull();
});

test('it rejects duplicate lgu level codes', function () {
    $user = lguTestUser(['lgu-level.add']);
    LguLevel::create(['code' => '5', 'name' => 'Existing']);

    $this->actingAs($user)->post('/lgu-levels', [
        'code' => '5',
        'name' => 'Duplicate',
    ])->assertSessionHasErrors(['code']);
});

test('it blocks deleting an lgu level assigned to offices', function () {
    $user = lguTestUser(['lgu-level.delete']);
    $level = LguLevel::create(['code' => '6', 'name' => 'In Use']);

    Office::factory()->create([
        'code' => 'LGU',
        'sector_id' => Sector::create(['code' => 'LGU1', 'name' => 'LGU Sector'])->id,
        'lgu_level_id' => $level->id,
        'office_type_id' => OfficeType::firstOrCreate(['code' => '01'], ['name' => 'Office'])->id,
    ]);

    $this->actingAs($user)->delete("/lgu-levels/{$level->id}")->assertSessionHasErrors();

    expect(LguLevel::find($level->id))->not->toBeNull();
});
