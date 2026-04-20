<?php

namespace App\Http\Controllers;

use App\Models\FiscalYear;
use App\Models\AipEntry;
use App\Models\Ppa;
use App\Models\Office;
use App\Models\Ppmp;
use App\Http\Requests\StoreFiscalYearRequest;
use App\Http\Requests\UpdateFiscalYearRequest;
use Inertia\Inertia;
use Illuminate\Http\Request;

class FiscalYearController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $isControlOffice = $user->office_id === 2 || $user->role === 'admin';

        return Inertia::render('aip/index', [
            'fiscalYears' => FiscalYear::all(),
            'offices' => $isControlOffice ? Office::get() : [],
            'app' => Inertia::optional(function () use (
                $request,
                $user,
                $isControlOffice,
            ) {
                $id = $request->query('fiscal_year_id'); // fiscal_year_id = 4

                if (!$id) {
                    return null;
                }

                $targetOfficeId = $isControlOffice
                    ? $request->query('office_id', 'all')
                    : $user->office_id;

                $query = Ppmp::with([
                    'ppmpPriceList.category',
                    'ppmpPriceList.chartOfAccount',
                ])->whereHas('aipEntry', function ($query) use ($id) {
                    $query->where('fiscal_year_id', $id);
                });

                $officeIds = Office::where('id', $targetOfficeId)
                    ->orWhere('parent_id', $targetOfficeId)
                    ->pluck('id');

                if ($targetOfficeId !== 'all') {
                    $query->whereHas('aipEntry.ppa', function ($q) use (
                        $officeIds,
                    ) {
                        $q->whereIn('office_id', $officeIds);
                    });
                }

                $items = $query->get();

                if ($targetOfficeId === 'all') {
                    $items = $items
                        ->groupBy('ppmp_price_list_id')
                        ->map(function ($group) {
                            $item = clone $group->first();
                            $months = [
                                'jan',
                                'feb',
                                'mar',
                                'apr',
                                'may',
                                'jun',
                                'jul',
                                'aug',
                                'sep',
                                'oct',
                                'nov',
                                'dec',
                            ];
                            foreach ($months as $m) {
                                $item->{"{$m}_qty"} = $group->sum("{$m}_qty");
                                $item->{"{$m}_amount"} = $group->sum(
                                    "{$m}_amount",
                                );
                            }
                            return $item;
                        });
                }

                return $items
                    ->map(function ($item) {
                        $quarters = [
                            'q1' => ['jan', 'feb', 'mar'],
                            'q2' => ['apr', 'may', 'jun'],
                            'q3' => ['jul', 'aug', 'sep'],
                            'q4' => ['oct', 'nov', 'dec'],
                        ];

                        foreach ($quarters as $q => $mths) {
                            $qtyKey = "{$q}_qty";
                            $amtKey = "{$q}_amount";

                            $item->$qtyKey = array_reduce(
                                $mths,
                                fn($carry, $m) => $carry +
                                    (float) $item->{"{$m}_qty"},
                                0,
                            );
                            $item->$amtKey = array_reduce(
                                $mths,
                                fn($carry, $m) => $carry +
                                    (float) $item->{"{$m}_amount"},
                                0,
                            );
                        }

                        $item->total_qty =
                            $item->q1_qty +
                            $item->q2_qty +
                            $item->q3_qty +
                            $item->q4_qty;
                        $item->total_amount =
                            $item->q1_amount +
                            $item->q2_amount +
                            $item->q3_amount +
                            $item->q4_amount;

                        return $item;
                    })
                    ->groupBy(function ($item) {
                        return $item->ppmpPriceList->category->name ??
                            'Uncategorized';
                    })
                    ->map(function ($categoryGroup) {
                        return $categoryGroup->groupBy(function ($item) {
                            return $item->ppmpPriceList->chartOfAccount
                                ->account_title ?? 'General Account';
                        });
                    });
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
    public function store(StoreFiscalYearRequest $request)
    {
        FiscalYear::create($request->validated());
    }

    /**
     * Display the specified resource.
     */
    public function show(FiscalYear $fiscalYear)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(FiscalYear $fiscalYear)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
        UpdateFiscalYearRequest $request,
        FiscalYear $fiscal_year,
    ) {
        // $fiscal_year->update($request->validated());
    }

    // update fiscal year status
    public function updateStatus(Request $request, FiscalYear $fiscalYear)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:active,inactive,closed',
        ]);

        $fiscalYear->update($validated);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(FiscalYear $fiscalYear)
    {
        //
    }
}
