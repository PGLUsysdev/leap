<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('ppmp_summaries');
        Schema::dropIfExists('account_groups');
        Schema::dropIfExists('allotment_classes');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('account_groups', function (Blueprint $table) {
            $table->id();
            $table->string('uacs_digit', 1)->unique();
            $table->string('name');
            $table->enum('normal_balance', ['debit', 'credit']);
            $table->timestamps();
        });

        Schema::create('allotment_classes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('name');
            $table->timestamps();
        });

        // this table is not being used
        Schema::create('ppmp_summaries', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });
    }
};
