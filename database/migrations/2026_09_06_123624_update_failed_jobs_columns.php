<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Parity with Laravel defaults: failed_jobs.connection/queue text
     * to string, plus the composite [connection, queue, failed_at]
     * index. Verified safe: table holds no rows exceeding varchar.
     */
    public function up(): void
    {
        Schema::table('failed_jobs', function (Blueprint $table) {
            $table->string('connection')->change();
            $table->string('queue')->change();
            $table->index(['connection', 'queue', 'failed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('failed_jobs', function (Blueprint $table) {
            $table->dropIndex(['connection', 'queue', 'failed_at']);
            $table->text('connection')->change();
            $table->text('queue')->change();
        });
    }
};
