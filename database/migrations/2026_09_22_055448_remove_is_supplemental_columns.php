<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Removes the redundant `is_supplemental` boolean columns. The presence
     * of a non-null `supplemental_aip_id` already indicates that a row is
     * supplemental, so the boolean adds no information and can drift out
     * of sync (e.g. when the related supplemental AIP is deleted and
     * `supplemental_aip_id` is set to null while `is_supplemental` stays true).
     */
    public function up(): void
    {
        Schema::table('aip_entries', function (Blueprint $table) {
            $table->dropColumn('is_supplemental');
        });

        Schema::table('ppas', function (Blueprint $table) {
            $table->dropColumn('is_supplemental');
        });

        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->dropColumn('is_supplemental');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Re-adds the columns with their original default (false). This is
     * provided for rollback convenience only; the columns remain redundant.
     */
    public function down(): void
    {
        Schema::table('aip_entries', function (Blueprint $table) {
            $table->boolean('is_supplemental')
                ->default(false)
                ->after('supplemental_aip_id');
        });

        Schema::table('ppas', function (Blueprint $table) {
            $table->boolean('is_supplemental')
                ->default(false)
                ->after('supplemental_aip_id');
        });

        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->boolean('is_supplemental')
                ->default(false)
                ->after('supplemental_aip_id');
        });
    }
};
