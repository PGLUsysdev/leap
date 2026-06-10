<?php

namespace App\Http\Controllers;

use App\Models\FiscalYear;
use App\Models\Ppa;
use App\Models\PpmpPriceList;
use App\Models\Ppmp;
use App\Models\Office;
use App\Models\User;
use App\Models\PpaFundingSource;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $activeYear = FiscalYear::where('status', 'active')->first();

        $totalBudget = 0;
        $totalPpas = 0;
        $expenseClassBudget = null;
        $fundingSourceBudget = collect();
        $ppaTypeDistribution = collect();
        $topOfficesByBudget = collect();
        $ppaCountPerOffice = collect();
        $ccExpenditure = null;

        if ($activeYear) {
            $totalBudget = PpaFundingSource::where('is_supplemental', false)
                ->whereHas('aipEntry.ppa', function ($q) use ($activeYear) {
                    $q->where('fiscal_year_id', $activeYear->id);
                })
                ->selectRaw('COALESCE(SUM(ps_amount + mooe_amount + fe_amount + co_amount), 0) as total')
                ->value('total');

            $totalPpas = Ppa::where('fiscal_year_id', $activeYear->id)->count();

            $expenseClassBudget = PpaFundingSource::where('is_supplemental', false)
                ->whereHas('aipEntry.ppa', function ($q) use ($activeYear) {
                    $q->where('fiscal_year_id', $activeYear->id);
                })
                ->selectRaw('
                    COALESCE(SUM(ps_amount), 0) as ps,
                    COALESCE(SUM(mooe_amount), 0) as mooe,
                    COALESCE(SUM(fe_amount), 0) as fe,
                    COALESCE(SUM(co_amount), 0) as co
                ')
                ->first();

            $fundingSourceBudget = PpaFundingSource::where('is_supplemental', false)
                ->whereHas('aipEntry.ppa', function ($q) use ($activeYear) {
                    $q->where('fiscal_year_id', $activeYear->id);
                })
                ->selectRaw('funding_source_id, SUM(ps_amount + mooe_amount + fe_amount + co_amount) as total')
                ->groupBy('funding_source_id')
                ->with('fundingSource:id,title,code')
                ->get();

            $ppaTypeDistribution = Ppa::where('fiscal_year_id', $activeYear->id)
                ->selectRaw('type, COUNT(*) as count')
                ->groupBy('type')
                ->get();

            $topOfficesByBudget = PpaFundingSource::where('ppa_funding_sources.is_supplemental', false)
                ->join('aip_entries', 'ppa_funding_sources.aip_entry_id', '=', 'aip_entries.id')
                ->join('ppas', 'aip_entries.ppa_id', '=', 'ppas.id')
                ->join('offices', 'ppas.office_id', '=', 'offices.id')
                ->where('ppas.fiscal_year_id', $activeYear->id)
                ->selectRaw('
                    offices.id,
                    offices.name,
                    offices.acronym,
                    SUM(ps_amount + mooe_amount + fe_amount + co_amount) as total
                ')
                ->groupBy('offices.id', 'offices.name', 'offices.acronym')
                ->orderByDesc('total')
                ->limit(10)
                ->get();

            $ppaCountPerOffice = Ppa::where('fiscal_year_id', $activeYear->id)
                ->selectRaw('office_id, COUNT(*) as count')
                ->groupBy('office_id')
                ->with('office:id,name,acronym')
                ->get();

            $ccExpenditure = PpaFundingSource::where('is_supplemental', false)
                ->whereHas('aipEntry.ppa', function ($q) use ($activeYear) {
                    $q->where('fiscal_year_id', $activeYear->id);
                })
                ->selectRaw('
                    COALESCE(SUM(ccet_adaptation), 0) as adaptation,
                    COALESCE(SUM(ccet_mitigation), 0) as mitigation
                ')
                ->first();
        }

        $totalPriceListItems = PpmpPriceList::count();

        $totalProcurement = Ppmp::query()
            ->selectRaw('
                COALESCE(SUM(jan_amount), 0) +
                COALESCE(SUM(feb_amount), 0) +
                COALESCE(SUM(mar_amount), 0) +
                COALESCE(SUM(apr_amount), 0) +
                COALESCE(SUM(may_amount), 0) +
                COALESCE(SUM(jun_amount), 0) +
                COALESCE(SUM(jul_amount), 0) +
                COALESCE(SUM(aug_amount), 0) +
                COALESCE(SUM(sep_amount), 0) +
                COALESCE(SUM(oct_amount), 0) +
                COALESCE(SUM(nov_amount), 0) +
                COALESCE(SUM(dec_amount), 0) as total
            ')
            ->value('total');

        $totalOffices = Office::count();
        $totalUsers = User::count();

        return Inertia::render('dashboard', [
            'activeYear' => $activeYear,
            'stats' => [
                'totalBudget' => (float) $totalBudget,
                'totalPpas' => (int) $totalPpas,
                'totalPriceListItems' => (int) $totalPriceListItems,
                'totalProcurement' => (float) ($totalProcurement ?? 0),
                'totalOffices' => (int) $totalOffices,
                'totalUsers' => (int) $totalUsers,
            ],
            'expenseClassBudget' => $expenseClassBudget ? [
                'ps' => (float) $expenseClassBudget->ps,
                'mooe' => (float) $expenseClassBudget->mooe,
                'fe' => (float) $expenseClassBudget->fe,
                'co' => (float) $expenseClassBudget->co,
            ] : null,
            'fundingSourceBudget' => $fundingSourceBudget->map(fn ($item) => [
                'label' => $item->fundingSource?->title ?? $item->fundingSource?->code ?? "Source #{$item->funding_source_id}",
                'value' => (float) $item->total,
            ]),
            'ppaTypeDistribution' => $ppaTypeDistribution->map(fn ($item) => [
                'type' => $item->type,
                'count' => (int) $item->count,
            ]),
            'topOfficesByBudget' => $topOfficesByBudget->map(fn ($item) => [
                'name' => $item->acronym ?: $item->name,
                'value' => (float) $item->total,
            ]),
            'ppaCountPerOffice' => $ppaCountPerOffice->map(fn ($item) => [
                'name' => $item->office?->acronym ?: $item->office?->name ?? "Office #{$item->office_id}",
                'count' => (int) $item->count,
            ]),
            'ccExpenditure' => $ccExpenditure ? [
                'adaptation' => (float) $ccExpenditure->adaptation,
                'mitigation' => (float) $ccExpenditure->mitigation,
            ] : null,
        ]);
    }
}
