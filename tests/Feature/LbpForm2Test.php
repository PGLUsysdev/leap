<?php

use App\Models\AipDocument;
use App\Models\AipEntry;
use App\Models\ChartOfAccount;
use App\Models\ChartOfAccountPpmpCategory;
use App\Models\FeBreakdownItem;
use App\Models\FiscalYear;
use App\Models\FundingSource;
use App\Models\Ios;
use App\Models\Office;
use App\Models\Permission;
use App\Models\PermissionRole;
use App\Models\Position;
use App\Models\Ppa;
use App\Models\PpaFundingSource;
use App\Models\Ppmp;
use App\Models\PpmpCategory;
use App\Models\PpmpPriceList;
use App\Models\Role;
use App\Models\SalaryStandard;
use App\Models\User;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $pdo = DB::connection()->getPdo();

    if (method_exists($pdo, 'sqliteCreateFunction')) {
        $pdo->sqliteCreateFunction('SHA2', fn ($value) => hash('sha256', (string) $value), 2);
    }
});

test('it serves lbp form 2 data scoped to office and fiscal year', function () {
    $role = Role::create(['name' => 'lbp2-tester']);
    $permission = Permission::firstOrCreate(['name' => 'fiscal-year.view']);
    PermissionRole::create(['role_id' => $role->id, 'permission_id' => $permission->id]);
    $user = User::factory()->create(['role_id' => $role->id]);

    $fy = FiscalYear::factory()->create(['status' => 'draft']);
    $office = Office::factory()->create();
    $ios = Ios::create([
        'occupational_service_code' => '11',
        'occupational_group_code' => '001',
        'class_id' => 'A',
        'class' => 'Officer V',
        'salary_grade' => 24,
    ]);
    Position::create([
        'item_number' => 'LBP2-1',
        'office_id' => $office->id,
        'ios_id' => $ios->id,
        'employment_type' => 'permanent',
        'is_funded' => true,
        'status' => 'occupied',
    ]);
    SalaryStandard::forceCreate([
        'fiscal_year_id' => $fy->id,
        'salary_grade' => 24,
        'step_increment' => 1,
        'monthly_rate' => 90000,
    ]);

    $ppa = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'LBP2 Program',
        'type' => 'Program',
        'code_suffix' => 'lbp2',
        'fiscal_year_id' => $fy->id,
    ]);
    $entry = AipEntry::create(['ppa_id' => $ppa->id]);
    $output = $entry->outputs()->create([
        'expected_output' => 'LBP2 output',
        'start_date' => '2027-01-01',
        'end_date' => '2027-12-01',
        'sort_order' => 1,
    ]);
    $bridge = PpaFundingSource::create([
        'aip_output_id' => $output->id,
        'funding_source_id' => FundingSource::firstOrCreate(
            ['code' => 'GF Proper'],
            ['fund_type' => 'General Fund', 'title' => 'General Fund'],
        )->id,
    ]);

    $ppmpFor = function (string $path, string $class, float $amount) use (
        $bridge,
    ) {
        static $seq = 0;

        $seq++;

        $coa = ChartOfAccount::create([
            'account_number' => "lbp2-{$seq}",
            'account_title' => "LBP2 Account {$seq}",
            'account_type' => 'EXPENSE',
            'expense_class' => $class,
            'path' => $path,
            'level' => 4,
            'is_postable' => true,
            'is_active' => true,
            'normal_balance' => 'DEBIT',
        ]);
        $junction = ChartOfAccountPpmpCategory::create([
            'chart_of_account_id' => $coa->id,
            'ppmp_category_id' => PpmpCategory::create([
                'name' => "LBP2 Category {$seq}",
            ])->id,
        ]);
        $priceList = PpmpPriceList::create([
            'item_number' => $seq,
            'sort_order' => $seq,
            'description' => "LBP2 Item {$seq}",
            'unit_of_measurement' => 'pc',
            'price' => $amount,
            'chart_of_account_ppmp_category_id' => $junction->id,
        ]);

        Ppmp::create([
            'ppa_funding_source_id' => $bridge->id,
            'ppmp_price_list_id' => $priceList->id,
            'jan_qty' => 1,
            'jan_amount' => $amount,
        ]);
    };

    $ppmpFor('5-02-03-010', 'MOOE', 500);
    $ppmpFor('1-07-03-010', 'CO', 1200);

    // FE lines come only from the FE breakdown, never from PPMP.
    $feCoa = function (string $path, ?string $class, bool $postable = true) {
        static $seq = 0;

        $seq++;

        return ChartOfAccount::create([
            'account_number' => "lbp2-fe-{$seq}",
            'account_title' => "LBP2 FE Account {$seq}",
            'account_type' => 'EXPENSE',
            'expense_class' => $class,
            'path' => $path,
            'level' => 4,
            'is_postable' => $postable,
            'is_active' => true,
            'normal_balance' => 'DEBIT',
        ]);
    };

    $secondBridge = PpaFundingSource::create([
        'aip_output_id' => $output->id,
        'funding_source_id' => FundingSource::firstOrCreate(
            ['code' => 'Trust Receipt'],
            ['fund_type' => 'General Fund', 'title' => 'Trust Receipt'],
        )->id,
    ]);

    $feFor = fn (PpaFundingSource $fundingSource, ChartOfAccount $coa, float $amount) => FeBreakdownItem::create([
        'ppa_funding_source_id' => $fundingSource->id,
        'chart_of_account_id' => $coa->id,
        'amount' => $amount,
    ]);

    $loans = $feCoa('2-01-02-040', 'FE');
    $interest = $feCoa('5-03-01-020', 'FE');
    $feFor($bridge, $loans, 1500.25);
    $feFor($bridge, $interest, 2500);
    $feFor($secondBridge, $interest, 500.25);
    // A zero line and an account that is no longer FE are both left out.
    $feFor($bridge, $feCoa('5-03-01-030', 'FE'), 0);
    $feFor($bridge, $feCoa('5-03-01-040', null), 999);

    $response = $this->actingAs($user)
        ->withHeaders([
            'X-Inertia' => 'true',
            'X-Inertia-Version' => hash_file('xxh128', public_path('build/manifest.json')),
            'X-Inertia-Partial-Component' => 'aip/index',
            'X-Inertia-Partial-Data' => 'lbp2',
        ])
        ->get("/aip?lbp2_fiscal_year_id={$fy->id}&lbp2_office_id={$office->id}");

    $response->assertOk();
    $response->assertJsonPath('props.lbp2.officeName', $office->name);

    $lbp2 = $response->json('props.lbp2');

    expect($lbp2['psRows'])->not->toBeEmpty()
        ->and($lbp2['psTotal'])->toBeGreaterThan(0)
        ->and($lbp2['grandTotal'])->toBeGreaterThan(0)
        ->and($lbp2['psRows'][0]['path'])->toBe('5-01-01-010')
        ->and($lbp2['mooeRows'])->toHaveCount(1)
        ->and($lbp2['mooeRows'][0]['path'])->toBe('5-02-03-010')
        ->and((float) $lbp2['mooeRows'][0]['amount'])->toBe(500.0)
        ->and((float) $lbp2['mooeTotal'])->toBe(500.0)
        ->and($lbp2['coRows'])->toHaveCount(1)
        ->and($lbp2['coRows'][0]['path'])->toBe('1-07-03-010')
        ->and((float) $lbp2['coRows'][0]['amount'])->toBe(1200.0)
        ->and((float) $lbp2['coTotal'])->toBe(1200.0)
        // Same account on two funding sources sums into one line, sorted by path.
        ->and($lbp2['feRows'])->toHaveCount(2)
        ->and($lbp2['feRows'][0]['path'])->toBe('2-01-02-040')
        ->and((float) $lbp2['feRows'][0]['amount'])->toBe(1500.25)
        ->and($lbp2['feRows'][1]['path'])->toBe('5-03-01-020')
        ->and((float) $lbp2['feRows'][1]['amount'])->toBe(3000.25)
        ->and((float) $lbp2['feTotal'])->toBe(4500.5)
        ->and(round((float) $lbp2['grandTotal'], 2))->toBe(round(
            (float) $lbp2['psTotal'] + 500 + 4500.5 + 1200,
            2,
        ));
});

test('it scopes fe breakdown rows to the selected aip document', function () {
    $role = Role::create(['name' => 'lbp2-fe-tester']);
    $permission = Permission::firstOrCreate(['name' => 'fiscal-year.view']);
    PermissionRole::create(['role_id' => $role->id, 'permission_id' => $permission->id]);
    $user = User::factory()->create(['role_id' => $role->id]);

    $fy = FiscalYear::factory()->create(['status' => 'draft']);
    $office = Office::factory()->create();
    $regular = AipDocument::create([
        'fiscal_year_id' => $fy->id,
        'office_id' => $office->id,
        'kind' => 'regular',
        'name' => 'LBP2 Regular',
    ]);
    $supplemental = AipDocument::create([
        'fiscal_year_id' => $fy->id,
        'office_id' => $office->id,
        'kind' => 'supplemental',
        'name' => 'LBP2 Supplemental',
    ]);

    $coa = ChartOfAccount::create([
        'account_number' => 'lbp2-fe-doc',
        'account_title' => 'Interest Expenses',
        'account_type' => 'EXPENSE',
        'expense_class' => 'FE',
        'path' => '5-03-01-020',
        'level' => 4,
        'is_postable' => true,
        'is_active' => true,
        'normal_balance' => 'DEBIT',
    ]);

    $fundingSourceId = FundingSource::firstOrCreate(
        ['code' => 'GF Proper'],
        ['fund_type' => 'General Fund', 'title' => 'General Fund'],
    )->id;

    $entryFor = function (int $documentId) use ($office, $fy, $coa, $fundingSourceId) {
        $ppa = Ppa::create([
            'office_id' => $office->id,
            'parent_id' => null,
            'name' => "LBP2 FE Program {$documentId}",
            'type' => 'Program',
            'code_suffix' => "fe{$documentId}",
            'fiscal_year_id' => $fy->id,
        ]);
        $entry = AipEntry::create([
            'ppa_id' => $ppa->id,
            'aip_document_id' => $documentId,
        ]);
        $output = $entry->outputs()->create([
            'expected_output' => 'LBP2 FE output',
            'sort_order' => 1,
        ]);
        $bridge = PpaFundingSource::create([
            'aip_output_id' => $output->id,
            'funding_source_id' => $fundingSourceId,
        ]);

        FeBreakdownItem::create([
            'ppa_funding_source_id' => $bridge->id,
            'chart_of_account_id' => $coa->id,
            'amount' => 1000 * $documentId,
        ]);
    };

    $entryFor($regular->id);
    $entryFor($supplemental->id);

    $lbp2For = fn (int $documentId) => $this->actingAs($user)
        ->withHeaders([
            'X-Inertia' => 'true',
            'X-Inertia-Version' => hash_file('xxh128', public_path('build/manifest.json')),
            'X-Inertia-Partial-Component' => 'aip/index',
            'X-Inertia-Partial-Data' => 'lbp2',
        ])
        ->get("/aip?lbp2_fiscal_year_id={$fy->id}&lbp2_office_id={$office->id}&lbp2_document_id={$documentId}")
        ->assertOk()
        ->json('props.lbp2');

    $regularOnly = $lbp2For($regular->id);
    $cumulative = $lbp2For($supplemental->id);

    expect($regularOnly['feRows'])->toHaveCount(1)
        ->and((float) $regularOnly['feTotal'])->toBe((float) $regular->id * 1000)
        ->and($cumulative['feRows'])->toHaveCount(1)
        ->and((float) $cumulative['feTotal'])->toBe(
            (float) (($regular->id + $supplemental->id) * 1000),
        );
});

test('it returns no lbp form 2 data without office scope', function () {
    $role = Role::create(['name' => 'lbp2-tester-2']);
    $permission = Permission::firstOrCreate(['name' => 'fiscal-year.view']);
    PermissionRole::create(['role_id' => $role->id, 'permission_id' => $permission->id]);
    $user = User::factory()->create(['role_id' => $role->id]);

    $this->actingAs($user)->get('/aip')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->missing('lbp2')
        );
});
