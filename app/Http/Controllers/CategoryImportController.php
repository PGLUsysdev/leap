<?php

namespace App\Http\Controllers;

use App\Models\PpmpCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CategoryImportController extends Controller
{
    private const SENTINELS = [
        ['name' => 'Additional Items (Uncategorized)', 'is_non_procurement' => false, 'is_additional' => true],
        ['name' => 'Non-Procurement (Uncategorized)', 'is_non_procurement' => true, 'is_additional' => true],
    ];
    public function index()
    {
        Gate::authorize('viewAny', PpmpCategory::class);

        return Inertia::render('imports/category-import/index', [
            'existingCategories' => PpmpCategory::select(['id', 'name', 'is_non_procurement', 'is_additional'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('create', PpmpCategory::class);

        $validated = $request->validate([
            'categories' => ['required', 'array', 'min:1'],
            'categories.*.name' => ['required', 'string', 'max:255'],
            'categories.*.normalized' => ['nullable', 'string', 'max:255'],
        ]);

        $normalize = fn (string $s) => strtolower(trim(preg_replace('/\s+/', ' ', $s) ?? $s));

        $inserted = 0;
        $skipped = 0;
        $details = [];

        // Build normalized existing map for strict dedupe
        $existing = PpmpCategory::pluck('name')->mapWithKeys(fn ($name) => [$normalize($name) => $name])->toArray();

        foreach ($validated['categories'] as $i => $cat) {
            $raw = trim($cat['name']);
            $norm = $normalize($raw);
            if ($norm === '') {
                $skipped++;
                $details[] = ['row' => $i + 1, 'raw' => $raw, 'status' => 'skipped: empty after normalize'];

                continue;
            }
            if (isset($existing[$norm])) {
                $skipped++;
                $details[] = ['row' => $i + 1, 'raw' => $raw, 'status' => 'skipped: exists', 'existing' => $existing[$norm]];

                continue;
            }
            PpmpCategory::create(['name' => $raw, 'is_non_procurement' => false, 'is_additional' => false]);
            $existing[$norm] = $raw;
            $inserted++;
            $details[] = ['row' => $i + 1, 'raw' => $raw, 'status' => 'inserted'];
        }

        Inertia::flash('importReport', [
            'total' => count($validated['categories']),
            'inserted' => $inserted,
            'skipped' => $skipped,
            'details' => $details,
            'status' => $skipped > 0 && $inserted > 0 ? 'partial_success' : ($inserted > 0 ? 'success' : 'failed'),
        ]);

        if ($skipped > 0 && $inserted > 0) {
            Inertia::flash('toast', ['type' => 'success', 'message' => "Imported {$inserted}, skipped {$skipped} existing."]);
        } elseif ($inserted > 0) {
            Inertia::flash('toast', ['type' => 'success', 'message' => "Imported {$inserted} categories."]);
        } else {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'No categories imported — all duplicates or invalid.']);
        }

        return redirect()->back();
    }

    public function ensureSentinels()
    {
        $details = [];

        foreach (self::SENTINELS as $sentinel) {
            $category = PpmpCategory::firstOrNew(['name' => $sentinel['name']]);
            $wasNew = ! $category->exists;
            $fixed = ! $wasNew && ((bool) $category->is_non_procurement !== $sentinel['is_non_procurement'] || (bool) $category->is_additional !== $sentinel['is_additional']);

            $category->fill([
                'is_non_procurement' => $sentinel['is_non_procurement'],
                'is_additional' => $sentinel['is_additional'],
            ]);
            $category->save();

            $details[] = [
                'name' => $sentinel['name'],
                'status' => $wasNew ? 'inserted' : ($fixed ? 'fixed' : 'exists'),
            ];
        }

        $changed = collect($details)->filter(fn ($d) => $d['status'] !== 'exists')->count();

        Inertia::flash('sentinelReport', ['details' => $details, 'changed' => $changed]);

        if ($changed > 0) {
            Inertia::flash('toast', ['type' => 'success', 'message' => "Ensured {$changed} system categor".($changed === 1 ? 'y' : 'ies').'.']);
        } else {
            Inertia::flash('toast', ['type' => 'success', 'message' => 'System categories already exist.']);
        }

        return redirect()->back();
    }
}
