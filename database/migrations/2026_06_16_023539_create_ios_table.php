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
        Schema::create('ios', function (Blueprint $table) {
            $table->id();
            $table->string('occupational_service_code');
            $table->string('occupational_group_code');
            $table->string('class_id');
            $table->string('class');
            $table->integer('salary_grade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ios');
    }
};
