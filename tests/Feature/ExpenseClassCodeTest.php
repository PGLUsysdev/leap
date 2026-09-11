<?php

use App\Models\AipEntry;
use App\Models\ChartOfAccount;
use App\Models\ChartOfAccountPpmpCategory;
use App\Models\FiscalYear;
use App\Models\FundingSource;
use App\Models\LguLevel;
use App\Models\Office;
use App\Models\OfficeType;
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
    $pdo = DB::connection()->getPdo();

    if (method_exists($pdo, 'sqliteCreateFunction')) {
        $pdo->sqliteCreateFunction('SHA2', fn ($value) => hash('sha256', (string) $value), 2);
    }
});

function codeTestUser(): User
{
    return User::factory()->create([
        'role_id' => Role::create(['name' => 'code-tester'])->id,
    ]);
}

function codeTestCoa(string $path, bool $postable = true, ?string $class = null): ChartOfAccount
{
    static $seq = 900;
    $n = $seq++;

    return ChartOfAccount::create([
        'account_number' => "990-{$n}",
        'account_title' => "Code Account {$n}",
        'path' => $path,
        'is_postable' => $postable,
        'expense_class' => $class,
    ]);
}

function codeTestBridge(): PpaFundingSource
{
    static $seq = 300;
    $n = $seq++;

    $office = Office::factory()->create([
        'code' => str_pad((string) $n, 3, '0', STR_PAD_LEFT),
        'sector_id' => Sector::create(['code' => str_pad((string) (3000 + $n), 4, '0', STR_PAD_LEFT), 'name' => "Code Sector {$n}"])->id,
        'lgu_level_id' => LguLevel::firstOrCreate(['code' => '1'], ['name' => 'Provincial'])->id,
        'office_type_id' => OfficeType::firstOrCreate(['code' => '01'], ['name' => 'Office'])->id,
    ]);
    $ppa = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => "Code Program {$n}",
        'type' => 'Program',
        'code_suffix' => "c{$n}",
        'fiscal_year_id' => FiscalYear::factory()->create(['status' => 'draft'])->id,
    ]);
    $entry = AipEntry::create(['ppa_id' => $ppa->id]);
    $output = $entry->outputs()->create([
        'expected_output' => "Code output {$n}",
        'start_date' => '2027-01-01',
        'end_date' => '2027-12-01',
        'sort_order' => 1,
    ]);

    return PpaFundingSource::create([
        'aip_output_id' => $output->id,
        'funding_source_id' => FundingSource::firstOrCreate(
            ['code' => 'GF Proper'],
            ['fund_type' => 'General Fund', 'title' => 'General Fund'],
        )->id,
    ]);
}

function codeTestPpmp(PpaFundingSource $bridge, ChartOfAccount $coa, float $amount): Ppmp
{
    static $seq = 700;
    $n = $seq++;

    $category = PpmpCategory::create(['name' => "Code Category {$n}"]);
    $junction = ChartOfAccountPpmpCategory::create([
        'chart_of_account_id' => $coa->id,
        'ppmp_category_id' => $category->id,
    ]);
    $priceList = PpmpPriceList::create([
        'item_number' => $n,
        'sort_order' => $n,
        'description' => "Code Item {$n}",
        'unit_of_measurement' => 'pc',
        'price' => $amount,
        'chart_of_account_ppmp_category_id' => $junction->id,
    ]);

    return Ppmp::create([
        'ppa_funding_source_id' => $bridge->id,
        'ppmp_price_list_id' => $priceList->id,
        'jan_qty' => 1,
        'jan_amount' => $amount,
    ]);
}

test('it lists the three class codes with postable accounts only', function () {
    $user = codeTestUser();
    codeTestCoa('5-02-03-010');
    codeTestCoa('5-02', postable: false);

    $response = $this->actingAs($user)->get('/expense-class-codes');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('classes', 3)
        ->where('classes.0', ['code' => '100', 'class' => 'PS', 'name' => 'Personal Services'])
        ->where('classes.1.code', '200')
        ->where('classes.2.code', '300')
        ->has('chartOfAccounts', 1)
        ->where('chartOfAccounts.0.path', '5-02-03-010')
    );
});

test('it links a postable account to a class', function () {
    $user = codeTestUser();
    $coa = codeTestCoa('5-02-03-010');

    $this->actingAs($user)->post('/expense-class-codes', [
        'chart_of_account_id' => $coa->id,
        'expense_class' => 'MOOE',
    ])->assertRedirect();

    expect($coa->fresh()->expense_class)->toBe('MOOE');
});

test('it refuses non-postable accounts and fe class', function () {
    $user = codeTestUser();
    $parent = codeTestCoa('5-02', postable: false);
    $leaf = codeTestCoa('5-02-03-010');

    $this->actingAs($user)->post('/expense-class-codes', [
        'chart_of_account_id' => $parent->id,
        'expense_class' => 'MOOE',
    ])->assertSessionHasErrors(['chart_of_account_id']);

    $this->actingAs($user)->post('/expense-class-codes', [
        'chart_of_account_id' => $leaf->id,
        'expense_class' => 'FE',
    ])->assertSessionHasErrors(['expense_class']);

    expect($parent->fresh()->expense_class)->toBeNull();
    expect($leaf->fresh()->expense_class)->toBeNull();
});

test('it unlinks an account back to unassigned', function () {
    $user = codeTestUser();
    $coa = codeTestCoa('5-02-03-010', class: 'MOOE');

    $this->actingAs($user)->delete("/expense-class-codes/{$coa->id}")->assertRedirect();

    expect($coa->fresh()->expense_class)->toBeNull();
});

test('it links multiple accounts in one request', function () {
    $user = codeTestUser();
    $first = codeTestCoa('5-02-03-010');
    $second = codeTestCoa('5-02-03-020');

    $this->actingAs($user)->post('/expense-class-codes', [
        'chart_of_account_ids' => [$first->id, $second->id],
        'expense_class' => 'MOOE',
    ])->assertRedirect();

    expect($first->fresh()->expense_class)->toBe('MOOE');
    expect($second->fresh()->expense_class)->toBe('MOOE');
});

test('linking a class moves synced totals to the right bucket', function () {
    $user = codeTestUser();
    $bridge = codeTestBridge();
    $coa = codeTestCoa('5-02-03-010');
    codeTestPpmp($bridge, $coa, 500);

    // Unassigned: totals stay zero.
    $bridge->refresh();
    expect((float) $bridge->mooe_amount)->toBe(0.0);

    $this->actingAs($user)->post('/expense-class-codes', [
        'chart_of_account_id' => $coa->id,
        'expense_class' => 'MOOE',
    ])->assertRedirect();

    $bridge->refresh();
    expect((float) $bridge->mooe_amount)->toBe(500.0);

    // Move to CO: MOOE drops, CO picks it up.
    $this->actingAs($user)->post('/expense-class-codes', [
        'chart_of_account_id' => $coa->id,
        'expense_class' => 'CO',
    ])->assertRedirect();

    $bridge->refresh();
    expect((float) $bridge->mooe_amount)->toBe(0.0);
    expect((float) $bridge->co_amount)->toBe(500.0);

    // Unlink: totals drop again.
    $this->actingAs($user)->delete("/expense-class-codes/{$coa->id}")->assertRedirect();

    $bridge->refresh();
    expect((float) $bridge->co_amount)->toBe(0.0);
});
