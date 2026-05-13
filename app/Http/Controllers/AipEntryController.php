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
        $officeId = auth()->user()->office_id;
        $officeIds = $this->getOfficeHierarchyIds($officeId);

        $yearId = $fiscalYear->id;

        $onlyAipItems = function ($query) use ($yearId) {
            $query
                ->where('fiscal_year_id', $yearId)
                ->whereHas('aipEntries')
                ->orderBy('sort_order');
        };

        $aipEntries = Ppa::whereIn('office_id', $officeIds)
            ->whereNull('parent_id')
            ->where('fiscal_year_id', $yearId)
            ->has('aipEntries')
            ->orderBy('sort_order')
            ->with([
                'office',
                'aipEntries.ppaFundingSources.fundingSource',

                'children' => $onlyAipItems,
                'children.office',
                'children.aipEntries.ppaFundingSources.fundingSource',

                'children.children' => $onlyAipItems,
                'children.children.office',
                'children.children.aipEntries.ppaFundingSources.fundingSource',

                'children.children.children' => $onlyAipItems,
                'children.children.children.office',
                'children.children.children.aipEntries.ppaFundingSources.fundingSource',
            ])
            ->get();

        return Inertia::render('aip-summary/index', [
            'fiscalYear' => $fiscalYear,
            'aipEntries' => $aipEntries,
            'fundingSources' => FundingSource::all(),
            'offices' => Office::all(),
            'filters' => $request->all(),

            'dialogPpaTree' => Inertia::lazy(function () use (
                $request,
                $officeIds,
                $yearId,
            ) {
                $id = $request->query('dialog_id');
                $search = $request->query('dialog_search');
                $boundaryId = $request->query('dialog_boundary_id');

                $targetParentId = $id ?: $boundaryId;

                return Ppa::whereIn('office_id', $officeIds)
                    ->where('fiscal_year_id', $yearId)
                    ->where('parent_id', $targetParentId)
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
        ]);

        DB::transaction(function () use ($validated, $fiscalYear) {
            foreach ($validated['ppa_ids'] as $ppaId) {
                AipEntry::firstOrCreate(
                    [
                        'ppa_id' => $ppaId,
                    ],
                    [
                        'start_date' => $fiscalYear->year . '-01-01',
                        'end_date' => $fiscalYear->year . '-12-31',
                        'expected_output' => 'To be defined.',
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
        $validated = $request->validated();
        $ppa = $aipEntry->ppa;

        if (!$ppa) {
            abort(404, 'Associated PPA not found.');
        }

        $currentFundingSourceIds = $aipEntry
            ->ppaFundingSources()
            ->pluck('funding_source_id')
            ->toArray();

        $newFundingSourceIds = collect($validated['ppa_funding_sources'])
            ->pluck('funding_source_id')
            ->toArray();

        $idsToRemove = array_diff(
            $currentFundingSourceIds,
            $newFundingSourceIds,
        );

        if (!empty($idsToRemove)) {
            $isUsedInPpmp = Ppmp::whereHas('ppaFundingSource', function (
                $query,
            ) use ($aipEntry, $idsToRemove) {
                $query
                    ->where('aip_entry_id', $aipEntry->id)
                    ->whereIn('funding_source_id', $idsToRemove);
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
        ) {
            $aipEntry->update([
                'expected_output' => $validated['expected_output'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
            ]);

            $ppa->update(['office_id' => $validated['office_id']]);

            // Remove only the ones that aren't in the new list (and passed the usage check)
            $aipEntry
                ->ppaFundingSources()
                ->whereIn('funding_source_id', $idsToRemove)
                ->delete();

            // Update existing or create new ones
            foreach ($validated['ppa_funding_sources'] as $source) {
                $aipEntry->ppaFundingSources()->updateOrCreate(
                    ['funding_source_id' => $source['funding_source_id']], // Match on this
                    [
                        'ps_amount' => $source['ps_amount'],
                        'mooe_amount' => $source['mooe_amount'],
                        'fe_amount' => $source['fe_amount'],
                        'co_amount' => $source['co_amount'],
                        'ccet_adaptation' => $source['ccet_adaptation'] ?? 0,
                        'ccet_mitigation' => $source['ccet_mitigation'] ?? 0,
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

    /**
     * Get all office IDs in the user's office hierarchy (user's office + all child offices).
     */
    private function getOfficeHierarchyIds($officeId)
    {
        // Start with the user's office
        $officeIds = [$officeId];

        // Get all child offices recursively
        $childOfficeIds = $this->getChildOfficeIds($officeId);
        $officeIds = array_merge($officeIds, $childOfficeIds);

        return $officeIds;
    }

    /**
     * Recursively find all child office IDs.
     */
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
