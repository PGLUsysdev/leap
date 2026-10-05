<?php

use App\Models\AipEntry;
use App\Models\ChartOfAccount;
use App\Models\FiscalYear;
use App\Models\Office;
use App\Models\Permission;
use App\Models\PermissionRole;
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
