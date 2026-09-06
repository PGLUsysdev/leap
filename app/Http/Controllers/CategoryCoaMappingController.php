<?php

namespace App\Http\Controllers;

use App\Models\ChartOfAccount;
use App\Models\ChartOfAccountPpmpCategory;
use App\Models\PpmpCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CategoryCoaMappingController extends Controller
{
    public function index()
    {
        return Inertia::render('category-coa-mapping/index', [
            'existingCategories' => PpmpCategory::select(['id', 'name', 'is_non_procurement', 'is_additional'])
                ->orderBy('name')
                ->get(),
            'existingCoas' => ChartOfAccount::select(['id', 'account_number', 'path', 'account_title'])
                ->where('is_postable', true)
                ->orderBy('path')
                ->get(),
            'existingMappings' => ChartOfAccountPpmpCategory::select(['chart_of_account_id', 'ppmp_category_id'])->get(),
        ]);
    }

    public function bulkStore(Request $request)
    {
        Gate::authorize('create', PpmpCategory::class);

        $validated = $request->validate([
            'mappings' => ['required', 'array', 'min:1'],
            'mappings.*.ppmp_category_id' => ['required', 'exists:ppmp_categories,id'],
            'mappings.*.chart_of_account_id' => ['required', 'exists:chart_of_accounts,id'],
        ]);

        $inserted = 0;
        $skipped = 0;

        DB::transaction(function () use ($validated, &$inserted, &$skipped) {
            foreach ($validated['mappings'] as $mapping) {
                $exists = ChartOfAccountPpmpCategory::where('ppmp_category_id', $mapping['ppmp_category_id'])
                    ->where('chart_of_account_id', $mapping['chart_of_account_id'])
                    ->exists();
                if ($exists) {
                    $skipped++;

                    continue;
                }
                ChartOfAccountPpmpCategory::create([
                    'ppmp_category_id' => $mapping['ppmp_category_id'],
                    'chart_of_account_id' => $mapping['chart_of_account_id'],
                ]);
                $inserted++;
            }
        });

        if ($inserted > 0) {
            $msg = $skipped > 0 ? "Created {$inserted} mapping(s), skipped {$skipped} already exists." : "Created {$inserted} mapping(s).";
            Inertia::flash('toast', ['type' => 'success', 'message' => $msg]);
        } else {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'No mappings created — all already exist.']);
        }

        return redirect()->back();
    }
}
