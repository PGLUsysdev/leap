<?php

namespace App\Http\Controllers;

use App\Models\LguLevel;
use App\Models\Office;
use App\Models\OfficeType;
use App\Models\Sector;
use Inertia\Inertia;

class AipRefCodeController extends Controller
{
    public function index()
    {
        $lgu_levels = LguLevel::all();
        $office_types = OfficeType::all();
        $offices = Office::all();
        $sectors = Sector::all();

        return Inertia::render('aip/aip-ref-code-input', [
            'sectors' => $sectors,
            'lgu_levels' => $lgu_levels,
            'office_types' => $office_types,
            'offices' => $offices,
        ]);
    }
}
