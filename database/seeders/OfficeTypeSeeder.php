<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\OfficeType;

class OfficeTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        OfficeType::truncate();

        $officeTypes = [
            ['code' => '01', 'name' => 'Mandatory'],
            ['code' => '02', 'name' => 'Optional'],
            ['code' => '03', 'name' => 'Others'],
        ];

        foreach ($officeTypes as $officeType) {
            // OfficeType::create($officeType);
            OfficeType::updateOrCreate($officeType);
        }
    }
}
