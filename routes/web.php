<?php

use App\Http\Controllers\AipCollectionController;
use App\Http\Controllers\PpaListController;
use App\Http\Controllers\LguProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\AipController;
use App\Http\Controllers\AipRefCodeController;
use App\Http\Controllers\PpaController;
use App\Http\Controllers\ChartOfAccountController;
use App\Http\Controllers\SectorController;
use App\Http\Controllers\OfficeController;
use App\Http\Controllers\AipEntryController;
use App\Http\Controllers\AipSummaryController;
use App\Http\Controllers\FiscalYearController;
use App\Http\Controllers\AipCostingController;
use App\Http\Controllers\PpmpPriceListController;
use App\Http\Controllers\PpmpHeaderController;
use App\Http\Controllers\PpmpItemController;
use App\Http\Controllers\PpmpController;
use App\Http\Controllers\FundingSourceController;
use App\Http\Controllers\LguLevelController;
use App\Http\Controllers\PpmpCategoryController;
use App\Http\Controllers\OfficeTypeController;

Route::get(
    '/',
    fn() => Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]),
)->name('home');

Route::middleware(['auth', 'verified'])->group(
    fn() => Route::get('dashboard', fn() => Inertia::render('dashboard'))->name(
        'dashboard',
    ),
);

// aip
Route::get('aip', [FiscalYearController::class, 'index'])->name('aip.index');
Route::post('aip', [FiscalYearController::class, 'store'])->name('aip.store');
Route::patch('/aip/{fiscal_year}', [
    FiscalYearController::class,
    'update',
])->name('aip.update');
Route::patch('/aip/{fiscal_year}/status', [
    FiscalYearController::class,
    'updateStatus',
])->name('aip.update-status');

// aip-summary
Route::prefix('aip/{fiscalYear}')->group(function () {
    Route::get('summary', [AipEntryController::class, 'index'])->name(
        'aip.summary',
    );
});

Route::get('price-lists', [PpmpPriceListController::class, 'index'])->name(
    'price-lists.index',
);

// funding-source
Route::get('funding-sources', [FundingSourceController::class, 'index'])->name(
    'funding-sources.index',
);
Route::post('funding-sources', [FundingSourceController::class, 'store'])->name(
    'funding-sources.store',
);
Route::patch('funding-sources/{fundingSource}', [
    FundingSourceController::class,
    'update',
])->name('funding-sources.update');
Route::delete('funding-sources/{fundingSource}', [
    FundingSourceController::class,
    'destroy',
])->name('funding-sources.destroy');

// ppmp-category
Route::get('ppmp-categories', [PpmpCategoryController::class, 'index'])->name(
    'ppmp-categories.index',
);
Route::post('ppmp-categories', [PpmpCategoryController::class, 'store'])->name(
    'ppmp-categories.store',
);
Route::patch('ppmp-categories/{ppmpCategory}', [
    PpmpCategoryController::class,
    'update',
])->name('ppmp-categories.update');
Route::delete('ppmp-categories/{ppmpCategory}', [
    PpmpCategoryController::class,
    'destroy',
])->name('ppmp-categories.destroy');

// chart-of-account
Route::get('chart-of-accounts', [
    ChartOfAccountController::class,
    'index',
])->name('chart-of-accounts.manage');
Route::post('chart-of-accounts', [
    ChartOfAccountController::class,
    'store',
])->name('chart-of-accounts.store');
Route::patch('chart-of-accounts/{chartOfAccount}', [
    ChartOfAccountController::class,
    'update',
])->name('chart-of-accounts.update');
Route::delete('chart-of-accounts/{chartOfAccount}', [
    ChartOfAccountController::class,
    'destroy',
])->name('chart-of-accounts.destroy');

// price-list
Route::post('price-lists', [PpmpPriceListController::class, 'store'])->name(
    'price-lists.store',
);
Route::patch('price-lists/{ppmpPriceList}', [
    PpmpPriceListController::class,
    'update',
])->name('price-lists.update');
Route::delete('price-lists/{ppmpPriceList}', [
    PpmpPriceListController::class,
    'destroy',
])->name('price-lists.destroy');

// offices
Route::get('offices', [OfficeController::class, 'index'])->name(
    'offices.index',
);
Route::post('offices', [OfficeController::class, 'store'])->name(
    'offices.store',
);
Route::patch('offices/{office}', [OfficeController::class, 'update'])->name(
    'offices.update',
);
// Route::put('offices/{office}', [OfficeController::class, 'update'])->name(
//     'offices.update.put',
// );
Route::delete('offices/{office}', [OfficeController::class, 'destroy'])->name(
    'offices.destroy',
);

// ---

Route::get('aip-ref-code', [AipRefCodeController::class, 'index']);

Route::get('home', function () {
    return Inertia::render('home');
});

Route::get('ppa-list', [PpaListController::class, 'index']);
Route::patch('ppa-list/{program}', [PpaListController::class, 'update']);

Route::get('lgu-profile', [LguProfileController::class, 'index']);

// aip ppa - master list for ppa
Route::get('aip-ppa', [PpaController::class, 'index']);
Route::post('aip-ppa', [PpaController::class, 'store'])->name('aip-ppa.store');
Route::patch('/aip-ppa/{aip_ppa}', [PpaController::class, 'update'])->name(
    'aip-ppa.update',
);
Route::delete('/aip-ppa/{aipPpa}', [PpaController::class, 'destroy'])->name(
    'aip-ppa.destroy',
);

// sectors (active)
Route::get('sectors', [SectorController::class, 'index'])->name(
    'sectors.index',
);
Route::post('sectors', [SectorController::class, 'store'])->name(
    'sectors.store',
);
Route::patch('sectors/{sector}', [SectorController::class, 'update'])->name(
    'sectors.update',
);
Route::delete('sectors/{sector}', [SectorController::class, 'destroy'])->name(
    'sectors.destroy',
);

// lgu-levels (active)
Route::get('lgu-levels', [LguLevelController::class, 'index'])->name(
    'lgu-levels.index',
);
Route::post('lgu-levels', [LguLevelController::class, 'store'])->name(
    'lgu-levels.store',
);
Route::patch('lgu-levels/{lguLevel}', [
    LguLevelController::class,
    'update',
])->name('lgu-levels.update');
Route::delete('lgu-levels/{lguLevel}', [
    LguLevelController::class,
    'destroy',
])->name('lgu-levels.destroy');

// office-types (active)
Route::get('office-types', [OfficeTypeController::class, 'index'])->name(
    'office-types.index',
);
Route::post('office-types', [OfficeTypeController::class, 'store'])->name(
    'office-types.store',
);
Route::patch('office-types/{officeType}', [
    OfficeTypeController::class,
    'update',
])->name('office-types.update');
Route::delete('office-types/{officeType}', [
    OfficeTypeController::class,
    'destroy',
])->name('office-types.destroy');

// aip summary
// Route::post('aip/{aip_id}/import', [AipEntryController::class, 'store']);
Route::post('/aip/{fiscalYear}/import', [AipEntryController::class, 'import']);
// Route::post('/aip-entries', [AipEntryController::class, 'store']);
Route::put('/aip-entries/{aipEntry}', [AipEntryController::class, 'update']);
Route::delete('/aip-entries/{aipEntry}', [
    AipEntryController::class,
    'destroy',
]);

// aip summary to ppmp
Route::get('/aip/{fiscalYear}/summary/{aipEntry}/ppmp', [
    PpmpController::class,
    'index',
])->name('aip.summary.ppmp.index');
Route::post('/ppmp', [PpmpController::class, 'store'])->name('ppmp.store');
Route::post('/ppmp/custom', [PpmpController::class, 'storeCustomItem'])->name(
    'ppmp.store.custom',
);
Route::put('/ppmp/{ppmp}/update-monthly-quantity', [
    PpmpController::class,
    'updateMonthlyQuantity',
])->name('ppmp.update-monthly-quantity');
Route::delete('/ppmp/{ppmp}', [PpmpController::class, 'destroy'])->name(
    'ppmp.destroy',
);

// ppa
Route::get('ppa', [PpaController::class, 'index'])->name('ppa.index');
Route::post('ppas', [PpaController::class, 'store'])->name('ppas.store');
Route::patch('ppas/{ppa}', [PpaController::class, 'update'])->name(
    'ppas.update',
);
Route::delete('ppas/{ppa}', [PpaController::class, 'destroy'])->name(
    'ppas.destroy',
);

Route::get('aip-entries', [AipEntryController::class, 'index']);

Route::get('aip-summary', [AipSummaryController::class, 'index']);

Route::post('/aip-costing/{aipEntry}', [
    AipCostingController::class,
    'store',
])->name('aip-costing.store');
Route::delete('/aip-costing/{id}', [
    AipCostingController::class,
    'destroy',
])->name('aip-costing.destroy');

Route::get('/ppmp-price-list', [PpmpPriceListController::class, 'index'])->name(
    'ppmp-price-list.index',
);
Route::post('/ppmp-price-list', [
    PpmpPriceListController::class,
    'store',
])->name('ppmp-price-list.store');
Route::put('/ppmp-price-list/{ppmpPriceList}', [
    PpmpPriceListController::class,
    'update',
])->name('ppmp-price-list.update');
Route::delete('/ppmp-price-list/{ppmpPriceList}', [
    PpmpPriceListController::class,
    'destroy',
])->name('ppmp-price-list.destroy');

// PPMP Headers Routes
Route::get('/ppmp-headers', [PpmpHeaderController::class, 'index'])->name(
    'ppmp-headers.index',
);
Route::post('/ppmp-headers', [PpmpHeaderController::class, 'store'])->name(
    'ppmp-headers.store',
);

// PPMP Items Routes
Route::get('/ppmp-headers/{ppmpHeaderId}/items', [
    PpmpItemController::class,
    'index',
])->name('ppmp-items.index');
Route::get('/ppmp-headers/{ppmpHeaderId}/items/create', [
    PpmpItemController::class,
    'create',
])->name('ppmp-items.create');
Route::post('/ppmp-headers/{ppmpHeaderId}/items', [
    PpmpItemController::class,
    'store',
])->name('ppmp-items.store');

Route::get('test-combobox', function () {
    return Inertia::render('test-combobox');
});

require __DIR__ . '/settings.php';
