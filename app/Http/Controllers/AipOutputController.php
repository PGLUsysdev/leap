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
        $officeIds = $this->resolveOfficeIds($data);
        $data['sort_order'] ??=
            ((int) $aipEntry->outputs()->max('sort_order')) + 1;

        $aipOutput = $aipEntry->outputs()->create($data);

        if ($officeIds !== null && $officeIds !== []) {
            $aipOutput->offices()->sync($officeIds);
        }

        // return back()->with('success', 'Output added successfully.');
    }

    public function update(
        UpdateAipOutputRequest $request,
        AipOutput $aipOutput,
    ) {
        Gate::authorize('update', $aipOutput->aipEntry);

        $data = $request->validated();
        $officeIds = $this->resolveOfficeIds($data);

        if ($officeIds !== null && $officeIds !== []) {
            $aipOutput->offices()->sync($officeIds);
        }

        $aipOutput->update($data);

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

    /**
     * Normalize office input into a list of office IDs.
     * Supports both the legacy single `office_id` and `office_ids` array.
     */
    private function resolveOfficeIds(array &$data): ?array
    {
        $ids = $data['office_ids'] ??
            (isset($data['office_id']) ? [$data['office_id']] : null);

        unset($data['office_ids'], $data['office_id']);

        if ($ids === null) {
            return null;
        }

        return array_values(array_unique(array_map('intval', $ids)));
    }
}
