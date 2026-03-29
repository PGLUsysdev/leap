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
            ['year' => 2023, 'status' => 'active'],
            ['year' => 2024, 'status' => 'inactive'],
            ['year' => 2025, 'status' => 'closed'],
        ];

        foreach ($fiscalYears as $fiscalYear) {
            FiscalYear::create($fiscalYear);
        }
    }
}
