<?php

use App\Models\AipEntry;
use App\Models\ChartOfAccount;
use App\Models\ChartOfAccountPpmpCategory;
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
        ->and((float) $lbp2['coTotal'])->toBe(1200.0);
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
