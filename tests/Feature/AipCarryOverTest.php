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
use App\Services\AipCarryOverService;
use App\Services\AipCumulativeService;

test('carry creates linked supplemental output with zero delta funding', function () {
    $office = Office::factory()->create();
    $fiscalYear = FiscalYear::factory()->create(['status' => 'draft']);
    $fundingSource = FundingSource::create([
        'fund_type' => 'General Fund',
        'code' => 'GF-CARRY',
        'title' => 'General Fund',
    ]);

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

    $entry = AipEntry::create(['ppa_id' => $ppa->id, 'aip_document_id' => $regularDoc->id]);
    $output = AipOutput::create([
        'aip_entry_id' => $entry->id,
        'expected_output' => 'Same output',
        'sort_order' => 0,
    ]);
    PpaFundingSource::create([
        'aip_output_id' => $output->id,
        'funding_source_id' => $fundingSource->id,
        'mooe_amount' => 500,
    ]);

    $carried = app(AipCarryOverService::class)->carryOutputToDocument(
        $output->fresh(['aipEntry', 'fundingSources', 'offices']),
        $supplementalDoc,
    );

    expect((int) $carried->source_output_id)->toBe((int) $output->id)
        ->and($carried->fundingSources)->toHaveCount(1)
        ->and((float) $carried->fundingSources->first()->mooe_amount)->toBe(0.0);

    // Idempotent: second carry reuses the same output.
    $again = app(AipCarryOverService::class)->carryOutputToDocument(
        $output->fresh(['aipEntry', 'fundingSources', 'offices']),
        $supplementalDoc,
    );
    expect((int) $again->id)->toBe((int) $carried->id);
});

test('cumulative merges same ppa across docs by lineage and sums deltas', function () {
    $office = Office::factory()->create();
    $fiscalYear = FiscalYear::factory()->create(['status' => 'draft']);
    $fundingSource = FundingSource::create([
        'fund_type' => 'General Fund',
        'code' => 'GF-CUM',
        'title' => 'General Fund',
    ]);

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
    $regularOutput = AipOutput::create([
        'aip_entry_id' => $regularEntry->id,
        'expected_output' => 'Same output',
    ]);
    PpaFundingSource::create([
        'aip_output_id' => $regularOutput->id,
        'funding_source_id' => $fundingSource->id,
        'mooe_amount' => 500,
    ]);

    $carried = app(AipCarryOverService::class)->carryOutputToDocument(
        $regularOutput->fresh(['aipEntry', 'fundingSources', 'offices']),
        $supplementalDoc,
    );
    // Supplemental delta: add 150 for a new pricelist.
    $carried->fundingSources->first()->update(['mooe_amount' => 150]);

    $entries = AipEntry::whereIn('aip_document_id', [$regularDoc->id, $supplementalDoc->id])
        ->with(['outputs.fundingSources', 'outputs.offices'])
        ->get();

    $merged = app(AipCumulativeService::class)->merge($entries);

    expect($merged)->toHaveCount(1)
        ->and($merged->first()->outputs)->toHaveCount(1)
        ->and((float) $merged->first()->outputs->first()->fundingSources->first()->mooe_amount)
        ->toBe(650.0);
});

test('sibling outputs lists same ppa outputs from other docs with carried flag', function () {
    $office = Office::factory()->create();
    $fiscalYear = FiscalYear::factory()->create(['status' => 'draft']);
    $fundingSource = FundingSource::create([
        'fund_type' => 'General Fund',
        'code' => 'GF-SIB',
        'title' => 'General Fund',
    ]);

    $role = Role::create(['name' => 'sibling-tester']);
    foreach (['aip-summary.edit', 'aip-summary.show.all'] as $name) {
        $permission = Permission::firstOrCreate(['name' => $name]);
        PermissionRole::create(['role_id' => $role->id, 'permission_id' => $permission->id]);
    }
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
    $regularOutput = AipOutput::create([
        'aip_entry_id' => $regularEntry->id,
        'expected_output' => 'Output 1',
    ]);
    PpaFundingSource::create([
        'aip_output_id' => $regularOutput->id,
        'funding_source_id' => $fundingSource->id,
        'mooe_amount' => 100,
    ]);

    $supplementalEntry = AipEntry::create(['ppa_id' => $ppa->id, 'aip_document_id' => $supplementalDoc->id]);

    $response = $this->actingAs($user)->getJson("/aip-entries/{$supplementalEntry->id}/sibling-outputs");
    $response->assertOk()->assertJsonCount(1);
    expect($response->json()[0]['already_carried'])->toBeFalse();

    app(AipCarryOverService::class)->carryOutputToDocument(
        $regularOutput->fresh(['aipEntry', 'fundingSources', 'offices']),
        $supplementalDoc,
    );

    $again = $this->actingAs($user)->getJson("/aip-entries/{$supplementalEntry->id}/sibling-outputs");
    $again->assertOk();
    expect($again->json()[0]['already_carried'])->toBeTrue();
});
