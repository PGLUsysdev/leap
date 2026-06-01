<?php

namespace App\Http\Controllers;

use App\Models\LguLevel;
use App\Http\Requests\StoreLguLevelRequest;
use App\Http\Requests\UpdateLguLevelRequest;
use Inertia\Inertia;

class LguLevelController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $this->authorize('viewAny', LguLevel::class);

        return Inertia::render('lgu-level/index', [
            'lguLevels' => LguLevel::all(),
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
    public function store(StoreLguLevelRequest $request)
    {
        $this->authorize('viewAny', LguLevel::class);

        $validated = $request->validated();

        LguLevel::create($validated);
    }

    /**
     * Display the specified resource.
     */
    public function show(LguLevel $lguLevel)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(LguLevel $lguLevel)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateLguLevelRequest $request, LguLevel $lguLevel)
    {
        $this->authorize('viewAny', $lguLevel);

        $validated = $request->validated();

        $lguLevel->update($validated);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(LguLevel $lguLevel)
    {
        $this->authorize('viewAny', $lguLevel);

        if ($lguLevel->offices()->exists()) {
            return back()->withErrors([
                'message' =>
                    'Cannot delete this sector because it is currently assigned to one or more offices.',
            ]);
        }

        $lguLevel->delete();
    }
}
