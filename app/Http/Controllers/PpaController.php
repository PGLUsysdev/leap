<?php

namespace App\Http\Controllers;

use App\Models\Ppa;
use App\Models\Office;
use App\Models\Sector;
use App\Http\Requests\StorePpaRequest;
use App\Http\Requests\UpdatePpaRequest;
use App\Models\LguLevel;
use App\Models\OfficeType;
use Inertia\Inertia;

class PpaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $ppaTree = Ppa::whereNull('parent_id')
            ->with([
                'office',

                'children',
                'children.office',

                'children.children',
                'children.children.office',

                'children.children.children',
                'children.children.children.office',
            ])
            ->get();

        $offices = Office::with(['sector', 'lguLevel', 'officeType'])->get();

        return Inertia::render('ppa/index', [
            'ppaTree' => $ppaTree,
            'offices' => $offices,
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
    public function store(StorePpaRequest $request)
    {
        $validated = $request->validated();

        Ppa::create($validated);
    }

    /**
     * Display the specified resource.
     */
    public function show(Ppa $ppa)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Ppa $ppa)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePpaRequest $request, Ppa $ppa)
    {
        $validated = $request->validated();

        $ppa->update($validated);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Ppa $ppa)
    {
        // This will delete the PPA and its children if you have
        // a cascade delete set up in your migration.
        $ppa->delete();

        return redirect()->back()->with('success', 'Entry deleted.');
    }
}
