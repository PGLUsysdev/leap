<?php

namespace App\Http\Controllers;

use App\Models\AipEntry;
use App\Models\FundingSource;
use App\Models\Aip;
use App\Models\FiscalYear;
use App\Models\Ppa;
use App\Http\Requests\StoreAipEntryRequest;
use App\Http\Requests\UpdateAipEntryRequest;
use App\Models\ChartOfAccount;
use App\Models\Office;
use App\Models\PpmpPriceList;
use App\Models\Ppmp;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Request;

class AipEntryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, FiscalYear $fiscalYear)
    {
        $officeId = auth()->user()->office_id;
        $yearId = $fiscalYear->id;

        $officeIds = $this->getOfficeHierarchyIds($officeId);

        $yearFilter = fn($q) => $q->where('fiscal_year_id', $yearId);
        $hasAipFilter = fn($q) => $q->whereHas('aipEntries', $yearFilter);

        // 1. Fetch AIP Entries (Main Table)
        $aipEntries = Ppa::whereIn('office_id', $officeIds)
            ->whereNull('parent_id')
            ->whereHas('aipEntries', $yearFilter)
            ->orderBy('sort_order')
            ->with([
                'aipEntries' => function ($query) use ($yearFilter) {
                    $yearFilter($query);
                    $query->with('ppaFundingSources.fundingSource');
                },
                'office.sector',
                'office.lguLevel',
                'office.officeType',
                'office.parent',
                'children' => fn($q) => $hasAipFilter($q)->orderBy(
                    'sort_order',
                ),
                'children.aipEntries' => function ($query) use ($yearFilter) {
                    $yearFilter($query);
                    $query->with('ppaFundingSources.fundingSource');
                },
                'children.office.sector',
                'children.office.lguLevel',
                'children.office.officeType',
                'children.office.parent',
                'children.children' => fn($q) => $hasAipFilter($q)->orderBy(
                    'sort_order',
                ),
                'children.children.aipEntries' => function ($query) use (
                    $yearFilter,
                ) {
                    $yearFilter($query);
                    $query->with('ppaFundingSources.fundingSource');
                },
                'children.children.office.sector',
                'children.children.office.lguLevel',
                'children.children.office.officeType',
                'children.children.office.parent',
                'children.children.children' => fn($q) => $hasAipFilter(
                    $q,
                )->orderBy('sort_order'),
                'children.children.children.aipEntries' => function (
                    $query,
                ) use ($yearFilter) {
                    $yearFilter($query);
                    $query->with('ppaFundingSources.fundingSource');
                },
                'children.children.children.office.sector',
                'children.children.children.office.lguLevel',
                'children.children.children.office.officeType',
                'children.children.children.office.parent',
            ])
            ->get();

        $offices = Office::all();

        // 2. Library Selector Logic
        $libId = $request->query('lib_id');
        $libSearch = $request->query('lib_search');
        $libBoundaryId = $request->query('lib_boundary_id');

        $targetParentId = $libId ?: $libBoundaryId;

        $masterPpas = Ppa::whereIn('office_id', $officeIds)
            ->where('fiscal_year_id', $yearId)
            ->where('parent_id', $targetParentId)
            ->when($libSearch, function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    // Use 'code_suffix' as it is the actual database column
                    $inner
                        ->where('name', 'like', "%$search%")
                        ->orWhere('code_suffix', 'like', "%$search%");

                    // If searching for a full code like "100-01-001", extract the last part
                    if (str_contains($search, '-')) {
                        $segments = explode('-', $search);
                        $lastSegment = end($segments);
                        if ($lastSegment) {
                            $inner->orWhere(
                                'code_suffix',
                                'like',
                                "%$lastSegment%",
                            );
                        }
                    }
                });
            })
            ->orderBy('sort_order')
            ->paginate(50, ['*'], 'lib_page')
            ->withQueryString();

        // 3. Library Breadcrumbs
        $libCurrent = $targetParentId
            ? $this->getPpaBreadcrumbs($targetParentId)
            : [];

        return Inertia::render('aip-summary/index', [
            'fiscalYear' => $fiscalYear,
            'aipEntries' => $aipEntries,
            'fundingSources' => FundingSource::all(),
            'offices' => $offices,
            'masterPpas' => $masterPpas,
            'libCurrent' => $libCurrent,
            'filters' => $request->all(),
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
            ->map(function ($ppaId) use ($fiscal_year_id) {
                return [
                    'fiscal_year_id' => $fiscal_year_id,
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
                // Use -> to access the id property of the fiscalYear object
                AipEntry::firstOrCreate(
                    [
                        'ppa_id' => $ppaId,
                        'fiscal_year_id' => $fiscalYear->id, // Fixed here
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

        // 1. Get the PPA associated with this entry
        $ppa = $aipEntry->ppa;

        if (!$ppa) {
            abort(404, 'Associated PPA not found.');
        }

        // 2. Identify removed funding sources (Using CamelCase method with parentheses)
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

        // 3. PPMP Usage Check
        if (!empty($idsToRemove)) {
            $isUsedInPpmp = \App\Models\Ppmp::where(
                'aip_entry_id',
                $aipEntry->id,
            )
                ->whereIn('funding_source_id', $idsToRemove)
                ->exists();

            if ($isUsedInPpmp) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'ppa_funding_sources' =>
                        'Cannot remove a funding source that is already being used by PPMP items for this project.',
                ]);
            }
        }

        // 4. Execute Update Transaction
        \DB::transaction(function () use ($validated, $aipEntry, $ppa) {
            // Update AIP Entry Metadata
            $aipEntry->update([
                'expected_output' => $validated['expected_output'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
            ]);

            // Update PPA Office (Since you made it editable)
            $ppa->update([
                'office_id' => $validated['office_id'],
            ]);

            // Sync PPA Funding Sources: Delete old, Create new
            $aipEntry->ppaFundingSources()->delete();

            foreach ($validated['ppa_funding_sources'] as $source) {
                $aipEntry->ppaFundingSources()->create([
                    'funding_source_id' => $source['funding_source_id'],
                    'ps_amount' => $source['ps_amount'],
                    'mooe_amount' => $source['mooe_amount'],
                    'fe_amount' => $source['fe_amount'],
                    'co_amount' => $source['co_amount'],
                    'ccet_adaptation' => $source['ccet_adaptation'] ?? 0,
                    'ccet_mitigation' => $source['ccet_mitigation'] ?? 0,
                    // 'cc_typology_code' => $source['cc_typology_code'] ?? null,
                ]);
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

            // Capture the context of the deletion
            $fiscalYearId = $aipEntry->fiscal_year_id;
            $targetPpaId = $aipEntry->ppa_id;

            // 1. Get all child PPA IDs recursively from the library
            // This ensures if we remove a "Program", all its "Activities" are also removed from this AIP year
            $ppaIdsToRemoveFromAip = array_merge(
                [$targetPpaId],
                $this->getDescendantPpaIds($targetPpaId),
            );

            // 2. Identify all AIP Entry IDs for these PPAs within this specific Fiscal Year
            $aipEntryIdsToDelete = AipEntry::where(
                'fiscal_year_id',
                $fiscalYearId,
            )
                ->whereIn('ppa_id', $ppaIdsToRemoveFromAip)
                ->pluck('id')
                ->toArray();

            if (!empty($aipEntryIdsToDelete)) {
                // 3. Delete dependent PPMP records first to satisfy foreign key constraints
                \App\Models\Ppmp::whereIn(
                    'aip_entry_id',
                    $aipEntryIdsToDelete,
                )->delete();

                // 2. NEW: Delete Funding Sources records
                // This is the missing piece causing your SQLSTATE[23000] error
                DB::table('ppa_funding_sources')
                    ->whereIn('aip_entry_id', $aipEntryIdsToDelete)
                    ->delete();

                // 4. Delete the AIP entries themselves
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
                'error' => 'Failed to remove entry: ' . $e->getMessage(),
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
