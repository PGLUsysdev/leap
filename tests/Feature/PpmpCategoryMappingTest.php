<?php

use App\Models\ChartOfAccount;
use App\Models\ChartOfAccountPpmpCategory;
use App\Models\Permission;
use App\Models\PermissionRole;
use App\Models\PpmpCategory;
use App\Models\PpmpPriceList;
use App\Models\Role;
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

function mappingTestUser(array $permissionNames): User
{
    static $seq = 0;

    $seq++;

    $role = Role::create(['name' => "mapping-tester-{$seq}"]);

    foreach ($permissionNames as $name) {
        $permission = Permission::firstOrCreate(['name' => $name]);
        PermissionRole::create(['role_id' => $role->id, 'permission_id' => $permission->id]);
    }

    return User::factory()->create(['role_id' => $role->id]);
}

function mappingTestPair(): array
{
    static $seq = 0;

    $seq++;

    $coa = ChartOfAccount::create([
        'account_number' => "5020399-{$seq}",
        'account_title' => "Mapping Account {$seq}",
        'account_type' => 'EXPENSE',
        'path' => "5-02-03-099-{$seq}",
        'is_postable' => true,
    ]);
    $category = PpmpCategory::create(['name' => "Mapping Category {$seq}"]);

    return [$coa, $category];
}

function mappingTestPriceList(int $mappingId): PpmpPriceList
{
    static $seq = 0;

    $seq++;

    return PpmpPriceList::create([
        'item_number' => $seq,
        'sort_order' => $seq,
        'description' => "Mapping Item {$seq}",
        'unit_of_measurement' => 'pc',
        'price' => 100,
        'chart_of_account_ppmp_category_id' => $mappingId,
    ]);
}

test('guests are redirected from the mappings page', function () {
    $this->get('/ppmp-category-mappings')->assertRedirect('/login');
});

test('it forbids the mappings index without the mapping view permission', function () {
    // Category perm alone must not grant access: proves the policy split.
    $user = mappingTestUser(['ppmp-category.view']);

    $this->actingAs($user)->get('/ppmp-category-mappings')->assertForbidden();
});

test('it renders the mappings index with can flags reflecting mapping permissions', function () {
    $viewer = mappingTestUser(['ppmp-category-mapping.view']);
    $manager = mappingTestUser([
        'ppmp-category-mapping.view',
        'ppmp-category-mapping.add',
        'ppmp-category-mapping.delete',
    ]);

    $this->actingAs($viewer)->get('/ppmp-category-mappings')->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('can.add', false)
            ->where('can.delete', false)
        );

    $this->actingAs($manager)->get('/ppmp-category-mappings')->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('can.add', true)
            ->where('can.delete', true)
        );
});

test('it forbids storing mappings without the mapping add permission', function () {
    $user = mappingTestUser(['ppmp-category-mapping.view']);
    [$coa, $category] = mappingTestPair();

    $this->actingAs($user)->post('/ppmp-category-mappings', [
        'ppmp_category_id' => $category->id,
        'chart_of_account_id' => $coa->id,
    ])->assertForbidden();
});

test('it stores a mapping and rejects duplicates', function () {
    $user = mappingTestUser(['ppmp-category-mapping.add']);
    [$coa, $category] = mappingTestPair();

    $this->actingAs($user)->post('/ppmp-category-mappings', [
        'ppmp_category_id' => $category->id,
        'chart_of_account_id' => $coa->id,
    ])->assertOk();

    expect(ChartOfAccountPpmpCategory::where('ppmp_category_id', $category->id)
        ->where('chart_of_account_id', $coa->id)->exists())->toBeTrue();

    $this->actingAs($user)->post('/ppmp-category-mappings', [
        'ppmp_category_id' => $category->id,
        'chart_of_account_id' => $coa->id,
    ])->assertSessionHasErrors(['chart_of_account_id']);
});

test('it forbids deleting mappings without the mapping delete permission', function () {
    $user = mappingTestUser(['ppmp-category-mapping.view']);
    [$coa, $category] = mappingTestPair();
    $mapping = ChartOfAccountPpmpCategory::create([
        'ppmp_category_id' => $category->id,
        'chart_of_account_id' => $coa->id,
    ]);

    $this->actingAs($user)->delete("/ppmp-category-mappings/{$mapping->id}")->assertForbidden();
});

test('it deletes a mapping without dependents', function () {
    $user = mappingTestUser(['ppmp-category-mapping.delete']);
    [$coa, $category] = mappingTestPair();
    $mapping = ChartOfAccountPpmpCategory::create([
        'ppmp_category_id' => $category->id,
        'chart_of_account_id' => $coa->id,
    ]);

    $this->actingAs($user)->delete("/ppmp-category-mappings/{$mapping->id}")->assertRedirect();

    expect(ChartOfAccountPpmpCategory::find($mapping->id))->toBeNull();
});

test('it blocks deleting a mapping with dependents without force', function () {
    $user = mappingTestUser(['ppmp-category-mapping.delete', 'price-list.delete']);
    [$coa, $category] = mappingTestPair();
    $mapping = ChartOfAccountPpmpCategory::create([
        'ppmp_category_id' => $category->id,
        'chart_of_account_id' => $coa->id,
    ]);
    $priceList = mappingTestPriceList($mapping->id);

    $this->actingAs($user)->delete("/ppmp-category-mappings/{$mapping->id}")
        ->assertSessionHasErrors(['force_delete']);

    expect(ChartOfAccountPpmpCategory::find($mapping->id))->not->toBeNull();
    expect(PpmpPriceList::find($priceList->id))->not->toBeNull();
});

test('it forbids force deleting dependents without price-list.delete', function () {
    $user = mappingTestUser(['ppmp-category-mapping.delete']);
    [$coa, $category] = mappingTestPair();
    $mapping = ChartOfAccountPpmpCategory::create([
        'ppmp_category_id' => $category->id,
        'chart_of_account_id' => $coa->id,
    ]);
    $priceList = mappingTestPriceList($mapping->id);

    $this->actingAs($user)->delete("/ppmp-category-mappings/{$mapping->id}?force=1")->assertForbidden();

    expect(ChartOfAccountPpmpCategory::find($mapping->id))->not->toBeNull();
    expect(PpmpPriceList::find($priceList->id))->not->toBeNull();
});

test('it force deletes a mapping with its dependent price lists', function () {
    $user = mappingTestUser(['ppmp-category-mapping.delete', 'price-list.delete']);
    [$coa, $category] = mappingTestPair();
    $mapping = ChartOfAccountPpmpCategory::create([
        'ppmp_category_id' => $category->id,
        'chart_of_account_id' => $coa->id,
    ]);
    $priceList = mappingTestPriceList($mapping->id);

    $this->actingAs($user)->delete("/ppmp-category-mappings/{$mapping->id}?force=1")->assertRedirect();

    expect(ChartOfAccountPpmpCategory::find($mapping->id))->toBeNull();
    expect(PpmpPriceList::find($priceList->id))->toBeNull();
});
