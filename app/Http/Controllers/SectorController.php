<?php

namespace App\Http\Controllers;

use App\Models\Sector;
use App\Http\Requests\StoreSectorRequest;
use App\Http\Requests\UpdateSectorRequest;
use Inertia\Inertia;

class SectorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('sector/index', [
            'sectors' => Sector::all(),
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
    public function store(StoreSectorRequest $request)
    {
        $validated = $request->validated();

        Sector::create($validated);
    }

    /**
     * Display the specified resource.
     */
    public function show(Sector $sector)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Sector $sector)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSectorRequest $request, Sector $sector)
    {
        $validated = $request->validated();

        $sector->update($validated);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sector $sector)
    {
        $sector->delete();
    }
}
