<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * SCHEMA-ONLY migration. No data is moved or backfilled here.
     *
     * NOTE: `aip_entries.aip_document_id` is intentionally left NULLABLE.
     * After you run your own data-migration SQL to populate it (and to
     * create the one "regular" aip_documents row per office+FY that has
     * PPAs), follow up with a separate migration making it NOT NULL.
     *
     * ORDERING NOTE (ppa_funding_sources) — this is the part MariaDB is
     * fussy about:
     *
     *   The unique index `pfs_output_funding_supplemental_unique`
     *   starts with `aip_output_id`, and it is the ONLY index starting
     *   with that column. MariaDB therefore uses it to back the FK
     *   `ppa_funding_sources_aip_output_id_foreign`. Because of that:
     *
     *     - You cannot drop the unique index while the aip_output_id
     *       FK exists (error 1553).
     *     - You cannot drop `supplemental_aip_id` while any index
     *       covers it (error 1072).
     *     - When the supplemental_aip_id FK is created, MariaDB
     *       silently auto-creates a plain index named after the FK;
     *       that index must be dropped before the column.
     *
     *   So the only safe order is:
     *     1) drop supplemental_aip_id FK
     *     2) drop aip_output_id FK         (frees the old unique index)
     *     3) drop old unique index
     *     4) add new unique index
     *     5) re-add aip_output_id FK       (backed by the new unique)
     *     6) drop leftover auto-index from step 1
     *     7) drop supplemental_aip_id column
     */
    public function up(): void
    {
        // 1. Rename supplemental_aips → aip_documents, add `kind`
        Schema::rename('supplemental_aips', 'aip_documents');

        Schema::table('aip_documents', function (Blueprint $table) {
            $table->enum('kind', ['regular', 'supplemental'])
                ->default('supplemental')
                ->after('office_id');
        });

        // 2. aip_documents uniqueness
        Schema::table('aip_documents', function (Blueprint $table) {
            $table->unique(
                ['fiscal_year_id', 'office_id', 'kind', 'name'],
                'aip_documents_unique',
            );
        });

        // 3. Add aip_document_id to aip_entries (NULLABLE for now)
        Schema::table('aip_entries', function (Blueprint $table) {
            $table->foreignId('aip_document_id')
                ->nullable()
                ->after('ppa_id')
                ->constrained('aip_documents')
                ->restrictOnDelete();
        });

        Schema::table('aip_entries', function (Blueprint $table) {
            $table->unique(
                ['ppa_id', 'aip_document_id'],
                'aip_entries_ppa_document_unique',
            );
        });

        // 4. Drop supplemental_aip_id from aip_entries
        Schema::table('aip_entries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('supplemental_aip_id');
        });

        // 5. Drop supplemental_aip_id from ppas
        Schema::table('ppas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('supplemental_aip_id');
        });

        // 6. ppa_funding_sources — see ordering note above

        // 6.1 drop supplemental_aip_id FK
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->dropForeign(['supplemental_aip_id']);
        });

        // 6.2 drop aip_output_id FK (frees the old unique index)
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->dropForeign(['aip_output_id']);
        });

        // 6.3 drop the old unique index
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->dropUnique('pfs_output_funding_supplemental_unique');
        });

        // 6.4 add the new unique index
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->unique(
                ['aip_output_id', 'funding_source_id'],
                'pfs_output_funding_unique',
            );
        });

        // 6.5 re-add aip_output_id FK (backed by the new unique index)
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->foreign('aip_output_id')
                ->references('id')
                ->on('aip_outputs');
        });

        // 6.6 drop leftover auto-created index from step 6.1
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->dropIndex('ppa_funding_sources_supplemental_aip_id_foreign');
        });

        // 6.7 drop the column
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->dropColumn('supplemental_aip_id');
        });
    }

    public function down(): void
    {
        // Reverse the schema changes. Data cannot be restored.
        //
        // Mirror of up(): the new unique index backs the aip_output_id FK,
        // so it must be freed before it can be dropped, and the column
        // must exist before the old index can be re-added.
        //
        // Order:
        //   1) drop aip_output_id FK         (frees pfs_output_funding_unique)
        //   2) drop pfs_output_funding_unique
        //   3) add supplemental_aip_id column (nullable)
        //   4) add old unique index (aip_output_id, funding_source_id, supplemental_aip_id)
        //   5) re-add aip_output_id FK       (backed by the old unique index)
        //   6) add supplemental_aip_id FK    (auto-creates its own index)

        // 1) drop aip_output_id FK
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->dropForeign(['aip_output_id']);
        });

        // 2) drop the new unique index
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->dropUnique('pfs_output_funding_unique');
        });

        // 3) re-add the column
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->foreignId('supplemental_aip_id')
                ->nullable()
                ->after('updated_at');
        });

        // 4) re-add the old unique index
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->unique(
                ['aip_output_id', 'funding_source_id', 'supplemental_aip_id'],
                'pfs_output_funding_supplemental_unique',
            );
        });

        // 5) re-add aip_output_id FK
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->foreign('aip_output_id')
                ->references('id')
                ->on('aip_outputs');
        });

        // 6) re-add supplemental_aip_id FK
        Schema::table('ppa_funding_sources', function (Blueprint $table) {
            $table->foreign('supplemental_aip_id')
                ->references('id')
                ->on('aip_documents')
                ->nullOnDelete();
        });

        // Reverse the rest of the schema changes on the other tables.

        Schema::table('ppas', function (Blueprint $table) {
            $table->foreignId('supplemental_aip_id')
                ->nullable()
                ->after('fiscal_year_id')
                ->constrained('aip_documents')
                ->nullOnDelete();
        });

        Schema::table('aip_entries', function (Blueprint $table) {
            $table->foreignId('supplemental_aip_id')
                ->nullable()
                ->after('ppa_id')
                ->constrained('aip_documents')
                ->nullOnDelete();
        });

        Schema::table('aip_entries', function (Blueprint $table) {
            $table->dropUnique('aip_entries_ppa_document_unique');
            $table->dropConstrainedForeignId('aip_document_id');
        });

        Schema::table('aip_documents', function (Blueprint $table) {
            $table->dropUnique('aip_documents_unique');
            $table->dropColumn('kind');
        });

        Schema::rename('aip_documents', 'supplemental_aips');
    }
};
