<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ImportsController extends Controller
{
    public function index()
    {
        Gate::authorize('viewHub', 'imports');

        return Inertia::render('imports/index', [
            'can' => [
                'category'            => Gate::allows('category', 'imports'),
                'categoryCoaMapping'  => Gate::allows('categoryCoaMapping', 'imports'),
                'priceList'           => Gate::allows('priceList', 'imports'),
                'priceListQuantities' => Gate::allows('priceListQuantities', 'imports'),
                'aipSummary'          => Gate::allows('aipSummary', 'imports'),
            ],
        ]);
    }
}
