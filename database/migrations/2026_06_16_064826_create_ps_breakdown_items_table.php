<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('ps_breakdown_items', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('ppa_funding_source_id')
                ->constrained('ppa_funding_sources')
                ->cascadeOnDelete();
            $table
                ->foreignId('chart_of_account_id')
                ->constrained('chart_of_accounts')
                ->cascadeOnDelete();
            $table
                ->foreignId('position_id')
                ->nullable()
                ->constrained('positions')
                ->cascadeOnDelete();

            $table->decimal('amount', 15, 2)->default(0);
            $table->boolean('is_manual')->default(false);

            $table->timestamps();

            $table->unique(
                ['ppa_funding_source_id', 'chart_of_account_id', 'position_id'],
                'uq_ps_breakdown_fs_coa_pos',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ps_breakdown_items');
    }
};
