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
        $activeId = (int) $request->active_id;
        $overId = (int) $request->over_id;

        DB::transaction(function () use ($activeId, $overId) {
            $movingItem = PpmpPriceList::findOrFail($activeId);
            $targetItem = PpmpPriceList::findOrFail($overId);

            $oldOrder = $movingItem->sort_order;
            $newOrder = $targetItem->sort_order;

            if ($oldOrder < $newOrder) {
                // Moving Down: Decrease sort_order of everything in between
                PpmpPriceList::whereBetween('sort_order', [
                    $oldOrder + 1,
                    $newOrder,
                ])->decrement('sort_order');
                PpmpPriceList::whereBetween('item_number', [
                    $oldOrder + 1,
                    $newOrder,
                ])->decrement('item_number');
            } elseif ($oldOrder > $newOrder) {
                // Moving Up: Increase sort_order of everything in between
                PpmpPriceList::whereBetween('sort_order', [
                    $newOrder,
                    $oldOrder - 1,
                ])->increment('sort_order');
                PpmpPriceList::whereBetween('item_number', [
                    $newOrder,
                    $oldOrder - 1,
                ])->increment('item_number');
            }

            // Set the moving item to its new position
            $movingItem->update([
                'sort_order' => $newOrder,
                'item_number' => $newOrder,
            ]);
        });
    }
}
