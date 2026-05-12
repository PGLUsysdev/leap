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

class OfficeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = auth()->user();
        $query = Office::with([
            'sector',
            'lguLevel',
            'officeType',
            'parent',
            'children',
        ]);

        if ($user->role === 'admin' || !$user->office_id) {
            // Only get the Top-Level parents; children are nested inside them
            $offices = $query->whereNull('parent_id')->get();
        } else {
            // Only get the User's specific office; children are nested inside it
            $offices = $query->where('id', $user->office_id)->get();
        }

        return Inertia::render('offices/index', [
            'offices' => $offices,
            'sectors' => Sector::all(),
            'lguLevels' => LguLevel::all(),
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
    public function store(StoreOfficeRequest $request)
    {
        $validated = $request->validated();

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
        // 1. Get the hierarchy
        $allOffices = $office->children()->get()->push($office);
        // Or if you prefer using your helper:
        $descendantIds = $this->getAllDescendantIds($office);
        $allOffices = \App\Models\Office::whereIn(
            'id',
            array_merge([$office->id], $descendantIds),
        )->get();

        // 2. Iterate through each office to find the blocker
        foreach ($allOffices as $o) {
            $hasUsers = \App\Models\User::where('office_id', $o->id)->exists();
            $hasPPAs = \App\Models\Ppa::where('office_id', $o->id)->exists();

            if ($hasUsers || $hasPPAs) {
                $type =
                    $o->id === $office->id
                        ? 'the main office'
                        : "sub-unit '{$o->name}'";
                $dependency = $hasUsers ? 'users' : 'PPAs';

                return redirect()
                    ->back()
                    ->withErrors([
                        'office_delete' => "Cannot delete: {$type} has active {$dependency} assigned.",
                    ]);
            }
        }

        // 3. Proceed with deletion...
        try {
            DB::transaction(function () use ($office) {
                Office::whereIn(
                    'id',
                    $this->getAllDescendantIds($office),
                )->delete();
                $office->delete();
            });
            return redirect()->back()->with('success', 'Deleted successfully.');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->withErrors([
                    'office_delete' => 'An unexpected error occurred.',
                ]);
        }
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
