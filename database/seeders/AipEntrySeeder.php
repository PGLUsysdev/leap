<?php

namespace Database\Seeders;

use App\Models\AipEntry;
use App\Models\FiscalYear;
use App\Models\Ppa;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AipEntrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Get the Fiscal Year
        $fiscalYear = FiscalYear::first();

        // 2. Get the Master List of PPAs
        $ppas = Ppa::all();

        // Safety check
        if (! $fiscalYear || $ppas->isEmpty()) {
            $this->command->error(
                'Error: No Fiscal Year or PPAs found. Please seed those tables first.',
            );

            return;
        }

        $year = $fiscalYear->year;

        foreach ($ppas as $ppa) {
            AipEntry::create([
                'fiscal_year_id' => $fiscalYear->id,
                'ppa_id' => $ppa->id,

                // Set dates within the budget year
                'start_date' => Carbon::createFromDate($year, 1, 1),
                'end_date' => Carbon::createFromDate($year, 12, 31),

                'expected_output' => 'Successfully implemented '.
                    $ppa->title.
                    ' with 100% utilization rate.',

                // Financial and CCET columns removed as requested
            ]);
        }
    }
}
