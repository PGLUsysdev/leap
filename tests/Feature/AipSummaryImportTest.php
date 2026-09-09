<?php

use App\Models\AipEntry;
use App\Models\AipOutput;
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
        'lgu_level_id' => LguLevel::firstOrCreate(['code' => '1'], ['name' => 'Provincial'])->id,
        'office_type_id' => OfficeType::firstOrCreate(['code' => '01'], ['name' => 'Office'])->id,
    ]);
}

function createOutputsUser(Office $office): User
{
    $role = Role::create(['name' => 'outputs-tester']);
    foreach (['aip-summary.edit', 'aip-summary.show.all'] as $name) {
        $permission = Permission::firstOrCreate(['name' => $name]);
        PermissionRole::create(['role_id' => $role->id, 'permission_id' => $permission->id]);
    }

    return User::factory()->create(['role_id' => $role->id, 'office_id' => $office->id]);
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

test('it imports outputs matched by normalized ppa name', function () {
    $office = createImportOffice();
    $user = createOutputsUser($office);
    $fiscalYear = FiscalYear::factory()->create(['status' => 'draft']);
    $ppa = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'Governance Initiatives',
        'type' => 'Program',
        'code_suffix' => '1',
        'fiscal_year_id' => $fiscalYear->id,
    ]);

    $payload = [
        'office_id' => $office->id,
        'fiscal_year_id' => $fiscalYear->id,
        'outputs' => [
            [
                'full_code' => $ppa->full_code,
                'name' => '  GOVERNANCE   initiatives ',
                'expected_output' => '100% services provided',
                'start_date' => '2027-01-01',
                'end_date' => '2027-12-01',
                'office_ids' => [$office->id],
            ],
        ],
    ];

    $this->actingAs($user)->post('/aip-summary-import/outputs', $payload)->assertRedirect();

    $entry = AipEntry::where('ppa_id', $ppa->id)->firstOrFail();
    $output = $entry->outputs()->firstOrFail();
    expect($output->expected_output)->toBe('100% services provided');
    expect($output->start_date)->toBe('2027-01-01');
    expect($output->end_date)->toBe('2027-12-01');
    expect($output->offices()->pluck('offices.id')->all())->toBe([$office->id]);
});

test('it skips outputs with no ppa, no offices, or duplicates', function () {
    $office = createImportOffice();
    $user = createOutputsUser($office);
    $fiscalYear = FiscalYear::factory()->create(['status' => 'draft']);
    $ppa = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'Governance Initiatives',
        'type' => 'Program',
        'code_suffix' => '1',
        'fiscal_year_id' => $fiscalYear->id,
    ]);

    $base = [
        'full_code' => $ppa->full_code,
        'name' => 'Governance Initiatives',
        'expected_output' => '100% services provided',
        'start_date' => '2027-01-01',
        'end_date' => '2027-12-01',
        'office_ids' => [$office->id],
    ];

    $payload = [
        'office_id' => $office->id,
        'fiscal_year_id' => $fiscalYear->id,
        'outputs' => [
            $base,
            array_merge($base, ['name' => 'Missing Program']),
            array_merge($base, ['expected_output' => 'Orphan output', 'office_ids' => []]),
        ],
    ];

    $this->actingAs($user)->post('/aip-summary-import/outputs', $payload)->assertRedirect();
    // Re-import: the valid row is now a duplicate.
    $this->actingAs($user)->post('/aip-summary-import/outputs', $payload)->assertRedirect();

    expect(AipOutput::count())->toBe(1);
});

test('it disambiguates same-name ppas by full code', function () {
    $office = createImportOffice();
    $user = createOutputsUser($office);
    $fiscalYear = FiscalYear::factory()->create(['status' => 'draft']);

    $parent = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'Parent Program',
        'type' => 'Program',
        'code_suffix' => '1',
        'fiscal_year_id' => $fiscalYear->id,
    ]);
    $childA = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => $parent->id,
        'name' => 'Same Name',
        'type' => 'Project',
        'code_suffix' => '1',
        'fiscal_year_id' => $fiscalYear->id,
    ]);
    $childB = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => $parent->id,
        'name' => 'Same Name',
        'type' => 'Project',
        'code_suffix' => '2',
        'fiscal_year_id' => $fiscalYear->id,
    ]);

    $makePayload = fn (array $output) => [
        'office_id' => $office->id,
        'fiscal_year_id' => $fiscalYear->id,
        'outputs' => [$output],
    ];

    // Ambiguous without a code: skipped.
    $this->actingAs($user)->post('/aip-summary-import/outputs', $makePayload([
        'full_code' => null,
        'name' => 'Same Name',
        'expected_output' => 'Ambiguous output',
        'start_date' => null,
        'end_date' => null,
        'office_ids' => [$office->id],
    ]))->assertRedirect();
    expect(AipOutput::count())->toBe(0);

    // Resolved by full code.
    $this->actingAs($user)->post('/aip-summary-import/outputs', $makePayload([
        'full_code' => $childB->full_code,
        'name' => 'Same Name',
        'expected_output' => 'Child B output',
        'start_date' => null,
        'end_date' => null,
        'office_ids' => [$office->id],
    ]))->assertRedirect();

    $entry = AipEntry::where('ppa_id', $childB->id)->firstOrFail();
    expect($childA->aipEntries()->count())->toBe(0);
    expect($entry->outputs()->firstOrFail()->expected_output)->toBe('Child B output');
});

test('it validates the outputs payload', function () {
    $office = createImportOffice();
    $user = createOutputsUser($office);

    $this->actingAs($user)->post('/aip-summary-import/outputs', [
        'office_id' => $office->id,
        'fiscal_year_id' => 999999,
        'outputs' => [],
    ])->assertSessionHasErrors(['fiscal_year_id', 'outputs']);
});

test('it imports context rows with a null expected output', function () {
    $office = createImportOffice();
    $user = createOutputsUser($office);
    $fiscalYear = FiscalYear::factory()->create(['status' => 'draft']);
    $ppa = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'Manpower Services',
        'type' => 'Program',
        'code_suffix' => '1',
        'fiscal_year_id' => $fiscalYear->id,
    ]);

    $payload = [
        'office_id' => $office->id,
        'fiscal_year_id' => $fiscalYear->id,
        'outputs' => [
            [
                'full_code' => $ppa->full_code,
                'name' => 'Manpower Services',
                'expected_output' => null,
                'start_date' => '2027-01-01',
                'end_date' => '2027-12-01',
                'office_ids' => [$office->id],
            ],
        ],
    ];

    $this->actingAs($user)->post('/aip-summary-import/outputs', $payload)->assertRedirect();
    // Re-import: the null output is now a duplicate.
    $this->actingAs($user)->post('/aip-summary-import/outputs', $payload)->assertRedirect();

    $entry = AipEntry::where('ppa_id', $ppa->id)->firstOrFail();
    $outputs = $entry->outputs()->get();
    expect($outputs)->toHaveCount(1);
    expect($outputs->first()->expected_output)->toBeNull();
    expect($outputs->first()->start_date)->toBe('2027-01-01');
});

test('it creates bare ancestor entries for imported outputs', function () {
    $office = createImportOffice();
    $user = createOutputsUser($office);
    $fiscalYear = FiscalYear::factory()->create(['status' => 'draft']);

    $program = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'Root Program',
        'type' => 'Program',
        'code_suffix' => '1',
        'fiscal_year_id' => $fiscalYear->id,
    ]);
    $project = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => $program->id,
        'name' => 'Child Project',
        'type' => 'Project',
        'code_suffix' => '1',
        'fiscal_year_id' => $fiscalYear->id,
    ]);

    $this->actingAs($user)->post('/aip-summary-import/outputs', [
        'office_id' => $office->id,
        'fiscal_year_id' => $fiscalYear->id,
        'outputs' => [
            [
                'full_code' => $project->full_code,
                'name' => 'Child Project',
                'expected_output' => 'Something delivered',
                'start_date' => null,
                'end_date' => null,
                'office_ids' => [$office->id],
            ],
        ],
    ])->assertRedirect();

    $ancestorEntry = AipEntry::where('ppa_id', $program->id)->firstOrFail();
    expect($ancestorEntry->outputs()->count())->toBe(0);
    expect(AipEntry::where('ppa_id', $project->id)->firstOrFail()->outputs()->count())->toBe(1);
});
