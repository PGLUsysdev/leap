<?php

use App\Models\FiscalYear;
use App\Models\LguLevel;
use App\Models\Office;
use App\Models\OfficeType;
use App\Models\Permission;
use App\Models\PermissionRole;
use App\Models\Ppa;
use App\Models\Role;
use App\Models\Sector;
use App\Models\User;

function createImportUser(): User
{
    $role = Role::create(['name' => 'import-tester']);
    $permission = Permission::firstOrCreate(['name' => 'ppa.create']);
    PermissionRole::create(['role_id' => $role->id, 'permission_id' => $permission->id]);

    return User::factory()->create(['role_id' => $role->id]);
}

function createImportOffice(): Office
{
    static $seq = 1;
    $n = $seq++;

    return Office::factory()->create([
        'code' => str_pad((string) $n, 3, '0', STR_PAD_LEFT),
        'sector_id' => Sector::create(['code' => str_pad((string) (1000 + $n), 4, '0', STR_PAD_LEFT), 'name' => "Test Sector {$n}"])->id,
        'lgu_level_id' => LguLevel::create(['code' => '1', 'name' => "Prov{$n}"])->id,
        'office_type_id' => OfficeType::create(['code' => '01', 'name' => "Office{$n}"])->id,
    ]);
}

test('it imports new ppa blocks with parent linkage', function () {
    $user = createImportUser();
    $office = createImportOffice();
    $fiscalYear = FiscalYear::factory()->create(['status' => 'draft']);
    $prefix = $office->full_code;

    $response = $this->actingAs($user)->post('/aip-summary-import', [
        'office_id' => $office->id,
        'fiscal_year_id' => $fiscalYear->id,
        'blocks' => [
            ['full_code' => "{$prefix}-001", 'name' => 'Program A', 'type' => 'Program'],
            ['full_code' => "{$prefix}-001-002", 'name' => 'Project B', 'type' => 'Project'],
        ],
    ]);

    $response->assertRedirect();

    $program = Ppa::where('office_id', $office->id)
        ->where('fiscal_year_id', $fiscalYear->id)
        ->where('type', 'Program')
        ->firstOrFail();
    expect($program->name)->toBe('Program A');
    expect($program->parent_id)->toBeNull();

    $project = Ppa::where('office_id', $office->id)
        ->where('fiscal_year_id', $fiscalYear->id)
        ->where('type', 'Project')
        ->firstOrFail();
    expect($project->parent_id)->toBe($program->id);
    expect($project->full_code)->toBe("{$prefix}-001-002");
});

test('it skips existing blocks on re-import', function () {
    $user = createImportUser();
    $office = createImportOffice();
    $fiscalYear = FiscalYear::factory()->create(['status' => 'draft']);
    $prefix = $office->full_code;

    $payload = [
        'office_id' => $office->id,
        'fiscal_year_id' => $fiscalYear->id,
        'blocks' => [
            ['full_code' => "{$prefix}-001", 'name' => 'Program A', 'type' => 'Program'],
        ],
    ];

    $this->actingAs($user)->post('/aip-summary-import', $payload)->assertRedirect();
    $this->actingAs($user)->post('/aip-summary-import', $payload)->assertRedirect();

    expect(
        Ppa::where('office_id', $office->id)
            ->where('fiscal_year_id', $fiscalYear->id)
            ->count(),
    )->toBe(1);
});

test('it validates the import payload', function () {
    $user = createImportUser();

    $this->actingAs($user)->post('/aip-summary-import', [
        'office_id' => 999999,
        'fiscal_year_id' => 999999,
        'blocks' => [],
    ])->assertSessionHasErrors(['office_id', 'fiscal_year_id', 'blocks']);
});
