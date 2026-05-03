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

        return Ppa::where('office_id', $officeId)
            ->when(
                $id,
                fn($q) => $q->where('parent_id', $id),
                fn($q) => $q->whereNull('parent_id'),
            )
            ->when($search, function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner
                        ->where('name', 'like', "%$search%")
                        ->orWhere('code_suffix', 'like', "%$search%");

                    if (str_contains($search, '-')) {
                        $lastSegment = end(explode('-', $search));
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

        // ONE query to get both count and max order
        $stats = Ppa::where('parent_id', $parentId)
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

        Ppa::create($validated);

        // Inertia will now redirect back to index()
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
            $this->syncSiblingIndexes($oldParentId);

            // 4. Re-index NEW home (if different)
            if ($oldParentId !== $ppa->parent_id) {
                $this->syncSiblingIndexes($ppa->parent_id);
            }
        });

        return redirect()->back();
    }

    private function syncSiblingIndexes($parentId)
    {
        // Handle both Root (null) and Child groups
        $query = Ppa::orderBy('sort_order');
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
        $parentId = $ppa->parent_id;

        // This will delete the PPA and its children if you have
        // a cascade delete set up in your migration.
        $ppa->delete();

        // Renumber remaining siblings with type-specific formatting
        if ($parentId !== null) {
            $siblings = Ppa::where('parent_id', $parentId)
                ->orderBy('sort_order')
                ->get();

            // First, set all siblings to temporary unique values to avoid unique constraint violation
            // Use numeric values that fit within 4-character limit (last 3 digits + 9 prefix)
            foreach ($siblings as $sibling) {
                $tempValue =
                    '9' . str_pad($sibling->id % 999, 3, '0', STR_PAD_LEFT);
                $sibling->update([
                    'code_suffix' => $tempValue,
                ]);
            }

            // Then, update all siblings to their final values
            foreach ($siblings as $index => $sibling) {
                $digitLength = $this->getCodeSuffixLength($sibling->type);

                // Apply type-specific formatting
                if ($digitLength === 0) {
                    // Dynamic formatting (Sub-Activity) - no padding
                    $codeSuffix = (string) ($index + 1);
                } else {
                    // Fixed length formatting with leading zeros
                    $codeSuffix = str_pad(
                        $index + 1,
                        $digitLength,
                        '0',
                        STR_PAD_LEFT,
                    );
                }

                $sibling->update([
                    'sort_order' => $index,
                    'code_suffix' => $codeSuffix,
                ]);
            }
        }

        return redirect()->back()->with('success', 'Entry deleted.');
    }

    // reorder
    // public function reorder(Request $request)
    // {
    //     $activeId = $request->active_id;
    //     $overId = $request->over_id;

    //     // 1. Get the item being moved
    //     $movingItem = Ppa::findOrFail($activeId);

    //     // 2. Get all siblings in their current order
    //     $siblings = Ppa::where('parent_id', $movingItem->parent_id)
    //         ->orderBy('sort_order')
    //         ->get();

    //     $ids = $siblings->pluck('id')->toArray();

    //     // 3. Remove moving ID and find where to insert it
    //     $oldIndex = array_search($activeId, $ids);
    //     $newIndex = array_search($overId, $ids);

    //     array_splice($ids, $oldIndex, 1);
    //     array_splice($ids, $newIndex, 0, $activeId);

    //     // 4. First, set all siblings to temporary unique values to avoid unique constraint violation
    //     // Use numeric values that fit within 4-character limit (last 3 digits + 9 prefix)
    //     foreach ($ids as $id) {
    //         $tempValue = '9' . str_pad($id % 999, 3, '0', STR_PAD_LEFT);
    //         Ppa::where('id', $id)->update([
    //             'code_suffix' => $tempValue,
    //         ]);
    //     }

    //     // 5. Then, update all siblings to their final values with type-specific formatting
    //     foreach ($ids as $index => $id) {
    //         $ppa = Ppa::findOrFail($id);
    //         $digitLength = $this->getCodeSuffixLength($ppa->type);

    //         // Apply type-specific formatting
    //         if ($digitLength === 0) {
    //             // Dynamic formatting (Sub-Activity) - no padding
    //             $codeSuffix = (string) ($index + 1);
    //         } else {
    //             // Fixed length formatting with leading zeros
    //             $codeSuffix = str_pad(
    //                 $index + 1,
    //                 $digitLength,
    //                 '0',
    //                 STR_PAD_LEFT,
    //             );
    //         }

    //         $ppa->update([
    //             'sort_order' => $index,
    //             'code_suffix' => $codeSuffix,
    //         ]);
    //     }

    //     // return response()->json(['status' => 'success']);
    // }
}
