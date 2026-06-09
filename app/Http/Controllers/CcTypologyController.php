<?php

namespace App\Http\Controllers;

use App\Models\CcTypology;
use App\Http\Requests\StoreCcTypologyRequest;
use App\Http\Requests\UpdateCcTypologyRequest;
use Inertia\Inertia;

class CcTypologyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('cc-typology/index', [
            // 'ccTypologies' => CcTypology::all(),
            'ccTypologies' => CcTypology::with([
                'strategicPriority',
                'subSector',
            ])->get(),
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
    public function store(StoreCcTypologyRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(CcTypology $ccTypology)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(CcTypology $ccTypology)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
        UpdateCcTypologyRequest $request,
        CcTypology $ccTypology,
    ) {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CcTypology $ccTypology)
    {
        //
    }
}
