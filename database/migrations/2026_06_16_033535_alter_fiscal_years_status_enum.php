<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('fiscal_years', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('fiscal_years', function (Blueprint $table) {
            $table
                ->enum('status', ['draft', 'open', 'locked', 'archived'])
                ->default('draft');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fiscal_years', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('fiscal_years', function (Blueprint $table) {
            $table
                ->enum('status', ['active', 'inactive', 'closed'])
                ->default('inactive')
                ->after('year');
        });
    }
};
