<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PsRate;
use App\Models\FiscalYear;

class PsRateSeeder extends Seeder
{
    public function run(): void
    {
        $fiscalYear = FiscalYear::where('year', 2027)->first();

        if (!$fiscalYear) {
            $this->command->error(
                'Fiscal year 2027 not found. Please create it first.',
            );
            return;
        }

        $rates = [
            ['rate_key' => 'pera_monthly', 'rate_value' => 2000.0],
            ['rate_key' => 'rata_sg_24_above', 'rate_value' => 4000.0],
            ['rate_key' => 'rata_sg_16_23', 'rate_value' => 2000.0],
            ['rate_key' => 'ta_sg_24_above', 'rate_value' => 2000.0],
            ['rate_key' => 'ta_sg_16_23', 'rate_value' => 1000.0],
            ['rate_key' => 'clothing_annual', 'rate_value' => 5000.0],
            ['rate_key' => 'cash_gift', 'rate_value' => 5000.0],
            ['rate_key' => 'pei_max', 'rate_value' => 5000.0],
            ['rate_key' => 'philhealth_percent', 'rate_value' => 2.5],
            ['rate_key' => 'gsis_percent', 'rate_value' => 12.0],
            ['rate_key' => 'ecip_percent', 'rate_value' => 1.0],
            ['rate_key' => 'pagibig_monthly', 'rate_value' => 100.0],
            ['rate_key' => 'subsistence_monthly', 'rate_value' => 1500.0],
            ['rate_key' => 'subsistence_daily_fulltime', 'rate_value' => 50.0],
            ['rate_key' => 'subsistence_daily_parttime', 'rate_value' => 25.0],
            ['rate_key' => 'num_days_monthly', 'rate_value' => 22.0],
            ['rate_key' => 'num_days_annual', 'rate_value' => 264.0],
            ['rate_key' => 'laundry_monthly', 'rate_value' => 150.0],
            // ['rate_key' => 'quarters_monthly', 'rate_value' => 500.0], // Quarters Allowance — skipped
        ];

        foreach ($rates as $rate) {
            PsRate::create([
                'fiscal_year_id' => $fiscalYear->id,
                'rate_key' => $rate['rate_key'],
                'rate_value' => $rate['rate_value'],
            ]);
        }

        $this->command->info('PS Rates seeded for FY ' . $fiscalYear->year);
    }
}
