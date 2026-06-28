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
        Schema::create('positions', function (Blueprint $table) {
            $table->id();

            $table->string('item_number', 50)->unique();
            $table
                ->foreignId('office_id')
                ->constrained('offices')
                ->onDelete('cascade');
            $table->string('title');
            $table->integer('salary_grade');
            $table
                ->enum('employment_type', [
                    'permanent',
                    'casual',
                    'contractual',
                    'coterminous',
                ])
                ->default('permanent');
            $table->boolean('is_funded');
            $table
                ->enum('status', ['occupied', 'vacant', 'abolished'])
                ->default('vacant');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('positions');
    }
};
