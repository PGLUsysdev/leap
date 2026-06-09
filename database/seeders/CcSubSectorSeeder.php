<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\CcSubSector;

class CcSubSectorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $subSectors = [
            // --- Priority 1: Food Security ---
            [
                'id' => 1,
                'strategic_priority_id' => 1,
                'code' => 1,
                'name' => 'Agriculture and Livestock',
            ],
            [
                'id' => 2,
                'strategic_priority_id' => 1,
                'code' => 2,
                'name' => 'Fisheries',
            ],

            // --- Priority 2: Water Sufficiency ---
            [
                'id' => 3,
                'strategic_priority_id' => 2,
                'code' => 1,
                'name' => 'Water Supply',
            ],
            [
                'id' => 4,
                'strategic_priority_id' => 2,
                'code' => 2,
                'name' => 'Flood Protection',
            ],
            [
                'id' => 5,
                'strategic_priority_id' => 2,
                'code' => 3,
                'name' => 'Water and Sanitation',
            ],

            // --- Priority 3: Ecological and Environmental Stability ---
            [
                'id' => 6,
                'strategic_priority_id' => 3,
                'code' => 1,
                'name' => 'Forest and Biodiversity',
            ],
            [
                'id' => 7,
                'strategic_priority_id' => 3,
                'code' => 2,
                'name' => 'Solid Waste',
            ],

            // --- Priority 4: Human Security ---
            [
                'id' => 8,
                'strategic_priority_id' => 4,
                'code' => 1,
                'name' => 'Health',
            ],
            [
                'id' => 9,
                'strategic_priority_id' => 4,
                'code' => 2,
                'name' => 'Settlements and Local Land Use',
            ],

            // --- Priority 5: Climate Smart Industries and Services ---
            [
                'id' => 10,
                'strategic_priority_id' => 5,
                'code' => 1,
                'name' => 'Tourism, Trade and Industries',
            ],

            // --- Priority 6: Sustainable Energy ---
            [
                'id' => 11,
                'strategic_priority_id' => 6,
                'code' => 1,
                'name' => 'Energy Efficiency',
            ],
            [
                'id' => 12,
                'strategic_priority_id' => 6,
                'code' => 2,
                'name' => 'Power Generation',
            ],
            [
                'id' => 13,
                'strategic_priority_id' => 6,
                'code' => 3,
                'name' => 'Transportation and Communication',
            ],

            // --- Priority 7: Knowledge and Capacity Development ---
            [
                'id' => 14,
                'strategic_priority_id' => 7,
                'code' => 1,
                'name' => 'Education and Climate Science',
            ],

            // // --- Priority 8: Finance ---
            // [
            //     'id' => 15,
            //     'strategic_priority_id' => 8,
            //     'code' => 1,
            //     'name' => 'Finance',
            // ],
        ];

        // Loop through each item so Eloquent can process them individually
        foreach ($subSectors as $subSector) {
            CcSubSector::create($subSector);
        }
    }
}
