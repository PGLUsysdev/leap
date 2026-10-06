<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fe_breakdown_items', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('ppa_funding_source_id')
                ->constrained('ppa_funding_sources')
                ->cascadeOnDelete();
            $table
                ->foreignId('chart_of_account_id')
                ->constrained('chart_of_accounts')
                ->cascadeOnDelete();

            $table->decimal('amount', 15, 2)->default(0);

            $table->timestamps();

            $table->unique(
                ['ppa_funding_source_id', 'chart_of_account_id'],
                'uq_fe_breakdown_fs_coa',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fe_breakdown_items');
    }
};
