<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePpaRequest;
use App\Http\Requests\UpdatePpaRequest;
use App\Models\AipEntry;
use App\Models\FiscalYear;
use App\Models\Office;
use App\Models\Ppa;
use App\Services\PSPoolService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PpaController extends Controller
{
    /**
     * Get all office IDs in the hierarchy (parent + all descendants).
     */
    private function getOfficeHierarchyIds($officeId): array
    {
        if (! $officeId) {
            return [];
        }

        $officeIds = [(int) $officeId];
        $children = $this->getChildOfficeIds((int) $officeId);

        return array_merge($officeIds, $children);
    }

    /**
     * Recursively get child office IDs.
     */
    private function getChildOfficeIds($parentId): array
    {
        $children = Office::where('parent_id', $parentId)->pluck('id')->toArray();
        $descendants = $children;
        foreach ($children as $childId) {
            $descendants = array_merge($descendants, $this->getChildOfficeIds($childId));
        }

        return $descendants;
    }

    public function index(Request $request)
    {
        Gate::authorize('viewAny', Ppa::class);

        $user = request()->user();
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        $showAll = $permissions->contains('ppa.show.all');
        $userOfficeId = $showAll ? $request->query('selected_office_id') : $user->office_id;

        // Build office ID list (including sub‑offices) if a base office is selected
        $officeIds = $userOfficeId ? $this->getOfficeHierarchyIds($userOfficeId) : null;

        $mode = $request->query('dialog_mode');

        return Inertia::render('ppa/index', [
            'can' => [
                'add' => $user->can('create', Ppa::class),
                'import' => $user->can('importLastYearPpa', Ppa::class),
            ],
            'showAllOffices' => $showAll,
            'selectedOfficeId' => $userOfficeId ? (int) $userOfficeId : null,
            'parentOffices' => Office::whereNull('parent_id')->get(),
            'ppaTree' => $this->getPpaQuery($request, $officeIds, 'id', 'search')
                ->paginate(100)
                ->withQueryString()
                ->through(function ($ppa) use ($user) {
                    $ppa->can = [
                        'edit' => $user->can('update', $ppa),
                        'delete' => $user->can('delete', $ppa),
                        'move' => $user->can('move', $ppa),
                    ];

                    return $ppa;
                }),

            'current' => $request->query('id')
                ? $this->flattenAncestors(Ppa::with('parent.parent')->find($request->query('id')))
                : [],

            'offices' => Office::with(['sector', 'lguLevel', 'officeType'])->get(),

            'filters' => $request->only([
                'id',
                'search',
                'page',
                'dialog_id',
                'dialog_search',
                'dialog_page',
                'dialog_mode',
                'selected_office_id',
            ]),

            'dialogPpaTree' => Inertia::optional(function () use (
                $request,
                $officeIds,
                $user,
                $mode,
            ) {
                if ($mode === 'import') {
                    return $this->getPreviousYearPpas($request, $officeIds);
                }

                return $this->getPpaQuery($request, $officeIds, 'dialog_id', 'dialog_search')
                    ->paginate(100, ['*'], 'dialog_page')
                    ->withQueryString()
                    ->through(function ($ppa) use ($user) {
                        $ppa->can = [
                            'edit' => $user->can('update', $ppa),
                            'delete' => $user->can('delete', $ppa),
                            'move' => $user->can('move', $ppa),
                        ];

                        return $ppa;
                    });
            }),

            'dialogCurrent' => Inertia::optional(function () use ($request) {
                $id = $request->query('dialog_id');
                if (! $id) {
                    return [];
                }
                $ppa = Ppa::with('parent.parent')->find($id);

                return $ppa ? $this->flattenAncestors($ppa) : [];
            }),

            'ppaTypes' => array_keys(config('ppa.type_padding')),
            'ppaTypePadding' => config('ppa.type_padding'),
        ]);
    }

    /**
     * Build the PPA query with office filtering (including sub‑offices)
     * and hierarchy navigation.
     */
    private function getPpaQuery($request, $officeIds, $idKey, $searchKey)
    {
        $fiscalYearId = session('active_fiscal_year_id');
        $id = $request->query($idKey);
        $search = $request->query($searchKey);

        return Ppa::when(
            $officeIds,
            fn ($q) => $q->whereIn('office_id', $officeIds),
            fn ($q) => $q, // no office filter if null (show all)
        )
            ->where('fiscal_year_id', $fiscalYearId)
            ->when(
                $id,
                function ($q) use ($id) {
                    return $q->where('parent_id', $id);
                },
                function ($q) {
                    return $q->whereNull('parent_id');
                },
            )
            ->when($search, function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner
                        ->where('name', 'like', "%$search%")
                        ->orWhere('code_suffix', 'like', "%$search%");

                    if (str_contains($search, '-')) {
                        $segments = explode('-', $search);
                        $lastSegment = end($segments);
                        if ($lastSegment) {
                            $inner->orWhere('code_suffix', 'like', "%$lastSegment%");
                        }
                    }
                });
            })
            ->orderBy('sort_order', 'asc')
            ->withCount('children');
    }

    /**
     * Get previous year PPAs for import, respecting office hierarchy.
     */
    public function getPreviousYearPpas($request, $officeIds)
    {
        $currentFiscalYearId = session('active_fiscal_year_id');
        $currentYear = FiscalYear::find($currentFiscalYearId);
        $prevYear = FiscalYear::where('year', $currentYear->year - 1)->first();
        $prevYearId = $prevYear->id;

        $id = $request->query('dialog_id');
        $search = $request->query('dialog_search');

        return Ppa::when($officeIds, fn ($q) => $q->whereIn('office_id', $officeIds), fn ($q) => $q)
            ->where('fiscal_year_id', $prevYearId)
            ->when(
                $id,
                function ($q) use ($id) {
                    return $q->where('parent_id', $id);
                },
                function ($q) {
                    return $q->whereNull('parent_id');
                },
            )
            ->when($search, function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner
                        ->where('name', 'like', "%$search%")
                        ->orWhere('code_suffix', 'like', "%$search%");

                    if (str_contains($search, '-')) {
                        $segments = explode('-', $search);
                        $lastSegment = end($segments);
                        if ($lastSegment) {
                            $inner->orWhere('code_suffix', 'like', "%$lastSegment%");
                        }
                    }
                });
            })
            ->orderBy('sort_order', 'asc')
            ->withCount('children')
            ->paginate(100, ['*'], 'dialog_page')
            ->withQueryString();
    }

    /**
     * Flatten ancestors for breadcrumbs.
     */
    private function flattenAncestors($ppa)
    {
        $result = [];
        $current = $ppa;

        while ($current) {
            $item = $current->toArray();
            unset($item['parent']);
            $result[] = $item;
            $current = $current->parent;
        }

        return $result;
    }

    /**
     * Store a newly created PPA.
     */
    public function store(StorePpaRequest $request)
    {
        Gate::authorize('create', Ppa::class);

        $validated = $request->validated();
        $parentId = $validated['parent_id'] ?? null;
        $type = $validated['type'];
        $fiscalYearId = session('active_fiscal_year_id');

        $user = Auth::user();
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        $showAll = $permissions->contains('ppa.show.all');

        if ($parentId) {
            $parent = Ppa::findOrFail($parentId);
            abort_if(! $showAll && $parent->office_id !== $user->office_id, 403);
            $officeId = $parent->office_id;
        } else {
            $officeId = $showAll ? $validated['office_id'] : $user->office_id;
        }

        $stats = Ppa::where('office_id', $officeId)
            ->where('parent_id', $parentId)
            ->where('fiscal_year_id', $fiscalYearId)
            ->selectRaw('COUNT(*) as total, MAX(sort_order) as max_sort')
            ->first();

        $siblingCount = $stats->total ?? 0;
        $maxSortOrder = $stats->max_sort ?? -1;
        $sortOrder = $maxSortOrder + 1;
        $codeSuffix = (string) ($siblingCount + 1);

        $validated['code_suffix'] = $codeSuffix;
        $validated['sort_order'] = $sortOrder;
        $validated['fiscal_year_id'] = $fiscalYearId;
        $validated['office_id'] = $officeId;

        Ppa::create($validated);
    }

    /**
     * Update an existing PPA.
     */
    public function update(UpdatePpaRequest $request, Ppa $ppa)
    {
        Gate::authorize('update', $ppa);
        $validated = $request->validated();
        $ppa->update($validated);
    }

    /**
     * Move a PPA (re‑order or change parent).
     */
    public function move(Request $request, Ppa $ppa)
    {
        Gate::authorize('move', $ppa);

        $target = Ppa::findOrFail($request->target_id);
        $direction = $request->direction;

        $officeId = $ppa->office_id;
        $fiscalYearId = $ppa->fiscal_year_id;
        $oldParentId = $ppa->parent_id;

        $isSibling = $target->type === $ppa->type;
        $newParentId = $isSibling ? $target->parent_id : $target->id;

        DB::transaction(function () use (
            $ppa,
            $target,
            $direction,
            $isSibling,
            $oldParentId,
            $newParentId,
            $officeId,
            $fiscalYearId,
        ) {
            // 1. Move with temporary suffix
            $ppa->update([
                'parent_id' => $newParentId,
                'code_suffix' => 'MOVING_'.$ppa->id,
                'sort_order' => $isSibling
                    ? ($direction === 'top'
                        ? $target->sort_order - 0.5
                        : $target->sort_order + 0.5)
                    : ($direction === 'top'
                        ? -1
                        : 999999),
            ]);

            // 2. Re‑index target folder
            $this->syncSiblingIndexes($newParentId, $officeId, $ppa->type, $fiscalYearId);

            // 3. Re‑index source folder if different
            if ($oldParentId !== $newParentId) {
                $this->syncSiblingIndexes($oldParentId, $officeId, $ppa->type, $fiscalYearId);
            }
        });

        return to_route('ppa.index', $request->query());
    }

    /**
     * Re‑index siblings after a move or delete.
     */
    protected function syncSiblingIndexes($parentId, $officeId, $type, $fiscalYearId)
    {
        $query = Ppa::where('office_id', $officeId)
            ->where('fiscal_year_id', $fiscalYearId)
            ->where('type', $type)
            ->orderBy('sort_order');

        if (is_null($parentId)) {
            $query->whereNull('parent_id');
        } else {
            $query->where('parent_id', $parentId);
        }

        $siblings = $query->get();

        foreach ($siblings as $sibling) {
            $sibling->update(['code_suffix' => 'TEMP_'.$sibling->id]);
        }

        foreach ($siblings as $index => $sibling) {
            $newPos = $index + 1;
            $sibling->update([
                'sort_order' => (float) $newPos,
                'code_suffix' => (string) $newPos,
            ]);
        }
    }

    /**
     * Delete a PPA and its descendants.
     */
    public function destroy(Ppa $ppa)
    {
        Gate::authorize('delete', $ppa);

        $allIds = $this->getAllDescendantIds($ppa);
        $hasDependencies = AipEntry::whereIn('ppa_id', $allIds)->exists();

        if ($hasDependencies) {
            return redirect()
                ->back()
                ->withErrors([
                    'error' => 'Cannot delete: This PPA or its sub‑items are linked to existing AIP entries.',
                ]);
        }

        $parentId = $ppa->parent_id;
        $officeId = $ppa->office_id;
        $type = $ppa->type;
        $fiscalYearId = $ppa->fiscal_year_id;

        DB::transaction(function () use ($ppa, $parentId, $officeId, $type, $fiscalYearId) {
            $ppa->delete(); // cascade deletes children
            $this->syncSiblingIndexes($parentId, $officeId, $type, $fiscalYearId);
        });

        return redirect()->back()->with('success', 'PPA and all sub‑items deleted successfully.');
    }

    /**
     * Recursively collect all descendant PPA IDs.
     */
    private function getAllDescendantIds($ppa, &$ids = [])
    {
        $ids[] = $ppa->id;
        foreach ($ppa->children as $child) {
            $this->getAllDescendantIds($child, $ids);
        }

        return $ids;
    }

    /**
     * Import selected PPAs from previous year.
     */
    public function importFromPreviousYear(Request $request)
    {
        Gate::authorize('importLastYearPpa', Ppa::class);

        $request->validate([
            'ppa_ids' => 'required|array',
            'ppa_ids.*' => 'integer',
        ]);

        $user = Auth::user();
        $user->loadMissing('role.permissionRoles.permission');
        $permissions = $user->role->permissionRoles->pluck('permission.name');
        $showAll = $permissions->contains('ppa.show.all');
        $userOfficeId = $showAll
            ? $request->input('office_id', $user->office_id)
            : $user->office_id;

        $currentFiscalYearId = session('active_fiscal_year_id');

        if (! $currentFiscalYearId) {
            return redirect()
                ->back()
                ->withErrors(['error' => 'No active fiscal year set']);
        }

        $currentFiscalYear = FiscalYear::find($currentFiscalYearId);
        if (! $currentFiscalYear) {
            return redirect()
                ->back()
                ->withErrors(['error' => 'Current fiscal year not found']);
        }

        $previousFiscalYear = FiscalYear::where('year', $currentFiscalYear->year - 1)->first();
        if (! $previousFiscalYear) {
            return redirect()
                ->back()
                ->withErrors(['error' => 'Previous fiscal year not found']);
        }

        $previousFiscalYearId = $previousFiscalYear->id;
        $ppaIds = $request->input('ppa_ids');

        try {
            DB::beginTransaction();

            $importedCount = 0;
            $parentIdMap = [];

            $originalPpas = Ppa::whereIn('id', $ppaIds)
                ->where('fiscal_year_id', $previousFiscalYearId)
                ->where('office_id', $userOfficeId)
                ->orderByRaw('CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END')
                ->orderBy('sort_order')
                ->get();

            foreach ($originalPpas as $originalPpa) {
                $newParentId = null;
                if ($originalPpa->parent_id && isset($parentIdMap[$originalPpa->parent_id])) {
                    $newParentId = $parentIdMap[$originalPpa->parent_id];
                }

                $newPpa = $originalPpa->replicate();
                $newPpa->fiscal_year_id = $currentFiscalYearId;
                $newPpa->parent_id = $newParentId;

                $stats = Ppa::where('office_id', $userOfficeId)
                    ->where('parent_id', $newParentId)
                    ->where('fiscal_year_id', $currentFiscalYearId)
                    ->selectRaw('COUNT(*) as total, MAX(sort_order) as max_sort')
                    ->first();

                $siblingCount = $stats->total ?? 0;
                $maxSortOrder = $stats->max_sort ?? -1;
                $sortOrder = $maxSortOrder + 1;
                $codeSuffix = (string) ($siblingCount + 1);

                $newPpa->sort_order = $sortOrder;
                $newPpa->code_suffix = $codeSuffix;
                $newPpa->save();

                $parentIdMap[$originalPpa->id] = $newPpa->id;
                $importedCount++;
            }

            DB::commit();

            return redirect()
                ->back()
                ->with('success', "Successfully imported {$importedCount} PPAs.");
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()
                ->back()
                ->withErrors([
                    'error' => 'Error importing PPAs: '.$e->getMessage(),
                ]);
        }
    }

    /**
     * Set a PPA as the PS pool.
     * Moves the previous pool's ps_amount over and rebuilds this PPA as a
     * single PS-only funding source (funding_source_id = 1).
     */
    public function setAsPsPool(Ppa $ppa, PSPoolService $poolService)
    {
        Gate::authorize('setPsPool', AipEntry::class);

        try {
            $transferred = DB::transaction(function () use ($ppa, $poolService) {
                $oldPool = Ppa::psPoolForFiscalYear($ppa->fiscal_year_id)->lockForUpdate()->first();

                $transferred = $poolService->handoff($oldPool, $ppa);

                $poolService->setPool($ppa);

                return $transferred;
            });

            $message = "{$ppa->name} is now the PS pool.";

            if ($transferred > 0) {
                $message .=
                    ' '.
                    number_format($transferred, 2).
                    ' in PS was transferred from the previous pool.';
            }

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => $message,
            ]);

            return redirect()->back();
        } catch (\Exception $e) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => $e->getMessage(),
            ]);

            return redirect()->back();
        }
    }
}
