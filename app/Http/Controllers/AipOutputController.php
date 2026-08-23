<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAipOutputRequest;
use App\Http\Requests\UpdateAipOutputRequest;
use App\Models\AipEntry;
use App\Models\AipOutput;
use App\Models\Ppmp;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class AipOutputController extends Controller
{
    public function store(StoreAipOutputRequest $request, AipEntry $aipEntry)
    {
        Gate::authorize('update', $aipEntry);

        $data = $request->validated();
        $data['sort_order'] ??=
            ((int) $aipEntry->outputs()->max('sort_order')) + 1;

        $aipEntry->outputs()->create($data);

        // return back()->with('success', 'Output added successfully.');
    }

    public function update(
        UpdateAipOutputRequest $request,
        AipOutput $aipOutput,
    ) {
        Gate::authorize('update', $aipOutput->aipEntry);

        $aipOutput->update($request->validated());

        // return back()->with('success', 'Output updated successfully.');
    }

    public function destroy(AipOutput $aipOutput)
    {
        Gate::authorize('update', $aipOutput->aipEntry);

        DB::transaction(function () use ($aipOutput) {
            $fundingSourceIds = $aipOutput->fundingSources()->pluck('id');

            Ppmp::whereIn('ppa_funding_source_id', $fundingSourceIds)->delete();

            $aipOutput->fundingSources()->delete();

            $aipOutput->delete();
        });

        // return back()->with('success', 'Output deleted successfully.');
    }
}
