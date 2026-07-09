<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ps_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fiscal_year_id')
                ->constrained('fiscal_years')
                ->onDelete('cascade');
            $table->string('rate_key');
            $table->decimal('rate_value', 12, 2);
            $table->timestamps();

            $table->unique(['fiscal_year_id', 'rate_key']);
            $table->index(['fiscal_year_id', 'rate_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ps_rates');
    }
};
