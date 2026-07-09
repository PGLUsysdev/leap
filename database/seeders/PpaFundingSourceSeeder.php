<?php

namespace Database\Seeders;

use App\Models\PpaFundingSource;
use Illuminate\Database\Seeder;

class PpaFundingSourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ppaFundingSources = [
            ['aip_entry_id' => 1, 'funding_source_id' => 1],
            ['aip_entry_id' => 1, 'funding_source_id' => 2],
        ];

        foreach ($ppaFundingSources as $ppaFundingSource) {
            PpaFundingSource::create($ppaFundingSource);
        }
    }
}
