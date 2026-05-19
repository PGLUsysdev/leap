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
        Schema::table('ppmp_price_lists', function (Blueprint $table) {
            $table->dropUnique('ppmp_price_lists_item_number_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ppmp_price_lists', function (Blueprint $table) {
            $table->unique('item_number');
        });
    }
};
