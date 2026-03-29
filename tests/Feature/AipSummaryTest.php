<?php

use App\Models\User;
use App\Models\Ppa;
use App\Models\FiscalYear;
use Inertia\Testing\AssertableInertia as Assert;

test('aip entries prop has the correct recursive shape', function () {
    $user = User::factory()->create();
    $year = FiscalYear::factory()->create(['year' => 2026]);

    // 1. Create the Parent and GIVE IT AN ENTRY for the year
    $parent = Ppa::factory()->create(['parent_id' => null]);
    $parent->aipEntries()->create(['fiscal_year_id' => $year->id]); // <--- Add this!

    // 2. Create the Child and give it an entry
    $child = Ppa::factory()->create(['parent_id' => $parent->id]);
    $child->aipEntries()->create(['fiscal_year_id' => $year->id]);

    // 2. Act
    $this->actingAs($user)
        ->get(route('aip.summary', $year->id))
        ->assertOk()
        ->assertInertia(
            fn(Assert $page) => $page->has(
                'aipEntries.0',
                fn(Assert $page) => $page
                    // Check the Parent level keys
                    ->hasAll(['id', 'children', 'office', 'aip_entries'])
                    ->has('office.sector')

                    // Check just one level deep to verify recursion works
                    ->has(
                        'children.0',
                        fn(Assert $page) => $page
                            ->hasAll([
                                'id',
                                'children',
                                'ppa_funding_sources',
                                'office',
                            ])
                            ->has('office.office_type')
                            ->etc(),
                    )
                    ->etc(),
            ),
        );
});
