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

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $userOfficeId = Auth::user()->office_id;

        // dd($userOfficeId);

        $ppaTree = Ppa::where('office_id', $userOfficeId)
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->with([
                'office',

                'children' => fn($q) => $q->orderBy('sort_order'),
                'children.office',

                'children.children' => fn($q) => $q->orderBy('sort_order'),
                'children.children.office',

                'children.children.children' => fn($q) => $q->orderBy(
                    'sort_order',
                ),
                'children.children.children.office',
            ])
            ->get();

        $offices = Office::with(['sector', 'lguLevel', 'officeType'])->get();

        return Inertia::render('ppa/index', [
            'ppaTree' => $ppaTree,
            'offices' => $offices,
        ]);
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

        // Auto-generate code_suffix and sort_order based on sibling count and type
        $parentId = $validated['parent_id'] ?? null;
        $type = $validated['type'];
        $siblingCount = Ppa::where('parent_id', $parentId)->count();
        $digitLength = $this->getCodeSuffixLength($type);

        // Get the maximum sort_order among siblings
        $maxSortOrder =
            Ppa::where('parent_id', $parentId)->max('sort_order') ?? -1;
        $sortOrder = $maxSortOrder + 1;

        // Apply type-specific formatting
        if ($digitLength === 0) {
            // Dynamic formatting (Sub-Activity) - no padding
            $codeSuffix = (string) ($siblingCount + 1);
        } else {
            // Fixed length formatting with leading zeros
            $codeSuffix = str_pad(
                $siblingCount + 1,
                $digitLength,
                '0',
                STR_PAD_LEFT,
            );
        }

        $validated['code_suffix'] = $codeSuffix;
        $validated['sort_order'] = $sortOrder;

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
