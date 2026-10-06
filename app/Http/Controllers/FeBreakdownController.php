<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateFeBreakdownRequest;
use App\Models\AipEntry;
use App\Models\ChartOfAccount;
use App\Models\FeBreakdownItem;
use App\Models\FiscalYear;
use App\Models\PpaFundingSource;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class FeBreakdownController extends Controller
{
    /**
     * Financial Expenses (FE) breakdown of a single PPA funding source.
     *
     * One row per chart of account classified as FE on the expense class
     * codes screen, so the page follows whatever the administrator linked
     * instead of a hardcoded account list. The rows total into
     * `ppa_funding_sources.fe_amount`, which is why that column is read-only
     * on the AIP funding sources dialog.
     */
    public function index($fiscalYear, $aipEntry)
    {
        $aipEntry = AipEntry::findOrFail($aipEntry);
        $fiscalYear = FiscalYear::findOrFail($fiscalYear);

        $fundingSource = $this
            ->resolveFundingSource($aipEntry, request()->query('ppa_funding_source_id'));

        $chartOfAccounts = ChartOfAccount::where('expense_class', 'FE')
            ->where('is_active', true)
            ->orderBy('path')
            ->get();

        return Inertia::render('fe-breakdown/index', [
            'aipEntryId' => $aipEntry->id,
            'amounts' => $this->amountsFor($fundingSource),
            'chartOfAccounts' => $chartOfAccounts,
            'fiscalYear' => ['id' => $fiscalYear->id, 'year' => (int) $fiscalYear->year],
            'fundingSource' => $fundingSource
                ? [
                    'id' => $fundingSource->id,
                    'code' => $fundingSource->fundingSource?->code,
                    'title' => $fundingSource->fundingSource?->title,
                ]
                : null,
            'can' => [
                'edit' => $fundingSource !== null
                    && request()->user()->can('editFundingSources', $aipEntry),
            ],
        ]);
    }

    /**
     * Save one account's amount and re-total the funding source. The grid
     * commits a cell at a time, the same way the PPMP grid does.
     */
    public function update(
        UpdateFeBreakdownRequest $request,
        $fiscalYear,
        $aipEntry,
        ChartOfAccount $chartOfAccount,
    ) {
        $aipEntry = AipEntry::findOrFail($aipEntry);
        FiscalYear::findOrFail($fiscalYear);

        $fundingSource = $this
            ->resolveFundingSource($aipEntry, $request->integer('ppa_funding_source_id') ?: null);

        abort_if($fundingSource === null, 404);

        Gate::authorize('editFundingSources', $aipEntry);

        abort_unless(
            $chartOfAccount->expense_class === 'FE'
                && $chartOfAccount->is_active
                && $chartOfAccount->is_postable,
            404,
        );

        FeBreakdownItem::updateOrCreate(
            [
                'ppa_funding_source_id' => $fundingSource->id,
                'chart_of_account_id' => $chartOfAccount->id,
            ],
            ['amount' => $request->validated()['amount']],
        );

        // Accounts unlinked from FE stop counting toward the total.
        FeBreakdownItem::where('ppa_funding_source_id', $fundingSource->id)
            ->whereDoesntHave('chartOfAccount', fn ($query) => $query
                ->where('expense_class', 'FE')
                ->where('is_active', true)
                ->where('is_postable', true))
            ->delete();

        $this->syncFeAmount($fundingSource);

        return back();
    }

    /**
     * The funding source must belong to the AIP entry in the URL; anything
     * else is a 404 so ids can't be probed across entries.
     */
    private function resolveFundingSource(AipEntry $aipEntry, ?int $ppaFundingSourceId): ?PpaFundingSource
    {
        if (! $ppaFundingSourceId) {
            return null;
        }

        $fundingSource = PpaFundingSource::with('fundingSource')
            ->find($ppaFundingSourceId);

        if (! $fundingSource || $fundingSource->aipOutput?->aip_entry_id !== $aipEntry->id) {
            abort(404);
        }

        return $fundingSource;
    }

    /**
     * @return Collection<int, string>
     */
    private function amountsFor(?PpaFundingSource $fundingSource)
    {
        if (! $fundingSource) {
            return collect();
        }

        return FeBreakdownItem::where('ppa_funding_source_id', $fundingSource->id)
            ->pluck('amount', 'chart_of_account_id');
    }

    private function syncFeAmount(PpaFundingSource $fundingSource): void
    {
        $total = FeBreakdownItem::where(
            'ppa_funding_source_id',
            $fundingSource->id,
        )->sum('amount');

        $fundingSource->update([
            'fe_amount' => round((float) $total, 2),
        ]);
    }
}
