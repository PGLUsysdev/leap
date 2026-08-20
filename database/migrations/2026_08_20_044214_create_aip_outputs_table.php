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
        Schema::create('aip_outputs', function (Blueprint $table) {
            $table->id();

            // Link to the parent AIP Entry
            $table
                ->foreignId('aip_entry_id')
                ->constrained('aip_entries')
                ->cascadeOnDelete();

            // Each output can belong to a specific office (not necessarily the PPA's office)
            $table
                ->foreignId('office_id')
                ->constrained('offices')
                ->restrictOnDelete();

            // Output-specific details
            $table->text('expected_output')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            // Optional: ordering within the AIP Entry
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->timestamps();

            $table->unique(
                ['aip_entry_id', 'expected_output'],
                'aip_outputs_unique',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('aip_outputs');
    }
};
