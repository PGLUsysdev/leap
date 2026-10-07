<?php

use App\Http\Controllers\PsBreakdownController;
use App\Models\AipDocument;
use App\Models\AipEntry;
use App\Models\ChartOfAccount;
use App\Models\FiscalYear;
use App\Models\FundingSource;
use App\Models\Office;
use App\Models\Permission;
use App\Models\PermissionRole;
use App\Models\Ppa;
use App\Models\PpaFundingSource;
use App\Models\Role;
use App\Models\User;
use App\Services\MockPersonnelData;
use App\Services\WorkspacePersonnel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config([
        'services.workspace.token' => 'pdapi_test_token',
        'services.workspace.base_url' => 'https://api.example.test/api/data/v1',
        // The Vite dev server answers the SSR endpoint on a page render, which
        // is not the request under test.
        'inertia.ssr.enabled' => false,
    ]);

    Http::preventStrayRequests();

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

/**
 * Offices are created with explicit ids because Office::DEPT_CODES is keyed by
 * them — the mapping is the point of these tests.
 */
function psBreakdownTestOffice(int $id, ?int $parentId = null): Office
{
    return Office::factory()->create([
        'id' => $id,
        'parent_id' => $parentId,
        'acronym' => "OFF-{$id}",
    ]);
}

function psBreakdownTestFakeWorkspace(array $rows): void
{
    Http::fake([
        'api.example.test/api/data/v1/employees?*' => Http::response([
            'data' => $rows,
            'meta' => ['current_page' => 1, 'per_page' => 500, 'total' => count($rows), 'last_page' => 1],
        ]),
        // The masterlist the catalog resolves position codes against.
        'api.example.test/api/data/v1/positions*' => Http::response([
            'data' => [
                ['id' => 500, 'pos_code' => '2B002', 'pos_name' => 'COMPUTER PROGRAMMER I', 'salary_grade' => 11],
                ['id' => 304, 'pos_code' => '12313', 'pos_name' => 'ACCOUNTANT I', 'salary_grade' => 12],
            ],
            'meta' => ['current_page' => 1, 'per_page' => 500, 'total' => 2, 'last_page' => 1],
        ]),
        // The schedule the rates resolve against.
        'api.example.test/api/data/v1/salary-grades*' => Http::response([
            'data' => [
                ['id' => 1, 'salary_grade' => 11, 'year' => 2025, 'steps' => ['1' => 30024, '2' => 30308, '3' => 30597]],
                ['id' => 2, 'salary_grade' => 24, 'year' => 2025, 'steps' => ['1' => 60000]],
            ],
            'meta' => ['current_page' => 1, 'per_page' => 500, 'total' => 2, 'last_page' => 1],
        ]),
    ]);
}

test('it serves the breakdown from the personnel api', function () {
    [$fy, $entry] = psBreakdownTestRoute();
    $office = psBreakdownTestOffice(18);
    $user = psBreakdownTestUser(['ps-breakdown.view']);
    $user->update(['office_id' => $office->id]);

    psBreakdownTestCoa('5-01-01-010', 'PS');
    psBreakdownTestFakeWorkspace([
        [
            'pers_id' => '33085',
            'full_name' => 'TORIBIO JASPER VANJO NASTOR',
            'pos_code' => '2B002',
            'appointment_status' => 'PERMANENT',
            'salary_grade' => 11,
            'step' => 3,
        ],
    ]);

    $this->actingAs($user)->get("/aip/{$fy->id}/summary/{$entry->id}/ps-breakdown")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('chartOfAccounts', 1)
            ->has('fiscalYear')
            ->has('positions', 1)
            ->where('positions.0.id', 33085)
            ->where('positions.0.user.name', 'TORIBIO JASPER VANJO NASTOR')
            ->where('positions.0.user.step', 3)
            ->where('positions.0.ios.salary_grade', 11)
            // The position title comes from the masterlist, keyed by pos_code.
            ->where('positions.0.ios.class', 'COMPUTER PROGRAMMER I')
            // The API exposes no vacancy concept, so every row is an incumbent.
            ->where('positions.0.status', 'occupied')
            ->where('positions.0.appointment_status', 'PERMANENT')
            // Monthly 30,597 x 12 from the salary schedule.
            ->where('annualRateMap.33085.budget', 367164)
            ->where('annualRateMap.33085.current', 367164)
            // Service length has no API source yet, so proration stays inert.
            ->where('monthsOfService', [])
            ->has('rates', count(MockPersonnelData::rates()))
            ->missing('breakdownItems')
            ->missing('autoValues')
            ->missing('offices')
            ->missing('fiscalYears')
            // The LBP Form 2 PDF was removed from this page.
            ->missing('can')
        );

    // The rows are scoped to the signed in user's office department.
    Http::assertSent(fn ($request): bool => str_contains($request->url(), '/employees')
        && $request['dept_code'] === '1022');
});

test('it excludes appointments that are not on a personnel table', function () {
    [$fy, $entry] = psBreakdownTestRoute();
    $office = psBreakdownTestOffice(18);
    $user = psBreakdownTestUser(['ps-breakdown.view']);
    $user->update(['office_id' => $office->id]);

    psBreakdownTestFakeWorkspace([
        ['pers_id' => '1', 'full_name' => 'PERMANENT ONE', 'pos_code' => '2B002', 'appointment_status' => 'PERMANENT', 'salary_grade' => 11, 'step' => 1],
        ['pers_id' => '2', 'full_name' => 'CASUAL ONE', 'pos_code' => '2B002', 'appointment_status' => 'CASUAL', 'salary_grade' => 11, 'step' => 1],
        ['pers_id' => '3', 'full_name' => 'COS ONE', 'pos_code' => '2B002', 'appointment_status' => 'CONTRACT OF SERVICE', 'salary_grade' => 11, 'step' => 1],
        ['pers_id' => '4', 'full_name' => 'OJT INTERN', 'pos_code' => '2B002', 'appointment_status' => 'OJT', 'salary_grade' => 11, 'step' => 1],
        ['pers_id' => '5', 'full_name' => 'UNRECORDED ONE', 'pos_code' => '2B002', 'appointment_status' => null, 'salary_grade' => 11, 'step' => 1],
        // Casing and padding must not smuggle an excluded row through.
        ['pers_id' => '6', 'full_name' => 'LOWERCASE OJT', 'pos_code' => '2B002', 'appointment_status' => 'ojt', 'salary_grade' => 11, 'step' => 1],
    ]);

    $this->actingAs($user)->get("/aip/{$fy->id}/summary/{$entry->id}/ps-breakdown")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('positions', 2)
            ->where('positions.0.user.name', 'PERMANENT ONE')
            ->where('positions.1.user.name', 'CASUAL ONE')
        );
});

test('it leaves a salary grade blank when it is an employment type marker', function () {
    // 35/36/37 are markers, not payable grades, and carry no rate.
    [$fy, $entry] = psBreakdownTestRoute();
    $office = psBreakdownTestOffice(18);
    $user = psBreakdownTestUser(['ps-breakdown.view']);
    $user->update(['office_id' => $office->id]);

    psBreakdownTestFakeWorkspace([
        ['pers_id' => '1', 'full_name' => 'MARKER ONE', 'pos_code' => '2B002', 'appointment_status' => 'PERMANENT', 'salary_grade' => 36, 'step' => 1],
        ['pers_id' => '2', 'full_name' => 'NO GRADE ONE', 'pos_code' => '2B002', 'appointment_status' => 'PERMANENT', 'salary_grade' => null, 'step' => 1],
        ['pers_id' => '3', 'full_name' => 'NO STEP ONE', 'pos_code' => '2B002', 'appointment_status' => 'PERMANENT', 'salary_grade' => 11, 'step' => null],
    ]);

    $this->actingAs($user)->get("/aip/{$fy->id}/summary/{$entry->id}/ps-breakdown")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('positions', 3)
            ->where('positions.0.ios.salary_grade', null)
            ->where('positions.1.ios.salary_grade', null)
            ->where('positions.2.user.step', null)
            // No grade or step means no rate, so no annual figure to show.
            ->missing('annualRateMap.1')
            ->missing('annualRateMap.2')
            ->missing('annualRateMap.3')
        );
});

test('it lists no personnel when the user office has no mapped department', function () {
    [$fy, $entry] = psBreakdownTestRoute();
    $office = psBreakdownTestOffice(5);
    $user = psBreakdownTestUser(['ps-breakdown.view']);
    $user->update(['office_id' => $office->id]);

    $this->actingAs($user)->get("/aip/{$fy->id}/summary/{$entry->id}/ps-breakdown")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('positions', [])
            ->where('annualRateMap', [])
        );

    Http::assertNothingSent();
});

/**
 * The GF Proper funding source the PS pool is restricted to.
 *
 * Normally seeded; created here with its canonical id because the pool sync
 * keys on funding_source_id = 1.
 */
function psBreakdownTestGfProper(): FundingSource
{
    return FundingSource::firstOrCreate(
        ['id' => 1],
        ['fund_type' => 'General Fund', 'code' => 'GF Proper', 'title' => 'General Fund'],
    );
}

/**
 * A PS pool PPA in the given office, with one AIP entry and a GF Proper
 * funding source already carrying a figure.
 */
function psBreakdownTestPsPool(Office $office, FiscalYear $fy, float $existingPs = 5000.0): AipEntry
{
    psBreakdownTestGfProper();

    $ppa = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'PS Pool Program',
        'type' => 'Program',
        'code_suffix' => 'pool'.random_int(1000, 9999),
        'fiscal_year_id' => $fy->id,
        'is_ps_pool' => true,
    ]);

    $entry = AipEntry::create(['ppa_id' => $ppa->id]);
    $output = $entry->outputs()->create(['sort_order' => 0]);
    $output->offices()->sync([$office->id]);

    PpaFundingSource::create([
        'aip_output_id' => $output->id,
        'funding_source_id' => 1,
        'ps_amount' => $existingPs,
    ]);

    return $entry->fresh();
}

/**
 * The PS total the fake workspace produces for office 18, derived
 * independently of the sync itself.
 */
function psBreakdownTestExpectedPsTotal(): float
{
    $rows = app(WorkspacePersonnel::class)->forOffice('1022');

    return array_sum(PsBreakdownController::computePsCoaTotals(
        $rows['positions'],
        MockPersonnelData::rates(),
        $rows['annualRateMap'],
    ));
}

function psBreakdownTestFakeEmployee(array $attrs = []): array
{
    return array_merge([
        'pers_id' => '1',
        'full_name' => 'PERMANENT ONE',
        'pos_code' => '2B002',
        'appointment_status' => 'PERMANENT',
        'salary_grade' => 11,
        'step' => 1,
    ], $attrs);
}

test('it writes the ps breakdown total onto the pool funding source', function () {
    $office = psBreakdownTestOffice(18);
    $fy = FiscalYear::factory()->create(['status' => 'draft']);
    $entry = psBreakdownTestPsPool($office, $fy);

    psBreakdownTestFakeWorkspace([psBreakdownTestFakeEmployee()]);

    PsBreakdownController::syncPoolPsAmount($entry);

    // Expected value derived independently from the API-shaped rows.
    $expected = psBreakdownTestExpectedPsTotal();

    $source = PpaFundingSource::where('aip_output_id', $entry->outputs()->first()->id)->firstOrFail();

    expect($expected)->toBeGreaterThan(0.0)
        ->and(round((float) $source->ps_amount, 2))->toBe(round($expected, 2))
        // The pool carries PS only.
        ->and((float) $source->mooe_amount)->toBe(0.0);
});

test('it syncs the fiscal year pool when the ps breakdown page opens', function () {
    // The pool belongs to the fiscal year, not to the entry being viewed, so the
    // sync must find it by year rather than off the entry's own PPA.
    $poolOffice = psBreakdownTestOffice(18);
    [$routeFy, $viewedEntry] = psBreakdownTestRoute();

    // The pool sits in the same fiscal year as the page being opened, on a
    // different office's entry, and carries a stale figure.
    $poolEntry = psBreakdownTestPsPool($poolOffice, $routeFy, existingPs: 5000.0);

    $viewer = psBreakdownTestUser(['ps-breakdown.view']);
    $viewer->update(['office_id' => $poolOffice->id]);

    psBreakdownTestFakeWorkspace([psBreakdownTestFakeEmployee()]);

    $this->actingAs($viewer)
        ->get("/aip/{$routeFy->id}/summary/{$viewedEntry->id}/ps-breakdown")
        ->assertOk();

    $source = PpaFundingSource::where('aip_output_id', $poolEntry->outputs()->first()->id)->firstOrFail();

    expect(round((float) $source->ps_amount, 2))->toBe(round(psBreakdownTestExpectedPsTotal(), 2));
});

test('it writes nothing when the fiscal year has no ps pool', function () {
    $office = psBreakdownTestOffice(18);
    [$routeFy, $entry] = psBreakdownTestRoute();
    psBreakdownTestPsPool($office, $routeFy, existingPs: 7777.0);

    // The pool flag is cleared, so there is no pool to sync.
    Ppa::where('fiscal_year_id', $routeFy->id)->update(['is_ps_pool' => null]);

    expect(PsBreakdownController::syncPoolForFiscalYear($routeFy->id))->toBeNull();

    // The page still renders for a year with no pool.
    $viewer = psBreakdownTestUser(['ps-breakdown.view']);
    $viewer->update(['office_id' => $office->id]);

    psBreakdownTestFakeWorkspace([psBreakdownTestFakeEmployee()]);

    $this->actingAs($viewer)
        ->get("/aip/{$routeFy->id}/summary/{$entry->id}/ps-breakdown")
        ->assertOk();

    // The pool's figure is left exactly as it was.
    expect((float) PpaFundingSource::first()->ps_amount)->toBe(7777.0);
});

/**
 * A PPA that can be promoted to PS pool: it needs a regular AIP entry and an
 * output, which `PSPoolService::handoff` requires before it will attach the
 * funding source.
 */
function psBreakdownTestPromotablePpa(Office $office, FiscalYear $fy): Ppa
{
    $ppa = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'New PS Pool',
        'type' => 'Program',
        'code_suffix' => 'new'.random_int(1000, 9999),
        'fiscal_year_id' => $fy->id,
    ]);

    $document = AipDocument::create([
        'fiscal_year_id' => $fy->id,
        'office_id' => $office->id,
        'kind' => 'regular',
        'name' => 'Regular AIP',
    ]);

    $entry = AipEntry::create([
        'ppa_id' => $ppa->id,
        'aip_document_id' => $document->id,
    ]);

    $output = $entry->outputs()->create(['sort_order' => 0]);
    $output->offices()->sync([$office->id]);

    return $ppa;
}

test('it syncs the fiscal year pool when the ps pool is changed', function () {
    $office = psBreakdownTestOffice(18);
    $fy = FiscalYear::factory()->create(['status' => 'draft']);

    // An existing pool carries a stale figure that the sync must replace.
    psBreakdownTestPsPool($office, $fy, existingPs: 1234.0);
    $newPool = psBreakdownTestPromotablePpa($office, $fy);

    $user = psBreakdownTestUser(['aip-summary.set.ps-pool']);
    $user->update(['office_id' => $office->id]);

    psBreakdownTestFakeWorkspace([psBreakdownTestFakeEmployee()]);

    $this->actingAs($user)
        ->post("/ppas/{$newPool->id}/set-as-ps-pool")
        ->assertRedirect();

    expect($newPool->fresh()->is_ps_pool)->toBeTruthy();

    $source = PpaFundingSource::where('aip_output_id', $newPool->aipEntries()->first()->outputs()->first()->id)
        ->firstOrFail();

    expect(round((float) $source->ps_amount, 2))->toBe(round(psBreakdownTestExpectedPsTotal(), 2));
});

test('it keeps the pool designated when the personnel api fails during a pool change', function () {
    // The pool is already designated by the time the sync runs, so an API
    // failure must not unwind it or report an error.
    $office = psBreakdownTestOffice(18);
    $fy = FiscalYear::factory()->create(['status' => 'draft']);
    psBreakdownTestPsPool($office, $fy, existingPs: 1234.0);
    $newPool = psBreakdownTestPromotablePpa($office, $fy);

    $user = psBreakdownTestUser(['aip-summary.set.ps-pool']);
    $user->update(['office_id' => $office->id]);

    // preventStrayRequests turns the personnel call into an exception.
    $this->actingAs($user)
        ->post("/ppas/{$newPool->id}/set-as-ps-pool")
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($newPool->fresh()->is_ps_pool)->toBeTruthy();
});

test('it leaves the pool untouched when the office has no mapped department', function () {
    // An unmapped office has no personnel to read. Writing a zero total would
    // erase a figure we cannot compute.
    $office = psBreakdownTestOffice(5);
    $fy = FiscalYear::factory()->create(['status' => 'draft']);
    $entry = psBreakdownTestPsPool($office, $fy, existingPs: 12345.0);

    PsBreakdownController::syncPoolPsAmount($entry);

    $source = PpaFundingSource::where('aip_output_id', $entry->outputs()->first()->id)->firstOrFail();

    expect((float) $source->ps_amount)->toBe(12345.0);

    Http::assertNothingSent();
});

test('it creates the output and its office link when the entry has none', function () {
    psBreakdownTestGfProper();

    $office = psBreakdownTestOffice(18);
    $fy = FiscalYear::factory()->create(['status' => 'draft']);

    $ppa = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'Bare PS Pool',
        'type' => 'Program',
        'code_suffix' => 'bare'.random_int(1000, 9999),
        'fiscal_year_id' => $fy->id,
        'is_ps_pool' => true,
    ]);
    $entry = AipEntry::create(['ppa_id' => $ppa->id]);

    psBreakdownTestFakeWorkspace([
        ['pers_id' => '1', 'full_name' => 'PERMANENT ONE', 'pos_code' => '2B002', 'appointment_status' => 'PERMANENT', 'salary_grade' => 11, 'step' => 1],
    ]);

    PsBreakdownController::syncPoolPsAmount($entry->fresh());

    $output = $entry->outputs()->firstOrFail();

    // aip_outputs carries no office_id column; the link lives on a pivot, and
    // silently dropping it would leave the output orphaned from its office.
    expect($output->offices()->pluck('offices.id')->all())->toBe([$office->id])
        ->and(PpaFundingSource::where('aip_output_id', $output->id)->exists())->toBeTrue();
});

test('it syncs every ps pool and reports what changed', function () {
    $office = psBreakdownTestOffice(18);
    $fy = FiscalYear::factory()->create(['status' => 'draft']);
    psBreakdownTestPsPool($office, $fy);

    psBreakdownTestFakeWorkspace([
        ['pers_id' => '1', 'full_name' => 'PERMANENT ONE', 'pos_code' => '2B002', 'appointment_status' => 'PERMANENT', 'salary_grade' => 11, 'step' => 1],
    ]);

    $first = PsBreakdownController::syncAllPsPools();
    $second = PsBreakdownController::syncAllPsPools();

    expect($first['synced'])->toBe(1)
        ->and($first['skipped'])->toBe(0)
        // A second run finds the pool already correct and writes nothing.
        ->and($second['synced'])->toBe(0)
        ->and($second['unchanged'])->toBe(1);
});

test('it counts pools it cannot compute as skipped', function () {
    $office = psBreakdownTestOffice(5);
    $fy = FiscalYear::factory()->create(['status' => 'draft']);
    psBreakdownTestPsPool($office, $fy);

    $result = PsBreakdownController::syncAllPsPools();

    expect($result['skipped'])->toBe(1)
        ->and($result['synced'])->toBe(0);

    Http::assertNothingSent();
});

test('it totals a sub-unit through its parent department', function () {
    // A sub-unit has no department code of its own; the API reports its people
    // under the parent. Both must yield the same total, not one extra copy.
    $parent = psBreakdownTestOffice(18);
    $subUnit = psBreakdownTestOffice(39, 18);

    expect($parent->deptCode())->toBe('1022')
        ->and($subUnit->deptCode())->toBe('1022');

    psBreakdownTestFakeWorkspace([
        ['pers_id' => '1', 'full_name' => 'PERMANENT ONE', 'pos_code' => '2B002', 'appointment_status' => 'PERMANENT', 'salary_grade' => 11, 'step' => 1],
    ]);

    $fromParent = PsBreakdownController::computePsCoaTotalsForOffice($parent->id, 1);
    $fromSubUnit = PsBreakdownController::computePsCoaTotalsForOffice($subUnit->id, 1);

    expect($fromSubUnit)->toBe($fromParent);
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
