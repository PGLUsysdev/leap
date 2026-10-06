<?php

use App\Http\Controllers\PsBreakdownController;
use App\Models\AipEntry;
use App\Models\ChartOfAccount;
use App\Models\FiscalYear;
use App\Models\Office;
use App\Models\Permission;
use App\Models\PermissionRole;
use App\Models\Ppa;
use App\Models\Role;
use App\Models\User;
use App\Services\MockPersonnelData;
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

test('it serves the breakdown from mock personnel data', function () {
    [$fy, $entry] = psBreakdownTestRoute();
    $user = psBreakdownTestUser();

    psBreakdownTestCoa('5-01-01-010', 'PS');

    $positions = MockPersonnelData::positions();

    $this->actingAs($user)->get("/aip/{$fy->id}/summary/{$entry->id}/ps-breakdown")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('chartOfAccounts', 1)
            ->has('fiscalYear')
            // Personnel data is served from the mock dataset rather than the
            // deprecated ios / positions / salary_standards tables.
            ->has('positions', count($positions))
            ->has('rates', count(MockPersonnelData::rates()))
            ->has('annualRateMap', count(MockPersonnelData::annualRateMap()))
            ->where('positions.0.item_number', $positions[0]['item_number'])
            ->where('positions.0.ios.salary_grade', $positions[0]['ios']['salary_grade'])
            ->where('positions.0.user.name', $positions[0]['user']['name'])
            ->where('annualRateMap.101.budget', MockPersonnelData::annualRateMap()[101]['budget'])
            ->missing('breakdownItems')
            ->missing('autoValues')
            ->missing('offices')
            ->missing('fiscalYears')
            // The LBP Form 2 PDF was removed from this page.
            ->missing('can')
        );
});

/**
 * Build a mock personnel position row. `ios` is nested as the API will supply
 * it, keeping these tests off the deprecated `positions` / `ios` tables.
 */
function psBreakdownTestPosition(array $attrs = []): array
{
    return array_merge([
        'id' => 1,
        'office_id' => 1,
        'item_number' => 'PS-1',
        'employment_type' => 'permanent',
        'is_funded' => true,
        'status' => 'occupied',
        'ios' => [
            'id' => 1,
            'class' => 'Officer',
            'class_id' => 'O-1',
            'salary_grade' => 24,
        ],
        'user' => null,
    ], $attrs);
}

test('it computes hardcoded per-position PS totals', function () {
    $posA = psBreakdownTestPosition(['id' => 1]);
    $posB = psBreakdownTestPosition([
        'id' => 2,
        'employment_type' => 'casual',
        'ios' => ['id' => 2, 'class' => 'Officer', 'class_id' => 'O-2', 'salary_grade' => 15],
    ]);
    $posC = psBreakdownTestPosition(['id' => 3, 'status' => 'vacant']);
    $unfunded = psBreakdownTestPosition(['id' => 4, 'is_funded' => false]);
    $abolished = psBreakdownTestPosition(['id' => 5, 'status' => 'abolished']);

    $annualRateMap = [
        1 => ['current' => 0, 'budget' => 600000],
        2 => ['current' => 0, 'budget' => 240000],
        3 => ['current' => 0, 'budget' => 600000],
    ];

    $totals = PsBreakdownController::computePsCoaTotals(
        [$posA, $posB, $posC, $unfunded, $abolished],
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

test('it prorates casual and contractual pay on the daily rate', function () {
    // ₱20,000/mo, ₱10,000/mo and ₱5,000/mo respectively.
    $casual = psBreakdownTestPosition(['id' => 1, 'employment_type' => 'casual']);
    $contractual = psBreakdownTestPosition(['id' => 2, 'employment_type' => 'contractual']);
    $longService = psBreakdownTestPosition(['id' => 3, 'employment_type' => 'casual']);
    $permanent = psBreakdownTestPosition(['id' => 4, 'employment_type' => 'permanent']);

    $annualRateMap = [
        1 => ['current' => 0, 'budget' => 240000],
        2 => ['current' => 0, 'budget' => 120000],
        3 => ['current' => 0, 'budget' => 60000],
        4 => ['current' => 0, 'budget' => 300000],
    ];

    $positions = [$casual, $contractual, $longService, $permanent];

    // With no service map every position is budgeted for a full year.
    $full = PsBreakdownController::computePsCoaTotals($positions, [], $annualRateMap);
    expect(round($full['5-01-01-020'], 2))->toBe(420000.0);

    $prorated = PsBreakdownController::computePsCoaTotals(
        $positions,
        [],
        $annualRateMap,
        [
            1 => 6,
            2 => 3,
            3 => 18,
        ],
    );

    // 6 months → 120,000; 3 months → 30,000; 18 months clamps to 12 → 60,000.
    expect(round($prorated['5-01-01-020'], 2))->toBe(210000.0)
        // Proration applies only to casual/contractual pay; permanent posts
        // keep their full annual salary under 5-01-01-010.
        ->and(round($prorated['5-01-01-010'], 2))->toBe(300000.0);
});
