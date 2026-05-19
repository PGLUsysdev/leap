<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::transaction(function () {
            // 1. Get all items.
            // We order by existing sort_order, then by ID to keep some logic.
            $items = DB::table('ppmp_price_lists')
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

            // 2. Update each item with a clean sequence starting at 1
            foreach ($items as $index => $item) {
                $newPosition = $index + 1;

                DB::table('ppmp_price_lists')
                    ->where('id', $item->id)
                    ->update([
                        'sort_order' => $newPosition,
                        'item_number' => $newPosition, // Syncing this too for now
                    ]);
            }
        });
    }

    public function down(): void
    {
        // No easy way to undo a data sort fix, so we leave it empty.
    }
};
