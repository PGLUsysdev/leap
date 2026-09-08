<?php

namespace App\Http\Controllers;

use App\Models\FiscalYear;
use App\Models\Office;
use App\Models\Ppa;
use Inertia\Inertia;

class AipSummaryImportController extends Controller
{
    public function index()
    {
        $fiscalYearId = session('active_fiscal_year_id');

        $offices = Office::with(['sector:id,code', 'lguLevel:id,code', 'officeType:id,code'])
            ->orderBy('acronym')
            ->get(['id', 'acronym', 'parent_id', 'code', 'sector_id', 'lgu_level_id', 'office_type_id'])
            ->map(fn (Office $office) => [
                'id' => $office->id,
                'acronym' => $office->acronym,
                'parent_id' => $office->parent_id,
                'full_code' => $office->full_code,
            ]);

        $ppas = collect();
        if ($fiscalYearId) {
            // Eager-load the full parent chain (max depth is 5 levels, so
            // 4 nested parents cover it) to keep full_code query-free.
            $ppas = Ppa::with(['parent.parent.parent.parent', 'office.sector', 'office.lguLevel', 'office.officeType'])
                ->where('fiscal_year_id', $fiscalYearId)
                ->orderBy('id')
                ->get(['id', 'office_id', 'parent_id', 'name', 'type', 'code_suffix'])
                ->map(fn (Ppa $ppa) => [
                    'id' => $ppa->id,
                    'office_id' => $ppa->office_id,
                    'parent_id' => $ppa->parent_id,
                    'name' => $ppa->name,
                    'type' => $ppa->type,
                    'code_suffix' => $ppa->code_suffix,
                    'full_code' => $ppa->full_code,
                ]);
        }

        $fiscalYear = $fiscalYearId
            ? FiscalYear::select(['id', 'year', 'status'])->find($fiscalYearId)
            : null;

        return Inertia::render('aip-summary-import/index', [
            'activeFiscalYear' => $fiscalYear,
            'existingOffices' => $offices,
            'existingPpas' => $ppas,
        ]);
    }
}
