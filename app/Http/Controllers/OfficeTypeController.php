<?php

namespace App\Http\Controllers;

use App\Models\OfficeType;
use App\Http\Requests\StoreOfficeTypeRequest;
use App\Http\Requests\UpdateOfficeTypeRequest;
use Inertia\Inertia;

class OfficeTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $this->authorize('viewAny', OfficeType::class);

        return Inertia::render('office-type/index', [
            'officeTypes' => OfficeType::all(),
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
    public function store(StoreOfficeTypeRequest $request)
    {
        $this->authorize('create', OfficeType::class);

        $validated = $request->validated();

        OfficeType::create($validated);
    }

    /**
     * Display the specified resource.
     */
    public function show(OfficeType $officeType)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(OfficeType $officeType)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
        UpdateOfficeTypeRequest $request,
        OfficeType $officeType,
    ) {
        $this->authorize('update', $officeType);

        $validated = $request->validated();

        $officeType->update($validated);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(OfficeType $officeType)
    {
        $this->authorize('delete', $officeType);

        if ($officeType->offices()->exists()) {
            return back()->withErrors([
                'message' =>
                    'Cannot delete this sector because it is currently assigned to one or more offices.',
            ]);
        }

        $officeType->delete();
    }
}
