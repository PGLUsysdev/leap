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
        Schema::create('ppa_funding_sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ppa_id')->constrained();
            $table->foreignId('funding_source_id')->constrained();
            $table->decimal('ps_amount', 19, 2)->default(0);
            $table->decimal('mooe_amount', 19, 2)->default(0);
            $table->decimal('fe_amount', 19, 2)->default(0);
            $table->decimal('co_amount', 19, 2)->default(0);
            $table->decimal('ccet_adaptation', 19, 2)->default(0);
            $table->decimal('ccet_mitigation', 19, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ppa_funding_sources');
    }
};
