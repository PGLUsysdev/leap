<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\FiscalYear;

class FiscalYearSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $fiscalYears = [
            ['year' => 2025, 'status' => 'archived'],
            ['year' => 2026, 'status' => 'open'],
            ['year' => 2027, 'status' => 'draft'],
        ];

        foreach ($fiscalYears as $fiscalYear) {
            FiscalYear::updateOrCreate(
                ['year' => $fiscalYear['year']],
                ['status' => $fiscalYear['status']],
            );
        }
    }
}
