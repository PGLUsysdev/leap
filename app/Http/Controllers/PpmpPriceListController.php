<?php

namespace App\Http\Controllers;

use App\Models\PpmpPriceList;
use App\Models\ChartOfAccount;
use App\Models\PpmpCategory;
use App\Http\Requests\StorePpmpPriceListRequest;
use App\Http\Requests\UpdatePpmpPriceListRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;

class PpmpPriceListController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $mode = $request->query('dialog_mode');

        $query = PpmpPriceList::query()
            ->with('chartOfAccount', 'category')
            ->orderBy('sort_order');

        if ($request->has('search')) {
            $searchTerm = $request->query('search');
            $query = $query
                ->where('unit_of_measurement', 'like', '%' . $searchTerm . '%')
                ->orWhere('description', 'like', '%' . $searchTerm . '%')
                ->orWhere('item_number', 'like', '%' . $searchTerm . '%')
                ->orWhere('price', 'like', '%' . $searchTerm . '%')
                ->orWhereHas('category', function ($subQuery) use (
                    $searchTerm,
                ) {
                    $subQuery->where('name', 'like', '%' . $searchTerm . '%');
                })
                ->orWhereHas('chartOfAccount', function ($subQuery) use (
                    $searchTerm,
                ) {
                    $subQuery->where(
                        'account_title',
                        'like',
                        '' . $searchTerm . '',
                    );
                });
        }

        $priceList = $query->paginate(100)->withQueryString();

        $chartOfAccounts = ChartOfAccount::whereIn('expense_class', [
            'MOOE',
            'CO',
        ])->get();

        $ppmpCategory = PpmpCategory::with(
            'chartOfAccounts:id,account_title,account_number',
        )->get();

        return Inertia::render('price-list/index', [
            'paginatedPriceList' => $priceList,
            'chartOfAccounts' => $chartOfAccounts,
            'ppmpCategory' => $ppmpCategory,
            'filters' => $request->only([
                'id',
                'search',
                'page',
                'dialog_id',
                'dialog_search',
                'dialog_page',
                'dialog_mode',
            ]),
            // 'filters' => $request->all(),
            'paginatedDialogPriceList' => Inertia::lazy(function () use (
                $request,
            ) {
                $query = PpmpPriceList::query()
                    ->with('chartOfAccount', 'category')
                    ->orderBy('sort_order');

                if ($request->has('dialog_search')) {
                    $searchTerm = $request->query('dialog_search');
                    $query = $query
                        ->where(
                            'unit_of_measurement',
                            'like',
                            '%' . $searchTerm . '%',
                        )
                        ->orWhere(
                            'description',
                            'like',
                            '%' . $searchTerm . '%',
                        )
                        ->orWhere(
                            'item_number',
                            'like',
                            '%' . $searchTerm . '%',
                        )
                        ->orWhere('price', 'like', '%' . $searchTerm . '%')
                        ->orWhereHas('category', function ($subQuery) use (
                            $searchTerm,
                        ) {
                            $subQuery->where(
                                'name',
                                'like',
                                '%' . $searchTerm . '%',
                            );
                        })
                        ->orWhereHas('chartOfAccount', function (
                            $subQuery,
                        ) use ($searchTerm) {
                            $subQuery->where(
                                'account_title',
                                'like',
                                '' . $searchTerm . '',
                            );
                        });
                }

                return $query->paginate(100);
            }),
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
    public function store(StorePpmpPriceListRequest $request)
    {
        $validated = $request->validated();

        // Auto-assign sort_order and item_number as the next available number
        $maxSortOrder = PpmpPriceList::max('sort_order') ?? 0;
        $nextSortOrder = $maxSortOrder + 1;

        $validatedMapped = [
            'chart_of_account_id' => $validated['expenseAccount'],
            'ppmp_category_id' => $validated['category'],
            'sort_order' => $nextSortOrder,
            'item_number' => $nextSortOrder,
            'description' => $validated['description'],
            'unit_of_measurement' => $validated['unitOfMeasurement'],
            'price' => $validated['price'],
        ];

        PpmpPriceList::create($validatedMapped);
    }

    /**
     * Display the specified resource.
     */
    public function show(PpmpPriceList $ppmpPriceList)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PpmpPriceList $ppmpPriceList)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
        UpdatePpmpPriceListRequest $request,
        PpmpPriceList $ppmpPriceList,
    ) {
        $validated = $request->validated();

        $validatedMapped = [
            'chart_of_account_id' => $validated['expenseAccount'],
            'ppmp_category_id' => $validated['category'],
            'description' => $validated['description'],
            'unit_of_measurement' => $validated['unitOfMeasurement'],
            'price' => $validated['price'],
        ];

        $ppmpPriceList->update($validatedMapped);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PpmpPriceList $ppmpPriceList)
    {
        // $ppmpPriceList->delete();

        try {
            $ppmpPriceList->delete();
            return Redirect::back()->with(
                'success',
                'Price list deleted successfully.',
            );
        } catch (QueryException $e) {
            if ($e->getCode() === '23000') {
                return Redirect::back()->withErrors([
                    'database' =>
                        'This record cannot be deleted because it is being used by another part of the system.',
                ]);
            }

            return Redirect::back()->withErrors([
                'database' => 'An unexpected database error occurred.',
            ]);
        }
    }

    /**
     * Reorder price list items.
     */
    public function reorder(Request $request)
    {
        $request->validate([
            'active_id' => 'required|exists:ppmp_price_lists,id',
            'over_id' => 'required|exists:ppmp_price_lists,id',
            'position' => 'required|in:up,down',
        ]);

        DB::transaction(function () use ($request) {
            $movingItem = PpmpPriceList::findOrFail($request->active_id);
            $targetItem = PpmpPriceList::findOrFail($request->over_id);

            $oldOrder = $movingItem->sort_order;
            $targetOrder = $targetItem->sort_order;

            // 1. Calculate the final target position
            // If 'up', it takes the target's current spot (others shift down)
            // If 'down', it takes the target's spot + 1
            $newOrder =
                $request->position === 'up' ? $targetOrder : $targetOrder + 1;

            // 2. Temporarily move the item out of the way to a "safe" index
            // to avoid unique constraint issues if you have them.
            // We use 0 as a temporary placeholder.
            $movingItem->update(['sort_order' => 0]);

            // 3. Re-shift the remaining items
            if ($oldOrder < $targetOrder) {
                // Moving down: shift items between old and new up by -1
                PpmpPriceList::whereBetween('sort_order', [
                    $oldOrder + 1,
                    $request->position === 'down'
                        ? $targetOrder
                        : $targetOrder - 1,
                ])->decrement('sort_order');
            } else {
                // Moving up: shift items between new and old down by +1
                PpmpPriceList::whereBetween('sort_order', [
                    $request->position === 'up'
                        ? $targetOrder
                        : $targetOrder + 1,
                    $oldOrder - 1,
                ])->increment('sort_order');
            }

            // 4. Assign the final position
            $movingItem->update(['sort_order' => $newOrder]);

            // 5. Cleanup: Ensure order is perfectly sequential 1, 2, 3...
            // This fixes any "gaps" created by the increment/decrement logic
            $all = PpmpPriceList::orderBy('sort_order')->get();
            foreach ($all as $index => $item) {
                $item->update([
                    'sort_order' => $index + 1,
                    'item_number' => $index + 1,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Reordered successfully.');
    }
}
