<?php

namespace App\Http\Controllers;

use App\Models\AipEntry;
use App\Models\FundingSource;
use App\Models\FiscalYear;
use App\Models\Ppa;
use App\Models\Office;
use App\Models\Ppmp;

use App\Http\Requests\StoreAipEntryRequest;
use App\Http\Requests\UpdateAipEntryRequest;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

use Inertia\Inertia;

class AipEntryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, FiscalYear $fiscalYear)
    {
        $this->authorize('viewAny', AipEntry::class);

        $officeId = auth()->user()->office_id;
        $officeIds = $this->getOfficeHierarchyIds($officeId);

        $yearId = $fiscalYear->id;

        $scope = $request->query('scope', 'original');
        $saipId = $request->query('supplemental_aip_id');

        $fundingSourceFilter = function ($query) use ($scope, $saipId) {
            $query->with('fundingSource');
            if ($scope === 'original') {
                $query->whereNull('supplemental_aip_id');
            } elseif ($scope === 'supplemental' && $saipId) {
                $query->where('supplemental_aip_id', $saipId);
            }
        };

        $aipEntryFilter = function ($query) use (
            $scope,
            $saipId,
            $fundingSourceFilter,
        ) {
            if ($scope === 'original') {
                $query->whereNull('supplemental_aip_id');
            } elseif ($scope === 'supplemental' && $saipId) {
                $query->where('supplemental_aip_id', $saipId);
            }
            $query->with(['ppaFundingSources' => $fundingSourceFilter]);
        };

        $onlyAipItems = function ($query) use ($yearId, $scope, $saipId) {
            $query
                ->where('fiscal_year_id', $yearId)
                ->whereHas('aipEntries', function ($q) use ($scope, $saipId) {
                    if ($scope === 'original') {
                        $q->whereNull('supplemental_aip_id');
                    } elseif ($scope === 'supplemental' && $saipId) {
                        $q->where('supplemental_aip_id', $saipId);
                    }
                })
                ->orderBy('sort_order');
        };

        $aipEntries = Ppa
            // whereIn('office_id', $officeIds)->
            ::whereNull('parent_id')
            ->where('fiscal_year_id', $yearId)
            ->whereHas('aipEntries', function ($q) use ($scope, $saipId) {
                if ($scope === 'original') {
                    $q->whereNull('supplemental_aip_id');
                } elseif ($scope === 'supplemental' && $saipId) {
                    $q->where('supplemental_aip_id', $saipId);
                }
            })
            ->orderBy('sort_order')
            ->with([
                'office',
                'aipEntries' => $aipEntryFilter,

                'children' => $onlyAipItems,
                'children.office',
                'children.aipEntries' => $aipEntryFilter,

                'children.children' => $onlyAipItems,
                'children.children.office',
                'children.children.aipEntries' => $aipEntryFilter,

                'children.children.children' => $onlyAipItems,
                'children.children.children.office',
                'children.children.children.aipEntries' => $aipEntryFilter,
            ])
            ->get();

        return Inertia::render('aip-summary/index', [
            'fiscalYear' => $fiscalYear,
            'aipEntries' => $aipEntries,
            'fundingSources' => FundingSource::all(),
            'offices' => Office::all(),
            'filters' => $request->all(),
            'supplementalAips' => \App\Models\SupplementalAip::where(
                'fiscal_year_id',
                $yearId,
            )
                ->where('office_id', $officeId)
                ->get(),
            'currentScope' => [
                'scope' => $scope,
                'supplemental_aip_id' => $saipId ? (int) $saipId : null,
            ],

            'dialogPpaTree' => Inertia::lazy(function () use (
                $request,
                $officeIds,
                $yearId,
                $scope,
                $saipId,
            ) {
                $id = $request->query('dialog_id');
                $search = $request->query('dialog_search');
                $boundaryId = $request->query('dialog_boundary_id');

                $targetParentId = $id ?: $boundaryId;

                return Ppa
                    // whereIn('office_id', $officeIds)->
                    ::where('fiscal_year_id', $yearId)
                    ->where('parent_id', $targetParentId)
                    ->where(function ($q) use ($scope, $saipId) {
                        if ($scope === 'original') {
                            $q->whereNull('supplemental_aip_id');
                        } elseif ($scope === 'supplemental' && $saipId) {
                            $q->whereNull('supplemental_aip_id')->orWhere(
                                'supplemental_aip_id',
                                $saipId,
                            );
                        }
                    })
                    ->when($search, function ($query, $search) {
                        $query->where(function ($inner) use ($search) {
                            $inner
                                ->where('name', 'like', "%$search%")
                                ->orWhere('code_suffix', 'like', "%$search%");

                            if (str_contains($search, '-')) {
                                $lastSegment = last(explode('-', $search));

                                $inner->orWhere(
                                    'code_suffix',
                                    'like',
                                    "%$lastSegment%",
                                );
                            }
                        });
                    })
                    ->orderBy('sort_order')
                    ->withCount('children')
                    ->paginate(50, ['*'], 'dialog_page')
                    ->withQueryString();
            }),

            'dialogCurrent' => Inertia::lazy(function () use ($request) {
                $id =
                    $request->query('dialog_id') ?:
                    $request->query('dialog_boundary_id');

                return $id ? $this->getPpaBreadcrumbs($id) : [];
            }),
        ]);
    }

    private function getPpaBreadcrumbs($id)
    {
        $breadcrumbs = [];
        $current = Ppa::find($id);

        while ($current) {
            $breadcrumbs[] = [
                'id' => $current->id,
                'name' => $current->name,
                'type' => $current->type,
            ];

            $current = $current->parent;
        }

        return array_reverse($breadcrumbs);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAipEntryRequest $request, $fiscal_year_id)
    {
        $validated = $request->validated();

        $newEntries = collect($validated['ppa_ids'])
            ->map(function ($ppaId) {
                return [
                    'ppa_id' => $ppaId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            })
            ->toArray();

        \DB::table('aip_entries')->insert($newEntries);

        return back()->with('success', 'PPAs imported successfully!');
    }

    public function import(Request $request, FiscalYear $fiscalYear)
    {
        $validated = $request->validate([
            'ppa_ids' => 'required|array',
            'ppa_ids.*' => 'exists:ppas,id',
            'supplemental_aip_id' => 'nullable|exists:supplemental_aips,id',
        ]);

        $this->authorize('import', [AipEntry::class, $validated['ppa_ids']]);

        $saipId = $validated['supplemental_aip_id'] ?? null;

        DB::transaction(function () use ($validated, $fiscalYear, $saipId) {
            foreach ($validated['ppa_ids'] as $ppaId) {
                AipEntry::firstOrCreate(
                    [
                        'ppa_id' => $ppaId,
                        'supplemental_aip_id' => $saipId ?: null,
                    ],
                    [
                        'start_date' => $fiscalYear->year . '-01-01',
                        'end_date' => $fiscalYear->year . '-12-31',
                        'expected_output' => 'To be defined.',
                        'is_supplemental' => (bool) $saipId,
                    ],
                );
            }
        });

        return back()->with(
            'success',
            'Selected items imported to AIP Summary.',
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(AipEntry $aipEntry)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(AipEntry $aipEntry)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAipEntryRequest $request, AipEntry $aipEntry)
    {
        $this->authorize('update', $aipEntry);

        $validated = $request->validated();
        $ppa = $aipEntry->ppa;

        if (!$ppa) {
            abort(404, 'Associated PPA not found.');
        }

        $saipId = $validated['supplemental_aip_id'] ?? null;

        $currentFundingSourceQuery = $aipEntry->ppaFundingSources();
        if ($saipId) {
            $currentFundingSourceQuery->where('supplemental_aip_id', $saipId);
        } else {
            $currentFundingSourceQuery->whereNull('supplemental_aip_id');
        }

        $currentFundingSourceIds = $currentFundingSourceQuery
            ->pluck('funding_source_id')
            ->toArray();

        $newFundingSourceIds = collect($validated['ppa_funding_sources'] ?? [])
            ->pluck('funding_source_id')
            ->toArray();

        $idsToRemove = array_diff(
            $currentFundingSourceIds,
            $newFundingSourceIds,
        );

        if (!empty($idsToRemove)) {
            $isUsedInPpmp = Ppmp::whereHas('ppaFundingSource', function (
                $query,
            ) use ($aipEntry, $idsToRemove, $saipId) {
                $query
                    ->where('aip_entry_id', $aipEntry->id)
                    ->whereIn('funding_source_id', $idsToRemove);
                if ($saipId) {
                    $query->where('supplemental_aip_id', $saipId);
                } else {
                    $query->whereNull('supplemental_aip_id');
                }
            })->exists();

            if ($isUsedInPpmp) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'ppa_funding_sources' =>
                        'Cannot remove a funding source that is already being used by PPMP items.',
                ]);
            }
        }

        // 4. Execute Update Transaction
        \DB::transaction(function () use (
            $validated,
            $aipEntry,
            $ppa,
            $idsToRemove,
            $saipId,
        ) {
            $aipEntry->update([
                'expected_output' => $validated['expected_output'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
            ]);

            $ppa->update(['office_id' => $validated['office_id']]);

            // Remove only the ones that aren't in the new list (and passed the usage check)
            $deleteQuery = $aipEntry
                ->ppaFundingSources()
                ->whereIn('funding_source_id', $idsToRemove);
            if ($saipId) {
                $deleteQuery->where('supplemental_aip_id', $saipId);
            } else {
                $deleteQuery->whereNull('supplemental_aip_id');
            }
            $deleteQuery->delete();

            // Update existing or create new ones
            foreach ($validated['ppa_funding_sources'] ?? [] as $source) {
                $aipEntry->ppaFundingSources()->updateOrCreate(
                    [
                        'funding_source_id' => $source['funding_source_id'],
                        'supplemental_aip_id' => $saipId ?: null,
                    ],
                    [
                        'ps_amount' => $source['ps_amount'],
                        'mooe_amount' => $source['mooe_amount'],
                        'fe_amount' => $source['fe_amount'],
                        'co_amount' => $source['co_amount'],
                        'ccet_adaptation' => $source['ccet_adaptation'] ?? 0,
                        'ccet_mitigation' => $source['ccet_mitigation'] ?? 0,
                        'is_supplemental' => (bool) $saipId,
                    ],
                );
            }
        });

        return back()->with('success', 'AIP Entry updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AipEntry $aipEntry)
    {
        $this->authorize('delete', $aipEntry);

        try {
            DB::beginTransaction();

            $targetPpaId = $aipEntry->ppa_id;
            $ppa = Ppa::find($targetPpaId);
            $fiscalYearId = $ppa ? $ppa->fiscal_year_id : null;

            $ppaIdsToRemoveFromAip = array_merge(
                [$targetPpaId],
                $this->getDescendantPpaIds($targetPpaId),
            );

            $aipEntryIdsToDelete = AipEntry::whereIn(
                'ppa_id',
                $ppaIdsToRemoveFromAip,
            )
                ->where('supplemental_aip_id', $aipEntry->supplemental_aip_id)
                ->when($fiscalYearId, function ($query) use ($fiscalYearId) {
                    $query->whereHas('ppa', function ($subQuery) use (
                        $fiscalYearId,
                    ) {
                        $subQuery->where('fiscal_year_id', $fiscalYearId);
                    });
                })
                ->pluck('id')
                ->toArray();

            if (!empty($aipEntryIdsToDelete)) {
                // 1. REFACTORED: Delete PPMP records
                // We find PPMPs that belong to the PpaFundingSources linked to these AipEntries
                Ppmp::whereHas('ppaFundingSource', function ($query) use (
                    $aipEntryIdsToDelete,
                ) {
                    $query->whereIn('aip_entry_id', $aipEntryIdsToDelete);
                })->delete();

                // 2. Delete the Funding Source bridge records
                DB::table('ppa_funding_sources')
                    ->whereIn('aip_entry_id', $aipEntryIdsToDelete)
                    ->delete();

                // 3. Delete the AIP entries
                AipEntry::whereIn('id', $aipEntryIdsToDelete)->delete();
            }

            DB::commit();
            return back()->with(
                'success',
                'Successfully removed from AIP summary.',
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors([
                'error' => 'Failed: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Recursively find all child PPA IDs from the library table.
     */
    private function getDescendantPpaIds($parentId)
    {
        $children = DB::table('ppas')
            ->where('parent_id', $parentId)
            ->pluck('id')
            ->toArray();

        $descendants = $children;
        foreach ($children as $childId) {
            $descendants = array_merge(
                $descendants,
                $this->getDescendantPpaIds($childId),
            );
        }

        return $descendants;
    }

    private function getOfficeHierarchyIds($officeId)
    {
        $officeIds = [$officeId];

        $childOfficeIds = $this->getChildOfficeIds($officeId);
        $officeIds = array_merge($officeIds, $childOfficeIds);

        return $officeIds;
    }

    private function getChildOfficeIds($parentId)
    {
        $children = Office::where('parent_id', $parentId)
            ->pluck('id')
            ->toArray();

        $descendants = $children;
        foreach ($children as $childId) {
            $descendants = array_merge(
                $descendants,
                $this->getChildOfficeIds($childId),
            );
        }

        return $descendants;
    }
}
