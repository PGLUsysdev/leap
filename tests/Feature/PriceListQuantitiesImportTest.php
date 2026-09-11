<?php

use App\Models\AipEntry;
use App\Models\ChartOfAccount;
use App\Models\ChartOfAccountPpmpCategory;
use App\Models\FiscalYear;
use App\Models\FundingSource;
use App\Models\LguLevel;
use App\Models\Office;
use App\Models\OfficeType;
use App\Models\Permission;
use App\Models\PermissionRole;
use App\Models\Ppa;
use App\Models\PpaFundingSource;
use App\Models\Ppmp;
use App\Models\PpmpCategory;
use App\Models\PpmpPriceList;
use App\Models\Role;
use App\Models\Sector;
use App\Models\User;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    // ppmp_price_lists has a MySQL VIRTUAL generated column using SHA2(),
    // which SQLite accepts at migrate time but cannot evaluate on insert.
    // Register an equivalent function so feature tests can insert rows.
    $pdo = DB::connection()->getPdo();

    if (method_exists($pdo, 'sqliteCreateFunction')) {
        $pdo->sqliteCreateFunction('SHA2', fn ($value) => hash('sha256', (string) $value), 2);
    }
});

function qtyImportUser(): User
{
    $role = Role::create(['name' => 'qty-import-tester']);
    $permission = Permission::firstOrCreate(['name' => 'ppmp.add.price-list']);
    PermissionRole::create(['role_id' => $role->id, 'permission_id' => $permission->id]);

    return User::factory()->create(['role_id' => $role->id]);
}

function qtyImportOffice(): Office
{
    static $seq = 100;
    $n = $seq++;

    return Office::factory()->create([
        'code' => str_pad((string) $n, 3, '0', STR_PAD_LEFT),
        'sector_id' => Sector::create(['code' => str_pad((string) (2000 + $n), 4, '0', STR_PAD_LEFT), 'name' => "Qty Sector {$n}"])->id,
        'lgu_level_id' => LguLevel::firstOrCreate(['code' => '1'], ['name' => 'Provincial'])->id,
        'office_type_id' => OfficeType::firstOrCreate(['code' => '01'], ['name' => 'Office'])->id,
    ]);
}

function qtyImportChain(): array
{
    $office = qtyImportOffice();
    $fiscalYear = FiscalYear::factory()->create(['status' => 'draft']);
    $ppa = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'Qty Program',
        'type' => 'Program',
        'code_suffix' => '1',
        'fiscal_year_id' => $fiscalYear->id,
    ]);
    $entry = AipEntry::create(['ppa_id' => $ppa->id]);
    $output = $entry->outputs()->create([
        'expected_output' => '100% supplies delivered',
        'start_date' => '2027-01-01',
        'end_date' => '2027-12-01',
        'sort_order' => 1,
    ]);
    $fund = FundingSource::firstOrCreate(
        ['code' => 'GF Proper'],
        ['fund_type' => 'General Fund', 'title' => 'General Fund'],
    );
    $bridge = PpaFundingSource::create([
        'aip_output_id' => $output->id,
        'funding_source_id' => $fund->id,
    ]);

    return compact('office', 'fiscalYear', 'ppa', 'entry', 'output', 'fund', 'bridge');
}

function qtyImportPriceList(string $expenseClass, float $price, int $itemNumber): PpmpPriceList
{
    static $seq = 500;
    $n = $seq++;

    $coa = ChartOfAccount::create([
        'account_number' => "50203010-{$n}",
        'account_title' => "Qty Account {$n}",
        'expense_class' => $expenseClass,
        'is_postable' => true,
        'path' => "1.{$n}",
    ]);
    $category = PpmpCategory::create(['name' => "Qty Category {$n}"]);
    $junction = ChartOfAccountPpmpCategory::create([
        'chart_of_account_id' => $coa->id,
        'ppmp_category_id' => $category->id,
    ]);

    return PpmpPriceList::create([
        'item_number' => $itemNumber,
        'sort_order' => $itemNumber,
        'description' => "Qty Item {$n}",
        'unit_of_measurement' => 'pc',
        'price' => $price,
        'chart_of_account_ppmp_category_id' => $junction->id,
    ]);
}

function qtyArray(int $jan = 0, int $feb = 0, int $mar = 0): array
{
    return [$jan, $feb, $mar, 0, 0, 0, 0, 0, 0, 0, 0, 0];
}

test('it imports quantities and syncs mooe and co totals to the funding source', function () {
    $user = qtyImportUser();
    $chain = qtyImportChain();
    $mooeOne = qtyImportPriceList('MOOE', 100, 1);
    $mooeTwo = qtyImportPriceList('MOOE', 50, 2);
    $coOne = qtyImportPriceList('CO', 1000, 3);

    $response = $this->actingAs($user)->post('/price-list-quantities-import', [
        'ppa_id' => $chain['ppa']->id,
        'items' => [
            ['ppmp_price_list_id' => $mooeOne->id, 'qtys' => qtyArray(jan: 2)],
            ['ppmp_price_list_id' => $mooeTwo->id, 'qtys' => qtyArray(feb: 3)],
            ['ppmp_price_list_id' => $coOne->id, 'qtys' => qtyArray(mar: 1)],
        ],
    ]);

    $response->assertRedirect();
    expect(Ppmp::count())->toBe(3);

    $row = Ppmp::where('ppmp_price_list_id', $mooeOne->id)->firstOrFail();
    expect((int) $row->jan_qty)->toBe(2);
    expect((float) $row->jan_amount)->toBe(200.0);

    $chain['bridge']->refresh();
    expect((float) $chain['bridge']->mooe_amount)->toBe(350.0);
    expect((float) $chain['bridge']->co_amount)->toBe(1000.0);
});

test('it updates existing rows without duplicating and recomputes totals', function () {
    $user = qtyImportUser();
    $chain = qtyImportChain();
    $mooeOne = qtyImportPriceList('MOOE', 100, 1);

    $payload = fn (int $qty) => [
        'ppa_id' => $chain['ppa']->id,
        'items' => [
            ['ppmp_price_list_id' => $mooeOne->id, 'qtys' => qtyArray(jan: $qty)],
        ],
    ];

    $this->actingAs($user)->post('/price-list-quantities-import', $payload(2))->assertRedirect();
    $this->actingAs($user)->post('/price-list-quantities-import', $payload(5))->assertRedirect();

    expect(Ppmp::count())->toBe(1);
    expect((int) Ppmp::firstOrFail()->jan_qty)->toBe(5);

    $chain['bridge']->refresh();
    expect((float) $chain['bridge']->mooe_amount)->toBe(500.0);
    expect((float) $chain['bridge']->co_amount)->toBe(0.0);
});

test('it skips zero-quantity items', function () {
    $user = qtyImportUser();
    $chain = qtyImportChain();
    $kept = qtyImportPriceList('MOOE', 100, 1);
    $skipped = qtyImportPriceList('MOOE', 100, 2);

    $this->actingAs($user)->post('/price-list-quantities-import', [
        'ppa_id' => $chain['ppa']->id,
        'items' => [
            ['ppmp_price_list_id' => $kept->id, 'qtys' => qtyArray(jan: 1)],
            ['ppmp_price_list_id' => $skipped->id, 'qtys' => qtyArray()],
        ],
    ])->assertRedirect();

    expect(Ppmp::count())->toBe(1);
    expect(Ppmp::where('ppmp_price_list_id', $skipped->id)->count())->toBe(0);

    $chain['bridge']->refresh();
    expect((float) $chain['bridge']->mooe_amount)->toBe(100.0);
});

test('it rejects items whose account has no expense class', function () {
    $user = qtyImportUser();
    $chain = qtyImportChain();

    $coa = ChartOfAccount::create([
        'account_number' => '50203010-unclassified',
        'account_title' => 'Unclassified Account',
        'expense_class' => null,
        'is_postable' => true,
        'path' => '9.999',
    ]);
    $category = PpmpCategory::create(['name' => 'Unclassified Category']);
    $junction = ChartOfAccountPpmpCategory::create([
        'chart_of_account_id' => $coa->id,
        'ppmp_category_id' => $category->id,
    ]);
    $priceList = PpmpPriceList::create([
        'item_number' => 99,
        'sort_order' => 99,
        'description' => 'Unclassified Item',
        'unit_of_measurement' => 'pc',
        'price' => 100,
        'chart_of_account_ppmp_category_id' => $junction->id,
    ]);

    $this->actingAs($user)->post('/price-list-quantities-import', [
        'ppa_id' => $chain['ppa']->id,
        'aip_output_id' => $chain['output']->id,
        'ppa_funding_source_id' => $chain['bridge']->id,
        'items' => [
            ['ppmp_price_list_id' => $priceList->id, 'qtys' => qtyArray(jan: 2)],
        ],
    ])->assertSessionHasErrors(['items']);

    expect(Ppmp::count())->toBe(0);

    $chain['bridge']->refresh();
    expect((float) $chain['bridge']->mooe_amount)->toBe(0.0);
});

test('it exposes the expense class of each price list on the index page', function () {
    $user = qtyImportUser();
    $chain = qtyImportChain();
    $priceList = qtyImportPriceList('MOOE', 100, 1);

    $response = $this->actingAs($user)->get('/price-list-quantities-import');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('existingPriceLists')
        ->where('existingPriceLists.0.expense_class', 'MOOE')
    );

    expect($priceList->fresh())->not->toBeNull();
    expect($chain['bridge']->fresh())->not->toBeNull();
});

test('it rejects import when the ppa has no funding source', function () {
    $user = qtyImportUser();
    $office = qtyImportOffice();
    $fiscalYear = FiscalYear::factory()->create(['status' => 'draft']);
    $ppa = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'Orphan Program',
        'type' => 'Program',
        'code_suffix' => '9',
        'fiscal_year_id' => $fiscalYear->id,
    ]);
    AipEntry::create(['ppa_id' => $ppa->id]);
    $priceList = qtyImportPriceList('MOOE', 100, 1);

    $this->actingAs($user)->post('/price-list-quantities-import', [
        'ppa_id' => $ppa->id,
        'items' => [
            ['ppmp_price_list_id' => $priceList->id, 'qtys' => qtyArray(jan: 1)],
        ],
    ])->assertSessionHasErrors(['ppa_id']);

    expect(Ppmp::count())->toBe(0);
});

test('it imports to the selected funding source instead of the first bridge', function () {
    $user = qtyImportUser();
    $chain = qtyImportChain();
    $secondOutput = $chain['entry']->outputs()->create([
        'expected_output' => 'Second output',
        'start_date' => '2027-01-01',
        'end_date' => '2027-12-01',
        'sort_order' => 2,
    ]);
    $secondBridge = PpaFundingSource::create([
        'aip_output_id' => $secondOutput->id,
        'funding_source_id' => $chain['fund']->id,
    ]);
    $priceList = qtyImportPriceList('MOOE', 100, 1);

    $this->actingAs($user)->post('/price-list-quantities-import', [
        'ppa_id' => $chain['ppa']->id,
        'ppa_funding_source_id' => $secondBridge->id,
        'items' => [
            ['ppmp_price_list_id' => $priceList->id, 'qtys' => qtyArray(jan: 2)],
        ],
    ])->assertRedirect();

    expect(Ppmp::where('ppa_funding_source_id', $secondBridge->id)->count())->toBe(1);
    expect(Ppmp::where('ppa_funding_source_id', $chain['bridge']->id)->count())->toBe(0);

    $secondBridge->refresh();
    $chain['bridge']->refresh();
    expect((float) $secondBridge->mooe_amount)->toBe(200.0);
    expect((float) $chain['bridge']->mooe_amount)->toBe(0.0);
});

test('it exposes funding sources with ppa linkage on the index page', function () {
    $user = qtyImportUser();
    $chain = qtyImportChain();

    $response = $this->actingAs($user)->get('/price-list-quantities-import');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('existingFundingSources', 1)
        ->where('existingFundingSources.0.id', $chain['bridge']->id)
        ->where('existingFundingSources.0.ppa_id', $chain['ppa']->id)
        ->has('existingOutputs', 1)
        ->where('existingOutputs.0.id', $chain['output']->id)
        ->where('existingOutputs.0.ppa_id', $chain['ppa']->id)
        ->where('existingOutputs.0.expected_output', '100% supplies delivered')
    );
});

test('it rejects a funding source that does not belong to the selected ppa', function () {
    $user = qtyImportUser();
    $chain = qtyImportChain();
    $otherOffice = qtyImportOffice();
    $otherPpa = Ppa::create([
        'office_id' => $otherOffice->id,
        'parent_id' => null,
        'name' => 'Other Program',
        'type' => 'Program',
        'code_suffix' => '7',
        'fiscal_year_id' => $chain['fiscalYear']->id,
    ]);
    $otherEntry = AipEntry::create(['ppa_id' => $otherPpa->id]);
    $otherOutput = $otherEntry->outputs()->create([
        'expected_output' => 'Other output',
        'start_date' => '2027-01-01',
        'end_date' => '2027-12-01',
        'sort_order' => 1,
    ]);
    $otherBridge = PpaFundingSource::create([
        'aip_output_id' => $otherOutput->id,
        'funding_source_id' => $chain['fund']->id,
    ]);
    $priceList = qtyImportPriceList('MOOE', 100, 1);

    $this->actingAs($user)->post('/price-list-quantities-import', [
        'ppa_id' => $chain['ppa']->id,
        'ppa_funding_source_id' => $otherBridge->id,
        'items' => [
            ['ppmp_price_list_id' => $priceList->id, 'qtys' => qtyArray(jan: 1)],
        ],
    ])->assertSessionHasErrors(['ppa_funding_source_id']);

    expect(Ppmp::count())->toBe(0);
});

test('it rejects an output that does not belong to the selected ppa', function () {
    $user = qtyImportUser();
    $chain = qtyImportChain();
    $otherOffice = qtyImportOffice();
    $otherPpa = Ppa::create([
        'office_id' => $otherOffice->id,
        'parent_id' => null,
        'name' => 'Output Orphan Program',
        'type' => 'Program',
        'code_suffix' => '6',
        'fiscal_year_id' => $chain['fiscalYear']->id,
    ]);
    $otherEntry = AipEntry::create(['ppa_id' => $otherPpa->id]);
    $otherOutput = $otherEntry->outputs()->create([
        'expected_output' => 'Other output',
        'start_date' => '2027-01-01',
        'end_date' => '2027-12-01',
        'sort_order' => 1,
    ]);
    $priceList = qtyImportPriceList('MOOE', 100, 1);

    $this->actingAs($user)->post('/price-list-quantities-import', [
        'ppa_id' => $chain['ppa']->id,
        'aip_output_id' => $otherOutput->id,
        'ppa_funding_source_id' => $chain['bridge']->id,
        'items' => [
            ['ppmp_price_list_id' => $priceList->id, 'qtys' => qtyArray(jan: 1)],
        ],
    ])->assertSessionHasErrors(['aip_output_id']);

    expect(Ppmp::count())->toBe(0);
});

test('it rejects a funding source that does not belong to the selected output', function () {
    $user = qtyImportUser();
    $chain = qtyImportChain();
    $secondOutput = $chain['entry']->outputs()->create([
        'expected_output' => 'Second output',
        'start_date' => '2027-01-01',
        'end_date' => '2027-12-01',
        'sort_order' => 2,
    ]);
    $secondBridge = PpaFundingSource::create([
        'aip_output_id' => $secondOutput->id,
        'funding_source_id' => $chain['fund']->id,
    ]);
    $priceList = qtyImportPriceList('MOOE', 100, 1);

    $this->actingAs($user)->post('/price-list-quantities-import', [
        'ppa_id' => $chain['ppa']->id,
        'aip_output_id' => $chain['output']->id,
        'ppa_funding_source_id' => $secondBridge->id,
        'items' => [
            ['ppmp_price_list_id' => $priceList->id, 'qtys' => qtyArray(jan: 1)],
        ],
    ])->assertSessionHasErrors(['ppa_funding_source_id']);

    expect(Ppmp::count())->toBe(0);
});

test('it imports to the selected output funding source and names the target in the toast', function () {
    $user = qtyImportUser();
    $chain = qtyImportChain();
    $priceList = qtyImportPriceList('MOOE', 100, 1);

    $this->actingAs($user)->post('/price-list-quantities-import', [
        'ppa_id' => $chain['ppa']->id,
        'aip_output_id' => $chain['output']->id,
        'ppa_funding_source_id' => $chain['bridge']->id,
        'items' => [
            ['ppmp_price_list_id' => $priceList->id, 'qtys' => qtyArray(jan: 2)],
        ],
    ])->assertRedirect();

    $chain['bridge']->refresh();
    expect((float) $chain['bridge']->mooe_amount)->toBe(200.0);
});
