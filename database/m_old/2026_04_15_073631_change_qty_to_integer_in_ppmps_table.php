<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ppmps', function (Blueprint $table) {
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
                // Using unsignedBigInteger or integer depending on your needs
                // .00 values will be truncated to whole numbers automatically
                $table
                    ->integer("{$month}_qty")
                    ->default(0)
                    ->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ppmps', function (Blueprint $table) {
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
                $table
                    ->decimal("{$month}_qty", 19, 2)
                    ->default(0)
                    ->change();
            }
        });
    }
};
