<?php

use App\Http\Controllers\PsBreakdownController;
use App\Models\AipEntry;
use App\Models\ChartOfAccount;
use App\Models\FiscalYear;
use App\Models\Ios;
use App\Models\Office;
use App\Models\Permission;
use App\Models\PermissionRole;
use App\Models\Position;
use App\Models\Ppa;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $pdo = DB::connection()->getPdo();

    if (method_exists($pdo, 'sqliteCreateFunction')) {
        $pdo->sqliteCreateFunction('SHA2', fn ($value) => hash('sha256', (string) $value), 2);
    }
});

function psBreakdownTestUser(array $permissionNames = ['ps-breakdown.view']): User
{
    static $seq = 0;

    $seq++;

    $role = Role::create(['name' => "ps-breakdown-tester-{$seq}"]);

    foreach ($permissionNames as $name) {
        $permission = Permission::firstOrCreate(['name' => $name]);
        PermissionRole::create(['role_id' => $role->id, 'permission_id' => $permission->id]);
    }

    return User::factory()->create(['role_id' => $role->id]);
}

function psBreakdownTestCoa(string $path, ?string $class, bool $active = true): ChartOfAccount
{
    static $seq = 500;

    $seq++;

    return ChartOfAccount::create([
        'account_number' => "ps-{$seq}",
        'account_title' => "PS Account {$seq}",
        'account_type' => 'EXPENSE',
        'expense_class' => $class,
        'path' => $path,
        'level' => 4,
        'is_postable' => true,
        'is_active' => $active,
        'normal_balance' => 'DEBIT',
    ]);
}

function psBreakdownTestRoute(): array
{
    $fy = FiscalYear::factory()->create(['status' => 'draft']);
    $office = Office::factory()->create();
    $ppa = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'PS Breakdown Program',
        'type' => 'Program',
        'code_suffix' => 'ps'.random_int(1000, 9999),
        'fiscal_year_id' => $fy->id,
    ]);
    $entry = AipEntry::create(['ppa_id' => $ppa->id]);

    return [$fy, $entry];
}

test('it forbids the page without ps-breakdown.view', function () {
    [$fy, $entry] = psBreakdownTestRoute();
    $user = psBreakdownTestUser([]);

    $this->actingAs($user)->get("/aip/{$fy->id}/summary/{$entry->id}/ps-breakdown")->assertForbidden();
});

test('it scopes dynamic columns to active PS accounts ordered by path', function () {
    [$fy, $entry] = psBreakdownTestRoute();
    $user = psBreakdownTestUser();

    psBreakdownTestCoa('5-01-01-020', 'PS');
    psBreakdownTestCoa('5-01-01-010', 'PS');
    psBreakdownTestCoa('5-02-03-010', 'MOOE');
    psBreakdownTestCoa('5-01-02-010', 'PS', active: false);

    $this->actingAs($user)->get("/aip/{$fy->id}/summary/{$entry->id}/ps-breakdown")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('chartOfAccounts', 2)
            ->where('chartOfAccounts.0.path', '5-01-01-010')
            ->where('chartOfAccounts.1.path', '5-01-01-020')
        );
});

test('it computes hardcoded per-position PS totals', function () {
    $office = Office::factory()->create();
    $sg24 = Ios::create([
        'occupational_service_code' => '11',
        'occupational_group_code' => '001',
        'class_id' => 'A',
        'class' => 'Officer V',
        'salary_grade' => 24,
    ]);
    $sg15 = Ios::create([
        'occupational_service_code' => '11',
        'occupational_group_code' => '002',
        'class_id' => 'B',
        'class' => 'Officer II',
        'salary_grade' => 15,
    ]);

    $make = fn (array $attrs) => Position::create(array_merge(
        ['office_id' => $office->id, 'is_funded' => true],
        $attrs,
    ));

    $posA = $make(['item_number' => 'PS-1', 'ios_id' => $sg24->id, 'employment_type' => 'permanent', 'status' => 'occupied']);
    $posB = $make(['item_number' => 'PS-2', 'ios_id' => $sg15->id, 'employment_type' => 'casual', 'status' => 'occupied']);
    $posC = $make(['item_number' => 'PS-3', 'ios_id' => $sg24->id, 'employment_type' => 'permanent', 'status' => 'vacant']);
    $make(['item_number' => 'PS-4', 'ios_id' => $sg24->id, 'employment_type' => 'permanent', 'status' => 'occupied', 'is_funded' => false]);
    $make(['item_number' => 'PS-5', 'ios_id' => $sg24->id, 'employment_type' => 'permanent', 'status' => 'abolished']);

    $annualRateMap = [
        $posA->id => ['current' => 0, 'budget' => 600000],
        $posB->id => ['current' => 0, 'budget' => 240000],
        $posC->id => ['current' => 0, 'budget' => 600000],
    ];

    $totals = PsBreakdownController::computePsCoaTotals(
        Position::with('ios')->where('office_id', $office->id)->get(),
        [],
        $annualRateMap,
    );

    $round = fn (string $key) => round($totals[$key], 2);

    // Salaries follow post cost (vacant funded counts, unfunded/abolished do not).
    expect($round('5-01-01-010'))->toBe(1200000.0)
        ->and($round('5-01-01-020'))->toBe(240000.0)
        // Flat person-benefits require occupied posts.
        ->and($round('5-01-02-010'))->toBe(48000.0)
        ->and($round('5-01-02-020'))->toBe(48000.0)
        ->and($round('5-01-02-030'))->toBe(24000.0)
        ->and($round('5-01-02-040'))->toBe(16000.0)
        ->and($round('5-01-02-060'))->toBe(3600.0)
        ->and($round('5-01-02-080'))->toBe(10000.0)
        ->and($round('5-01-02-110'))->toBe(90000.0)
        ->and($round('5-01-02-150'))->toBe(10000.0)
        // Salary-derived amounts.
        ->and($round('5-01-02-140'))->toBe(120000.0)
        ->and($round('5-01-02-990'))->toBe(120000.0)
        ->and($round('5-01-03-010'))->toBe(172800.0)
        ->and($round('5-01-03-020'))->toBe(7200.0)
        ->and($round('5-01-03-030'))->toBe(36000.0)
        ->and($round('5-01-03-040'))->toBe(3600.0);
});
