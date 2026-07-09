<?php

namespace Database\Seeders;

use App\Models\AllotmentClass;
use Illuminate\Database\Seeder;

class AllotmentClassSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $classes = [
            ['code' => 'PS', 'name' => 'Personal Services'],
            [
                'code' => 'MOOE',
                'name' => 'Maintenance & Other Operating Expenses',
            ],
            ['code' => 'FE', 'name' => 'Financial Expenses'],
            ['code' => 'CO', 'name' => 'Capital Outlay'],
            ['code' => 'INC', 'name' => 'Income Sources'],
        ];

        foreach ($classes as $class) {
            // Using updateOrCreate prevents duplicate errors if you run the seeder twice
            AllotmentClass::updateOrCreate(
                ['code' => $class['code']], // Unique identifier
                ['name' => $class['name']], // Attributes to update/create
            );
        }
    }
}
