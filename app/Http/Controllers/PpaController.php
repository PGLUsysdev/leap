<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePpaRequest;
use App\Http\Requests\UpdatePpaRequest;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Models\Ppa;
use App\Models\Office;
use App\Models\Sector;
use App\Models\LguLevel;
use App\Models\OfficeType;
use App\Models\FiscalYear;

class PpaController extends Controller
{
    /**
     * Get the digit length for code suffix based on PPA type.
     * Returns 0 for dynamic formatting (no padding).
     */
    private function getCodeSuffixLength(string $type): int
    {
        return match ($type) {
            'Program' => 3,
            'Project' => 2,
            'Activity' => 2,
            'Sub-Activity' => 0,
            default => 3,
        };
    }

    public function index(Request $request)
    {
        $userOfficeId = Auth::user()->office_id;
        $mode = $request->query('dialog_mode');

        return Inertia::render('ppa/index', [
            'ppaTree' => $this->getPpaQuery(
                $request,
                $userOfficeId,
                'id',
                'search',
            )
                ->paginate(100)
                ->withQueryString(),

            'current' => $request->query('id')
                ? $this->flattenAncestors(
                    Ppa::with('ancestor.ancestor')->find($request->query('id')),
                )
                : [],

            'offices' => Office::with([
                'sector',
                'lguLevel',
                'officeType',
            ])->get(),

            'filters' => $request->only([
                'id',
                'search',
                'page',
                'dialog_id',
                'dialog_search',
                'dialog_page',
                'dialog_mode',
            ]),

            'dialogPpaTree' => Inertia::lazy(function () use (
                $request,
                $userOfficeId,
                $mode,
            ) {
                if ($mode === 'import') {
                    return $this->getPreviousYearPpas($request, $userOfficeId);
                }
                return $this->getPpaQuery(
                    $request,
                    $userOfficeId,
                    'dialog_id',
                    'dialog_search',
                )
                    ->paginate(100, ['*'], 'dialog_page')
                    ->withQueryString();
            }),

            'dialogCurrent' => Inertia::lazy(function () use ($request) {
                $id = $request->query('dialog_id');
                if (!$id) {
                    return [];
                }

                $ppa = Ppa::with('ancestor.ancestor')->find($id);
                return $ppa ? $this->flattenAncestors($ppa) : [];
            }),
        ]);
    }

    private function getPpaQuery($request, $officeId, $idKey, $searchKey)
    {
        $fiscalYearId = session('active_fiscal_year_id');

        $id = $request->query($idKey);
        $search = $request->query($searchKey);

        return Ppa::where('office_id', $officeId)
            ->where('fiscal_year_id', $fiscalYearId)
            ->when(
                $id,
                function ($q) use ($id) {
                    return $q->where('parent_id', $id);
                },
                function ($q) {
                    return $q->whereNull('parent_id');
                },
            )
            ->when($search, function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner
                        ->where('name', 'like', "%$search%")
                        ->orWhere('code_suffix', 'like', "%$search%");

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
            ->orderBy('sort_order', 'asc')
            ->withCount('children');
    }

    public function getPreviousYearPpas($request, $userOfficeId)
    {
        // $userOfficeId = Auth::user()->office_id;
        $currentFiscalYearId = session('active_fiscal_year_id');

        // get previous year
        $currentYear = FiscalYear::find($currentFiscalYearId);
        $prevYear = FiscalYear::where('year', $currentYear->year - 1)->first();
        $prevYearId = $prevYear->id;

        $id = $request->query('dialog_id');
        $search = $request->query('dialog_search');

        // get ppa null first
        return Ppa::where('office_id', $userOfficeId)
            ->where('fiscal_year_id', $prevYearId)
            ->when(
                $id,
                function ($q) use ($id) {
                    return $q->where('parent_id', $id);
                },
                function ($q) {
                    return $q->whereNull('parent_id');
                },
            )
            ->when($search, function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner
                        ->where('name', 'like', "%$search%")
                        ->orWhere('code_suffix', 'like', "%$search%");

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
            ->orderBy('sort_order', 'asc')
            ->withCount('children')
            ->paginate(100, ['*'], 'dialog_page')
            ->withQueryString();
    }

    private function flattenAncestors($ppa)
    {
        $result = [];
        $current = $ppa;

        while ($current) {
            // Create a copy without the ancestor relation
            $item = $current->toArray();
            unset($item['ancestor']);
            $result[] = $item;

            // Move to the next level up
            $current = $current->ancestor;
        }

        return $result;
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
    public function store(StorePpaRequest $request)
    {
        $validated = $request->validated();
        $parentId = $validated['parent_id'] ?? null;
        $type = $validated['type'];
        $officeId = Auth::user()->office_id;
        $fiscalYearId = session('active_fiscal_year_id');

        // ONE query to get both count and max order
        $stats = Ppa::where('office_id', $officeId)
            ->where('parent_id', $parentId)
            ->where('fiscal_year_id', $fiscalYearId)
            ->selectRaw('COUNT(*) as total, MAX(sort_order) as max_sort')
            ->first();

        $siblingCount = $stats->total ?? 0;
        $maxSortOrder = $stats->max_sort ?? -1;

        $digitLength = $this->getCodeSuffixLength($type);
        $sortOrder = $maxSortOrder + 1;

        // Formatting logic
        $codeSuffix =
            $digitLength === 0
                ? (string) ($siblingCount + 1)
                : str_pad($siblingCount + 1, $digitLength, '0', STR_PAD_LEFT);

        $validated['code_suffix'] = $codeSuffix;
        $validated['sort_order'] = $sortOrder;
        $validated['fiscal_year_id'] = $fiscalYearId;
        $validated['office_id'] = $officeId;

        Ppa::create($validated);
    }

    /**
     * Display the specified resource.
     */
    public function show(Ppa $ppa)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Ppa $ppa)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePpaRequest $request, Ppa $ppa)
    {
        $validated = $request->validated();
        $ppa->update($validated);
    }

    public function move(Request $request, Ppa $ppa)
    {
        $target = Ppa::findOrFail($request->target_id);
        $direction = $request->direction;

        $officeId = $ppa->office_id;
        $fiscalYearId = $ppa->fiscal_year_id; // Scope by the record's year
        $oldParentId = $ppa->parent_id;

        $isSibling = $target->type === $ppa->type;
        $newParentId = $isSibling ? $target->parent_id : $target->id;

        DB::transaction(function () use (
            $ppa,
            $target,
            $direction,
            $isSibling,
            $oldParentId,
            $newParentId,
            $officeId,
            $fiscalYearId,
        ) {
            // 1. Move to new parent with a globally unique temp suffix
            $ppa->update([
                'parent_id' => $newParentId,
                'code_suffix' => 'MOVING_' . $ppa->id,
                'sort_order' => $isSibling
                    ? ($direction === 'top'
                        ? $target->sort_order - 0.5
                        : $target->sort_order + 0.5)
                    : ($direction === 'top'
                        ? -1
                        : 999999),
            ]);

            // 2. Re-index target folder (filtered by year)
            $this->syncSiblingIndexes(
                $newParentId,
                $officeId,
                $ppa->type,
                $fiscalYearId,
            );

            // 3. Re-index source folder (if different)
            if ($oldParentId !== $newParentId) {
                $this->syncSiblingIndexes(
                    $oldParentId,
                    $officeId,
                    $ppa->type,
                    $fiscalYearId,
                );
            }
        });

        return to_route('ppa.index', $request->query());
    }

    protected function syncSiblingIndexes(
        $parentId,
        $officeId,
        $type,
        $fiscalYearId,
    ) {
        // Filter strictly by Office AND Year AND Type
        $query = Ppa::where('office_id', $officeId)
            ->where('fiscal_year_id', $fiscalYearId)
            ->where('type', $type)
            ->orderBy('sort_order');

        if (is_null($parentId)) {
            $query->whereNull('parent_id');
        } else {
            $query->where('parent_id', $parentId);
        }

        $siblings = $query->get();

        // Pass 1: Set temporary values to avoid collision with other years/items
        foreach ($siblings as $sibling) {
            $sibling->update(['code_suffix' => 'TEMP_' . $sibling->id]);
        }

        // Pass 2: Final sequential numbering (01, 02, 03...)
        foreach ($siblings as $index => $sibling) {
            $newPos = $index + 1;
            $sibling->update([
                'sort_order' => (float) $newPos,
                'code_suffix' => str_pad($newPos, 3, '0', STR_PAD_LEFT),
            ]);
        }
    }

    private function isParentLevel($typeA, $typeB)
    {
        return match ($typeB) {
            'Project' => $typeA === 'Program',
            'Activity' => $typeA === 'Project',
            'Sub-Activity' => $typeA === 'Activity',
            default => false,
        };
    }

    protected function isDescendantOf($target, $sourceId)
    {
        $current = $target;

        while ($current) {
            if ($current->id == $sourceId) {
                return true;
            }
            $current = $current->parent;
        }

        return false;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Ppa $ppa)
    {
        $parentId = $ppa->parent_id;
        $officeId = $ppa->office_id;
        $type = $ppa->type;
        $fiscalYearId = $ppa->fiscal_year_id;

        DB::transaction(function () use (
            $ppa,
            $parentId,
            $officeId,
            $type,
            $fiscalYearId,
        ) {
            $ppa->delete();

            // Close the gap only for this office and this year
            $this->syncSiblingIndexes(
                $parentId,
                $officeId,
                $type,
                $fiscalYearId,
            );
        });

        // return back();
    }

    private function getDescendantPpaIds($parentId)
    {
        $children = DB::table('ppas')
            ->where('parent_id', $parentId)
            ->where('office_id', Auth::user()->office_id)
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
     * Import selected PPAs from previous year to current year
     */
    public function importFromPreviousYear(Request $request)
    {
        $request->validate([
            'ppa_ids' => 'required|array',
            'ppa_ids.*' => 'integer',
        ]);

        $userOfficeId = Auth::user()->office_id;
        $currentFiscalYearId = session('active_fiscal_year_id');

        if (!$currentFiscalYearId) {
            return redirect()
                ->back()
                ->withErrors(['error' => 'No active fiscal year set']);
        }

        // Get previous fiscal year by querying the database
        $currentFiscalYear = \App\Models\FiscalYear::find($currentFiscalYearId);
        if (!$currentFiscalYear) {
            return redirect()
                ->back()
                ->withErrors(['error' => 'Current fiscal year not found']);
        }

        $previousFiscalYear = \App\Models\FiscalYear::where(
            'year',
            $currentFiscalYear->year - 1,
        )->first();

        if (!$previousFiscalYear) {
            return redirect()
                ->back()
                ->withErrors(['error' => 'Previous fiscal year not found']);
        }

        $previousFiscalYearId = $previousFiscalYear->id;
        $ppaIds = $request->input('ppa_ids');

        try {
            DB::beginTransaction();

            $importedCount = 0;
            $parentIdMap = []; // Maps old parent IDs to new parent IDs

            // First, get all original PPAs and sort them to ensure parents come first
            $originalPpas = Ppa::whereIn('id', $ppaIds)
                ->where('fiscal_year_id', $previousFiscalYearId)
                ->where('office_id', $userOfficeId)
                ->orderByRaw('CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END') // Parents first
                ->orderBy('sort_order')
                ->get();

            foreach ($originalPpas as $originalPpa) {
                // Determine the correct parent_id for the new PPA
                $newParentId = null;
                if ($originalPpa->parent_id) {
                    // Check if the parent was also selected for import
                    if (isset($parentIdMap[$originalPpa->parent_id])) {
                        $newParentId = $parentIdMap[$originalPpa->parent_id];
                    }
                    // For now, if parent wasn't selected for import, we'll make this a root-level PPA
                    // In a future implementation, you could add logic to find matching parents by name/type/code
                }

                // Create new PPA as copy of original
                $newPpa = $originalPpa->replicate();
                $newPpa->fiscal_year_id = $currentFiscalYearId;
                $newPpa->parent_id = $newParentId; // Set the correct parent

                // Calculate proper sort_order and code_suffix like in add/move functionality
                $stats = Ppa::where('office_id', $userOfficeId)
                    ->where('parent_id', $newParentId)
                    ->where('fiscal_year_id', $currentFiscalYearId)
                    ->selectRaw(
                        'COUNT(*) as total, MAX(sort_order) as max_sort',
                    )
                    ->first();

                $siblingCount = $stats->total ?? 0;
                $maxSortOrder = $stats->max_sort ?? -1;

                $digitLength = $this->getCodeSuffixLength($newPpa->type);
                $sortOrder = $maxSortOrder + 1;

                // Formatting logic for code suffix
                $codeSuffix =
                    $digitLength === 0
                        ? (string) ($siblingCount + 1)
                        : str_pad(
                            $siblingCount + 1,
                            $digitLength,
                            '0',
                            STR_PAD_LEFT,
                        );

                $newPpa->sort_order = $sortOrder;
                $newPpa->code_suffix = $codeSuffix;
                $newPpa->save();

                // Map the old ID to the new ID for child PPAs
                $parentIdMap[$originalPpa->id] = $newPpa->id;

                $importedCount++;
            }

            DB::commit();

            return redirect()
                ->back()
                ->with(
                    'success',
                    "Successfully imported {$importedCount} PPAs.",
                );
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()
                ->back()
                ->withErrors([
                    'error' => 'Error importing PPAs: ' . $e->getMessage(),
                ]);
        }
    }

    /**
     * Get breadcrumbs for PPA navigation
     */
    // private function getPpaBreadcrumbs($ppaId, $fiscalYearId = null)
    // {
    //     $query = Ppa::with('parent.parent');

    //     if ($fiscalYearId) {
    //         $query->where('fiscal_year_id', $fiscalYearId);
    //     }

    //     $ppa = $query->find($ppaId);

    //     if (!$ppa) {
    //         return [];
    //     }

    //     $breadcrumbs = [];
    //     $current = $ppa;

    //     while ($current) {
    //         array_unshift($breadcrumbs, [
    //             'id' => $current->id,
    //             'name' => $current->name,
    //         ]);
    //         $current = $current->parent;
    //     }

    //     return $breadcrumbs;
    // }
}
