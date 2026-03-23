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
        $validated = $request->validated();

        $officeType->update($validated);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(OfficeType $officeType)
    {
        $officeType->delete();
    }
}
