<?php

namespace App\Console\Commands;

use App\Http\Controllers\PsBreakdownController;
use Illuminate\Console\Command;

class SyncPsPoolAmounts extends Command
{
    protected $signature = 'ps:sync-pool-amounts';

    protected $description =
        'Set each PS pool funding source to the PS breakdown total of its office, read from the personnel API';

    public function handle(): int
    {
        $result = PsBreakdownController::syncAllPsPools();

        $this->info("Synced {$result['synced']} pool(s).");
        $this->line("{$result['unchanged']} already matched the breakdown total.");

        if ($result['skipped'] > 0) {
            $this->warn(
                "{$result['skipped']} skipped: the office has no PGLU Space department to read personnel from.",
            );
        }

        return self::SUCCESS;
    }
}
