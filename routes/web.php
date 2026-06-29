<?php

use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AipCostingController;
use App\Http\Controllers\AipEntryController;
use App\Http\Controllers\SupplementalAipController;
use App\Http\Controllers\AipRefCodeController;
use App\Http\Controllers\ChartOfAccountController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FiscalYearController;
use App\Http\Controllers\FundingSourceController;
use App\Http\Controllers\LguLevelController;
use App\Http\Controllers\OfficeController;
use App\Http\Controllers\OfficeTypeController;
use App\Http\Controllers\PpaController;
use App\Http\Controllers\PpaListController;
use App\Http\Controllers\PpmpCategoryController;
use App\Http\Controllers\PpmpController;
use App\Http\Controllers\PpmpPriceListController;
use App\Http\Controllers\PpmpSummaryController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SectorController;
use App\Http\Controllers\TestDataTableController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CcTypologyController;
use App\Http\Controllers\CcStrategicPriorityController;
use App\Http\Controllers\CcSubSectorController;
use App\Http\Controllers\PpaFundingSourceController;
use App\Http\Controllers\PlantillaPositionController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\GovSalaryScheduleController;
use App\Http\Controllers\PsBreakdownController;
use App\Http\Controllers\IosController;
use App\Http\Controllers\SalaryStandardController;
use App\Models\GovSalarySchedule;
use App\Models\PlantillaPosition;
use App\Models\SalaryStandard;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/login');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name(
        'dashboard',
    );
    Route::get('home', fn() => Inertia::render('home'));

    // Test Routes
    Route::get('test-table', [TestDataTableController::class, 'index'])->name(
        'test-table.index',
    );
    Route::get('test-combobox', fn() => Inertia::render('test-combobox'));
});

Route::middleware(['auth', 'verified'])->group(function () {
    // User Status Management
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::patch('users/{user}', [UserController::class, 'update'])->name(
        'users.update',
    );

    // User Approval
    Route::patch('/admin/users/{user}/approve', [
        AdminUserController::class,
        'approve',
    ])->name('admin.users.approve');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // --- AIP (Fiscal Year Management) ---
    Route::get('aip', [FiscalYearController::class, 'index'])->name(
        'aip.index',
    );
    Route::post('aip', [FiscalYearController::class, 'store'])->name(
        'aip.store',
    );
    Route::patch('/aip/{fiscal_year}', [
        FiscalYearController::class,
        'update',
    ])->name('aip.update');
    Route::patch('/aip/{fiscal_year}/status', [
        FiscalYearController::class,
        'updateStatus',
    ])->name('aip.update-status');

    // --- AIP Summary & Entries ---
    Route::get('aip-entries', [AipEntryController::class, 'index']);
    Route::prefix('aip/{fiscalYear}')->group(function () {
        Route::get('summary', [AipEntryController::class, 'index'])->name(
            'aip.summary',
        );
        Route::post('import', [AipEntryController::class, 'import']);
    });
    Route::put('/aip-entries/{aipEntry}', [
        AipEntryController::class,
        'update',
    ]);
    Route::delete('/aip-entries/{aipEntry}', [
        AipEntryController::class,
        'destroy',
    ]);
    Route::post('/aip-entries/{aipEntry}/ppa-funding-sources', [
        PpaFundingSourceController::class,
        'store',
    ]);
    Route::delete(
        '/aip-entries/{aipEntry}/ppa-funding-sources/{ppaFundingSource}',
        [PpaFundingSourceController::class, 'destroy'],
    );

    // --- Supplemental AIPs ---
    Route::post('/supplemental-aips', [
        SupplementalAipController::class,
        'store',
    ])->name('supplemental-aips.store');
    Route::delete('/supplemental-aips/{supplementalAip}', [
        SupplementalAipController::class,
        'destroy',
    ])->name('supplemental-aips.destroy');

    // --- AIP Costing ---
    Route::post('/aip-costing/{aipEntry}', [
        AipCostingController::class,
        'store',
    ])->name('aip-costing.store');
    Route::delete('/aip-costing/{id}', [
        AipCostingController::class,
        'destroy',
    ])->name('aip-costing.destroy');

    // --- PPA (Programs, Projects, and Activities) ---
    Route::get('ppa', [PpaController::class, 'index'])->name('ppa.index');
    Route::post('ppas', [PpaController::class, 'store'])->name('ppas.store');
    Route::patch('ppas/{ppa}', [PpaController::class, 'update'])->name(
        'ppas.update',
    );
    Route::delete('ppas/{ppa}', [PpaController::class, 'destroy'])->name(
        'ppas.destroy',
    );
    Route::post('ppas/{ppa}/move', [PpaController::class, 'move'])->name(
        'ppas.move',
    );
    Route::post('ppas/reorder', [PpaController::class, 'reorder'])->name(
        'ppa.reorder',
    );
    Route::get('ppa/move-index', [PpaController::class, 'moveIndex'])->name(
        'ppa.move-index',
    );
    Route::post('ppas/{ppa}/set-as-ps-pool', [
        PpaController::class,
        'setAsPsPool',
    ])->name('ppas.set-as-ps-pool');

    // PPA Import
    Route::get('ppa/previous-year', [
        PpaController::class,
        'getPreviousYearPpas',
    ])->name('ppa.previous-year');
    Route::post('ppa/import-from-previous-year', [
        PpaController::class,
        'importFromPreviousYear',
    ])->name('ppa.import-from-previous-year');

    // AIP PPA Master List
    Route::get('aip-ppa', [PpaController::class, 'index']);
    Route::post('aip-ppa', [PpaController::class, 'store'])->name(
        'aip-ppa.store',
    );
    Route::patch('/aip-ppa/{aip_ppa}', [PpaController::class, 'update'])->name(
        'aip-ppa.update',
    );
    Route::delete('/aip-ppa/{aipPpa}', [PpaController::class, 'destroy'])->name(
        'aip-ppa.destroy',
    );

    // PPA List Misc
    Route::get('ppa-list', [PpaListController::class, 'index']);
    Route::patch('ppa-list/{program}', [PpaListController::class, 'update']);

    // --- PPMP (Procurement Management) ---
    Route::get('/aip/{fiscalYear}/summary/{aipEntry}/ppmp', [
        PpmpController::class,
        'index',
    ])->name('aip.summary.ppmp.index');
    Route::post('/ppmp', [PpmpController::class, 'store'])->name('ppmp.store');
    Route::post('/ppmp/custom', [
        PpmpController::class,
        'storeCustomItem',
    ])->name('ppmp.store.custom');
    Route::put('/ppmp/{ppmp}/update-monthly-quantity', [
        PpmpController::class,
        'updateMonthlyQuantity',
    ])->name('ppmp.update-monthly-quantity');
    Route::delete('/ppmp/{ppmp}', [PpmpController::class, 'destroy'])->name(
        'ppmp.destroy',
    );

    Route::prefix('aip/{fiscalYear}')->group(function () {
        Route::get('ppmp-summaries', [
            PpmpSummaryController::class,
            'index',
        ])->name('ppmp-summaries.index');
    });
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Roles
    Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
    Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
    Route::patch('roles/{role}', [RoleController::class, 'update'])->name(
        'roles.update',
    );
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name(
        'roles.destroy',
    );
    Route::get('roles/{role}/permissions', [
        RoleController::class,
        'getPermissions',
    ])->name('roles.permissions.get');
    Route::post('roles/{role}/permissions', [
        RoleController::class,
        'updatePermissions',
    ])->name('roles.permissions.update');

    // Offices
    Route::get('offices', [OfficeController::class, 'index'])->name(
        'offices.index',
    );
    Route::post('offices', [OfficeController::class, 'store'])->name(
        'offices.store',
    );
    Route::patch('offices/{office}', [OfficeController::class, 'update'])->name(
        'offices.update',
    );
    Route::delete('offices/{office}', [
        OfficeController::class,
        'destroy',
    ])->name('offices.destroy');

    // Sectors
    Route::get('sectors', [SectorController::class, 'index'])->name(
        'sectors.index',
    );
    Route::post('sectors', [SectorController::class, 'store'])->name(
        'sectors.store',
    );
    Route::patch('sectors/{sector}', [SectorController::class, 'update'])->name(
        'sectors.update',
    );
    Route::delete('sectors/{sector}', [
        SectorController::class,
        'destroy',
    ])->name('sectors.destroy');

    // LGU Levels
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

    // Office Types
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

    // Funding Sources
    Route::get('funding-sources', [
        FundingSourceController::class,
        'index',
    ])->name('funding-sources.index');
    Route::post('funding-sources', [
        FundingSourceController::class,
        'store',
    ])->name('funding-sources.store');
    Route::patch('funding-sources/{fundingSource}', [
        FundingSourceController::class,
        'update',
    ])->name('funding-sources.update');
    Route::delete('funding-sources/{fundingSource}', [
        FundingSourceController::class,
        'destroy',
    ])->name('funding-sources.destroy');

    // PPMP Categories
    Route::get('ppmp-categories', [
        PpmpCategoryController::class,
        'index',
    ])->name('ppmp-categories.index');
    Route::post('ppmp-categories', [
        PpmpCategoryController::class,
        'store',
    ])->name('ppmp-categories.store');
    Route::patch('ppmp-categories/{ppmpCategory}', [
        PpmpCategoryController::class,
        'update',
    ])->name('ppmp-categories.update');
    Route::delete('ppmp-categories/{ppmpCategory}', [
        PpmpCategoryController::class,
        'destroy',
    ])->name('ppmp-categories.destroy');

    // Chart of Accounts
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

    // Price Lists
    Route::get('price-lists', [PpmpPriceListController::class, 'index'])->name(
        'price-lists.index',
    );
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
    Route::post('price-lists/reorder', [
        PpmpPriceListController::class,
        'reorder',
    ])->name('price-lists.reorder');

    // PPMP Price List (Duplicate/Alternative endpoints)
    Route::get('/ppmp-price-list', [
        PpmpPriceListController::class,
        'index',
    ])->name('ppmp-price-list.index');
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

    // CC Strategic Priorities
    Route::get('cc-strategic-priority', [
        CcStrategicPriorityController::class,
        'index',
    ])->name('cc-strategic-priority.index');
    Route::post('cc-strategic-priority', [
        CcStrategicPriorityController::class,
        'store',
    ])->name('cc-strategic-priority.store');
    Route::patch('cc-strategic-priority/{ccStrategicPriority}', [
        CcStrategicPriorityController::class,
        'update',
    ])->name('cc-strategic-priority.update');
    Route::delete('cc-strategic-priority/{ccStrategicPriority}', [
        CcStrategicPriorityController::class,
        'destroy',
    ])->name('cc-strategic-priority.destroy');

    // CC Sub Sectors
    Route::get('cc-sub-sector', [CcSubSectorController::class, 'index'])->name(
        'cc-sub-sector.index',
    );
    Route::post('cc-sub-sector', [CcSubSectorController::class, 'store'])->name(
        'cc-sub-sector.store',
    );
    Route::patch('cc-sub-sector/{ccSubSector}', [
        CcSubSectorController::class,
        'update',
    ])->name('cc-sub-sector.update');
    Route::delete('cc-sub-sector/{ccSubSector}', [
        CcSubSectorController::class,
        'destroy',
    ])->name('cc-sub-sector.destroy');

    // CC Typology
    Route::get('cc-typology', [CcTypologyController::class, 'index'])->name(
        'cc-typology.index',
    );
    Route::post('cc-typology', [CcTypologyController::class, 'store'])->name(
        'cc-typology.store',
    );
    Route::patch('cc-typology/{ccTypology}', [
        CcTypologyController::class,
        'update',
    ])->name('cc-typology.update');
    Route::delete('cc-typology/{ccTypology}', [
        CcTypologyController::class,
        'destroy',
    ])->name('cc-typology.destroy');

    // position
    Route::get('position', [PositionController::class, 'index'])->name(
        'position.index',
    );
    Route::post('position', [PositionController::class, 'store'])->name(
        'position.store',
    );
    Route::patch('position/{position}', [
        PositionController::class,
        'update',
    ])->name('position.update');
    Route::delete('position/{position}', [
        PositionController::class,
        'destroy',
    ])->name('position.destroy');
    Route::post('plantilla-position', [
        PlantillaPositionController::class,
        'store',
    ])->name('plantilla-position.store');
    Route::patch('plantilla-position/{plantillaPosition}', [
        PlantillaPositionController::class,
        'update',
    ])->name('plantilla-position.update');
    Route::delete('plantilla-position/{plantillaPosition}', [
        PlantillaPositionController::class,
        'destroy',
    ])->name('plantilla-position.destroy');

    // ios
    Route::get('ios', [IosController::class, 'index'])->name('ios.index');
    Route::post('ios', [IosController::class, 'store'])->name('ios.store');
    Route::patch('ios/{ios}', [IosController::class, 'update'])->name(
        'ios.update',
    );
    Route::delete('ios/{ios}', [IosController::class, 'destroy'])->name(
        'ios.destroy',
    );

    // salary standard
    Route::get('salary-standard', [
        SalaryStandardController::class,
        'index',
    ])->name('salary-standard.index');

    // ps breakdown
    Route::get('/aip/{fiscalYear}/summary/{aipEntry}/ps-breakdown', [
        PsBreakdownController::class,
        'index',
    ])->name('ps-breakdown.index');
    Route::post('/ps-breakdown-items', [
        PsBreakdownController::class,
        'store',
    ])->name('ps-breakdown-items.store');
    Route::delete('/ps-breakdown-items/{psBreakdownItem}', [
        PsBreakdownController::class,
        'destroy',
    ])->name('ps-breakdown-items.destroy');
    Route::post('/ps-breakdown-items/recalculate', [
        PsBreakdownController::class,
        'recalculate',
    ])->name('ps-breakdown-items.recalculate');

    // Misc
    Route::get('aip-ref-code', [AipRefCodeController::class, 'index']);
});

require __DIR__ . '/settings.php';
