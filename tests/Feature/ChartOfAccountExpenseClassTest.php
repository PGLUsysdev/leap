<?php

use App\Models\ChartOfAccount;
use App\Models\Permission;
use App\Models\PermissionRole;
use App\Models\Role;
use App\Models\User;

function expenseClassTestUser(): User
{
    static $seq = 0;

    $seq++;

    $role = Role::create(['name' => "expense-class-tester-{$seq}"]);

    foreach (['chart-of-account.add', 'chart-of-account.edit'] as $name) {
        $permission = Permission::firstOrCreate(['name' => $name]);
        PermissionRole::create(['role_id' => $role->id, 'permission_id' => $permission->id]);
    }

    return User::factory()->create(['role_id' => $role->id]);
}

function expenseClassPayload(array $overrides = []): array
{
    return array_merge([
        'account_number' => '010',
        'path' => '5-02-03-010',
        'account_title' => 'Office Supplies',
        'is_postable' => true,
        'is_active' => true,
    ], $overrides);
}

test('creating an account without an expense class leaves it unassigned', function () {
    $user = expenseClassTestUser();

    $this->actingAs($user)->post('/chart-of-accounts', expenseClassPayload());

    $coa = ChartOfAccount::where('path', '5-02-03-010')->first();

    expect($coa)->not->toBeNull()
        ->and($coa->expense_class)->toBeNull();
});

test('creating an account does not infer expense class from the code path', function () {
    $user = expenseClassTestUser();

    $this->actingAs($user)->post('/chart-of-accounts', expenseClassPayload([
        'path' => '5-01-01-010',
        'account_number' => '011',
    ]));

    expect(ChartOfAccount::where('path', '5-01-01-010')->first()->expense_class)->toBeNull();
});

test('an explicit expense class is stored as given', function () {
    $user = expenseClassTestUser();

    $this->actingAs($user)->post('/chart-of-accounts', expenseClassPayload([
        'expense_class' => 'MOOE',
    ]));

    expect(ChartOfAccount::where('path', '5-02-03-010')->first()->expense_class)->toBe('MOOE');
});

test('updating an account without an expense class does not infer one', function () {
    $user = expenseClassTestUser();
    $coa = ChartOfAccount::create(expenseClassPayload());

    $this->actingAs($user)->patch("/chart-of-accounts/{$coa->id}", expenseClassPayload([
        'path' => '5-03-01-010',
        'account_number' => '012',
        'account_title' => 'Bank Charges',
    ]));

    expect($coa->fresh()->expense_class)->toBeNull();
});
