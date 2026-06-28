<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Office;
use App\Models\Position;

class PositionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $offices = Office::all();

        if ($offices->isEmpty()) {
            $this->command->error('No offices found. Run OfficeSeeder first.');
            return;
        }

        $positionCounter = 1;

        // Define position templates grouped by typical plantilla structure.
        // Each template: [title, salary_grade, employment_type]
        $officePositions = [
            'OPG' => [
                ['Provincial Administrator', 26, 'permanent'],
                ['Assistant Provincial Administrator', 24, 'permanent'],
                ['Chief of Staff', 22, 'permanent'],
                ['Executive Assistant IV', 18, 'permanent'],
                ['Executive Assistant III', 15, 'permanent'],
                ['Executive Assistant II', 11, 'permanent'],
                ['Administrative Officer V', 18, 'permanent'],
                ['Administrative Officer IV', 15, 'permanent'],
                ['Administrative Officer III', 11, 'permanent'],
                ['Administrative Aide VI', 6, 'permanent'],
                ['Administrative Aide IV', 4, 'permanent'],
                ['Driver', 3, 'permanent'],
                ['Utility Worker I', 1, 'permanent'],
            ],
            'PTO' => [
                ['Provincial Treasurer', 26, 'permanent'],
                ['Assistant Provincial Treasurer', 24, 'permanent'],
                ['Chief Accountant', 22, 'permanent'],
                ['Senior Administrative Officer', 18, 'permanent'],
                ['Accountant III', 18, 'permanent'],
                ['Accountant II', 16, 'permanent'],
                ['Administrative Officer IV', 15, 'permanent'],
                ['Administrative Officer III', 11, 'permanent'],
                ['Bookkeeper II', 8, 'permanent'],
                ['Clerk III', 6, 'permanent'],
                ['Clerk II', 4, 'permanent'],
                ['Driver', 3, 'permanent'],
            ],
            'PBO' => [
                ['Provincial Budget Officer', 26, 'permanent'],
                ['Assistant Provincial Budget Officer', 24, 'permanent'],
                ['Senior Budget Officer', 22, 'permanent'],
                ['Budget Officer III', 18, 'permanent'],
                ['Budget Officer II', 16, 'permanent'],
                ['Administrative Officer IV', 15, 'permanent'],
                ['Administrative Officer III', 11, 'permanent'],
                ['Clerk III', 6, 'permanent'],
                ['Clerk II', 4, 'permanent'],
            ],
            'OPAcc' => [
                ['Provincial Accountant', 26, 'permanent'],
                ['Assistant Provincial Accountant', 24, 'permanent'],
                ['Senior Accountant', 22, 'permanent'],
                ['Accountant III', 18, 'permanent'],
                ['Accountant II', 16, 'permanent'],
                ['Administrative Officer III', 11, 'permanent'],
                ['Bookkeeper II', 8, 'permanent'],
                ['Clerk III', 6, 'permanent'],
            ],
            'OPAss' => [
                ['Provincial Assessor', 26, 'permanent'],
                ['Assistant Provincial Assessor', 24, 'permanent'],
                ['Chief Assessment Officer', 22, 'permanent'],
                ['Assessment Officer III', 18, 'permanent'],
                ['Assessment Officer II', 16, 'permanent'],
                ['Administrative Officer III', 11, 'permanent'],
                ['Clerk III', 6, 'permanent'],
                ['Driver', 3, 'permanent'],
            ],
            'OPPDC' => [
                ['PPDC', 26, 'permanent'],
                ['Assistant PPDC', 24, 'permanent'],
                ['Senior Planning Officer', 22, 'permanent'],
                ['Planning Officer III', 18, 'permanent'],
                ['Planning Officer II', 16, 'permanent'],
                ['Administrative Officer IV', 15, 'permanent'],
                ['Administrative Officer III', 11, 'permanent'],
                ['Project Development Assistant', 8, 'permanent'],
                ['Clerk III', 6, 'permanent'],
                ['Driver', 3, 'permanent'],
            ],
            'PEO' => [
                ['Provincial Engineer', 26, 'permanent'],
                ['Assistant Provincial Engineer', 24, 'permanent'],
                ['Senior Engineer', 22, 'permanent'],
                ['Engineer III', 18, 'permanent'],
                ['Engineer II', 16, 'permanent'],
                ['Engineering Assistant', 11, 'permanent'],
                ['Draftsman', 8, 'permanent'],
                ['Administrative Officer III', 11, 'permanent'],
                ['Clerk III', 6, 'permanent'],
                ['Driver', 3, 'permanent'],
                ['Utility Worker I', 1, 'permanent'],
            ],
            'PHO' => [
                ['Provincial Health Officer', 26, 'permanent'],
                ['Assistant Provincial Health Officer', 24, 'permanent'],
                ['Senior Medical Officer', 22, 'permanent'],
                ['Medical Officer III', 18, 'permanent'],
                ['Medical Officer II', 16, 'permanent'],
                ['Nurse III', 15, 'permanent'],
                ['Nurse II', 11, 'permanent'],
                ['Midwife III', 11, 'permanent'],
                ['Midwife II', 8, 'permanent'],
                ['Administrative Officer IV', 15, 'permanent'],
                ['Administrative Officer III', 11, 'permanent'],
                ['Clerk III', 6, 'permanent'],
                ['Driver', 3, 'permanent'],
                ['Utility Worker I', 1, 'permanent'],
            ],
            'PSWDO' => [
                ['Provincial Social Welfare Officer', 26, 'permanent'],
                ['Assistant PSWDO', 24, 'permanent'],
                ['Senior Social Welfare Officer', 22, 'permanent'],
                ['Social Welfare Officer III', 18, 'permanent'],
                ['Social Welfare Officer II', 16, 'permanent'],
                ['Administrative Officer III', 11, 'permanent'],
                ['Clerk III', 6, 'permanent'],
                ['Driver', 3, 'permanent'],
            ],
            'PHRMDO' => [
                ['Provincial Human Resource Officer', 24, 'permanent'],
                ['Senior HR Specialist', 22, 'permanent'],
                ['HR Specialist III', 18, 'permanent'],
                ['HR Specialist II', 16, 'permanent'],
                ['Administrative Officer III', 11, 'permanent'],
                ['Clerk III', 6, 'permanent'],
            ],
            'PDRRMO' => [
                ['Provincial DRRM Officer', 24, 'permanent'],
                ['Senior DRRM Specialist', 22, 'permanent'],
                ['DRRM Specialist III', 18, 'permanent'],
                ['DRRM Specialist II', 16, 'permanent'],
                ['Administrative Officer III', 11, 'permanent'],
                ['Clerk III', 6, 'permanent'],
                ['Driver', 3, 'permanent'],
            ],
            'PGSO' => [
                ['Provincial General Services Officer', 26, 'permanent'],
                ['Assistant PGSO', 24, 'permanent'],
                ['Supply Officer III', 18, 'permanent'],
                ['Supply Officer II', 16, 'permanent'],
                ['Administrative Officer III', 11, 'permanent'],
                ['Clerk III', 6, 'permanent'],
                ['Driver', 3, 'permanent'],
                ['Utility Worker I', 1, 'permanent'],
            ],
            'OPAg' => [
                ['Provincial Agriculturist', 26, 'permanent'],
                ['Assistant Provincial Agriculturist', 24, 'permanent'],
                ['Senior Agriculturist', 22, 'permanent'],
                ['Agriculturist III', 18, 'permanent'],
                ['Agriculturist II', 16, 'permanent'],
                ['Agricultural Technician', 8, 'permanent'],
                ['Administrative Officer III', 11, 'permanent'],
                ['Clerk III', 6, 'permanent'],
                ['Driver', 3, 'permanent'],
            ],
            'PG-ENRO' => [
                ['Provincial ENR Officer', 26, 'permanent'],
                ['Assistant ENR Officer', 24, 'permanent'],
                ['Senior ENR Specialist', 22, 'permanent'],
                ['ENR Specialist III', 18, 'permanent'],
                ['ENR Specialist II', 16, 'permanent'],
                ['Administrative Officer III', 11, 'permanent'],
                ['Clerk III', 6, 'permanent'],
                ['Driver', 3, 'permanent'],
            ],
            'PICTO' => [
                ['Provincial ICT Officer', 24, 'permanent'],
                ['Senior ICT Specialist', 22, 'permanent'],
                ['ICT Specialist III', 18, 'permanent'],
                ['ICT Specialist II', 16, 'permanent'],
                ['ICT Specialist I', 11, 'permanent'],
                ['Administrative Officer III', 11, 'permanent'],
                ['Clerk III', 6, 'permanent'],
            ],
            'LUPTO' => [
                ['Provincial Tourism Officer', 24, 'permanent'],
                ['Senior Tourism Specialist', 22, 'permanent'],
                ['Tourism Specialist III', 18, 'permanent'],
                ['Tourism Specialist II', 16, 'permanent'],
                ['Administrative Officer III', 11, 'permanent'],
                ['Clerk III', 6, 'permanent'],
            ],
            'LUPJ' => [
                ['Provincial Jail Warden', 24, 'permanent'],
                ['Assistant Jail Warden', 22, 'permanent'],
                ['Senior Jail Officer', 18, 'permanent'],
                ['Jail Officer III', 15, 'permanent'],
                ['Jail Officer II', 11, 'permanent'],
                ['Jail Officer I', 8, 'permanent'],
                ['Administrative Officer III', 11, 'permanent'],
                ['Clerk III', 6, 'permanent'],
                ['Driver', 3, 'permanent'],
            ],
        ];

        // Also create positions for district hospitals
        $hospitalAcronyms = ['BDH', 'BalDH', 'CDH', 'NDH', 'RDH'];
        $hospitalPositions = [
            ['Chief of Hospital', 24, 'permanent'],
            ['Chief Medical Officer', 22, 'permanent'],
            ['Medical Officer III', 18, 'permanent'],
            ['Nurse III', 15, 'permanent'],
            ['Nurse II', 11, 'permanent'],
            ['Midwife II', 8, 'permanent'],
            ['Administrative Officer III', 11, 'permanent'],
            ['Clerk III', 6, 'permanent'],
            ['Driver', 3, 'permanent'],
            ['Utility Worker I', 1, 'permanent'],
        ];

        // Map acronym -> office_id
        $officeMap = [];
        foreach ($offices as $office) {
            $officeMap[$office->acronym] = $office->id;
        }

        foreach ($officePositions as $acronym => $positions) {
            $officeId = $officeMap[$acronym] ?? null;
            if (!$officeId) {
                $this->command->warn(
                    "Office with acronym '$acronym' not found. Skipping.",
                );
                continue;
            }

            foreach ($positions as [$title, $sg, $type]) {
                $isFunded = in_array(
                    $acronym,
                    ['OPG', 'PTO', 'PBO', 'OPAcc', 'PEO', 'PHO'],
                    true,
                )
                    ? fake()->boolean(90)
                    : fake()->boolean(75);

                Position::create([
                    'item_number' =>
                        'POS-' .
                        str_pad(
                            (string) $positionCounter,
                            4,
                            '0',
                            STR_PAD_LEFT,
                        ),
                    'office_id' => $officeId,
                    'title' => $title,
                    'salary_grade' => $sg,
                    'employment_type' => $type,
                    'is_funded' => $isFunded,
                    'status' => $isFunded
                        ? fake()->randomElement(['occupied', 'vacant'])
                        : 'vacant',
                ]);

                $positionCounter++;
            }
        }

        // Seed hospital positions
        foreach ($hospitalAcronyms as $acronym) {
            $officeId = $officeMap[$acronym] ?? null;
            if (!$officeId) {
                $this->command->warn(
                    "Hospital with acronym '$acronym' not found. Skipping.",
                );
                continue;
            }

            foreach ($hospitalPositions as [$title, $sg, $type]) {
                Position::create([
                    'item_number' =>
                        'POS-' .
                        str_pad(
                            (string) $positionCounter,
                            4,
                            '0',
                            STR_PAD_LEFT,
                        ),
                    'office_id' => $officeId,
                    'title' => $title,
                    'salary_grade' => $sg,
                    'employment_type' => $type,
                    'is_funded' => true,
                    'status' => fake()->randomElement(['occupied', 'vacant']),
                ]);

                $positionCounter++;
            }
        }

        $this->command->info(
            'Seeded ' . ($positionCounter - 1) . ' positions successfully.',
        );
    }
}
