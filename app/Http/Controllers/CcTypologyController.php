<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCcTypologyRequest;
use App\Http\Requests\UpdateCcTypologyRequest;
use App\Models\CcStrategicPriority;
use App\Models\CcSubSector;
use App\Models\CcTypology;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CcTypologyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('viewAny', CcTypology::class);

        return Inertia::render('cc-typology/index', [
            // 'ccTypologies' => CcTypology::all(),
            'ccTypologies' => CcTypology::with([
                'strategicPriority',
                'subSector',
            ])->get(),
            'strategicPriorities' => CcStrategicPriority::all(),
            'subSectors' => CcSubSector::all(),
            'can' => [
                'add' => request()->user()->can('create', CcTypology::class),
                'edit' => request()->user()->can('update', new CcTypology),
                'delete' => request()->user()->can('delete', new CcTypology),
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
    public function store(StoreCcTypologyRequest $request)
    {
        Gate::authorize('create', CcTypology::class);

        $priority = CcStrategicPriority::findOrFail(
            $request->strategic_priority_id,
        );
        $subSector = $request->sub_sector_id
            ? CcSubSector::find($request->sub_sector_id)
            : null;

        $code =
            $request->response_type.
            $priority->code.
            ($subSector?->code ?? '1').
            $request->category_code.
            '-'.
            str_pad($request->item_num, 2, '0', STR_PAD_LEFT);

        try {
            CcTypology::create([
                'code' => $code,
                'description' => $request->description,
                'response_type' => $request->response_type,
                'strategic_priority_id' => $request->strategic_priority_id,
                'sub_sector_id' => $request->sub_sector_id,
                'category_code' => $request->category_code,
                'item_num' => $request->item_num,
                'is_nccap_activity' => $request->boolean('is_nccap_activity'),
            ]);
        } catch (QueryException $e) {
            if ($e->getCode() === '23000') {
                return redirect()
                    ->back()
                    ->withErrors([
                        'message' => "A typology with code \"{$code}\" already exists.",
                    ]);
            }

            throw $e;
        }

        return redirect()->back();
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
        Gate::authorize('update', $ccTypology);

        $priority = CcStrategicPriority::findOrFail(
            $request->strategic_priority_id,
        );
        $subSector = $request->sub_sector_id
            ? CcSubSector::find($request->sub_sector_id)
            : null;

        $code =
            $request->response_type.
            $priority->code.
            ($subSector?->code ?? '1').
            $request->category_code.
            '-'.
            str_pad($request->item_num, 2, '0', STR_PAD_LEFT);

        try {
            $ccTypology->update([
                'code' => $code,
                'description' => $request->description,
                'response_type' => $request->response_type,
                'strategic_priority_id' => $request->strategic_priority_id,
                'sub_sector_id' => $request->sub_sector_id,
                'category_code' => $request->category_code,
                'item_num' => $request->item_num,
                'is_nccap_activity' => $request->boolean('is_nccap_activity'),
            ]);
        } catch (QueryException $e) {
            if ($e->getCode() === '23000') {
                return redirect()
                    ->back()
                    ->withErrors([
                        'message' => "A typology with code \"{$code}\" already exists.",
                    ]);
            }

            throw $e;
        }

        return redirect()->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CcTypology $ccTypology)
    {
        Gate::authorize('delete', $ccTypology);

        $ccTypology->delete();

        return redirect()->back();
    }
}
