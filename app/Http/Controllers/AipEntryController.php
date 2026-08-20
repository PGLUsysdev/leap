<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAipEntryRequest;
use App\Http\Requests\UpdateAipEntryRequest;
use App\Models\AipEntry;
use App\Models\CcTypology;
use App\Models\ChartOfAccount;
use App\Models\FiscalYear;
use App\Models\FundingSource;
use App\Models\Office;
use App\Models\Ppa;
use App\Models\Ppmp;
use App\Models\PpmpCategory;
use App\Models\PpmpPriceList;
use App\Models\PsBreakdownItem;
use App\Models\SupplementalAip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AipEntryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, FiscalYear $fiscalYear)
    {
        // Gate::authorize('viewAny', AipEntry::class);

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

        $newAipEntries = AipEntry::whereHas('ppa', function ($query) use (
            $fiscalYear,
            $officeIds,
        ) {
            $query
                ->where('fiscal_year_id', $fiscalYear->id)
                ->whereIn('office_id', $officeIds);
        })
            ->select([
                'id',
                'ppa_id',
                'start_date',
                'end_date',
                'expected_output',
                'supplemental_aip_id',
                'is_supplemental',
                // 'created_at',
                // 'updated_at',
            ])
            ->with(
                'ppa:id,office_id,parent_id,name,type,code_suffix,is_active,sort_order,fiscal_year_id,supplemental_aip_id,is_supplemental,is_ps_pool',
                // 'ppa.office:id,sector_id,lgu_level_id,office_type_id,parent_id,code,name,acronym,is_lee',
                'ppa.office:id,sector_id,lgu_level_id,office_type_id,parent_id,code,name,acronym,is_lee',
                'ppa.office.sector:id,code',
                'ppa.office.lguLevel:id,code',
                'ppa.office.officeType:id,code',
                // 'ppaFundingSources:id,aip_entry_id,funding_source_id,ps_amount,mooe_amount,fe_amount,co_amount,ccet_adaptation,ccet_mitigation,supplemental_aip_id,is_supplemental,cc_typology_id',
                'ppaFundingSources:id,aip_entry_id,funding_source_id,ps_amount,mooe_amount,fe_amount,co_amount,ccet_adaptation,ccet_mitigation,supplemental_aip_id,is_supplemental,cc_typology_id',
                // 'ppaFundingSources.fundingSource:id,fund_type,code,title,description',
                'ppaFundingSources.fundingSource:id,code,title',
                // 'ppaFundingSources.ccTypology:id,code,description,response_type,strategic_priority_id,sub_sector_id,category_code,item_num,id_nccap_activity',
                'ppaFundingSources.ccTypology:id,code',
            )
            // ->limit(100)
            ->get();

        // Attach per-entry permissions so the AIP entry form dialog can
        // enable/disable its controls based on the user's rights.
        $newAipEntries->each(function ($entry) {
            if (!$entry->ppa) {
                return;
            }

            $entry->ppa->can = [
                // 'import' => true,
                // 'edit' => true,
                // 'delete' => true,
                // 'editFundingSources' => true,
                // 'viewPpmp' => true,
                // 'viewPsBreakdown' => true,
                'import' => request()
                    ->user()
                    ->can('import', [AipEntry::class, [$entry->ppa_id]]),
                'edit' => request()->user()->can('update', $entry),
                'delete' => request()->user()->can('delete', $entry),
                'editFundingSources' => request()
                    ->user()
                    ->can('editFundingSources', $entry),
                'viewPpmp' => request()
                    ->user()
                    ->can('viewAny', [Ppmp::class, $entry]),
                'viewPsBreakdown' => request()
                    ->user()
                    ->can('viewAny', PsBreakdownItem::class),
            ];
        });

        return Inertia::render('aip-summary/index', [
            'fiscalYear' => $fiscalYear,
            // 'psPoolPpaId' => $psPoolPpa?->id,
            // 'aipEntries' => $aipEntries,
            'newAipEntries' => $newAipEntries,
            // 'ppmpCoaTotals' => $ppmpCoaTotals,
            // 'psCoaAutoTotals' => $officeId
            //     ? PsBreakdownController::computePsCoaTotalsForOffice(
            //         $officeId,
            //         $yearId,
            //     )
            //     : [],
            'fundingSources' => Inertia::defer(
                fn() => FundingSource::all(),
            )->once(),
            'chartOfAccounts' => Inertia::defer(
                fn() => ChartOfAccount::select(
                    'id',
                    'account_number',
                    'account_title',
                    'expense_class',
                )
                    ->orderBy('account_number')
                    ->get(),
            ),
            'priceLists' => Inertia::defer(
                fn() => PpmpPriceList::with([
                    'chartOfAccountPpmpCategory.chartOfAccount',
                    'chartOfAccountPpmpCategory.ppmpCategory',
                ])
                    ->orderBy('sort_order', 'asc')
                    ->get(),
            ),
            'ppmpCategories' => Inertia::defer(
                fn() => PpmpCategory::with([
                    'chartOfAccountPpmpCategories.chartOfAccount',
                ])->get(),
            ),
            'ccTypologies' => Inertia::defer(
                fn() => CcTypology::select(
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
            ),
            'offices' => Inertia::defer(fn() => Office::all())->once(),
            'filters' => $request->all(),
            // 'supplementalAips' => \App\Models\SupplementalAip::where(
            //     'fiscal_year_id',
            //     $yearId,
            // )
            //     ->where('office_id', $officeId)
            //     ->get()
            //     ->map(function ($saip) use ($request) {
            //         $saip->can = [
            //             'viewSaip' => $request->user()->can('view', $saip),
            //             'deleteSaip' => $request->user()->can('delete', $saip),
            //         ];
            //         return $saip;
            //     }),
            // 'currentScope' => [
            //     'scope' => $scope,
            //     'supplemental_aip_id' => $saipId ? (int) $saipId : null,
            // ],
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
                'setPsPool' => request()
                    ->user()
                    ->can('setPsPool', AipEntry::class),
                'delete' => $permissions->contains('aip-summary.delete'),
            ],
            'dialogPpaTree' => Inertia::optional(function () use (
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
            'dialogCurrent' => Inertia::optional(function () use ($request) {
                $id =
                    $request->query('dialog_id') ?:
                    $request->query('dialog_boundary_id');
                return $id ? $this->getPpaBreadcrumbs($id) : [];
            }),
            'ppaTypes' => array_keys(config('ppa.type_padding')),
            'ppaTypePadding' => config('ppa.type_padding'),
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

        Gate::authorize('import', [AipEntry::class, $validated['ppa_ids']]);

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
        $data = $request->validated();

        Log::info($data);

        $aipEntry->update([
            'office_id' => $data['officeId'] ?? null,
            'start_date' => $data['startDate'] ?? null,
            'end_date' => $data['endDate'] ?? null,
            'expected_output' => $data['expectedOutput'] ?? null,
        ]);

        // $aipEntry->update($request->validate([]));

        // ---

        // $user = auth()->user();
        // $validated = $request->validated();
        // $ppa = $aipEntry->ppa;

        // if (!$ppa) {
        //     abort(404, 'Associated PPA not found.');
        // }

        // $canEdit = $user->can('update', $aipEntry);
        // $canEditFunding = $user->can('editFundingSources', $aipEntry);

        // $saipId = $validated['supplemental_aip_id'] ?? null;

        // $detailsChanged =
        //     $validated['expected_output'] !== $aipEntry->expected_output ||
        //     $validated['start_date'] !== $aipEntry->start_date ||
        //     $validated['end_date'] !== $aipEntry->end_date ||
        //     (int) $validated['office_id'] !== $ppa->office_id;

        // $fundingChanged = $this->fundingSourcesChanged(
        //     $validated['ppa_funding_sources'] ?? [],
        //     $aipEntry,
        //     $saipId,
        // );

        // if ($detailsChanged && !$canEdit) {
        //     abort(403, 'You do not have permission to edit AIP entry details.');
        // }

        // if ($fundingChanged && !$canEditFunding) {
        //     abort(403, 'You do not have permission to edit funding sources.');
        // }

        // if (!$detailsChanged && !$fundingChanged) {
        //     abort(403, 'No changes detected.');
        // }

        // $currentFundingSourceQuery = $aipEntry->ppaFundingSources();
        // if ($saipId) {
        //     $currentFundingSourceQuery->where('supplemental_aip_id', $saipId);
        // } else {
        //     $currentFundingSourceQuery->whereNull('supplemental_aip_id');
        // }

        // $currentFundingSourceIds = $currentFundingSourceQuery
        //     ->pluck('funding_source_id')
        //     ->toArray();

        // $newFundingSourceIds = collect($validated['ppa_funding_sources'] ?? [])
        //     ->pluck('funding_source_id')
        //     ->toArray();

        // $idsToRemove = array_diff(
        //     $currentFundingSourceIds,
        //     $newFundingSourceIds,
        // );

        // \DB::transaction(function () use (
        //     $validated,
        //     $aipEntry,
        //     $ppa,
        //     $idsToRemove,
        //     $saipId,
        //     $canEdit,
        //     $canEditFunding,
        // ) {
        //     if ($canEdit) {
        //         $aipEntry->update([
        //             'expected_output' => $validated['expected_output'],
        //             'start_date' => $validated['start_date'],
        //             'end_date' => $validated['end_date'],
        //         ]);

        //         $ppa->update(['office_id' => $validated['office_id']]);
        //     }

        //     if ($canEditFunding) {
        //         $sourcesToRemove = $aipEntry
        //             ->ppaFundingSources()
        //             ->whereIn('funding_source_id', $idsToRemove);
        //         if ($saipId) {
        //             $sourcesToRemove->where('supplemental_aip_id', $saipId);
        //         } else {
        //             $sourcesToRemove->whereNull('supplemental_aip_id');
        //         }

        //         $ppaFundingSourceIds = $sourcesToRemove->pluck('id');

        //         Ppmp::whereIn(
        //             'ppa_funding_source_id',
        //             $ppaFundingSourceIds,
        //         )->delete();

        //         $sourcesToRemove->delete();

        //         foreach ($validated['ppa_funding_sources'] ?? [] as $source) {
        //             $aipEntry->ppaFundingSources()->updateOrCreate(
        //                 [
        //                     'funding_source_id' => $source['funding_source_id'],
        //                     'supplemental_aip_id' => $saipId ?: null,
        //                 ],
        //                 [
        //                     'ps_amount' => $source['ps_amount'],
        //                     'mooe_amount' => $source['mooe_amount'],
        //                     'fe_amount' => $source['fe_amount'],
        //                     'co_amount' => $source['co_amount'],
        //                     'ccet_adaptation' =>
        //                         $source['ccet_adaptation'] ?? 0,
        //                     'ccet_mitigation' =>
        //                         $source['ccet_mitigation'] ?? 0,
        //                     'cc_typology_id' =>
        //                         $source['cc_typology_id'] ?? null,
        //                     'is_supplemental' => (bool) $saipId,
        //                 ],
        //             );
        //         }
        //     }
        // });

        // // PS Pool sync: if this PPA is the PS pool, auto-calculate ps_amount
        // // onto the GF Proper funding source (id=1), creating it if needed.
        // if ($ppa->is_ps_pool && $canEditFunding) {
        //     PsBreakdownController::syncPoolPsAmount($aipEntry, $saipId);
        // }

        // // return back()->with('success', 'AIP Entry updated successfully.');
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
            ->get()
            ->filter(fn($source) => $source->funding_source_id !== null)
            ->values();

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
        Gate::authorize('delete', $aipEntry);

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
