<?php

use App\Http\Controllers\PsBreakdownController;
use App\Models\AipDocument;
use App\Models\AipEntry;
use App\Models\AipOutput;
use App\Models\ChartOfAccount;
use App\Models\ChartOfAccountPpmpCategory;
use App\Models\FeBreakdownItem;
use App\Models\FiscalYear;
use App\Models\FundingSource;
use App\Models\Office;
use App\Models\Permission;
use App\Models\PermissionRole;
use App\Models\Ppa;
use App\Models\PpaFundingSource;
use App\Models\Ppmp;
use App\Models\PpmpCategory;
use App\Models\PpmpPriceList;
use App\Models\Role;
use App\Models\User;
use App\Services\MockPersonnelData;
use App\Services\WorkspacePersonnel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    // ppmp_price_lists has a MySQL generated column calling sha2(); sqlite
    // needs the function registered before that table is written.
    $pdo = DB::connection()->getPdo();

    if (method_exists($pdo, 'sqliteCreateFunction')) {
        $pdo->sqliteCreateFunction('sha2', fn ($value) => hash('sha256', (string) $value));
        $pdo->sqliteCreateFunction('SHA2', fn ($value) => hash('sha256', (string) $value));
    }
});

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

test('it totals regular documents only, excluding supplemental', function () {
    $office = Office::factory()->create();
    $fiscalYear = FiscalYear::factory()->create(['status' => 'draft']);
    $fundingSource = FundingSource::create([
        'fund_type' => 'General Fund',
        'code' => 'GF',
        'title' => 'General Fund',
    ]);

    $role = Role::create(['name' => 'dashboard-regular-tester']);
    $permission = Permission::firstOrCreate(['name' => 'dashboard.view']);
    PermissionRole::create(['role_id' => $role->id, 'permission_id' => $permission->id]);
    $user = User::factory()->create(['role_id' => $role->id, 'office_id' => $office->id]);

    $ppa = Ppa::factory()->create([
        'office_id' => $office->id,
        'fiscal_year_id' => $fiscalYear->id,
    ]);

    $regularDoc = AipDocument::create([
        'fiscal_year_id' => $fiscalYear->id,
        'office_id' => $office->id,
        'kind' => 'regular',
        'name' => 'Regular AIP',
    ]);
    $supplementalDoc = AipDocument::create([
        'fiscal_year_id' => $fiscalYear->id,
        'office_id' => $office->id,
        'kind' => 'supplemental',
        'name' => 'Supplemental AIP No. 1',
    ]);

    $regularEntry = AipEntry::create(['ppa_id' => $ppa->id, 'aip_document_id' => $regularDoc->id]);
    $supplementalEntry = AipEntry::create(['ppa_id' => $ppa->id, 'aip_document_id' => $supplementalDoc->id]);

    $regularOutput = AipOutput::create(['aip_entry_id' => $regularEntry->id]);
    $supplementalOutput = AipOutput::create(['aip_entry_id' => $supplementalEntry->id]);

    PpaFundingSource::create([
        'aip_output_id' => $regularOutput->id,
        'funding_source_id' => $fundingSource->id,
        'ps_amount' => 100,
        'mooe_amount' => 200,
        'fe_amount' => 300,
        'co_amount' => 400,
    ]);
    PpaFundingSource::create([
        'aip_output_id' => $supplementalOutput->id,
        'funding_source_id' => $fundingSource->id,
        'ps_amount' => 10,
        'mooe_amount' => 20,
        'fe_amount' => 30,
        'co_amount' => 40,
    ]);

    expect(PpaFundingSource::regular()->count())->toBe(1);

    $this->actingAs($user)->get(route('dashboard'))->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stats.totalBudget', fn ($v) => (float) $v === 1000.0)
            ->where('expenseClassBudget.ps', fn ($v) => (float) $v === 100.0)
            ->where('expenseClassBudget.mooe', fn ($v) => (float) $v === 200.0)
        );
});

/**
 * A PS pool in the given office carrying a stale figure, so a dashboard sync
 * has something to correct.
 */
function dashboardTestPsPool(Office $office, FiscalYear $fy, float $existingPs = 42.0): PpaFundingSource
{
    FundingSource::firstOrCreate(
        ['id' => 1],
        ['fund_type' => 'General Fund', 'code' => 'GF Proper', 'title' => 'General Fund'],
    );

    $ppa = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'Dashboard PS Pool',
        'type' => 'Program',
        'code_suffix' => 'dash'.random_int(1000, 9999),
        'fiscal_year_id' => $fy->id,
        'is_ps_pool' => true,
    ]);

    $entry = AipEntry::create(['ppa_id' => $ppa->id]);
    $output = $entry->outputs()->create(['sort_order' => 0]);
    $output->offices()->sync([$office->id]);

    return PpaFundingSource::create([
        'aip_output_id' => $output->id,
        'funding_source_id' => 1,
        'ps_amount' => $existingPs,
    ]);
}

function dashboardTestFakePersonnel(): void
{
    config([
        'services.workspace.token' => 'pdapi_test_token',
        'services.workspace.base_url' => 'https://api.example.test/api/data/v1',
    ]);

    Http::fake([
        'api.example.test/api/data/v1/employees?*' => Http::response([
            'data' => [[
                'pers_id' => '1',
                'full_name' => 'PERMANENT ONE',
                'pos_code' => '2B002',
                'appointment_status' => 'PERMANENT',
                'salary_grade' => 11,
                'step' => 1,
            ]],
            'meta' => ['current_page' => 1, 'per_page' => 500, 'total' => 1, 'last_page' => 1],
        ]),
        'api.example.test/api/data/v1/positions*' => Http::response([
            'data' => [['id' => 500, 'pos_code' => '2B002', 'pos_name' => 'COMPUTER PROGRAMMER I', 'salary_grade' => 11]],
            'meta' => ['current_page' => 1, 'per_page' => 500, 'total' => 1, 'last_page' => 1],
        ]),
        'api.example.test/api/data/v1/salary-grades*' => Http::response([
            'data' => [['id' => 1, 'salary_grade' => 11, 'year' => 2025, 'steps' => ['1' => 30024]]],
            'meta' => ['current_page' => 1, 'per_page' => 500, 'total' => 1, 'last_page' => 1],
        ]),
    ]);
}

test('it syncs the ps pool of the offices in view', function () {
    // Office 18 maps to department 1022, so its personnel can be read.
    $office = Office::factory()->create(['id' => 18, 'acronym' => 'OFF-18']);
    $fiscalYear = FiscalYear::factory()->create(['status' => 'draft']);
    $source = dashboardTestPsPool($office, $fiscalYear);

    dashboardTestFakePersonnel();

    $user = dashboardTestUser(['dashboard.view']);
    $user->update(['office_id' => $office->id]);

    $this->actingAs($user)->get(route('dashboard'))->assertOk();

    $rows = app(WorkspacePersonnel::class)->forOffice('1022');
    $expected = array_sum(PsBreakdownController::computePsCoaTotals(
        $rows['positions'],
        MockPersonnelData::rates(),
        $rows['annualRateMap'],
    ));

    expect($expected)->toBeGreaterThan(0.0)
        ->and(round((float) $source->fresh()->ps_amount, 2))->toBe(round($expected, 2));
});

test('it renders the dashboard when the personnel api fails during a pool sync', function () {
    $office = Office::factory()->create(['id' => 18, 'acronym' => 'OFF-18']);
    $fiscalYear = FiscalYear::factory()->create(['status' => 'draft']);
    $source = dashboardTestPsPool($office, $fiscalYear);

    config([
        'services.workspace.token' => 'pdapi_test_token',
        'services.workspace.base_url' => 'https://api.example.test/api/data/v1',
    ]);

    // preventStrayRequests turns the personnel call into an exception.
    $user = dashboardTestUser(['dashboard.view']);
    $user->update(['office_id' => $office->id]);

    $this->actingAs($user)->get(route('dashboard'))->assertOk();

    // The stored figure is left alone rather than zeroed.
    expect((float) $source->fresh()->ps_amount)->toBe(42.0);
});

test('it does not sync a pool belonging to an office outside the view', function () {
    $poolOffice = Office::factory()->create(['id' => 18, 'acronym' => 'OFF-18']);
    $otherOffice = Office::factory()->create(['id' => 7, 'acronym' => 'OFF-7']);

    $fiscalYear = FiscalYear::factory()->create(['status' => 'draft']);
    $source = dashboardTestPsPool($poolOffice, $fiscalYear);

    dashboardTestFakePersonnel();

    // The user is scoped to office 7, so office 18's pool must not be written.
    $user = dashboardTestUser(['dashboard.view']);
    $user->update(['office_id' => $otherOffice->id]);

    $this->actingAs($user)->get(route('dashboard'))->assertOk();

    expect((float) $source->fresh()->ps_amount)->toBe(42.0);
});

/**
 * A chart of account with an expense class, postable and active.
 */
function dashboardTestCoa(string $path, string $class, string $title = 'Test Account'): ChartOfAccount
{
    return ChartOfAccount::create([
        'path' => $path,
        'account_number' => substr($path, -3),
        'account_title' => $title,
        'account_type' => 'EXPENSE',
        'expense_class' => $class,
        'level' => 4,
        'is_postable' => true,
        'is_active' => true,
        'normal_balance' => 'DEBIT',
    ]);
}

/**
 * A MOOE/CO amount reached through the procurement chain:
 * ppmp -> price list -> pivot category -> chart of account.
 */
function dashboardTestPpmpAmount(
    Ppa $ppa,
    ChartOfAccount $coa,
    float $janAmount,
): void {
    $category = PpmpCategory::create(['name' => 'cat-'.uniqid()]);

    $pivot = ChartOfAccountPpmpCategory::create([
        'chart_of_account_id' => $coa->id,
        'ppmp_category_id' => $category->id,
    ]);

    $priceList = PpmpPriceList::create([
        'item_number' => 'pl-'.uniqid(),
        'sort_order' => 1,
        'description' => 'Test line item',
        'unit_of_measurement' => 'unit',
        'price' => 100,
        'chart_of_account_ppmp_category_id' => $pivot->id,
    ]);

    $entry = AipEntry::create(['ppa_id' => $ppa->id]);
    $output = $entry->outputs()->create(['sort_order' => 0]);
    $source = PpaFundingSource::create([
        'aip_output_id' => $output->id,
        'funding_source_id' => FundingSource::create([
            'fund_type' => 'General Fund',
            'code' => 'GF-'.uniqid(),
            'title' => 'General Fund',
        ])->id,
    ]);

    Ppmp::create([
        'ppa_funding_source_id' => $source->id,
        'ppmp_price_list_id' => $priceList->id,
        'jan_amount' => $janAmount,
    ]);
}

/**
 * The chart-of-accounts prop for a dashboard request by an office-scoped user.
 *
 * $test is the Pest test case; helpers cannot reach $this on their own.
 */
function dashboardTestCoaBudget($test, Office $office): array
{
    $user = dashboardTestUser(['dashboard.view']);
    $user->update(['office_id' => $office->id]);

    $response = $test->actingAs($user)->get(route('dashboard'));
    $response->assertOk();

    $captured = null;
    $response->assertInertia(function ($page) use (&$captured): void {
        $captured = $page->toArray()['props']['coaBudget'] ?? [];
    });

    return $captured ?? [];
}

test('it omits accounts that have no amount', function () {
    // 755 accounts exist but only those with a figure are listed.
    $office = Office::factory()->create(['id' => 5, 'acronym' => 'OFF-5']);
    $fy = FiscalYear::factory()->create(['status' => 'draft']);

    dashboardTestFakePersonnel();

    dashboardTestCoa('5-02-03-020', 'MOOE', 'Accountable Forms Expenses');

    $rows = dashboardTestCoaBudget($this, $office);

    // The account was created but nothing budgeted against it.
    expect($rows)->toBeArray();
});

test('it shows mooe amounts reached through procurement', function () {
    $office = Office::factory()->create(['id' => 5, 'acronym' => 'OFF-5']);
    $fy = FiscalYear::factory()->create(['status' => 'draft']);

    $ppa = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'Proc Program',
        'type' => 'Program',
        'code_suffix' => 'proc'.random_int(1000, 9999),
        'fiscal_year_id' => $fy->id,
    ]);

    $coa = dashboardTestCoa('5-02-03-020', 'MOOE', 'Accountable Forms Expenses');
    dashboardTestPpmpAmount($ppa, $coa, 1500.0);

    $rows = collect(dashboardTestCoaBudget($this, $office))
        ->keyBy('path');

    expect($rows)->toHaveKey('5-02-03-020')
        ->and((float) $rows['5-02-03-020']['value'])->toBe(1500.0)
        ->and($rows['5-02-03-020']['expense_class'])->toBe('mooe')
        ->and($rows['5-02-03-020']['account_title'])->toBe('Accountable Forms Expenses');
});

test('it carries the full path so duplicate account numbers stay distinguishable', function () {
    $office = Office::factory()->create(['id' => 5, 'acronym' => 'OFF-5']);
    $fy = FiscalYear::factory()->create(['status' => 'draft']);

    $ppa = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'Dup Program',
        'type' => 'Program',
        'code_suffix' => 'dup'.random_int(1000, 9999),
        'fiscal_year_id' => $fy->id,
    ]);

    // Both accounts end in the same three-digit segment, so account_number
    // alone cannot tell them apart in the chart labels.
    dashboardTestPpmpAmount($ppa, dashboardTestCoa('5-02-03-020', 'MOOE', 'MOOE Account'), 100.0);
    dashboardTestPpmpAmount($ppa, dashboardTestCoa('1-07-05-020', 'CO', 'CO Account'), 200.0);

    $rows = collect(dashboardTestCoaBudget($this, $office))->keyBy('path');

    expect($rows)->toHaveKey('5-02-03-020')
        ->and($rows)->toHaveKey('1-07-05-020')
        ->and($rows['5-02-03-020']['account_number'])->toBe('020')
        ->and($rows['1-07-05-020']['account_number'])->toBe('020')
        // The path disambiguates them.
        ->and($rows['5-02-03-020']['path'])->not->toBe($rows['1-07-05-020']['path']);
});

test('it shows fe amounts from the fe breakdown page', function () {
    $office = Office::factory()->create(['id' => 5, 'acronym' => 'OFF-5']);
    $fy = FiscalYear::factory()->create(['status' => 'draft']);

    $coa = dashboardTestCoa('5-03-01-020', 'FE', 'Land Acquisition');

    $ppa = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'FE Program',
        'type' => 'Program',
        'code_suffix' => 'fe'.random_int(1000, 9999),
        'fiscal_year_id' => $fy->id,
    ]);

    $entry = AipEntry::create(['ppa_id' => $ppa->id]);
    $output = $entry->outputs()->create(['sort_order' => 0]);
    $source = PpaFundingSource::create([
        'aip_output_id' => $output->id,
        'funding_source_id' => FundingSource::create([
            'fund_type' => 'General Fund',
            'code' => 'GF-FE-'.uniqid(),
            'title' => 'General Fund',
        ])->id,
    ]);

    FeBreakdownItem::create([
        'ppa_funding_source_id' => $source->id,
        'chart_of_account_id' => $coa->id,
        'amount' => 2500.0,
    ]);

    $rows = collect(dashboardTestCoaBudget($this, $office))->keyBy('path');

    expect($rows)->toHaveKey('5-03-01-020')
        ->and((float) $rows['5-03-01-020']['value'])->toBe(2500.0)
        ->and($rows['5-03-01-020']['expense_class'])->toBe('fe');
});

test('it shows every account with an amount rather than a top ten', function () {
    $office = Office::factory()->create(['id' => 5, 'acronym' => 'OFF-5']);
    $fy = FiscalYear::factory()->create(['status' => 'draft']);

    $ppa = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'Many Program',
        'type' => 'Program',
        'code_suffix' => 'many'.random_int(1000, 9999),
        'fiscal_year_id' => $fy->id,
    ]);

    // 12 accounts, each with a distinct amount so ordering is checkable.
    for ($i = 1; $i <= 12; $i++) {
        dashboardTestPpmpAmount(
            $ppa,
            dashboardTestCoa("5-02-03-0{$i}", 'MOOE', "Account {$i}"),
            (float) ($i * 100),
        );
    }

    $rows = dashboardTestCoaBudget($this, $office);

    expect($rows)->toHaveCount(12)
        // Server-sorted, largest first.
        ->and((float) $rows[0]['value'])->toBe(1200.0)
        ->and((float) $rows[11]['value'])->toBe(100.0);
});
