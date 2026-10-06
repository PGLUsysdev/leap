<?php

use App\Models\AipEntry;
use App\Models\AipOutput;
use App\Models\ChartOfAccount;
use App\Models\FeBreakdownItem;
use App\Models\FiscalYear;
use App\Models\FundingSource;
use App\Models\Office;
use App\Models\Permission;
use App\Models\PermissionRole;
use App\Models\Ppa;
use App\Models\PpaFundingSource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $pdo = DB::connection()->getPdo();

    if (method_exists($pdo, 'sqliteCreateFunction')) {
        $pdo->sqliteCreateFunction('SHA2', fn ($value) => hash('sha256', (string) $value), 2);
    }
});

function feBreakdownTestUser(array $permissionNames = ['aip-summary.edit.funding-source', 'aip-summary.show.all']): User
{
    static $seq = 0;

    $seq++;

    $role = Role::create(['name' => "fe-breakdown-tester-{$seq}"]);

    foreach ($permissionNames as $name) {
        $permission = Permission::firstOrCreate(['name' => $name]);
        PermissionRole::create(['role_id' => $role->id, 'permission_id' => $permission->id]);
    }

    return User::factory()->create(['role_id' => $role->id]);
}

function feBreakdownTestCoa(string $path, ?string $class, bool $active = true): ChartOfAccount
{
    static $seq = 700;

    $seq++;

    return ChartOfAccount::create([
        'account_number' => "fe-{$seq}",
        'account_title' => "FE Account {$seq}",
        'account_type' => 'EXPENSE',
        'expense_class' => $class,
        'path' => $path,
        'level' => 4,
        'is_postable' => true,
        'is_active' => $active,
        'normal_balance' => 'DEBIT',
    ]);
}

function feBreakdownTestEntry(bool $isPsPool = false): array
{
    $fiscalYear = FiscalYear::factory()->create(['status' => 'draft']);
    $office = Office::factory()->create();
    $ppa = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'FE Breakdown Program',
        'type' => 'Program',
        'code_suffix' => 'fe'.random_int(1000, 9999),
        'fiscal_year_id' => $fiscalYear->id,
        'is_ps_pool' => $isPsPool,
    ]);
    $entry = AipEntry::create(['ppa_id' => $ppa->id]);

    $output = AipOutput::create([
        'aip_entry_id' => $entry->id,
        'expected_output' => 'FE Breakdown Output',
        'sort_order' => 1,
    ]);

    $fundingSource = PpaFundingSource::create([
        'aip_output_id' => $output->id,
        'funding_source_id' => FundingSource::create([
            'fund_type' => 'GF Proper',
            'code' => 'FE'.random_int(1000, 9999),
            'title' => 'FE Breakdown Funding Source',
        ])->id,
    ]);

    return [$fiscalYear, $entry, $fundingSource];
}

test('it renders the page for the entry without a funding source', function () {
    [$fiscalYear, $entry] = feBreakdownTestEntry();
    $user = feBreakdownTestUser();

    $this->actingAs($user)->get("/aip/{$fiscalYear->id}/summary/{$entry->id}/fe-breakdown")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('fe-breakdown/index')
            ->where('fiscalYear.id', $fiscalYear->id)
            ->where('fiscalYear.year', (int) $fiscalYear->year)
            ->where('fundingSource', null)
            ->where('can.edit', false)
        );
});

test('it scopes rows to active FE accounts ordered by path', function () {
    [$fiscalYear, $entry] = feBreakdownTestEntry();
    $user = feBreakdownTestUser();

    feBreakdownTestCoa('5-03-01-020', 'FE');
    feBreakdownTestCoa('2-01-02-040', 'FE');
    feBreakdownTestCoa('5-03-01-030', 'FE', active: false);
    feBreakdownTestCoa('5-02-03-010', 'MOOE');

    $this->actingAs($user)->get("/aip/{$fiscalYear->id}/summary/{$entry->id}/fe-breakdown")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('chartOfAccounts', 2)
            ->where('chartOfAccounts.0.path', '2-01-02-040')
            ->where('chartOfAccounts.1.path', '5-03-01-020')
        );
});

test('it exposes the saved amounts for the requested funding source', function () {
    [$fiscalYear, $entry, $fundingSource] = feBreakdownTestEntry();
    $user = feBreakdownTestUser();

    $coa = feBreakdownTestCoa('5-03-01-020', 'FE');

    FeBreakdownItem::create([
        'ppa_funding_source_id' => $fundingSource->id,
        'chart_of_account_id' => $coa->id,
        'amount' => 1234.56,
    ]);

    $this->actingAs($user)->get("/aip/{$fiscalYear->id}/summary/{$entry->id}/fe-breakdown?ppa_funding_source_id={$fundingSource->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('fundingSource.id', $fundingSource->id)
            ->where('amounts', [$coa->id => '1234.56'])
            ->where('can.edit', true)
        );
});

test('it totals the entered amounts into the funding source fe amount', function () {
    [$fiscalYear, $entry, $fundingSource] = feBreakdownTestEntry();
    $user = feBreakdownTestUser();

    $interest = feBreakdownTestCoa('5-03-01-020', 'FE');
    $loans = feBreakdownTestCoa('2-01-02-040', 'FE');

    $this->actingAs($user)->put("/aip/{$fiscalYear->id}/summary/{$entry->id}/fe-breakdown/{$interest->id}", [
        'ppa_funding_source_id' => $fundingSource->id,
        'amount' => 1500.25,
    ]);

    $this->actingAs($user)->put("/aip/{$fiscalYear->id}/summary/{$entry->id}/fe-breakdown/{$loans->id}", [
        'ppa_funding_source_id' => $fundingSource->id,
        'amount' => 2499.75,
    ])->assertRedirect();

    expect((float) $fundingSource->fresh()->fe_amount)->toBe(4000.0)
        ->and(FeBreakdownItem::where('ppa_funding_source_id', $fundingSource->id)->count())->toBe(2);
});

test('it overwrites a previously saved amount for the same account', function () {
    [$fiscalYear, $entry, $fundingSource] = feBreakdownTestEntry();
    $user = feBreakdownTestUser();

    $coa = feBreakdownTestCoa('5-03-01-020', 'FE');

    FeBreakdownItem::create([
        'ppa_funding_source_id' => $fundingSource->id,
        'chart_of_account_id' => $coa->id,
        'amount' => 900,
    ]);

    $this->actingAs($user)->put("/aip/{$fiscalYear->id}/summary/{$entry->id}/fe-breakdown/{$coa->id}", [
        'ppa_funding_source_id' => $fundingSource->id,
        'amount' => 750.5,
    ])->assertRedirect();

    expect(FeBreakdownItem::where('ppa_funding_source_id', $fundingSource->id)->count())->toBe(1)
        ->and((float) $fundingSource->fresh()->fe_amount)->toBe(750.5);
});

test('it drops amounts for accounts no longer classified as FE', function () {
    [$fiscalYear, $entry, $fundingSource] = feBreakdownTestEntry();
    $user = feBreakdownTestUser();

    $kept = feBreakdownTestCoa('5-03-01-020', 'FE');
    $unlinked = feBreakdownTestCoa('2-01-02-040', 'FE');

    foreach ([$kept, $unlinked] as $coa) {
        FeBreakdownItem::create([
            'ppa_funding_source_id' => $fundingSource->id,
            'chart_of_account_id' => $coa->id,
            'amount' => 100,
        ]);
    }

    $unlinked->update(['expense_class' => null]);

    $this->actingAs($user)->put("/aip/{$fiscalYear->id}/summary/{$entry->id}/fe-breakdown/{$kept->id}", [
        'ppa_funding_source_id' => $fundingSource->id,
        'amount' => 300,
    ])->assertRedirect();

    expect(FeBreakdownItem::where('ppa_funding_source_id', $fundingSource->id)->pluck('chart_of_account_id')->all())
        ->toBe([$kept->id])
        ->and((float) $fundingSource->fresh()->fe_amount)->toBe(300.0);
});

test('it 404s for an account outside the FE class', function () {
    [$fiscalYear, $entry, $fundingSource] = feBreakdownTestEntry();
    $user = feBreakdownTestUser();

    $mooe = feBreakdownTestCoa('5-02-03-010', 'MOOE');

    $this->actingAs($user)->put("/aip/{$fiscalYear->id}/summary/{$entry->id}/fe-breakdown/{$mooe->id}", [
        'ppa_funding_source_id' => $fundingSource->id,
        'amount' => 100,
    ])->assertNotFound();

    expect((float) $fundingSource->fresh()->fe_amount)->toBe(0.0);
});

test('it refuses negative amounts', function () {
    [$fiscalYear, $entry, $fundingSource] = feBreakdownTestEntry();
    $user = feBreakdownTestUser();

    $coa = feBreakdownTestCoa('5-03-01-020', 'FE');

    $this->actingAs($user)->put("/aip/{$fiscalYear->id}/summary/{$entry->id}/fe-breakdown/{$coa->id}", [
        'ppa_funding_source_id' => $fundingSource->id,
        'amount' => -100,
    ])->assertSessionHasErrors(['amount']);

    expect((float) $fundingSource->fresh()->fe_amount)->toBe(0.0);
});

test('it forbids saving without permission to edit funding sources', function () {
    [$fiscalYear, $entry, $fundingSource] = feBreakdownTestEntry();
    $user = feBreakdownTestUser([]);

    $coa = feBreakdownTestCoa('5-03-01-020', 'FE');

    $this->actingAs($user)->put("/aip/{$fiscalYear->id}/summary/{$entry->id}/fe-breakdown/{$coa->id}", [
        'ppa_funding_source_id' => $fundingSource->id,
        'amount' => 100,
    ])->assertForbidden();

    expect((float) $fundingSource->fresh()->fe_amount)->toBe(0.0);
});

test('it 404s when saving against a funding source of another entry', function () {
    [$fiscalYear, $entry] = feBreakdownTestEntry();
    [, , $otherFundingSource] = feBreakdownTestEntry();
    $user = feBreakdownTestUser();

    $coa = feBreakdownTestCoa('5-03-01-020', 'FE');

    $this->actingAs($user)->put("/aip/{$fiscalYear->id}/summary/{$entry->id}/fe-breakdown/{$coa->id}", [
        'ppa_funding_source_id' => $otherFundingSource->id,
        'amount' => 100,
    ])->assertNotFound();
});

test('it 404s when the funding source belongs to another entry', function () {
    [$fiscalYear, $entry] = feBreakdownTestEntry();
    [, , $otherFundingSource] = feBreakdownTestEntry();
    $user = feBreakdownTestUser();

    $this->actingAs($user)->get("/aip/{$fiscalYear->id}/summary/{$entry->id}/fe-breakdown?ppa_funding_source_id={$otherFundingSource->id}")
        ->assertNotFound();
});

test('it 404s for an unknown funding source', function () {
    [$fiscalYear, $entry] = feBreakdownTestEntry();
    $user = feBreakdownTestUser();

    $this->actingAs($user)->get("/aip/{$fiscalYear->id}/summary/{$entry->id}/fe-breakdown?ppa_funding_source_id=999999")
        ->assertNotFound();
});

test('it 404s for an unknown entry', function () {
    [$fiscalYear] = feBreakdownTestEntry();
    $user = feBreakdownTestUser();

    $this->actingAs($user)->get("/aip/{$fiscalYear->id}/summary/999999/fe-breakdown")
        ->assertNotFound();
});
