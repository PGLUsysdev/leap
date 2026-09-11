<?php

use App\Models\FiscalYear;
use App\Models\LguLevel;
use App\Models\Office;
use App\Models\OfficeType;
use App\Models\Ppa;
use App\Models\Sector;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

function pathTestOffice(): Office
{
    static $seq = 600;
    $n = $seq++;

    return Office::factory()->create([
        'code' => str_pad((string) $n, 3, '0', STR_PAD_LEFT),
        'sector_id' => Sector::create(['code' => str_pad((string) (6000 + $n), 4, '0', STR_PAD_LEFT), 'name' => "Path Sector {$n}"])->id,
        'lgu_level_id' => LguLevel::firstOrCreate(['code' => '1'], ['name' => 'Provincial'])->id,
        'office_type_id' => OfficeType::firstOrCreate(['code' => '01'], ['name' => 'Office'])->id,
    ]);
}

function pathTestChain(): array
{
    $office = pathTestOffice();
    $fiscalYear = FiscalYear::factory()->create(['status' => 'draft']);

    $program = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'Path Program',
        'type' => 'Program',
        'code_suffix' => '2',
        'fiscal_year_id' => $fiscalYear->id,
    ]);
    $project = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => $program->id,
        'name' => 'Path Project',
        'type' => 'Project',
        'code_suffix' => '1',
        'fiscal_year_id' => $fiscalYear->id,
    ]);
    $activity = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => $project->id,
        'name' => 'Path Activity',
        'type' => 'Activity',
        'code_suffix' => '1',
        'fiscal_year_id' => $fiscalYear->id,
    ]);

    return compact('office', 'fiscalYear', 'program', 'project', 'activity');
}

test('creating ppas materializes the hierarchy path', function () {
    $chain = pathTestChain();

    expect($chain['program']->fresh()->path)->toBe('002');
    expect($chain['project']->fresh()->path)->toBe('002-001');
    expect($chain['activity']->fresh()->path)->toBe('002-001-01');

    $prefix = $chain['office']->full_code;
    expect($chain['activity']->fresh()->full_code)->toBe("{$prefix}-002-001-01");
});

test('updating a suffix cascades the path to descendants', function () {
    $chain = pathTestChain();

    $chain['program']->update(['code_suffix' => '5']);

    expect($chain['program']->fresh()->path)->toBe('005');
    expect($chain['project']->fresh()->path)->toBe('005-001');
    expect($chain['activity']->fresh()->path)->toBe('005-001-01');
});

test('reparenting rewrites the moved subtree paths', function () {
    $chain = pathTestChain();

    $otherProgram = Ppa::create([
        'office_id' => $chain['office']->id,
        'parent_id' => null,
        'name' => 'Other Program',
        'type' => 'Program',
        'code_suffix' => '7',
        'fiscal_year_id' => $chain['fiscalYear']->id,
    ]);

    $chain['project']->update(['parent_id' => $otherProgram->id]);

    expect($chain['project']->fresh()->path)->toBe('007-001');
    expect($chain['activity']->fresh()->path)->toBe('007-001-01');
});

test('duplicate paths in the same office and fiscal year are rejected', function () {
    $chain = pathTestChain();

    expect(fn () => DB::table('ppas')->insert([
        'office_id' => $chain['office']->id,
        'parent_id' => $chain['program']->id,
        'name' => 'Duplicate Project',
        'type' => 'Project',
        'code_suffix' => '1',
        'fiscal_year_id' => $chain['fiscalYear']->id,
        'path' => '002-001',
        'created_at' => now(),
        'updated_at' => now(),
    ]))->toThrow(QueryException::class);
});

test('listing full codes needs no per-row parent queries', function () {
    $chain = pathTestChain();

    DB::enableQueryLog();

    $ppas = Ppa::where('office_id', $chain['office']->id)
        ->with('office.sector', 'office.lguLevel', 'office.officeType')
        ->get();

    foreach ($ppas as $ppa) {
        $ppa->full_code;
    }

    // 1 ppas + 1 office + sector/lgu-level/office-type = 5 total,
    // regardless of tree depth. Recursive accessors would add one
    // parent query per level per row.
    expect(count(DB::getQueryLog()))->toBeLessThanOrEqual(5);
});
