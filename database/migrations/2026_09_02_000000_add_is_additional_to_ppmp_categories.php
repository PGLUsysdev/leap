<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ppmp_categories', function (Blueprint $table) {
            $table->boolean('is_additional')->default(false)->after('is_non_procurement');
        });

        // Create sentinel categories for Additional and Non-Procurement COA-only items
        // Use updateOrInsert to avoid touching PpmpCategorySeeder
        $now = now();

        DB::table('ppmp_categories')->updateOrInsert(
            ['name' => 'Additional Items (Uncategorized)'],
            [
                'is_non_procurement' => false,
                'is_additional' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('ppmp_categories')->updateOrInsert(
            ['name' => 'Non-Procurement (Uncategorized)'],
            [
                'is_non_procurement' => true,
                'is_additional' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
    }

    public function down(): void
    {
        DB::table('ppmp_categories')->where('name', 'Additional Items (Uncategorized)')->delete();
        DB::table('ppmp_categories')->where('name', 'Non-Procurement (Uncategorized)')->delete();

        Schema::table('ppmp_categories', function (Blueprint $table) {
            $table->dropColumn('is_additional');
        });
    }
};
