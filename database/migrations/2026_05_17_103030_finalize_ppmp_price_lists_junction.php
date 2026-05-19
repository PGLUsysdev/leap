<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ppmp_price_lists', function (Blueprint $table) {
            // Drop old foreign keys first
            $table->dropForeign(['ppmp_category_id']);
            $table->dropForeign(['chart_of_account_id']);

            // Drop old columns
            $table->dropColumn('ppmp_category_id');
            $table->dropColumn('chart_of_account_id');

            // Make the new column required
            $table
                ->unsignedBigInteger('chart_of_account_ppmp_category_id')
                ->nullable(false)
                ->change();

            // Add final foreign key
            $table
                ->foreign('chart_of_account_ppmp_category_id')
                ->references('id')
                ->on('chart_of_account_ppmp_categories')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('ppmp_price_lists', function (Blueprint $table) {
            // 1. Remove new FK and column
            $table->dropForeign(['chart_of_account_ppmp_category_id']);
            $table->dropColumn('chart_of_account_ppmp_category_id');

            // 2. Re‑add old columns as nullable (data cannot be restored automatically)
            $table->foreignId('ppmp_category_id')->nullable();
            $table->foreignId('chart_of_account_id')->nullable();

            // 3. Re‑add old foreign keys
            $table
                ->foreign('ppmp_category_id')
                ->references('id')
                ->on('ppmp_categories');
            $table
                ->foreign('chart_of_account_id')
                ->references('id')
                ->on('chart_of_accounts');
        });
    }
};
