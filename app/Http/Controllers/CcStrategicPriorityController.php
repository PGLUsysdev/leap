<?php

namespace App\Http\Controllers;

use App\Models\CcStrategicPriority;
use App\Http\Requests\StoreCcStrategicPriorityRequest;
use App\Http\Requests\UpdateCcStrategicPriorityRequest;
use Illuminate\Database\QueryException;
use Inertia\Inertia;

class CcStrategicPriorityController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('cc-strategic-priority/index', [
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
    public function store(StoreCcStrategicPriorityRequest $request)
    {
        CcStrategicPriority::create($request->validated());

        return redirect()->back();
    }

    /**
     * Display the specified resource.
     */
    public function show(CcStrategicPriority $ccStrategicPriority)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(CcStrategicPriority $ccStrategicPriority)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCcStrategicPriorityRequest $request, CcStrategicPriority $ccStrategicPriority)
    {
        $ccStrategicPriority->update($request->validated());

        return redirect()->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CcStrategicPriority $ccStrategicPriority)
    {
        try {
            $ccStrategicPriority->delete();

            return redirect()->back();
        } catch (QueryException $e) {
            if ($e->getCode() === '23000') {
                return redirect()
                    ->back()
                    ->withErrors([
                        'message' =>
                            'Cannot delete this strategic priority because it is linked to existing sub-sectors or typologies.',
                    ]);
            }

            throw $e;
        }
    }
}
