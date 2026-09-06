<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create the pivot table linking outputs to (multiple) offices
        Schema::create('aip_output_office', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aip_output_id')
                ->constrained('aip_outputs')
                ->cascadeOnDelete();
            $table->foreignId('office_id')
                ->constrained('offices')
                ->cascadeOnDelete();
            $table->timestamps();

            // Prevent duplicate (output, office) pairs
            $table->unique(['aip_output_id', 'office_id'], 'aip_output_office_unique');
        });

        // 2. Migrate existing data: one pivot row per output with its current office_id
        // CURRENT_TIMESTAMP works on both MariaDB/MySQL and SQLite (NOW() is MySQL-only)
        DB::statement(
            'INSERT INTO aip_output_office (aip_output_id, office_id, created_at, updated_at)
             SELECT id, office_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM aip_outputs',
        );

        // 3. Drop the old foreign key and column
        Schema::table('aip_outputs', function (Blueprint $table) {
            $table->dropForeign(['office_id']);
            $table->dropColumn('office_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Re-add office_id (nullable while backfilling)
        Schema::table('aip_outputs', function (Blueprint $table) {
            $table->foreignId('office_id')
                ->nullable()
                ->after('aip_entry_id')
                ->constrained('offices')
                ->restrictOnDelete();
        });

        // 2. Backfill: first linked office per output
        DB::table('aip_output_office')
            ->orderBy('id')
            ->each(function ($pivot): void {
                DB::table('aip_outputs')
                    ->where('id', $pivot->aip_output_id)
                    ->whereNull('office_id')
                    ->update(['office_id' => $pivot->office_id]);
            });

        // 3. Fallback: outputs without any linked office inherit the PPA's office
        DB::statement(
            'UPDATE aip_outputs
             SET office_id = (
                 SELECT ppas.office_id
                 FROM aip_entries
                 INNER JOIN ppas ON ppas.id = aip_entries.ppa_id
                 WHERE aip_entries.id = aip_outputs.aip_entry_id
             )
             WHERE office_id IS NULL',
        );

        // 4. Restore the original NOT NULL constraint
        Schema::table('aip_outputs', function (Blueprint $table) {
            $table->dropForeign(['office_id']);
            $table->unsignedBigInteger('office_id')->nullable(false)->change();
        });

        Schema::table('aip_outputs', function (Blueprint $table) {
            $table->foreign('office_id')
                ->references('id')
                ->on('offices')
                ->restrictOnDelete();
        });

        // 5. Drop the pivot table
        Schema::dropIfExists('aip_output_office');
    }
};
