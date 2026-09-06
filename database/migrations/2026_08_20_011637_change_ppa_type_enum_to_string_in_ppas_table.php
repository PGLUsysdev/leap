<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // 1. Disable foreign key checks for safety
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // 2. Drop the temporary column if it exists
        if (Schema::hasColumn('ppas', 'type_new')) {
            Schema::table('ppas', function (Blueprint $table) {
                $table->dropColumn('type_new');
            });
        }

        // 3. Drop the unique index if it exists (ignore if not)
        try {
            Schema::table('ppas', function (Blueprint $table) {
                $table->dropUnique('ppa_unique_index');
            });
        } catch (Exception $e) {
            // Index might already be gone – swallow the exception
        }

        // 4. Add a new VARCHAR column
        Schema::table('ppas', function (Blueprint $table) {
            $table->string('type_new', 50)->nullable();
        });

        // 5. Copy data from the ENUM column
        DB::statement('UPDATE ppas SET type_new = type');

        // 6. Drop the old ENUM column
        Schema::table('ppas', function (Blueprint $table) {
            $table->dropColumn('type');
        });

        // 7. Rename the temporary column to 'type'
        Schema::table('ppas', function (Blueprint $table) {
            $table->renameColumn('type_new', 'type');
        });

        // 8. Re‑add the unique index (now on VARCHAR column)
        Schema::table('ppas', function (Blueprint $table) {
            $table->unique(
                ['office_id', 'parent_id', 'code_suffix', 'type'],
                'ppa_unique_index',
            );
        });

        // 9. Re‑enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    public function down()
    {
        // Reverse: drop the index, drop VARCHAR, re-add ENUM...
        // (Optional – if you need a rollback, we can implement it)
    }
};
