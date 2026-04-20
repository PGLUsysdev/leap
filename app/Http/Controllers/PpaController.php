<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePpaRequest;
use App\Http\Requests\UpdatePpaRequest;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

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
            'Sub-Activity' => 0, // Dynamic, no padding
            default => 3,
        };
    }

    public function index()
    {
        $userOfficeId = Auth::user()->office_id;

        return Inertia::render('ppa/index', [
            'ppaTree' => function () use ($userOfficeId) {
                // 1. Fetch ALL relevant rows in ONE query
                $allPpas = Ppa::where('office_id', $userOfficeId)
                    ->with('office')
                    ->orderBy('sort_order')
                    ->get();

                // 2. Build the tree using references (O(n) complexity)
                $lookup = [];
                foreach ($allPpas as $ppa) {
                    $ppa->setRelation('children', collect()); // Initialize children collection
                    $lookup[$ppa->id] = $ppa;
                }

                $tree = collect();
                foreach ($allPpas as $ppa) {
                    if ($ppa->parent_id && isset($lookup[$ppa->parent_id])) {
                        $lookup[$ppa->parent_id]->children->push($ppa);
                    } else {
                        $tree->push($ppa);
                    }
                }

                return $tree;
            },

            'offices' => fn() => Office::with([
                'sector',
                'lguLevel',
                'officeType',
            ])->get(),
        ]);
    }

    // public function index()
    // {
    //     $userOfficeId = Auth::user()->office_id;

    //     return Inertia::render('ppa/index', [
    //         // Send a simple, flat list of PPAs
    //         'ppas' => fn() => Ppa::where('office_id', $userOfficeId)
    //             ->orderBy('sort_order')
    //             ->get(),

    //         // Send a simple, flat list of Offices
    //         'offices' => fn() => Office::all(),

    //         // Send the "Support" tables separately so JS can map them
    //         'sectors' => fn() => Sector::all(),
    //         'lguLevels' => fn() => LguLevel::all(),
    //         'officeTypes' => fn() => OfficeType::all(),
    //     ]);
    // }

    // public function index()
    // {
    //     // $userOfficeId = Auth::user()->office_id;

    //     return Inertia::render('ppa/index', [
    //         // toBase() returns raw StdClass objects, much faster than Models
    //         'ppas' => fn() => Ppa::select('id', 'name')->get(),

    //         'offices' => fn() => Office::select('id', 'name')->get(),

    //         'sectors' => fn() => Sector::select('id', 'name')->get(),

    //         'lguLevels' => fn() => LguLevel::select('id', 'name')
    //         ->get(),

    //         'officeTypes' => fn() => OfficeType::select('id', 'name')
    //         ->get(),
    //     ]);
    // }

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

    /**
     * Move a PPA to a different parent.
     */
    public function move(Request $request, Ppa $ppa)
    {
        $request->validate([
            'parent_id' => 'nullable|exists:ppas,id',
        ]);

        $newParentId = $request->input('parent_id');
        $oldParentId = $ppa->parent_id;

        // Set moving PPA to temporary code_suffix to avoid unique constraint conflicts
        $tempCodeSuffix = '9' . str_pad($ppa->id % 999, 3, '0', STR_PAD_LEFT);
        $ppa->code_suffix = $tempCodeSuffix;
        $ppa->save();

        // Renumber siblings in the OLD parent (remove the item)
        if ($oldParentId !== null) {
            $this->renumberSiblings($oldParentId, $ppa->id);
        }

        // Renumber siblings in the NEW parent (add the item at the end)
        if ($newParentId !== null) {
            $this->renumberSiblings($newParentId, $ppa->id);
        }

        // Update the PPA with the new parent_id
        $ppa->parent_id = $newParentId;

        // Set sort_order to be the last in the new parent's children
        $maxSortOrder =
            Ppa::where('parent_id', $newParentId)
                ->where('id', '!=', $ppa->id)
                ->max('sort_order') ?? -1;
        $ppa->sort_order = $maxSortOrder + 1;

        // Calculate the new code_suffix based on its position in the new parent
        $siblingCount = Ppa::where('parent_id', $newParentId)
            ->where('id', '!=', $ppa->id)
            ->count();
        $digitLength = $this->getCodeSuffixLength($ppa->type);

        if ($digitLength === 0) {
            // Dynamic formatting (Sub-Activity) - no padding
            $ppa->code_suffix = (string) ($siblingCount + 1);
        } else {
            // Fixed length formatting with leading zeros
            $ppa->code_suffix = str_pad(
                $siblingCount + 1,
                $digitLength,
                '0',
                STR_PAD_LEFT,
            );
        }

        $ppa->save();
    }

    /**
     * Renumber siblings after a parent change.
     */
    private function renumberSiblings($parentId, $excludeId = null)
    {
        $query = Ppa::where('parent_id', $parentId)->orderBy('sort_order');

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        $siblings = $query->get();

        // First, set all siblings to temporary unique values to avoid unique constraint violation
        foreach ($siblings as $sibling) {
            $tempValue =
                '9' . str_pad($sibling->id % 999, 3, '0', STR_PAD_LEFT);
            $sibling->update([
                'code_suffix' => $tempValue,
            ]);
        }

        // Then, update all siblings to their final values with type-specific formatting
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
    public function reorder(Request $request)
    {
        $activeId = $request->active_id;
        $overId = $request->over_id;

        // 1. Get the item being moved
        $movingItem = Ppa::findOrFail($activeId);

        // 2. Get all siblings in their current order
        $siblings = Ppa::where('parent_id', $movingItem->parent_id)
            ->orderBy('sort_order')
            ->get();

        $ids = $siblings->pluck('id')->toArray();

        // 3. Remove moving ID and find where to insert it
        $oldIndex = array_search($activeId, $ids);
        $newIndex = array_search($overId, $ids);

        array_splice($ids, $oldIndex, 1);
        array_splice($ids, $newIndex, 0, $activeId);

        // 4. First, set all siblings to temporary unique values to avoid unique constraint violation
        // Use numeric values that fit within 4-character limit (last 3 digits + 9 prefix)
        foreach ($ids as $id) {
            $tempValue = '9' . str_pad($id % 999, 3, '0', STR_PAD_LEFT);
            Ppa::where('id', $id)->update([
                'code_suffix' => $tempValue,
            ]);
        }

        // 5. Then, update all siblings to their final values with type-specific formatting
        foreach ($ids as $index => $id) {
            $ppa = Ppa::findOrFail($id);
            $digitLength = $this->getCodeSuffixLength($ppa->type);

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

            $ppa->update([
                'sort_order' => $index,
                'code_suffix' => $codeSuffix,
            ]);
        }

        // return response()->json(['status' => 'success']);
    }
}
