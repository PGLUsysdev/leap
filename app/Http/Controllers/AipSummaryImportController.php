<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class AipSummaryImportController extends Controller
{
    public function index()
    {
        return Inertia::render('aip-summary-import/index');
    }
}
