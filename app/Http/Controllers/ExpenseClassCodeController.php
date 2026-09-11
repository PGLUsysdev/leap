<?php

namespace App\Http\Controllers;

use App\Models\ChartOfAccount;
use App\Models\PpaFundingSource;
use App\Models\Ppmp;
use App\Services\PpaFundingSourceTotalsService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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
        return Inertia::render('expense-class-codes/index', [
            'classes' => self::classes(),
            'chartOfAccounts' => ChartOfAccount::select(['id', 'path', 'account_title', 'expense_class'])
                ->where('is_postable', true)
                ->orderBy('path')
                ->get(),
        ]);
    }

    public function store(Request $request, PpaFundingSourceTotalsService $totalsService)
    {
        $postable = Rule::exists('chart_of_accounts', 'id')->where('is_postable', true);

        $validated = $request->validate([
            'chart_of_account_id' => ['required_without:chart_of_account_ids', 'integer', $postable],
            'chart_of_account_ids' => ['array', 'min:1'],
            'chart_of_account_ids.*' => ['integer', $postable],
            'expense_class' => ['required', 'in:PS,MOOE,CO'],
        ]);

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
