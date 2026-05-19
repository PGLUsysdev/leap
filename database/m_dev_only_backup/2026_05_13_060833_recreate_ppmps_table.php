<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 1. Force drop the current messy table
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Schema::dropIfExists('ppmps');
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 2. Create the clean, normalized table
        Schema::create('ppmps', function (Blueprint $table) {
            $table->id();

            // This is now the ONLY link to the Activity and the Fund
            $table
                ->foreignId('ppa_funding_source_id')
                ->constrained('ppa_funding_sources')
                ->restrictOnDelete();

            $table
                ->foreignId('ppmp_price_list_id')
                ->nullable()
                ->constrained('ppmp_price_lists')
                ->nullOnDelete();

            // Monthly breakdown
            $months = [
                'jan',
                'feb',
                'mar',
                'apr',
                'may',
                'jun',
                'jul',
                'aug',
                'sep',
                'oct',
                'nov',
                'dec',
            ];
            foreach ($months as $month) {
                $table->integer("{$month}_qty")->default(0);
                $table->decimal("{$month}_amount", 15, 2)->default(0);
            }

            $table->timestamps();

            // Prevent duplicate items for the same activity/fund link
            $table->unique(
                ['ppa_funding_source_id', 'ppmp_price_list_id'],
                'ppmps_price_list_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ppmps');
    }
};
