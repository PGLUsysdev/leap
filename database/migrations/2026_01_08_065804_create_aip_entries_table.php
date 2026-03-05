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
        Schema::create('aip_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fiscal_year_id')->constrained();
            $table
                ->foreignId('ppa_id')
                ->constrained('ppas')
                ->onDelete('cascade');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->text('expected_output')->nullable();
            $table
                ->foreignId('funding_source_id')
                ->nullable()
                ->constrained('funding_sources');

            $table->decimal('ps_amount', 19, 2)->default(0);
            $table->decimal('mooe_amount', 19, 2)->default(0);
            $table->decimal('fe_amount', 19, 2)->default(0);
            $table->decimal('co_amount', 19, 2)->default(0);

            $table->decimal('total_amount', 19, 2)->default(0);

            $table->decimal('ccet_adaptation', 19, 2)->default(0);
            $table->decimal('ccet_mitigation', 19, 2)->default(0);
            // $table
            //     ->foreignId('ccet_typology_id')
            //     ->nullable()
            //     ->constrained('ref_ccet_typologies');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('aip_entries');
    }
};
