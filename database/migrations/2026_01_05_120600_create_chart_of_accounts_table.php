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
        Schema::create('chart_of_accounts', function (Blueprint $table) {
            $table->id();

            // Account Identification
            $table->string('account_number')->unique();        // e.g., "5-02-03-010"
            $table->string('account_title');                  // e.g., "Office Supplies Expenses"

            // Classification
            $table->enum('account_type', ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']);
            $table->enum('expense_class', ['PS', 'MOOE', 'FE', 'CO'])->nullable(); // NULL for non-expense accounts
            $table->string('account_series')->nullable();                 // e.g., "5-02" (first 4 characters)

            // Hierarchy
            $table->foreignId('parent_id')->nullable()->constrained('chart_of_accounts')->onDelete('set null')->onUpdate('cascade');
            $table->tinyInteger('level')->default(1);         // 1=main, 2=sub, 3=detail

            // Usage Control
            $table->boolean('is_postable')->default(true);    // Can be used in transactions
            $table->boolean('is_active')->default(true);

            // Accounting Rules
            $table->enum('normal_balance', ['DEBIT', 'CREDIT']); // From COA descriptions

            // Metadata
            $table->text('description')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chart_of_accounts');
    }
};
