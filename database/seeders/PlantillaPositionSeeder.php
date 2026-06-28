<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Office;
use App\Models\FiscalYear;
use App\Models\PlantillaPosition;

class PlantillaPositionSeeder extends Seeder
{
    public function run(): void
    {
        // PlantillaPosition::truncate();

        // Get the first office (or create one if none exists)
        $office = Office::first();

        if (!$office) {
            $office = Office::create([
                'code' => '001',
                'name' => 'Office of the Mayor',
                'acronym' => 'OM',
                'is_lee' => false,
                // Add other required fields based on your offices table schema
            ]);
        }

        // Get or create fiscal year 2027
        $fiscalYear = FiscalYear::where('year', 2027)->first();
        if (!$fiscalYear) {
            $fiscalYear = FiscalYear::create([
                'year' => 2027,
                'status' => 'open',
            ]);
        }

        $positions = [
            // --- Permanent Positions ---
            [
                'item_number' => '101',
                'position_title' => 'Administrative Officer III',
                'incumbent_name' => 'Juan Dela Cruz',
                'position_type' => 'permanent',
                'current_sg' => 15,
                'current_step' => 3,
                'current_annual_rate' => 432000.0,
                'budget_sg' => 15,
                'budget_step' => 4,
                'budget_annual_rate' => 456000.0,
                'remarks' => 'Regular employee',
            ],
            [
                'item_number' => '102',
                'position_title' => 'Planning Officer I',
                'incumbent_name' => null,
                'position_type' => 'permanent',
                'current_sg' => 18,
                'current_step' => 2,
                'current_annual_rate' => 540000.0,
                'budget_sg' => 18,
                'budget_step' => 2,
                'budget_annual_rate' => 540000.0,
                'remarks' => 'Vacant position',
            ],
            [
                'item_number' => '103',
                'position_title' => 'Budget Officer',
                'incumbent_name' => 'Maria Santos',
                'position_type' => 'permanent',
                'current_sg' => 22,
                'current_step' => 5,
                'current_annual_rate' => 720000.0,
                'budget_sg' => 22,
                'budget_step' => 6,
                'budget_annual_rate' => 750000.0,
                'remarks' => 'Promotion to Step 6',
            ],
            [
                'item_number' => '104',
                'position_title' => 'Administrative Aide VI',
                'incumbent_name' => 'Pedro Reyes',
                'position_type' => 'permanent',
                'current_sg' => 8,
                'current_step' => 4,
                'current_annual_rate' => 240000.0,
                'budget_sg' => 8,
                'budget_step' => 5,
                'budget_annual_rate' => 252000.0,
                'remarks' => 'Step increment',
            ],
            [
                'item_number' => '105',
                'position_title' => 'Driver I',
                'incumbent_name' => 'Ramon Garcia',
                'position_type' => 'permanent',
                'current_sg' => 3,
                'current_step' => 8,
                'current_annual_rate' => 180000.0,
                'budget_sg' => 3,
                'budget_step' => 8,
                'budget_annual_rate' => 180000.0,
                'remarks' => 'No salary change',
            ],

            // --- Casual Position ---
            [
                'item_number' => 'C-001',
                'position_title' => 'Utility Worker',
                'incumbent_name' => 'Josefa Mendoza',
                'position_type' => 'casual',
                'current_sg' => 1,
                'current_step' => 1,
                'current_annual_rate' => 120000.0,
                'budget_sg' => 1,
                'budget_step' => 1,
                'budget_annual_rate' => 120000.0,
                'remarks' => 'Casual employee - separate plantilla required',
            ],

            // --- Contractual Position ---
            [
                'item_number' => 'CT-001',
                'position_title' => 'Project Coordinator',
                'incumbent_name' => 'Albert Tan',
                'position_type' => 'contractual',
                'current_sg' => 12,
                'current_step' => 2,
                'current_annual_rate' => 360000.0,
                'budget_sg' => 12,
                'budget_step' => 2,
                'budget_annual_rate' => 360000.0,
                'remarks' => 'Contractual for specific project',
            ],

            // --- Coterminous Position (FIXED) ---
            [
                'item_number' => 'CO-001',
                'position_title' => 'Secretary to the Mayor',
                'incumbent_name' => 'Luzviminda Cruz',
                'position_type' => 'coterminous',
                'current_sg' => 20,
                'current_step' => 3,
                'current_annual_rate' => 600000.0,
                'budget_sg' => 20,
                'budget_step' => 4, // <-- FIXED TYPO HERE
                'budget_annual_rate' => 630000.0,
                'remarks' => 'Coterminous with the Mayor',
            ],
        ];

        foreach ($positions as $pos) {
            PlantillaPosition::create(
                array_merge($pos, [
                    'office_id' => $office->id,
                    'fiscal_year_id' => $fiscalYear->id,
                ]),
            );
        }

        $this->command->info('Plantilla positions seeded successfully!');
        $this->command->info('Total positions: ' . count($positions));
    }
}
