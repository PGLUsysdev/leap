<?php

namespace App\Http\Controllers;

use App\Models\Ios;
use App\Http\Requests\StoreIosRequest;
use App\Http\Requests\UpdateIosRequest;
use Inertia\Inertia;

class IosController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('ios/index', [
            'ios' => Ios::query()->paginate(100)->withQueryString(),
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
    public function store(StoreIosRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Ios $ios)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Ios $ios)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateIosRequest $request, Ios $ios)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Ios $ios)
    {
        //
    }
}
