<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ----------------------------------------------------------------
        // 1. Independent / base tables (no foreign keys to other new tables)
        // ----------------------------------------------------------------

        Schema::create('sectors', function (Blueprint $table) {
            $table->id();
            $table->string('code', 4)->unique();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('lgu_levels', function (Blueprint $table) {
            $table->id();
            $table->string('code', 1)->unique();
            $table->string('name', 20);
            $table->timestamps();
        });

        Schema::create('office_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 2)->unique();
            $table->string('name', 20);
            $table->timestamps();
        });

        Schema::create('fiscal_years', function (Blueprint $table) {
            $table->id();
            $table->year('year')->unique();
            $table
                ->enum('status', ['active', 'inactive', 'closed'])
                ->default('inactive');
            $table->timestamps();
        });

        Schema::create('funding_sources', function (Blueprint $table) {
            $table->id();
            $table->string('fund_type', 50);
            $table->string('code', 50);
            $table->text('title');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('chart_of_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('account_number')->unique();
            $table->string('account_title');
            $table->enum('account_type', [
                'ASSET',
                'LIABILITY',
                'EQUITY',
                'REVENUE',
                'EXPENSE',
            ]);
            $table->enum('expense_class', ['PS', 'MOOE', 'FE', 'CO']);
            $table->string('account_series')->nullable();
            $table
                ->foreignId('parent_id')
                ->nullable()
                ->constrained('chart_of_accounts')
                ->onDelete('set null')
                ->onUpdate('cascade');
            $table->tinyInteger('level')->default(1);
            $table->boolean('is_postable')->default(true);
            $table->boolean('is_active')->default(true);
            $table->enum('normal_balance', ['DEBIT', 'CREDIT']);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('ppmp_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->timestamps();
            $table->boolean('is_non_procurement')->default(false);
        });

        Schema::create('account_groups', function (Blueprint $table) {
            $table->id();
            $table->string('uacs_digit', 1)->unique();
            $table->string('name');
            $table->enum('normal_balance', ['debit', 'credit']);
            $table->timestamps();
        });

        Schema::create('allotment_classes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });

        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // this table is not being used
        Schema::create('ppmp_summaries', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });

        // ----------------------------------------------------------------
        // 2. Tables that depend on the base tables
        // ----------------------------------------------------------------

        Schema::create('offices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sector_id')->nullable()->constrained();
            $table->foreignId('lgu_level_id')->constrained();
            $table->foreignId('office_type_id')->constrained();
            $table->foreignId('parent_id')->nullable()->constrained('offices');
            $table->string('code', 3);
            $table->string('name', 100);
            $table->string('acronym', 100)->nullable();
            $table->boolean('is_lee')->default(false);
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->text('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();
            $table->string('status')->default('pending');
            $table->string('role')->default('user');
            $table->rememberToken();
            $table->timestamps();
            $table
                ->foreignId('office_id')
                ->nullable()
                ->constrained()
                ->cascadeOnDelete();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        Schema::create('ppas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('office_id')->constrained();
            $table
                ->foreignId('parent_id')
                ->nullable()
                ->constrained('ppas')
                ->cascadeOnDelete();
            $table->string('name');
            $table->enum('type', [
                'Program',
                'Project',
                'Activity',
                'Sub-Activity',
            ]);
            $table->string('code_suffix', 20);
            $table->boolean('is_active')->default(true);
            $table->decimal('sort_order', 10, 2)->default(0);
            $table->timestamps();
            $table->foreignId('fiscal_year_id')->nullable()->constrained();

            $table->unique(
                ['office_id', 'parent_id', 'code_suffix', 'type'],
                'ppa_unique_index',
            );
            $table->index('parent_id');
        });

        Schema::create('aip_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ppa_id')->constrained('ppas')->cascadeOnDelete();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->text('expected_output')->nullable();
            $table->timestamps();
        });

        Schema::create('ppa_funding_sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aip_entry_id')->constrained();
            $table->foreignId('funding_source_id')->constrained();
            $table->decimal('ps_amount', 19, 2)->default(0);
            $table->decimal('mooe_amount', 19, 2)->default(0);
            $table->decimal('fe_amount', 19, 2)->default(0);
            $table->decimal('co_amount', 19, 2)->default(0);
            $table->decimal('ccet_adaptation', 19, 2)->default(0);
            $table->decimal('ccet_mitigation', 19, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('chart_of_account_ppmp_categories', function (
            Blueprint $table,
        ) {
            $table->id();
            $table->foreignId('chart_of_account_id')->constrained();
            $table->foreignId('ppmp_category_id')->constrained();
            $table->timestamps();
        });

        Schema::create('ppmp_price_lists', function (Blueprint $table) {
            $table->id();
            $table->integer('item_number');
            $table->integer('sort_order')->default(0);
            $table->text('description');
            $table->string('unit_of_measurement', 20);
            $table->decimal('price', 19, 2);
            $table->foreignId('ppmp_category_id')->constrained();
            $table->foreignId('chart_of_account_id')->constrained();
            $table->timestamps();
        });

        Schema::create('ppmps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aip_entry_id')->constrained();
            $table->foreignId('ppmp_price_list_id')->nullable()->constrained();
            $table->foreignId('funding_source_id')->constrained();

            $table->integer('jan_qty')->default(0);
            $table->decimal('jan_amount', 15, 2)->default(0);
            $table->integer('feb_qty')->default(0);
            $table->decimal('feb_amount', 15, 2)->default(0);
            $table->integer('mar_qty')->default(0);
            $table->decimal('mar_amount', 15, 2)->default(0);
            $table->integer('apr_qty')->default(0);
            $table->decimal('apr_amount', 15, 2)->default(0);
            $table->integer('may_qty')->default(0);
            $table->decimal('may_amount', 15, 2)->default(0);
            $table->integer('jun_qty')->default(0);
            $table->decimal('jun_amount', 15, 2)->default(0);
            $table->integer('jul_qty')->default(0);
            $table->decimal('jul_amount', 15, 2)->default(0);
            $table->integer('aug_qty')->default(0);
            $table->decimal('aug_amount', 15, 2)->default(0);
            $table->integer('sep_qty')->default(0);
            $table->decimal('sep_amount', 15, 2)->default(0);
            $table->integer('oct_qty')->default(0);
            $table->decimal('oct_amount', 15, 2)->default(0);
            $table->integer('nov_qty')->default(0);
            $table->decimal('nov_amount', 15, 2)->default(0);
            $table->integer('dec_qty')->default(0);
            $table->decimal('dec_amount', 15, 2)->default(0);

            $table->timestamps();

            $table->unique(
                ['aip_entry_id', 'ppmp_price_list_id', 'funding_source_id'],
                'ppmps_aip_entry_id_ppmp_price_list_id_funding_source_id_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ppmps');
        Schema::dropIfExists('ppmp_price_lists');
        Schema::dropIfExists('chart_of_account_ppmp_categories');
        Schema::dropIfExists('ppa_funding_sources');
        Schema::dropIfExists('aip_entries');
        Schema::dropIfExists('ppas');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('users');
        Schema::dropIfExists('offices');
        Schema::dropIfExists('ppmp_summaries');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('allotment_classes');
        Schema::dropIfExists('account_groups');
        Schema::dropIfExists('ppmp_categories');
        Schema::dropIfExists('chart_of_accounts');
        Schema::dropIfExists('funding_sources');
        Schema::dropIfExists('fiscal_years');
        Schema::dropIfExists('office_types');
        Schema::dropIfExists('lgu_levels');
        Schema::dropIfExists('sectors');
    }
};
