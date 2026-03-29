<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Sector;

class SectorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sectors = [
            ['code' => '1000', 'name' => 'General Public Services Sector'], // General Public Services Sector
            ['code' => '3000', 'name' => 'Social Services Sector'], // Social Services Sector / District Hospitals
            ['code' => '8000', 'name' => 'Economic Services Sector'], // Economic Services Sector
            ['code' => '9000', 'name' => 'Other Services'], // Special Accounts
        ];

        foreach ($sectors as $sector) {
            Sector::create($sector);
        }
    }
}
