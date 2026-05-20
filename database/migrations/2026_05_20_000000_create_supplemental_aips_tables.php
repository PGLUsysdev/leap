<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Create supplemental_aips table
        Schema::create('supplemental_aips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fiscal_year_id')->constrained('fiscal_years')->restrictOnDelete();
            $table->foreignId('office_id')->constrained('offices')->restrictOnDelete();
            $table->string('name');
            $table->timestamps();
        });

        // 2. Add columns to ppas
        Schema::table('ppas', function (Blueprint $table) {
            $table->foreignId('supplemental_aip_id')->nullable()->constrained('supplemental_aips')->nullOnDelete();
            $table->boolean('is_supplemental')->default(false);
        });

        // 3. Add columns to aip_entries
        Schema::table('aip_entries', function (Blueprint $table) {
            $table->foreignId('supplemental_aip_id')->nullable()->constrained('supplemental_aips')->nullOnDelete();
            $table->boolean('is_supplemental')->default(false);
        });

        // 4. Add columns and modify unique constraint in ppa_funding_sources
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->foreignId('supplemental_aip_id')->nullable()->constrained('supplemental_aips')->nullOnDelete();
            $table->boolean('is_supplemental')->default(false);
            
            // Drop old unique constraint
            $table->dropUnique('pfs_aip_funding_unique');
            
            // Create new unique constraint including supplemental_aip_id
            $table->unique(
                ['aip_entry_id', 'funding_source_id', 'supplemental_aip_id'],
                'pfs_aip_funding_supplemental_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->dropUnique('pfs_aip_funding_supplemental_unique');
            $table->unique(
                ['aip_entry_id', 'funding_source_id'],
                'pfs_aip_funding_unique'
            );
            $table->dropConstrainedForeignId('supplemental_aip_id');
            $table->dropColumn('is_supplemental');
        });

        Schema::table('aip_entries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('supplemental_aip_id');
            $table->dropColumn('is_supplemental');
        });

        Schema::table('ppas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('supplemental_aip_id');
            $table->dropColumn('is_supplemental');
        });

        Schema::dropIfExists('supplemental_aips');
    }
};
