<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreFiscalYearRequest;
use App\Http\Requests\UpdateFiscalYearRequest;
use App\Models\AipEntry;
use App\Models\FiscalYear;
use App\Models\Office;
use App\Models\Ppmp;
use App\Models\PpmpSummary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class FiscalYearController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        Gate::authorize('viewAny', FiscalYear::class);

        $user = $request->user();
        $canGenerateAppAll = $user->can('generateAppAll', FiscalYear::class);
        $canGenerateAppOwn = $user->can('generateAppOwn', FiscalYear::class);
        $canShowSummaryAll = $user->can('showSummaryAll', AipEntry::class);
        $canShowSummaryOwn = $user->can('showSummaryOwn', AipEntry::class);
        $showOffices = $canGenerateAppAll || $canShowSummaryAll;

        return Inertia::render('aip/index', [
            'fiscalYears' => FiscalYear::orderBy('year', 'asc')->get(),
            'offices' => $showOffices ? Office::get() : [],
            'can' => [
                'add' => request()->user()->can('create', FiscalYear::class),
                'updateStatus' => request()
                    ->user()
                    ->can('updateStatus', new FiscalYear),
                'showSummaryAll' => $canShowSummaryAll,
                'showSummaryOwn' => $canShowSummaryOwn,
                'generateAppAll' => $canGenerateAppAll,
                'generateAppOwn' => $canGenerateAppOwn,
                'openPpmpSummary' => request()
                    ->user()
                    ->can('viewAny', PpmpSummary::class),
            ],
            'app' => Inertia::optional(function () use (
                $request,
                $user,
                $canGenerateAppAll,
            ) {
                $id = $request->query('fiscal_year_id'); // fiscal_year_id = 4

                if (! $id) {
                    return null;
                }

                $targetOfficeId = $canGenerateAppAll
                    ? $request->query('office_id', 'all')
                    : $user->office_id;

                $query = Ppmp::with([
                    'ppmpPriceList.chartOfAccountPpmpCategory.chartOfAccount',
                    'ppmpPriceList.chartOfAccountPpmpCategory.ppmpCategory',
                ])->whereHas('ppaFundingSource.aipEntry.ppa', function (
                    $query,
                ) use ($id) {
                    $query->where('fiscal_year_id', $id);
                });

                $officeIds = Office::where('id', $targetOfficeId)
                    ->orWhere('parent_id', $targetOfficeId)
                    ->pluck('id');

                if ($targetOfficeId !== 'all') {
                    $query->whereHas('ppaFundingSource.aipEntry.ppa', function (
                        $q,
                    ) use ($officeIds) {
                        $q->whereIn('office_id', $officeIds);
                    });
                }

                $items = $query->get();

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
                            $item->{"{$m}_amount"} = $group->sum("{$m}_amount");
                        }

                        return $item;
                    });

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
                                fn ($carry, $m) => $carry +
                                    (float) $item->{"{$m}_qty"},
                                0,
                            );
                            $item->$amtKey = array_reduce(
                                $mths,
                                fn ($carry, $m) => $carry +
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
                        return $item->ppmpPriceList->chartOfAccountPpmpCategory
                            ->ppmpCategory->name ?? 'Uncategorized';
                    })
                    ->map(function ($categoryGroup) {
                        return $categoryGroup->groupBy(function ($item) {
                            return $item->ppmpPriceList
                                ->chartOfAccountPpmpCategory->chartOfAccount
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
        Gate::authorize('create', FiscalYear::class);

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
        Gate::authorize('updateStatus', $fiscalYear);

        $validated = $request->validate([
            'status' => 'required|string|in:draft,open,locked,archived',
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
