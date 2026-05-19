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
        Schema::create('chart_of_account_ppmp_categories', function (
            Blueprint $table,
        ) {
            $table->id();
            $table->foreignId('chart_of_account_id')->constrained();
            $table->foreignId('ppmp_category_id')->constrained();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chart_of_account_ppmp_categories');
    }
};
