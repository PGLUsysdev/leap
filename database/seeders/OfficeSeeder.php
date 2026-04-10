<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Office;
use Illuminate\Support\Facades\Schema;

class OfficeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable foreign key checks to truncate safely, then re-enable
        // Schema::disableForeignKeyConstraints();
        // Office::truncate();
        // Schema::enableForeignKeyConstraints();

        $offices = [
            // general public services sector
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '001',
                'name' => 'Office of the Provincial Governor',
                'acronym' => 'OPG',
            ],
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '001',
                'name' => 'OPG - Bids and Awards Committee Support Unit',
                'acronym' => 'BACSU',
            ],
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '001',
                'name' => 'OPG - Internal Audit Services Unit',
                'acronym' => 'IASU',
            ],
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '001',
                'name' => 'OPG - Security Services Unit',
                'acronym' => 'SSU',
            ],
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '001',
                'name' => 'OPG - Peace, Order and Public Safety',
                'acronym' => 'POPS',
            ],
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '001',
                'name' => 'La Union Provincial Jail',
                'acronym' => 'LUPJ',
            ],
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '002',
                'name' => 'Office of the Vice Governor',
                'acronym' => 'OVG',
            ],
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '003',
                'name' => 'Office of the Sangguniang Panlalawigan',
                'acronym' => 'OSP',
            ],
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '005',
                'name' => 'Provincial Treasurer\'s Office',
                'acronym' => 'PTO',
            ],
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '006',
                'name' => 'Office of the Provincial Assessor',
                'acronym' => 'OPAss',
            ],
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '007',
                'name' => 'Office of the Provincial Accountant',
                'acronym' => 'OPAcc',
            ],
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '009',
                'name' => 'Provincial Budget Office',
                'acronym' => 'PBO',
            ],
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '010',
                'name' =>
                    'Office of the Provincial Planning and Development Coordinator',
                'acronym' => 'OPPDC',
            ],
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '011',
                'name' => 'Provincial Legal Office',
                'acronym' => 'PLO',
            ],
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '012',
                'name' => 'Office of the Provincial Administrator',
                'acronym' => 'OPAdmin',
            ],
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '015',
                'name' => 'Provincial General Services Officer',
                'acronym' => 'PGSO',
            ],
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 2,
                'code' => '005',
                'name' => 'Provincial Information Office',
                'acronym' => 'PIO',
            ],
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 3,
                'code' => '009',
                'name' =>
                    'Provincial Information and Communications Technology Office',
                'acronym' => 'PICTO',
            ],
            [
                'sector_id' => 1,
                'lgu_level_id' => 1,
                'office_type_id' => 3,
                'code' => '010',
                'name' =>
                    'Provincial Human Resource Mangement and Development Office',
                'acronym' => 'PHRMDO',
            ],

            // social services sector
            [
                'sector_id' => 2,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '001',
                'name' => 'OPG - Provincial Housing Board (PHB)',
                'acronym' => 'PHB',
            ],
            [
                'sector_id' => 2,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '001',
                'name' => 'OPG - Gender and Development Office',
                'acronym' => 'GAD',
            ],
            [
                'sector_id' => 2,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '001',
                'name' => 'OPG - Public Employment Services Office',
                'acronym' => 'PESO',
            ],
            [
                'sector_id' => 2,
                'lgu_level_id' => 1,
                'office_type_id' => 3,
                'code' => '011',
                'name' =>
                    'Provincial Youth, Education, Sports Development Office',
                'acronym' => 'PYESDO',
            ],
            [
                'sector_id' => 2,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '014',
                'name' => 'Provincial Social Welfare and Development Office',
                'acronym' => 'PSWDO',
            ],
            [
                'sector_id' => 2,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '013',
                'name' => 'Provincial Health Office',
                'acronym' => 'PHO',
            ],
            [
                'sector_id' => 2,
                'lgu_level_id' => 1,
                'office_type_id' => 3,
                'code' => '002',
                'name' => 'Bacnotan District Hospital',
                'acronym' => 'BDH',
            ],
            [
                'sector_id' => 2,
                'lgu_level_id' => 1,
                'office_type_id' => 3,
                'code' => '003',
                'name' => 'Balaoan District Hospital',
                'acronym' => 'BalDH',
            ],
            [
                'sector_id' => 2,
                'lgu_level_id' => 1,
                'office_type_id' => 3,
                'code' => '004',
                'name' => 'Caba District Hospital',
                'acronym' => 'CDH',
            ],
            [
                'sector_id' => 2,
                'lgu_level_id' => 1,
                'office_type_id' => 3,
                'code' => '005',
                'name' => 'Naguilian District Hospital',
                'acronym' => 'NDH',
            ],
            [
                'sector_id' => 2,
                'lgu_level_id' => 1,
                'office_type_id' => 3,
                'code' => '006',
                'name' => 'Rosario District Hospital',
                'acronym' => 'RDH',
            ],

            // economic services sector
            [
                'sector_id' => 3,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '001',
                'name' => 'OPG - Provincial Cooperative Development Office',
                'acronym' => 'PCDO',
            ],
            [
                'sector_id' => 3,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '008',
                'name' => 'Provincial Engineering Office',
                'acronym' => 'PEO',
            ],
            [
                'sector_id' => 3,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '016',
                'name' => 'Office of the Provincial Agriculturist',
                'acronym' => 'OPAg',
            ],
            [
                'sector_id' => 3,
                'lgu_level_id' => 1,
                'office_type_id' => 1,
                'code' => '017',
                'name' => 'Office of the Provincial Veterinarian',
                'acronym' => 'OPVet',
            ],
            [
                'sector_id' => 3,
                'lgu_level_id' => 1,
                'office_type_id' => 2,
                'code' => '002',
                'name' =>
                    'Provincial Government Environment and Natural Resource Office',
                'acronym' => 'PG-ENRO',
            ],
            [
                'sector_id' => 3,
                'lgu_level_id' => 1,
                'office_type_id' => 3,
                'code' => '001',
                'name' =>
                    'Provincial Disaster Risk Reduction and Management Office',
                'acronym' => 'PDRRMO',
            ],
            [
                'sector_id' => 3,
                'lgu_level_id' => 1,
                'office_type_id' => 3,
                'code' => '007',
                'name' => 'La Union Provincial Tourism Office',
                'acronym' => 'LUPTO',
            ],
            [
                'sector_id' => 3,
                'lgu_level_id' => 1,
                'office_type_id' => 3,
                'code' => '008',
                'name' =>
                    'Local Economic Enterprise and Investments Promotion Office',
                'acronym' => 'LEEIPO',
            ],
        ];

        foreach ($offices as $office) {
            Office::create($office);
        }
    }
}
