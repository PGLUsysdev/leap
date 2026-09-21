<?php

use App\Services\ChartOfAccountClassifier;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Backfill expense_class on chart of accounts rows that never had it
     * classified (e.g. seeded before classification existed). Only touches
     * rows where expense_class is currently NULL so manual edits are kept.
     */
    public function up(): void
    {
        $cases = collect(ChartOfAccountClassifier::prefixMap())
            ->map(fn (string $class, string $prefix) => "WHEN path LIKE '{$prefix}%' THEN '{$class}'")
            ->implode(' ');

        DB::table('chart_of_accounts')
            ->whereNull('expense_class')
            ->update([
                'expense_class' => DB::raw(
                    "(CASE {$cases} ELSE expense_class END)"
                ),
            ]);
    }

    /**
     * Irreversible on purpose: clearing the classes again would also wipe
     * classifications an admin set manually after the backfill.
     */
    public function down(): void
    {
        //
    }
};
