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
        $this->authorize('viewAny', Sector::class);

        return Inertia::render('sector/index', [
            'sectors' => Sector::all(),
            'can' => [
                'add' => request()->user()->can('create', Sector::class),
                'edit' => request()->user()->can('update', new Sector()),
                'delete' => request()->user()->can('delete', new Sector()),
            ],
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
        $this->authorize('create', Sector::class);

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
        $this->authorize('update', $sector);

        $validated = $request->validated();

        $sector->update($validated);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sector $sector)
    {
        $this->authorize('delete', $sector);

        if ($sector->offices()->exists()) {
            return back()->withErrors([
                'message' =>
                    'Cannot delete this sector because it is currently assigned to one or more offices.',
            ]);
        }

        $sector->delete();
    }
}
