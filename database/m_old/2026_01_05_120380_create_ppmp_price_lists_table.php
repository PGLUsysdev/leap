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
        Schema::create('ppmp_price_lists', function (Blueprint $table) {
            $table->id();
            $table->integer('item_number')->unique();
            $table->text('description');
            $table->string('unit_of_measurement', 20);
            $table->decimal('price', 19, 2);
            $table->foreignId('ppmp_category_id')->constrained();
            $table->foreignId('chart_of_account_id')->constrained();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ppmp_price_lists');
    }
};
