<?php

namespace App\Http\Controllers;

use App\Models\PpmpCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CategoryImportController extends Controller
{
    public function index()
    {
        return Inertia::render('category-import/index', [
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
            'categories.*.is_additional' => ['sometimes', 'boolean'],
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
            $isAdditional = $cat['is_additional'] ?? false;
            PpmpCategory::create(['name' => $raw, 'is_non_procurement' => false, 'is_additional' => (bool) $isAdditional]);
            $existing[$norm] = $raw;
            $inserted++;
            $details[] = ['row' => $i + 1, 'raw' => $raw, 'status' => 'inserted', 'is_additional' => (bool) $isAdditional];
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
            Inertia::flash('toast', ['type' => 'error', 'message' => "No categories imported — all duplicates or invalid."]);
        }

        return redirect()->back();
    }
}
