<?php

namespace App\Http\Controllers;

use App\Models\ChartOfAccount;
use App\Models\ChartOfAccountPpmpCategory;
use App\Models\PpmpCategory;
use App\Models\PpmpPriceList;
use Inertia\Inertia;

class PriceListQuantitiesImportController extends Controller
{
    public function index()
    {
        return Inertia::render('price-list-quantities-import/index', [
            'existingCategories' => PpmpCategory::select(['id', 'name', 'is_non_procurement', 'is_additional'])
                ->orderBy('name')
                ->get(),
            'existingCoas' => ChartOfAccount::select(['id', 'account_number', 'path', 'account_title'])
                ->where('is_postable', true)
                ->orderBy('path')
                ->get(),
            'existingMappings' => ChartOfAccountPpmpCategory::select(['id', 'chart_of_account_id', 'ppmp_category_id'])
                ->get(),
            'existingPriceLists' => PpmpPriceList::select(['id', 'description', 'unit_of_measurement', 'price', 'chart_of_account_ppmp_category_id'])
                ->get(),
        ]);
    }
}
