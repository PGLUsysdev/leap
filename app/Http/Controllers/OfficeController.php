<?php

namespace App\Http\Controllers;

use App\Models\Office;
use App\Models\Sector;
use App\Models\LguLevel;
use App\Models\OfficeType;
use App\Http\Requests\StoreOfficeRequest;
use App\Http\Requests\UpdateOfficeRequest;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OfficeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $this->authorize('viewAny', Office::class);

        $user = auth()->user();
        $query = Office::with([
            'sector',
            'lguLevel',
            'officeType',
            'parent',
            'children',
        ]);

        if (!$user->office_id) {
            $offices = $query->whereNull('parent_id')->get();
        } else {
            $offices = $query->where('id', $user->office_id)->get();
        }

        return Inertia::render('offices/index', [
            'offices' => $offices,
            'sectors' => Sector::all(),
            'lguLevels' => LguLevel::all(),
            'officeTypes' => OfficeType::all(),
            'can' => [
                'addOffice' => request()->user()->can('createOffice', Office::class),
                'addSubUnit' => request()->user()->can('createSubUnit', new Office()),
                'editOffice' => request()->user()->can('updateOffice', new Office()),
                'editSubUnit' => request()->user()->can('updateSubUnit', new Office()),
                'deleteOffice' => request()->user()->can('deleteOffice', new Office()),
                'deleteSubUnit' => request()->user()->can('deleteSubUnit', new Office()),
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
    public function store(StoreOfficeRequest $request)
    {
        $validated = $request->validated();

        if (!empty($validated['parent_id'])) {
            // Find the target parent office they want to add a sub-unit to
            $parentOffice = Office::findOrFail($validated['parent_id']);

            // Authorize using the parent office instance
            $this->authorize('createSubUnit', $parentOffice);
        } else {
            // No parent_id means it's a main office. Authorize against the class globally.
            $this->authorize('createOffice', Office::class);
        }

        Office::create($validated);
    }

    /**
     * Display the specified resource.
     */
    public function show(Office $office)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Office $office)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateOfficeRequest $request, Office $office)
    {
        $validated = $request->validated();

        Log::info($validated);

        // checks if its an office or sub-unit then applies different authorizations
        if (!empty($validated['parent_id'])) {
            // sub-unit
            // find the main office of this sub-unit
            $parentOffice = Office::findOrFail($validated['parent_id']);

            $this->authorize('updateSubUnit', $parentOffice);
        } else {
            // office
            $this->authorize('updateOffice', $office);
        }

        // Check if account code fields have changed
        $codeFieldsChanged =
            $office->sector_id != $validated['sector_id'] ||
            $office->lgu_level_id != $validated['lgu_level_id'] ||
            $office->office_type_id != $validated['office_type_id'] ||
            $office->code != $validated['code'];

        // Update the office
        $office->update($validated);

        // If code fields changed and office has children, update all direct children
        if ($codeFieldsChanged && $office->children()->exists()) {
            DB::transaction(function () use ($office, $validated) {
                $office->children()->update([
                    'sector_id' => $validated['sector_id'],
                    'lgu_level_id' => $validated['lgu_level_id'],
                    'office_type_id' => $validated['office_type_id'],
                    'code' => $validated['code'],
                ]);
            });
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Office $office)
    {
        // Log::info($office);

        if (!empty($office['parent_id'])) {
            $parentOffice = Office::findOrFail($office['parent_id']);
            $this->authorize('deleteSubUnit', $parentOffice);
        } else {
            $this->authorize('deleteOffice', $office);
        }

        $officeName = $office->name;
        $blockers = [];

        // 1. Check direct dependencies (Users/PPAs on the parent office itself)
        if ($office->users()->exists()) {
            $blockers[] = 'active users';
        }
        if ($office->ppas()->exists()) {
            $blockers[] = 'assigned PPAs';
        }

        // 2. Check ONLY for sub-units that are "dirty" (have users or PPAs)
        // We ignore sub-units that are empty.
        $hasDirtySubUnits = $office
            ->children()
            ->where(function ($query) {
                $query->whereHas('users')->orWhereHas('ppas');
            })
            ->exists();

        if ($hasDirtySubUnits) {
            $blockers[] = 'sub-units with active data';
        }

        // 3. Construct the message
        if (!empty($blockers)) {
            $reason =
                count($blockers) > 1
                    ? implode(', ', array_slice($blockers, 0, -1)) .
                        ' and ' .
                        end($blockers)
                    : $blockers[0];

            $message = "Cannot delete '{$officeName}' because it has {$reason} depending on it.";

            return back()->withErrors(['office_delete' => $message]);
        }

        // 4. Success: Delete the office and its empty sub-units
        // Note: You must delete the children first to avoid foreign key constraint errors
        $office->children()->delete();
        $office->delete();

        return back()->with(
            'success',
            'Office and its empty sub-units deleted.',
        );
    }

    /**
     * Recursively collect all descendant office IDs.
     */
    private function getAllDescendantIds(Office $office): array
    {
        $ids = [];

        foreach ($office->children as $child) {
            $ids[] = $child->id;
            $ids = array_merge($ids, $this->getAllDescendantIds($child));
        }

        return $ids;
    }
}
