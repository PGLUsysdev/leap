<?php

namespace App\Http\Controllers;

use App\Models\CcStrategicPriority;
use App\Models\CcSubSector;
use App\Http\Requests\StoreCcSubSectorRequest;
use App\Http\Requests\UpdateCcSubSectorRequest;
use Illuminate\Database\QueryException;
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
            'strategicPriorities' => CcStrategicPriority::all(),
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
        CcSubSector::create($request->validated());

        return redirect()->back();
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
        $ccSubSector->update($request->validated());

        return redirect()->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CcSubSector $ccSubSector)
    {
        try {
            $ccSubSector->delete();

            return redirect()->back();
        } catch (QueryException $e) {
            if ($e->getCode() === '23000') {
                return redirect()
                    ->back()
                    ->withErrors([
                        'message' =>
                            'Cannot delete this sub sector because it is linked to existing typologies.',
                    ]);
            }

            throw $e;
        }
    }
}
