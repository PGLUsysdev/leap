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
        Schema::create('salary_standards', function (Blueprint $table) {
            $table->id();
            $table
                ->foreignId('fiscal_year_id')
                ->constrained('fiscal_years')
                ->onDelete('cascade');
            $table->integer('salary_grade');
            $table->integer('step_increment');
            $table->decimal('monthly_rate', 15, 2); // 15 for scalability
            $table->timestamps();

            $table->unique(
                ['fiscal_year_id', 'salary_grade', 'step_increment'],
                'salary_standards_unique',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_standards');
    }
};
