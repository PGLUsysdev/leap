<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExpenseClassCodeRequest;
use App\Models\ChartOfAccount;
use App\Models\PpaFundingSource;
use App\Models\Ppmp;
use App\Services\PpaFundingSourceTotalsService;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ExpenseClassCodeController extends Controller
{
    /**
     * @return array<int, array{code: string, class: string, name: string}>
     */
    public static function classes(): array
    {
        return [
            ['code' => '100', 'class' => 'PS', 'name' => 'Personal Services'],
            ['code' => '200', 'class' => 'MOOE', 'name' => 'Maintenance and Other Operating Expenditures'],
            ['code' => '300', 'class' => 'CO', 'name' => 'Capital Outlay'],
        ];
    }

    public function index()
    {
        Gate::authorize('viewAny', 'expense-class-code');

        return Inertia::render('expense-class-codes/index', [
            'classes' => self::classes(),
            'chartOfAccounts' => ChartOfAccount::select(['id', 'path', 'account_title', 'expense_class'])
                ->where('is_postable', true)
                ->orderBy('path')
                ->get(),
            'can' => [
                'add' => request()->user()->can('create', 'expense-class-code'),
                'delete' => request()->user()->can('delete', 'expense-class-code'),
            ],
        ]);
    }

    public function store(StoreExpenseClassCodeRequest $request, PpaFundingSourceTotalsService $totalsService)
    {
        Gate::authorize('create', 'expense-class-code');

        $validated = $request->validated();

        $ids = collect($validated['chart_of_account_ids'] ?? [])
            ->when(
                ! empty($validated['chart_of_account_id']),
                fn ($ids) => $ids->push($validated['chart_of_account_id']),
            )
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        ChartOfAccount::whereIn('id', $ids)->update([
            'expense_class' => $validated['expense_class'],
            'updated_at' => now(),
        ]);

        $this->resyncAffectedBridges($ids, $totalsService);

        return redirect()->back();
    }

    public function destroy(ChartOfAccount $chartOfAccount, PpaFundingSourceTotalsService $totalsService)
    {
        Gate::authorize('delete', 'expense-class-code');

        $chartOfAccount->update(['expense_class' => null]);

        $this->resyncAffectedBridges([$chartOfAccount->id], $totalsService);

        return redirect()->back();
    }

    private function resyncAffectedBridges(array $chartOfAccountIds, PpaFundingSourceTotalsService $totalsService): void
    {
        $bridgeIds = Ppmp::whereHas(
            'ppmpPriceList.chartOfAccountPpmpCategory',
            fn ($query) => $query->whereIn('chart_of_account_id', $chartOfAccountIds),
        )->distinct()->pluck('ppa_funding_source_id');

        foreach (PpaFundingSource::whereIn('id', $bridgeIds)->get() as $bridge) {
            $totalsService->syncOne($bridge);
        }
    }
}
