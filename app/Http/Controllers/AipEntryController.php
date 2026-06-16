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

        $user = auth()->user();
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        $canViewAll = $permissions->contains('aip-summary.show.all');
        $officeId = $canViewAll
            ? ($request->query('selected_office_id') ?:
            $user->office_id)
            : $user->office_id;
        $officeIds = $this->getOfficeHierarchyIds($officeId);

        $yearId = $fiscalYear->id;

        $scope = $request->query('scope', 'original');
        $saipId = $request->query('supplemental_aip_id');

        $supplementalAip = null;

        if ($scope === 'supplemental' && $saipId) {
            $supplementalAip = \App\Models\SupplementalAip::findOrFail($saipId);
            $this->authorize('view', $supplementalAip);
        }

        $fundingSourceFilter = function ($query) use ($scope, $saipId) {
            $query->with(['fundingSource', 'ccTypology', 'ppmps']);
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

        $aipEntries = Ppa::whereIn('office_id', $officeIds)
            ->whereNull('parent_id')
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
            ->get()
            ->map(function ($aipEntries) use (
                $request,
                $supplementalAip,
                $scope,
                $saipId,
            ) {
                $aipEntry = $aipEntries->aip_entries?->first();

                if (!$aipEntry) {
                    $aipEntry = \App\Models\AipEntry::where(
                        'ppa_id',
                        $aipEntries->id,
                    )
                        ->when(
                            $scope === 'original',
                            fn($q) => $q->whereNull('supplemental_aip_id'),
                        )
                        ->when(
                            $scope === 'supplemental' && $saipId,
                            fn($q) => $q->where('supplemental_aip_id', $saipId),
                        )
                        ->first();
                }

                $aipEntries->can = [
                    'import' => $request
                        ->user()
                        ->can('import', [AipEntry::class, [$aipEntries->id]]),
                    'edit' => $aipEntry
                        ? $request->user()->can('update', $aipEntry)
                        : false,
                    'delete' => $aipEntry
                        ? $request->user()->can('delete', $aipEntry)
                        : false,
                    'editFundingSources' => $aipEntry
                        ? $request->user()->can('editFundingSources', $aipEntry)
                        : false,
                    'viewPpmp' => $aipEntry
                        ? $request
                            ->user()
                            ->can('viewAny', [Ppmp::class, $aipEntry])
                        : false,
                ];

                $aipEntries->children->each(function ($child) use (
                    $request,
                    $scope,
                    $saipId,
                ) {
                    $childEntry = $child->aip_entries?->first();

                    if (!$childEntry) {
                        $childEntry = \App\Models\AipEntry::where(
                            'ppa_id',
                            $child->id,
                        )
                            ->when(
                                $scope === 'original',
                                fn($q) => $q->whereNull('supplemental_aip_id'),
                            )
                            ->when(
                                $scope === 'supplemental' && $saipId,
                                fn($q) => $q->where(
                                    'supplemental_aip_id',
                                    $saipId,
                                ),
                            )
                            ->first();
                    }

                    $child->can = [
                        'import' => $request
                            ->user()
                            ->can('import', [AipEntry::class, [$child->id]]),
                        'edit' => $childEntry
                            ? $request->user()->can('update', $childEntry)
                            : false,
                        'delete' => $childEntry
                            ? $request->user()->can('delete', $childEntry)
                            : false,
                        'editFundingSources' => $childEntry
                            ? $request
                                ->user()
                                ->can('editFundingSources', $childEntry)
                            : false,
                        'viewPpmp' => $childEntry
                            ? $request
                                ->user()
                                ->can('viewAny', [Ppmp::class, $childEntry])
                            : false,
                    ];

                    $child->children->each(function ($child2) use (
                        $request,
                        $scope,
                        $saipId,
                    ) {
                        $child2Entry = $child2->aip_entries?->first();

                        if (!$child2Entry) {
                            $child2Entry = \App\Models\AipEntry::where(
                                'ppa_id',
                                $child2->id,
                            )
                                ->when(
                                    $scope === 'original',
                                    fn($q) => $q->whereNull(
                                        'supplemental_aip_id',
                                    ),
                                )
                                ->when(
                                    $scope === 'supplemental' && $saipId,
                                    fn($q) => $q->where(
                                        'supplemental_aip_id',
                                        $saipId,
                                    ),
                                )
                                ->first();
                        }

                        $child2->can = [
                            'import' => $request
                                ->user()
                                ->can('import', [
                                    AipEntry::class,
                                    [$child2->id],
                                ]),
                            'edit' => $child2Entry
                                ? $request->user()->can('update', $child2Entry)
                                : false,
                            'delete' => $child2Entry
                                ? $request->user()->can('delete', $child2Entry)
                                : false,
                            'editFundingSources' => $child2Entry
                                ? $request
                                    ->user()
                                    ->can('editFundingSources', $child2Entry)
                                : false,
                            'viewPpmp' => $child2Entry
                                ? $request
                                    ->user()
                                    ->can('viewAny', [
                                        Ppmp::class,
                                        $child2Entry,
                                    ])
                                : false,
                        ];

                        $child2->children->each(function ($child3) use (
                            $request,
                            $scope,
                            $saipId,
                        ) {
                            $child3Entry = $child3->aip_entries?->first();

                            if (!$child3Entry) {
                                $child3Entry = \App\Models\AipEntry::where(
                                    'ppa_id',
                                    $child3->id,
                                )
                                    ->when(
                                        $scope === 'original',
                                        fn($q) => $q->whereNull(
                                            'supplemental_aip_id',
                                        ),
                                    )
                                    ->when(
                                        $scope === 'supplemental' && $saipId,
                                        fn($q) => $q->where(
                                            'supplemental_aip_id',
                                            $saipId,
                                        ),
                                    )
                                    ->first();
                            }

                            $child3->can = [
                                'import' => $request
                                    ->user()
                                    ->can('import', [
                                        AipEntry::class,
                                        [$child3->id],
                                    ]),
                                'edit' => $child3Entry
                                    ? $request
                                        ->user()
                                        ->can('update', $child3Entry)
                                    : false,
                                'delete' => $child3Entry
                                    ? $request
                                        ->user()
                                        ->can('delete', $child3Entry)
                                    : false,
                                'editFundingSources' => $child3Entry
                                    ? $request
                                        ->user()
                                        ->can(
                                            'editFundingSources',
                                            $child3Entry,
                                        )
                                    : false,
                                'viewPpmp' => $child3Entry
                                    ? $request
                                        ->user()
                                        ->can('viewAny', [
                                            Ppmp::class,
                                            $child3Entry,
                                        ])
                                    : false,
                            ];
                        });
                    });
                });

                return $aipEntries;
            });

        return Inertia::render('aip-summary/index', [
            'fiscalYear' => $fiscalYear,
            'aipEntries' => $aipEntries,
            'fundingSources' => FundingSource::all(),
            'chartOfAccounts' => \App\Models\ChartOfAccount::select(
                'id',
                'account_number',
                'account_title',
                'expense_class',
            )
                ->orderBy('account_number')
                ->get(),
            'priceLists' => \App\Models\PpmpPriceList::with([
                'chartOfAccountPpmpCategory.chartOfAccount',
                'chartOfAccountPpmpCategory.ppmpCategory',
            ])
                ->orderBy('sort_order', 'asc')
                ->get(),
            'ppmpCategories' => \App\Models\PpmpCategory::with([
                'chartOfAccountPpmpCategories.chartOfAccount',
            ])->get(),
            'ccTypologies' => \App\Models\CcTypology::select(
                'id',
                'code',
                'description',
                'strategic_priority_id',
                'sub_sector_id',
            )
                ->with([
                    'strategicPriority:id,code,name',
                    'subSector:id,code,name',
                ])
                ->orderBy('code')
                ->get(),
            'offices' => Office::all(),
            'filters' => $request->all(),
            'supplementalAips' => \App\Models\SupplementalAip::where(
                'fiscal_year_id',
                $yearId,
            )
                ->where('office_id', $officeId)
                ->get()
                ->map(function ($saip) use ($request) {
                    $saip->can = [
                        'viewSaip' => $request->user()->can('view', $saip),
                        'deleteSaip' => $request->user()->can('delete', $saip),
                    ];
                    return $saip;
                }),
            'currentScope' => [
                'scope' => $scope,
                'supplemental_aip_id' => $saipId ? (int) $saipId : null,
            ],

            'can' => [
                'export' => request()->user()->can('export', AipEntry::class),
                'import' => $request
                    ->user()
                    ->can('import', [AipEntry::class, []]),
                'createSaip' => $request
                    ->user()
                    ->can('create', SupplementalAip::class),
                'showSummaryAll' => $permissions->contains(
                    'aip-summary.show.all',
                ),
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

                return Ppa::whereIn('office_id', $officeIds)
                    ->where('fiscal_year_id', $yearId)
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
                        'expected_output' => '-',
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
        $user = auth()->user();
        $validated = $request->validated();
        $ppa = $aipEntry->ppa;

        if (!$ppa) {
            abort(404, 'Associated PPA not found.');
        }

        $canEdit = $user->can('update', $aipEntry);
        $canEditFunding = $user->can('editFundingSources', $aipEntry);

        $saipId = $validated['supplemental_aip_id'] ?? null;

        $detailsChanged =
            $validated['expected_output'] !== $aipEntry->expected_output ||
            $validated['start_date'] !== $aipEntry->start_date ||
            $validated['end_date'] !== $aipEntry->end_date ||
            (int) $validated['office_id'] !== $ppa->office_id;

        $fundingChanged = $this->fundingSourcesChanged(
            $validated['ppa_funding_sources'] ?? [],
            $aipEntry,
            $saipId,
        );

        if ($detailsChanged && !$canEdit) {
            abort(403, 'You do not have permission to edit AIP entry details.');
        }

        if ($fundingChanged && !$canEditFunding) {
            abort(403, 'You do not have permission to edit funding sources.');
        }

        if (!$detailsChanged && !$fundingChanged) {
            abort(403, 'No changes detected.');
        }

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

        \DB::transaction(function () use (
            $validated,
            $aipEntry,
            $ppa,
            $idsToRemove,
            $saipId,
            $canEdit,
            $canEditFunding,
        ) {
            if ($canEdit) {
                $aipEntry->update([
                    'expected_output' => $validated['expected_output'],
                    'start_date' => $validated['start_date'],
                    'end_date' => $validated['end_date'],
                ]);

                $ppa->update(['office_id' => $validated['office_id']]);
            }

            if ($canEditFunding) {
                $sourcesToRemove = $aipEntry
                    ->ppaFundingSources()
                    ->whereIn('funding_source_id', $idsToRemove);
                if ($saipId) {
                    $sourcesToRemove->where('supplemental_aip_id', $saipId);
                } else {
                    $sourcesToRemove->whereNull('supplemental_aip_id');
                }

                $ppaFundingSourceIds = $sourcesToRemove->pluck('id');

                Ppmp::whereIn(
                    'ppa_funding_source_id',
                    $ppaFundingSourceIds,
                )->delete();

                $sourcesToRemove->delete();

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
                            'ccet_adaptation' =>
                                $source['ccet_adaptation'] ?? 0,
                            'ccet_mitigation' =>
                                $source['ccet_mitigation'] ?? 0,
                            'cc_typology_id' =>
                                $source['cc_typology_id'] ?? null,
                            'is_supplemental' => (bool) $saipId,
                        ],
                    );
                }
            }
        });

        return back()->with('success', 'AIP Entry updated successfully.');
    }

    private function fundingSourcesChanged(
        array $submittedSources,
        AipEntry $aipEntry,
        $saipId,
    ): bool {
        $current = $aipEntry
            ->ppaFundingSources()
            ->when($saipId, fn($q) => $q->where('supplemental_aip_id', $saipId))
            ->when(!$saipId, fn($q) => $q->whereNull('supplemental_aip_id'))
            ->get();

        if ($current->count() !== count($submittedSources)) {
            return true;
        }

        foreach ($submittedSources as $source) {
            $match = $current->firstWhere(
                'funding_source_id',
                $source['funding_source_id'],
            );
            if (!$match) {
                return true;
            }
            if ((float) $match->ps_amount !== (float) $source['ps_amount']) {
                return true;
            }
            if (
                (float) $match->mooe_amount !== (float) $source['mooe_amount']
            ) {
                return true;
            }
            if ((float) $match->fe_amount !== (float) $source['fe_amount']) {
                return true;
            }
            if ((float) $match->co_amount !== (float) $source['co_amount']) {
                return true;
            }
            if (
                (float) $match->ccet_adaptation !==
                (float) ($source['ccet_adaptation'] ?? 0)
            ) {
                return true;
            }
            if (
                (float) $match->ccet_mitigation !==
                (float) ($source['ccet_mitigation'] ?? 0)
            ) {
                return true;
            }
            if (
                ($match->cc_typology_id ?? '') !==
                ($source['cc_typology_id'] ?? '')
            ) {
                return true;
            }
        }

        return false;
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
