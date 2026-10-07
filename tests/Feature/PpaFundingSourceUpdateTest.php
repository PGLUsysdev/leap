<?php

use App\Models\AipEntry;
use App\Models\FiscalYear;
use App\Models\FundingSource;
use App\Models\Office;
use App\Models\Ppa;
use App\Models\PpaFundingSource;
use App\Models\User;

beforeEach(function () {
    config(['inertia.ssr.enabled' => false]);
});

/**
 * A funding source on an output, belonging to a pool PPA when `$isPsPool`.
 */
function fundingSourceTestRow(bool $isPsPool = false, float $ps = 1000.0): PpaFundingSource
{
    FundingSource::firstOrCreate(
        ['id' => 1],
        ['fund_type' => 'General Fund', 'code' => 'GF Proper', 'title' => 'General Fund'],
    );

    $office = Office::factory()->create();
    $fy = FiscalYear::factory()->create(['status' => 'draft']);

    $ppa = Ppa::create([
        'office_id' => $office->id,
        'parent_id' => null,
        'name' => 'Funding Source Program',
        'type' => 'Program',
        'code_suffix' => 'fs'.random_int(1000, 9999),
        'fiscal_year_id' => $fy->id,
        'is_ps_pool' => $isPsPool ?: null,
    ]);

    $entry = AipEntry::create(['ppa_id' => $ppa->id]);
    $output = $entry->outputs()->create(['sort_order' => 0]);

    return PpaFundingSource::create([
        'aip_output_id' => $output->id,
        'funding_source_id' => 1,
        'ps_amount' => $ps,
        'mooe_amount' => 500,
    ]);
}

test('it rejects a manual ps amount on a ps pool funding source', function () {
    // PS is derived from the personnel schedule; a typed value must not stick.
    $source = fundingSourceTestRow(isPsPool: true, ps: 1000.0);

    $this->actingAs(User::factory()->create())
        ->put("/ppa-funding-sources/{$source->id}", ['ps_amount' => 999999.0])
        ->assertSessionHasErrors('ps_amount');

    expect((float) $source->fresh()->ps_amount)->toBe(1000.0);
});

test('it rejects a manual ps amount on a non-pool funding source', function () {
    $source = fundingSourceTestRow(isPsPool: false, ps: 1000.0);

    $this->actingAs(User::factory()->create())
        ->put("/ppa-funding-sources/{$source->id}", ['ps_amount' => 999999.0])
        ->assertSessionHasErrors('ps_amount');

    expect((float) $source->fresh()->ps_amount)->toBe(1000.0);
});

test('it explains that ps is computed rather than just failing', function () {
    $source = fundingSourceTestRow(isPsPool: true);

    $this->actingAs(User::factory()->create())
        ->from(route('dashboard'))
        ->put("/ppa-funding-sources/{$source->id}", ['ps_amount' => 500.0])
        ->assertSessionHasErrors([
            'ps_amount' => 'Personal Services is computed from the personnel schedule and cannot be entered manually.',
        ]);
});

test('it still accepts the amounts that are manually editable', function () {
    // MOOE and CO are not editable here at all — they are summed from PPMP
    // line items. FE and the CCET columns remain manual off a pool.
    $source = fundingSourceTestRow(isPsPool: false, ps: 1000.0);

    $this->actingAs(User::factory()->create())
        ->put("/ppa-funding-sources/{$source->id}", [
            'fe_amount' => 777.0,
            'ccet_adaptation' => 5.0,
            'ccet_mitigation' => 6.0,
        ])
        ->assertSessionHasNoErrors();

    expect((float) $source->fresh()->fe_amount)->toBe(777.0)
        ->and((float) $source->fresh()->ccet_adaptation)->toBe(5.0)
        ->and((float) $source->fresh()->ccet_mitigation)->toBe(6.0);
});

test('it still rejects a non-ps amount on a ps pool funding source', function () {
    // The existing pool invariant is unchanged.
    $source = fundingSourceTestRow(isPsPool: true);

    $this->actingAs(User::factory()->create())
        ->put("/ppa-funding-sources/{$source->id}", ['fe_amount' => 100.0])
        ->assertSessionHasErrors('fe_amount');
});
