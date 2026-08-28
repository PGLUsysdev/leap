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
        Schema::table('chart_of_accounts', function (Blueprint $table) {
            // Make all non-essential columns nullable
            $table
                ->enum('account_type', ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])
                ->nullable()
                ->change();
            $table
                ->enum('expense_class', ['PS', 'MOOE', 'FE', 'CO'])
                ->nullable()
                ->change();
            $table->string('account_series')->nullable()->change();
            $table->tinyInteger('level')->nullable()->change();
            $table
                ->enum('normal_balance', ['DEBIT', 'CREDIT'])
                ->nullable()
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chart_of_accounts', function (Blueprint $table) {
            // Revert to NOT NULL (with defaults where possible)
            $table
                ->enum('account_type', ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])
                ->nullable(false)
                ->change();
            $table
                ->enum('expense_class', ['PS', 'MOOE', 'FE', 'CO'])
                ->nullable(false)
                ->change();
            $table->string('account_series')->nullable(false)->change();
            $table->tinyInteger('level')->default(1)->nullable(false)->change();
            $table
                ->enum('normal_balance', ['DEBIT', 'CREDIT'])
                ->nullable(false)
                ->change();
        });
    }
};
