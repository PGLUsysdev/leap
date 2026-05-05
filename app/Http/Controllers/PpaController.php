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

        // 1. Handle Main Table Data
        $ppa = $this->getPpaQuery($request, $userOfficeId, 'id', 'search')
            ->paginate(50)
            ->withQueryString();

        // 2. Handle Ancestors / Breadcrumbs for MAIN TABLE
        $parentId = $request->query('id');
        $current = $parentId
            ? Ppa::with('ancestor.ancestor')->find($parentId)
            : null;
        $flatCurrent = $current ? $this->flattenAncestors($current) : [];

        return Inertia::render('ppa/index', [
            'ppaTree' => $ppa,
            'offices' => Office::with([
                'sector',
                'lguLevel',
                'officeType',
            ])->get(),
            'current' => $flatCurrent,

            // 3. Centralized Filters (Helpful for the frontend to know all states)
            'filters' => [
                'search' => $request->query('search'),
                'id' => $request->query('id'),
                'page' => $request->query('page', 1),
                'move_id' => $request->query('move_id'),
                'move_search' => $request->query('move_search'),
                'move_page' => $request->query('move_page', 1),
            ],

            // 4. LAZY LOADING FOR THE MODAL
            'movePpaTree' => Inertia::lazy(
                fn() => $this->getPpaQuery(
                    $request,
                    $userOfficeId,
                    'move_id',
                    'move_search',
                )
                    ->paginate(50, ['*'], 'move_page')
                    ->withQueryString(),
            ),

            // 5. Breadcrumbs for the MODAL (also lazy)
            'moveCurrent' => Inertia::lazy(function () use ($request) {
                $moveId = $request->query('move_id');
                if (!$moveId) {
                    return [];
                }
                $movePpa = Ppa::with('ancestor.ancestor')->find($moveId);
                return $movePpa ? $this->flattenAncestors($movePpa) : [];
            }),
        ]);
    }

    private function getPpaQuery($request, $officeId, $idKey, $searchKey)
    {
        $id = $request->query($idKey);
        $search = $request->query($searchKey);
        $fiscalYearId = session('active_fiscal_year_id');

        return Ppa::where('office_id', $officeId)
            ->where('fiscal_year_id', $fiscalYearId)
            ->withCount('children')
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
            ->orderBy('sort_order', 'asc');
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
        $request->validate([
            'target_id' => 'required|exists:ppas,id',
            'direction' => 'required|in:top,bottom',
        ]);

        $target = Ppa::findOrFail($request->target_id);
        $direction = $request->direction;
        $oldParentId = $ppa->parent_id;

        // 1. Hierarchy Validation: Prevent illegal structures
        $isParentTarget = $this->isParentLevel($target->type, $ppa->type);
        $isSiblingTarget = $target->type === $ppa->type;

        if (!$isParentTarget && !$isSiblingTarget) {
            return back()->withErrors([
                'move' => "A {$ppa->type} cannot be placed there.",
            ]);
        }

        // 2. Cycle Detection: Can't move a folder into its own sub-folder
        if ($this->isDescendantOf($target, $ppa->id)) {
            return back()->withErrors([
                'move' => 'Cannot move a folder into its own sub-folder.',
            ]);
        }

        DB::transaction(function () use (
            $ppa,
            $target,
            $direction,
            $oldParentId,
            $isParentTarget,
        ) {
            // MODE A: Into a Parent
            if ($isParentTarget) {
                $ppa->parent_id = $target->id;
                $ppa->sort_order = $direction === 'top' ? -1 : 999999;
            }
            // MODE B: Relative to a Sibling
            else {
                $ppa->parent_id = $target->parent_id;
                $ppa->sort_order =
                    $direction === 'top'
                        ? $target->sort_order - 0.5
                        : $target->sort_order + 0.5;
            }

            $ppa->save();

            // 3. Re-index OLD home
            $this->syncSiblingIndexes($oldParentId, $ppa->office_id);

            // 4. Re-index NEW home (if different)
            if ($oldParentId !== $ppa->parent_id) {
                $this->syncSiblingIndexes($ppa->parent_id, $ppa->office_id);
            }
        });

        return redirect()->back();
    }

    private function syncSiblingIndexes($parentId, $officeId)
    {
        $fiscalYearId = session('active_fiscal_year_id');

        // Handle both Root (null) and Child groups
        $query = Ppa::where('office_id', $officeId)
            ->where('fiscal_year_id', $fiscalYearId)
            ->orderBy('sort_order', 'asc');

        if ($parentId === null) {
            $query->whereNull('parent_id');
        } else {
            $query->where('parent_id', $parentId);
        }

        $siblings = $query->get();

        // STEP 1: Temporary suffixes to avoid Unique Constraint violations
        foreach ($siblings as $sibling) {
            $tempSuffix = 't' . $sibling->id; // Use ID to ensure uniqueness
            $sibling->update(['code_suffix' => $tempSuffix]);
        }

        // STEP 2: Assign final sort_order and code_suffix
        foreach ($siblings as $index => $sibling) {
            $digitLength = $this->getCodeSuffixLength($sibling->type);

            $newSuffix =
                $digitLength === 0
                    ? (string) ($index + 1)
                    : str_pad($index + 1, $digitLength, '0', STR_PAD_LEFT);

            $sibling->update([
                'sort_order' => $index,
                'code_suffix' => $newSuffix,
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

    private function isDescendantOf($target, $movingId)
    {
        $current = $target;
        while ($current) {
            if ($current->id == $movingId) {
                return true;
            }
            $current = $current->ancestor; // Requires 'ancestor' relationship in Model
        }
        return false;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Ppa $ppa)
    {
        // 1. Identify the branch
        $descendantIds = $this->getDescendantPpaIds($ppa->id);
        $allBranchIds = array_merge([$ppa->id], $descendantIds);

        // 2. CHECK: Is ANY part of this branch used in the AIP Summary?
        $usedInAip = \App\Models\AipEntry::whereIn(
            'ppa_id',
            $allBranchIds,
        )->exists();

        if ($usedInAip) {
            return redirect()
                ->back()
                ->withErrors([
                    'error' =>
                        'Cannot delete: This entry (or one of its sub-items) is currently used in an AIP Summary.',
                ]);
        }

        $parentId = $ppa->parent_id;
        $officeId = $ppa->office_id;
        // $deletedSortOrder = $ppa->sort_order;

        try {
            DB::beginTransaction();

            // 3. Delete the PPA
            $ppa->delete();

            $this->syncSiblingIndexes($parentId, $officeId);

            // // 4. RE-SEQUENCE SIBLINGS
            // $siblings = Ppa::where('parent_id', $parentId)
            //     ->where('office_id', $officeId)
            //     ->where('sort_order', '>', $deletedSortOrder)
            //     ->orderBy('sort_order', 'asc')
            //     ->get();

            // foreach ($siblings as $sibling) {
            //     // newOrder is for the Database (0, 1, 2...)
            //     $newOrder = (int) $sibling->sort_order - 1;

            //     // namingIndex is for the Code Suffix (1, 2, 3...)
            //     // This prevents the "000" issue.
            //     $namingIndex = $newOrder + 1;

            //     $digitLength = $this->getCodeSuffixLength($sibling->type);

            //     $newSuffix =
            //         $digitLength === 0
            //             ? (string) $namingIndex
            //             : str_pad(
            //                 $namingIndex,
            //                 $digitLength,
            //                 '0',
            //                 STR_PAD_LEFT,
            //             );

            //     // Force update to DB
            //     DB::table('ppas')
            //         ->where('id', $sibling->id)
            //         ->update([
            //             'sort_order' => $newOrder,
            //             'code_suffix' => $newSuffix,
            //             'updated_at' => now(),
            //         ]);
            // }

            DB::commit();

            return redirect()->back()->with('success', 'Entry removed.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()
                ->back()
                ->withErrors(['error' => $e->getMessage()]);
        }
    }

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
     * Get PPAs from previous fiscal year for import functionality
     */
    public function getPreviousYearPpas(Request $request)
    {
        try {
            $userOfficeId = Auth::user()->office_id;
            $currentFiscalYearId = session('active_fiscal_year_id');

            if (!$currentFiscalYearId) {
                return response()->json(
                    [
                        'error' => 'No active fiscal year set',
                    ],
                    400,
                );
            }

            // Get previous fiscal year by querying the database
            $currentFiscalYear = \App\Models\FiscalYear::find(
                $currentFiscalYearId,
            );
            if (!$currentFiscalYear) {
                return response()->json(
                    [
                        'error' => 'Current fiscal year not found',
                    ],
                    400,
                );
            }

            $previousFiscalYear = \App\Models\FiscalYear::where(
                'year',
                $currentFiscalYear->year - 1,
            )->first();
            if (!$previousFiscalYear) {
                return response()->json(
                    [
                        'error' => 'Previous fiscal year not found',
                    ],
                    400,
                );
            }

            $previousFiscalYearId = $previousFiscalYear->id;

            // Import dialog parameters
            $libId = $request->query('lib_id');
            $libSearch = $request->query('lib_search');
            $libBoundaryId = $request->query('lib_boundary_id');

            // Handle null/undefined values properly
            $targetParentId = null;
            if ($libId && $libId !== 'undefined') {
                $targetParentId = $libId;
            } elseif ($libBoundaryId && $libBoundaryId !== 'undefined') {
                $targetParentId = $libBoundaryId;
            }

            // For now, return empty existing PPA IDs since we don't have original_id field
            $existingPpaIds = [];

            // Build the query for previous year's PPAs
            $query = Ppa::where('office_id', $userOfficeId)->where(
                'fiscal_year_id',
                $previousFiscalYearId,
            );

            // Only add parent_id condition if we have a valid target
            if ($targetParentId !== null) {
                $query->where('parent_id', $targetParentId);
            } else {
                $query->whereNull('parent_id'); // Root level
            }

            // Add search condition if provided
            if (
                $libSearch &&
                $libSearch !== 'undefined' &&
                !empty($libSearch)
            ) {
                $query->where(function ($inner) use ($libSearch) {
                    $inner
                        ->where('name', 'like', "%$libSearch%")
                        ->orWhere('code_suffix', 'like', "%$libSearch%");

                    if (str_contains($libSearch, '-')) {
                        $segments = explode('-', $libSearch);
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
            }

            $previousYearPpas = $query
                ->withCount('children')
                ->orderBy('sort_order')
                ->paginate(50, ['*'], 'lib_page')
                ->withQueryString();

            // Get breadcrumbs for navigation
            $libCurrent = $targetParentId
                ? $this->getPpaBreadcrumbs(
                    $targetParentId,
                    $previousFiscalYearId,
                )
                : [];

            return response()->json([
                'previousYearPpas' => $previousYearPpas,
                'libCurrent' => $libCurrent,
                'existingPpaIds' => $existingPpaIds,
                'previousFiscalYearId' => $previousFiscalYearId,
            ]);
        } catch (\Exception $e) {
            return response()->json(
                [
                    'error' =>
                        'Failed to fetch previous year PPAs: ' .
                        $e->getMessage(),
                ],
                500,
            );
        }
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
            return response()->json(
                [
                    'success' => false,
                    'message' => 'No active fiscal year set',
                ],
                400,
            );
        }

        // Get previous fiscal year by querying the database
        $currentFiscalYear = \App\Models\FiscalYear::find($currentFiscalYearId);
        if (!$currentFiscalYear) {
            return response()->json(
                [
                    'success' => false,
                    'message' => 'Current fiscal year not found',
                ],
                400,
            );
        }

        $previousFiscalYear = \App\Models\FiscalYear::where(
            'year',
            $currentFiscalYear->year - 1,
        )->first();
        if (!$previousFiscalYear) {
            return response()->json(
                [
                    'success' => false,
                    'message' => 'Previous fiscal year not found',
                ],
                400,
            );
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
                ->with('error', 'Error importing PPAs: ' . $e->getMessage());
        }
    }

    /**
     * Get breadcrumbs for PPA navigation
     */
    private function getPpaBreadcrumbs($ppaId, $fiscalYearId = null)
    {
        $query = Ppa::with('parent.parent');

        if ($fiscalYearId) {
            $query->where('fiscal_year_id', $fiscalYearId);
        }

        $ppa = $query->find($ppaId);

        if (!$ppa) {
            return [];
        }

        $breadcrumbs = [];
        $current = $ppa;

        while ($current) {
            array_unshift($breadcrumbs, [
                'id' => $current->id,
                'name' => $current->name,
            ]);
            $current = $current->parent;
        }

        return $breadcrumbs;
    }
}
