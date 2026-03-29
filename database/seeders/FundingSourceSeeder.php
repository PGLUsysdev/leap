<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\FundingSource;

class FundingSourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            [
                'fund_type' => 'General Fund',
                'code' => 'GF Proper',
                'title' => 'General Fund',
                'description' => null,
            ],
            [
                'fund_type' => 'General Fund',
                'code' => 'GF-5% GAD',
                'title' => 'General Fund - 5% Gender and Development Fund',
                'description' => null,
            ],
            [
                'fund_type' => 'General Fund',
                'code' => 'GF - 1% Protection of Children',
                'title' => 'General Fund - 1% Protection of Children',
                'description' => null,
            ],
            [
                'fund_type' => 'General Fund',
                'code' => 'GF - 1% PWD and SC',
                'title' =>
                    'General Fund - 1% Person with Disabilities and Senior Citizens',
                'description' => null,
            ],
            [
                'fund_type' => 'General Fund',
                'code' => 'GF - 20% DF',
                'title' =>
                    'General Fund - Special Account - 20% Development Fund',
                'description' => null,
            ],
            [
                'fund_type' => 'General Fund',
                'code' => 'GF - 5% LDRRMF',
                'title' =>
                    'General Fund - Local Disaster Risk Reduction Management Fund (LDRRMF)',
                'description' => null,
            ],
            [
                'fund_type' => 'General Fund',
                'code' => 'GF -POPS Fund',
                'title' =>
                    'General Fund - Peace and Order and Public Safety Fund',
                'description' => null,
            ],
            [
                'fund_type' => 'Transfer from NGAs',
                'code' => 'Transfer from NGAs',
                'title' =>
                    'Transfer from National Government Organizations (Other than those accruing to the GF)',
                'description' => null,
            ],
            [
                'fund_type' => 'Transfer from GOCCs',
                'code' => 'Transfer from GOCCs',
                'title' =>
                    'Transfer from Government-owned and Controlled Corporations (Other than those accruing to the GF)',
                'description' => null,
            ],
            [
                'fund_type' => 'Transfer from other LGUs',
                'code' => 'Transfer from other LGUs',
                'title' => 'Transfer from other Local Government Units',
                'description' => null,
            ],
            [
                'fund_type' => 'Income from Local Economic Enterprise',
                'code' => 'LEEs',
                'title' =>
                    'Income from Local Economic Enterprise (for its own operation)',
                'description' => null,
            ],
            [
                'fund_type' => 'Loan Proceeds',
                'code' => 'Loan Proceeds',
                'title' => 'Loan Proceeds',
                'description' => null,
            ],
            [
                'fund_type' => 'RA 7171',
                'code' => 'RA 7171',
                'title' =>
                    'RA No. 7171, entitled, “An Act to Promote the Development of Farmers in the Virginia Tobacco Producing Provinces',
                'description' => null,
            ],
            [
                'fund_type' => 'RA 8240',
                'code' => 'RA 8240',
                'title' =>
                    'RA No. 8240, as amended by RA No. 10351, entitled, “An Act Restructuring the Excise Tax on Alcohol and Tobacco Products by Amending Sections 141, 142, 143, 144, 145, 8, 131 and 288 of RA No. 8424, Otherwise Known as the National Internal Revenue Code of 1997, as Amended by RA No. 9334, and for Other Purposes',
                'description' => null,
            ],
        ];

        foreach ($data as $item) {
            FundingSource::create($item);
        }
    }
}
