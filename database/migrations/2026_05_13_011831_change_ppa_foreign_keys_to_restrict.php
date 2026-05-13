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
        // 1. Update 'ppas' table to restrict self-referencing deletes
        Schema::table('ppas', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table
                ->foreign('parent_id')
                ->references('id')
                ->on('ppas')
                ->cascadeOnDelete();
        });

        // 2. Update 'aip_entries' table to restrict PPA deletes
        Schema::table('aip_entries', function (Blueprint $table) {
            $table->dropForeign(['ppa_id']);
            $table
                ->foreign('ppa_id')
                ->references('id')
                ->on('ppas')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert 'ppas' back to CASCADE
        Schema::table('ppas', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table
                ->foreign('parent_id')
                ->references('id')
                ->on('ppas')
                ->onDelete('cascade');
        });

        // Revert 'aip_entries' back to CASCADE
        Schema::table('aip_entries', function (Blueprint $table) {
            $table->dropForeign(['ppa_id']);
            $table
                ->foreign('ppa_id')
                ->references('id')
                ->on('ppas')
                ->onDelete('cascade');
        });
    }
};
