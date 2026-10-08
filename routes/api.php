<?php

use App\Http\Controllers\Api\V1\PpmpPriceListController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1')
    ->middleware(['auth:sanctum', 'throttle:partner'])
    ->group(function () {

        Route::middleware('abilities:read:procurement')->group(function () {
            Route::get('/ppmp-price-lists', [PpmpPriceListController::class, 'index']);
            Route::get('/ppmp-price-lists/{ppmpPriceList}', [PpmpPriceListController::class, 'show']);
        });

    });
