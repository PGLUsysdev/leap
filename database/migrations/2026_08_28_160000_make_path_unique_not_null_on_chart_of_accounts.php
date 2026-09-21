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
        // Ensure no NULL paths remain (user confirmed data processed, but double-check)
        // If any NULLs exist, this will be caught by the NOT NULL change below.

        Schema::table('chart_of_accounts', function (Blueprint $table) {
            // Drop the plain index created in 2026_08_28_011143_add_path_to_chart_of_accounts.php
            try {
                $table->dropIndex(['path']);
            } catch (Throwable $e) {
                // Index may already be gone or named differently; ignore
            }
        });

        // Make path NOT NULL - use raw statement for compatibility without doctrine/dbal
        // Wrapped in try/catch to handle already NOT NULL case
        try {
            // MySQL / MariaDB
            DB::statement('ALTER TABLE `chart_of_accounts` MODIFY `path` VARCHAR(255) NOT NULL');
        } catch (Throwable $e) {
            // Fallback to Laravel change() if raw fails (e.g., SQLite)
            try {
                Schema::table('chart_of_accounts', function (Blueprint $table) {
                    $table->string('path', 255)->nullable(false)->change();
                });
            } catch (Throwable $e2) {
                // If both fail, rethrow original
                throw $e;
            }
        }

        Schema::table('chart_of_accounts', function (Blueprint $table) {
            $table->unique('path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chart_of_accounts', function (Blueprint $table) {
            $table->dropUnique(['path']);
        });

        try {
            DB::statement('ALTER TABLE `chart_of_accounts` MODIFY `path` VARCHAR(255) NULL');
        } catch (Throwable $e) {
            try {
                Schema::table('chart_of_accounts', function (Blueprint $table) {
                    $table->string('path', 255)->nullable()->change();
                });
            } catch (Throwable $e2) {
                throw $e;
            }
        }

        Schema::table('chart_of_accounts', function (Blueprint $table) {
            $table->index('path');
        });
    }
};
