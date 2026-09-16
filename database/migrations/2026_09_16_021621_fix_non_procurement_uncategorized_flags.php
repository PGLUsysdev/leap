<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * is_additional means "from the Additional items section" only, so the
     * Non-Procurement sentinel is (is_non_procurement: true, is_additional: false).
     */
    public function up(): void
    {
        DB::table('ppmp_categories')
            ->where('name', 'Non-Procurement (Uncategorized)')
            ->update(['is_additional' => false, 'updated_at' => now()]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('ppmp_categories')
            ->where('name', 'Non-Procurement (Uncategorized)')
            ->update(['is_additional' => true, 'updated_at' => now()]);
    }
};
