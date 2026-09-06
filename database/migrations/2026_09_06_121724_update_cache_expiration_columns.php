<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Brings cache/cache_locks.expiration to parity with the Laravel
     * defaults (bigInteger + index). Cached data is ephemeral, so the
     * columns are rebuilt instead of altered (no doctrine/dbal needed).
     */
    public function up(): void
    {
        Schema::table('cache', function (Blueprint $table) {
            $table->dropColumn('expiration');
        });

        Schema::table('cache', function (Blueprint $table) {
            $table->bigInteger('expiration')->index();
        });

        Schema::table('cache_locks', function (Blueprint $table) {
            $table->dropColumn('expiration');
        });

        Schema::table('cache_locks', function (Blueprint $table) {
            $table->bigInteger('expiration')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cache', function (Blueprint $table) {
            $table->dropColumn('expiration');
        });

        Schema::table('cache', function (Blueprint $table) {
            $table->integer('expiration');
        });

        Schema::table('cache_locks', function (Blueprint $table) {
            $table->dropColumn('expiration');
        });

        Schema::table('cache_locks', function (Blueprint $table) {
            $table->integer('expiration');
        });
    }
};
