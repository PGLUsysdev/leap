<?php

namespace App\Http\Controllers;

use App\Models\CcSubSector;
use App\Http\Requests\StoreCcSubSectorRequest;
use App\Http\Requests\UpdateCcSubSectorRequest;
use Inertia\Inertia;

class CcSubSectorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('cc-sub-sector/index', [
            'subSectors' => CcSubSector::with('strategicPriority')->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCcSubSectorRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(CcSubSector $ccSubSector)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(CcSubSector $ccSubSector)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCcSubSectorRequest $request, CcSubSector $ccSubSector)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CcSubSector $ccSubSector)
    {
        //
    }
}
