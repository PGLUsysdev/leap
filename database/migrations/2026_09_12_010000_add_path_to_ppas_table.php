<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Materialize the PPA hierarchy code path (e.g. "002-001-01") so
     * full_code no longer needs recursive parent queries.
     */
    public function up(): void
    {
        Schema::table('ppas', function (Blueprint $table) {
            $table->string('path', 255)->nullable()->after('code_suffix');
        });

        $padding = config('ppa.type_padding', []);
        $pad = fn (?string $type, ?string $suffix): string => str_pad(
            (string) ($suffix ?? ''),
            $padding[$type] ?? 0,
            '0',
            STR_PAD_LEFT
        );

        $rows = DB::table('ppas')->select(['id', 'parent_id', 'type', 'code_suffix'])->get();
        $byId = $rows->keyBy('id');
        $paths = [];

        $resolve = function (int $id) use (&$resolve, &$paths, $byId, $pad): string {
            if (isset($paths[$id])) {
                return $paths[$id];
            }

            $row = $byId->get($id);

            if (! $row) {
                throw new RuntimeException("Cannot backfill ppas.path: missing PPA row {$id}.");
            }

            $segment = $pad($row->type, $row->code_suffix);

            if ($row->parent_id && $byId->has($row->parent_id)) {
                return $paths[$id] = $resolve((int) $row->parent_id).'-'.$segment;
            }

            return $paths[$id] = $segment;
        };

        DB::transaction(function () use ($rows, $resolve) {
            foreach ($rows as $row) {
                DB::table('ppas')->where('id', $row->id)->update([
                    'path' => $resolve((int) $row->id),
                ]);
            }
        });

        $dupes = DB::table('ppas')
            ->selectRaw('office_id, fiscal_year_id, path, COUNT(*) as n')
            ->groupBy('office_id', 'fiscal_year_id', 'path')
            ->havingRaw('COUNT(*) > 1')
            ->count();

        if ($dupes > 0) {
            throw new RuntimeException(
                'Cannot add unique index on ppas path: duplicate (office_id, fiscal_year_id, path) groups exist.'
            );
        }

        Schema::table('ppas', function (Blueprint $table) {
            $table->unique(['office_id', 'fiscal_year_id', 'path'], 'ppas_office_fy_path_unique');
        });
    }

    public function down(): void
    {
        Schema::table('ppas', function (Blueprint $table) {
            $table->dropUnique('ppas_office_fy_path_unique');
            $table->dropColumn('path');
        });
    }
};
