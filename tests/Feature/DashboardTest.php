<?php

use App\Models\AipDocument;
use App\Models\AipEntry;
use App\Models\AipOutput;
use App\Models\FiscalYear;
use App\Models\FundingSource;
use App\Models\Office;
use App\Models\Permission;
use App\Models\PermissionRole;
use App\Models\Ppa;
use App\Models\PpaFundingSource;
use App\Models\Role;
use App\Models\User;

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
