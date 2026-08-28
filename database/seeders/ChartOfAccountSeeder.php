<?php

namespace Database\Seeders;

use App\Models\ChartOfAccount;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ChartOfAccountSeeder extends Seeder
{
    public function run(): void
    {
        $coas = [
            [
                'full_code' => '1',
                'account_title' => 'Assets',
            ],
            [
                'full_code' => '1 01',
                'account_title' => 'Cash',
            ],
            [
                'full_code' => '1 01 01',
                'account_title' => 'Cash on Hand',
            ],
            [
                'full_code' => '1 01 01 010',
                'account_title' => 'Cash Local Treasury',
            ],
            [
                'full_code' => '1 01 01 020',
                'account_title' => 'Petty Cash',
            ],
            [
                'full_code' => '1 01 02',
                'account_title' => 'Cash in Bank - Local Currency',
            ],
            [
                'full_code' => '1 01 02 010',
                'account_title' => 'Cash in Bank - Local Currency, Current Account',
            ],
            [
                'full_code' => '1 01 02 020',
                'account_title' => 'Cash in Bank - Local Currency, Savings Account',
            ],
            [
                'full_code' => '1 01 03',
                'account_title' => 'Cash in Bank - Foreign Currency',
            ],
            [
                'full_code' => '1 01 03 010',
                'account_title' => 'Cash in Bank - Foreign Currency, Current Account',
            ],
            [
                'full_code' => '1 01 03 020',
                'account_title' => 'Cash in Bank - Foreign Currency, Savings Account',
            ],

            // ---

            ['full_code' => '1 02', 'account_title' => 'Investments'],
            ['full_code' => '1 02 01', 'account_title' => 'Investments in Time Deposits'],
            [
                'full_code' => '1 02 01 010',
                'account_title' => 'Cash in Bank -Local Currency, Time Deposits',
            ],
            [
                'full_code' => '1 02 01 020',
                'account_title' => 'Cash in Bank - Foreign Currency, Time Deposits',
            ],
            ['full_code' => '1 02 01 030', 'account_title' => 'Treasury Bills'],
            [
                'full_code' => '1 02 02',
                'account_title' => 'Financial Assets at Fair Value Through Surplus or Deficit',
            ],
            ['full_code' => '1 02 02 010', 'account_title' => 'Financial Assets Held for Trading'],
            [
                'full_code' => '1 02 02 020',
                'account_title' =>
                    'Financial Assets Designated at Fair Value Through Surplus or Deficit',
            ],
            ['full_code' => '1 02 03', 'account_title' => 'Financial Assets - Held to Maturity'],
            [
                'full_code' => '1 02 03 010',
                'account_title' => 'Investments in Treasury Bills - Local',
            ],
            [
                'full_code' => '1 02 03 011',
                'account_title' =>
                    'Allowance for Impairment - Investments in Treasury Bills - Local',
            ],
            ['full_code' => '1 02 03 020', 'account_title' => 'Investments in Bonds-Local'],
            [
                'full_code' => '1 02 03 021',
                'account_title' => 'Allowance for Impairment - Investments in Bonds - Local',
            ],
            ['full_code' => '1 02 04', 'account_title' => 'Financial Assets - Available for Sale'],
            ['full_code' => '1 02 04 010', 'account_title' => 'Investments in Stocks'],
            ['full_code' => '1 02 04 020', 'account_title' => 'Investments in Bonds'],
            ['full_code' => '1 02 05', 'account_title' => 'Financial Assets - Others'],
            ['full_code' => '1 02 05 010', 'account_title' => 'Deposits on Letters of Credit'],
            [
                'full_code' => '1 02 05 011',
                'account_title' => 'Allowance for Impairment - Deposits in Letters of Credit',
            ],
            ['full_code' => '1 02 05 020', 'account_title' => 'Guaranty Deposits'],
            [
                'full_code' => '1 02 05 021',
                'account_title' => 'Allowance for Impairment - Guaranty Deposits',
            ],
            ['full_code' => '1 02 05 990', 'account_title' => 'Other Investments'],
            [
                'full_code' => '1 02 05 991',
                'account_title' => 'Allowance for Impairment - Other Investments',
            ],
            ['full_code' => '1 02 06', 'account_title' => 'Investments in Joint Venture'],
            ['full_code' => '1 02 06 010', 'account_title' => 'Investments in Joint Venture'],
            [
                'full_code' => '1 02 06 011',
                'account_title' => 'Allowance for Impairment - Investments in Joint Venture',
            ],
            ['full_code' => '1 02 07', 'account_title' => 'Sinking Fund'],
            ['full_code' => '1 02 07 010', 'account_title' => 'Sinking Fund'],

            ['full_code' => '1 03', 'account_title' => 'Receivables'],
            ['full_code' => '1 03 01', 'account_title' => 'Loans and Receivable Accounts'],
            ['full_code' => '1 03 01 010', 'account_title' => 'Accounts Receivable'],
            [
                'full_code' => '1 03 01 011',
                'account_title' => 'Allowance for Impairment - Accounts Receivable',
            ],
            ['full_code' => '1 03 01 020', 'account_title' => 'Real Property Tax Receivable'],
            [
                'full_code' => '1 03 01 021',
                'account_title' => 'Allowance for Impairment - RPT Receivable',
            ],
            ['full_code' => '1 03 01 030', 'account_title' => 'Special Education Tax Receivable'],
            [
                'full_code' => '1 03 01 031',
                'account_title' => 'Allowance for Impairment - SET Receivable',
            ],
            ['full_code' => '1 03 01 040', 'account_title' => 'Notes Receivable'],
            [
                'full_code' => '1 03 01 041',
                'account_title' => 'Allowance for Impairment - Notes Receivable',
            ],
            [
                'full_code' => '1 03 01 050',
                'account_title' =>
                    'Loans Receivable - Government-Owned and/or Controlled Corporations',
            ],
            [
                'full_code' => '1 03 01 051',
                'account_title' =>
                    'Allowance for Impairment - Loans Receivable - Government-Owned and/or Controlled Corporations',
            ],
            [
                'full_code' => '1 03 01 060',
                'account_title' => 'Loans Receivable - Local Government Units',
            ],
            [
                'full_code' => '1 03 01 061',
                'account_title' =>
                    'Allowance for Impairment - Loans Receivable - Local Government Units',
            ],
            ['full_code' => '1 03 01 070', 'account_title' => 'Interests Receivable'],
            [
                'full_code' => '1 03 01 071',
                'account_title' => 'Allowance for Impairment - Interests Receivable',
            ],
            ['full_code' => '1 03 01 080', 'account_title' => 'Dividends Receivable'],
            [
                'full_code' => '1 03 01 081',
                'account_title' => 'Allowance for Impairment - Dividends Receivable',
            ],
            ['full_code' => '1 03 01 990', 'account_title' => 'Loans Receivable - Others'],
            [
                'full_code' => '1 03 01 991',
                'account_title' => 'Allowance for Impairment - Loans Receivable - Others',
            ],
            ['full_code' => '1 03 02', 'account_title' => 'Lease Receivables'],
            ['full_code' => '1 03 02 010', 'account_title' => 'Operating Lease Receivable'],
            [
                'full_code' => '1 03 02 011',
                'account_title' => 'Allowance for Impairment - Operating Lease Receivable',
            ],
            ['full_code' => '1 03 02 020', 'account_title' => 'Finance Lease Receivable'],
            [
                'full_code' => '1 03 02 021',
                'account_title' => 'Allowance for Impairment - Finance Lease Receivable',
            ],
            ['full_code' => '1 03 03', 'account_title' => 'Inter-Agency Receivables'],
            [
                'full_code' => '1 03 03 010',
                'account_title' => 'Due from National Government Agencies',
            ],
            [
                'full_code' => '1 03 03 011',
                'account_title' =>
                    'Allowance for Impairment - Due from National Government Agencies',
            ],
            [
                'full_code' => '1 03 03 020',
                'account_title' => 'Due from Government-Owned and/or Controlled Corporations',
            ],
            [
                'full_code' => '1 03 03 021',
                'account_title' => 'Allowance for Impairment - Due from GOCCs',
            ],
            ['full_code' => '1 03 03 030', 'account_title' => 'Due from Local Government Units'],
            [
                'full_code' => '1 03 03 031',
                'account_title' => 'Allowance for Impairment - Due from LGUs',
            ],
            ['full_code' => '1 03 03 040', 'account_title' => 'Due from Joint Venture'],
            [
                'full_code' => '1 03 03 041',
                'account_title' => 'Allowance for Impairment - Due from Joint Venture',
            ],
            ['full_code' => '1 03 04', 'account_title' => 'Intra-Agency Receivables'],
            ['full_code' => '1 03 04 050', 'account_title' => 'Due from Other Funds'],
            ['full_code' => '1 03 04 060', 'account_title' => 'Due from Special Accounts'],
            ['full_code' => '1 03 04 070', 'account_title' => 'Due from Local Economic Enterprise'],
            ['full_code' => '1 03 05', 'account_title' => 'Advances'],
            ['full_code' => '1 03 05 010', 'account_title' => 'Advances for Operating Expenses'],
            ['full_code' => '1 03 05 020', 'account_title' => 'Advances for Payroll'],
            [
                'full_code' => '1 03 05 030',
                'account_title' => 'Advances to Special Disbursing Officer',
            ],
            ['full_code' => '1 03 05 040', 'account_title' => 'Advances to Officers and Employees'],
            ['full_code' => '1 03 06', 'account_title' => 'Other Receivables'],
            [
                'full_code' => '1 03 06 010',
                'account_title' => 'Receivables - Disallowances/Charges',
            ],
            [
                'full_code' => '1 03 06 011',
                'account_title' => 'Allowance for Impairment - Receivables- Disallowances/Charges',
            ],
            ['full_code' => '1 03 06 020', 'account_title' => 'Due from Officers and Employees'],
            [
                'full_code' => '1 03 06 021',
                'account_title' => 'Allowance for Impairment - Due from Officers and Employees',
            ],
            [
                'full_code' => '1 03 06 030',
                'account_title' => 'Due from Non-Government Organizations/People\'s Organizations',
            ],
            [
                'full_code' => '1 03 06 031',
                'account_title' =>
                    'Allowance for Impairment - Due from Non-Government Organizations/People\'s Organizations',
            ],
            ['full_code' => '1 03 06 990', 'account_title' => 'Other Receivables'],
            [
                'full_code' => '1 03 06 991',
                'account_title' => 'Allowance for Impairment - Other Receivables',
            ],

            ['full_code' => '1 04', 'account_title' => 'Inventories'],
            ['full_code' => '1 04 01', 'account_title' => 'Inventory Held for Sale'],
            ['full_code' => '1 04 01 010', 'account_title' => 'Merchandise Inventory'],
            ['full_code' => '1 04 02', 'account_title' => 'Inventory Held for Distribution'],
            ['full_code' => '1 04 02 010', 'account_title' => 'Food Supplies for Distribution'],
            ['full_code' => '1 04 02 020', 'account_title' => 'Welfare Goods for Distribution'],
            [
                'full_code' => '1 04 02 030',
                'account_title' => 'Drugs and Medicines for Distribution',
            ],
            [
                'full_code' => '1 04 02 040',
                'account_title' => 'Medical, Dental and Laboratory Supplies for Distribution',
            ],
            [
                'full_code' => '1 04 02 050',
                'account_title' => 'Agricultural and Marine Supplies for Distribution',
            ],
            [
                'full_code' => '1 04 02 060',
                'account_title' => 'Agricultural Produce for Distribution',
            ],
            [
                'full_code' => '1 04 02 070',
                'account_title' => 'Textbooks and Instructional Materials for Distribution',
            ],
            [
                'full_code' => '1 04 02 080',
                'account_title' => 'Construction Materials for Distribution',
            ],
            [
                'full_code' => '1 04 02 090',
                'account_title' => 'Property and Equipment for Distribution',
            ],
            [
                'full_code' => '1 04 02 990',
                'account_title' => 'Other Supplies and Materials for Distribution',
            ],
            ['full_code' => '1 04 03', 'account_title' => 'Inventory Held for Manufacturing'],
            ['full_code' => '1 04 03 010', 'account_title' => 'Raw Materials Inventory'],
            ['full_code' => '1 04 03 020', 'account_title' => 'Work-in-Process Inventory'],
            ['full_code' => '1 04 03 030', 'account_title' => 'Finished Goods Inventory'],
            ['full_code' => '1 04 04', 'account_title' => 'Inventory Held for Consumption'],
            ['full_code' => '1 04 04 010', 'account_title' => 'Office Supplies Inventory'],
            [
                'full_code' => '1 04 04 020',
                'account_title' => 'Accountable Forms, Plates and Stickers',
            ],
            ['full_code' => '1 04 04 030', 'account_title' => 'Non-Accountable Forms Inventory'],
            [
                'full_code' => '1 04 04 040',
                'account_title' => 'Animal/Zoological Supplies Inventory',
            ],
            ['full_code' => '1 04 04 050', 'account_title' => 'Food Supplies Inventory'],
            ['full_code' => '1 04 04 060', 'account_title' => 'Drugs and Medicines Inventory'],
            [
                'full_code' => '1 04 04 070',
                'account_title' => 'Medical, Dental and Laboratory Supplies Inventory',
            ],
            ['full_code' => '1 04 04 080', 'account_title' => 'Fuel, Oil and Lubricants Inventory'],
            [
                'full_code' => '1 04 04 090',
                'account_title' => 'Agricultural and Marine Supplies Inventory',
            ],
            [
                'full_code' => '1 04 04 100',
                'account_title' => 'Textbooks and Instructional Materials Inventory',
            ],
            [
                'full_code' => '1 04 04 110',
                'account_title' => 'Military, Police and Traffic Supplies Inventory',
            ],
            [
                'full_code' => '1 04 04 120',
                'account_title' => 'Chemical and Filtering Supplies Inventory',
            ],
            ['full_code' => '1 04 04 130', 'account_title' => 'Construction Materials Inventory'],
            [
                'full_code' => '1 04 04 990',
                'account_title' => 'Other Supplies and Materials Inventory',
            ],

            ['full_code' => '1 05', 'account_title' => 'Prepayments'],
            ['full_code' => '1 05 01', 'account_title' => 'Prepayments'],
            ['full_code' => '1 05 01 010', 'account_title' => 'Advances to Contractors'],
            ['full_code' => '1 05 01 020', 'account_title' => 'Prepaid Rent'],
            ['full_code' => '1 05 01 030', 'account_title' => 'Prepaid Registration'],
            ['full_code' => '1 05 01 040', 'account_title' => 'Prepaid Interest'],
            ['full_code' => '1 05 01 050', 'account_title' => 'Prepaid Insurance'],
            ['full_code' => '1 05 01 990', 'account_title' => 'Other Prepayments'],

            ['full_code' => '1 06', 'account_title' => 'Investment Property'],
            ['full_code' => '1 06 01', 'account_title' => 'Land and Buildings'],
            ['full_code' => '1 06 01 010', 'account_title' => 'Investment Property, Land'],
            [
                'full_code' => '1 06 01 011',
                'account_title' => 'Accumulated Impairment Losses - Investment Property, Land',
            ],
            ['full_code' => '1 06 01 020', 'account_title' => 'Investment Property, Buildings'],
            [
                'full_code' => '1 06 01 021',
                'account_title' => 'Accumulated Depreciation - Investment Property, Buildings',
            ],
            [
                'full_code' => '1 06 01 022',
                'account_title' => 'Accumulated Impairment Losses - Investment Property, Buildings',
            ],
            [
                'full_code' => '1 06 01 030',
                'account_title' => 'Construction in Progress - Investment Property, Buildings',
            ],

            ['full_code' => '1 07', 'account_title' => 'Property, Plant and Equipment'],
            ['full_code' => '1 07 01', 'account_title' => 'Land'],
            ['full_code' => '1 07 01 010', 'account_title' => 'Land'],
            [
                'full_code' => '1 07 01 011',
                'account_title' => 'Accumulated Impairment Losses - Land',
            ],
            ['full_code' => '1 07 02', 'account_title' => 'Land Improvements'],
            [
                'full_code' => '1 07 02 010',
                'account_title' => 'Land Improvements, Aquaculture Structures',
            ],
            [
                'full_code' => '1 07 02 011',
                'account_title' =>
                    'Accumulated Depreciation - Land Improvements, Aquaculture Structures',
            ],
            [
                'full_code' => '1 07 02 012',
                'account_title' =>
                    'Accumulated Impairment Losses - Land Improvements, Aquaculture Structures',
            ],
            ['full_code' => '1 07 02 990', 'account_title' => 'Other Land Improvements'],
            [
                'full_code' => '1 07 02 991',
                'account_title' => 'Accumulated Depreciation - Other Land Improvements',
            ],
            [
                'full_code' => '1 07 02 992',
                'account_title' => 'Accumulated Impairment Losses - Other Land Improvements',
            ],
            ['full_code' => '1 07 03', 'account_title' => 'Infrastructure Assets'],
            ['full_code' => '1 07 03 010', 'account_title' => 'Road Networks'],
            [
                'full_code' => '1 07 03 011',
                'account_title' => 'Accumulated Depreciation - Road Networks',
            ],
            [
                'full_code' => '1 07 03 012',
                'account_title' => 'Accumulated Impairment Losses - Road Networks',
            ],
            ['full_code' => '1 07 03 020', 'account_title' => 'Flood Control Systems'],
            [
                'full_code' => '1 07 03 021',
                'account_title' => 'Accumulated Depreciation - Flood Control Systems',
            ],
            [
                'full_code' => '1 07 03 022',
                'account_title' => 'Accumulated Impairment Losses - Flood Control Systems',
            ],
            ['full_code' => '1 07 03 030', 'account_title' => 'Sewer Systems'],
            [
                'full_code' => '1 07 03 031',
                'account_title' => 'Accumulated Depreciation - Sewer Systems',
            ],
            [
                'full_code' => '1 07 03 032',
                'account_title' => 'Accumulated Impairment Losses - Sewer Systems',
            ],
            ['full_code' => '1 07 03 040', 'account_title' => 'Water Supply Systems'],
            [
                'full_code' => '1 07 03 041',
                'account_title' => 'Accumulated Depreciation - Water Supply Systems',
            ],
            [
                'full_code' => '1 07 03 042',
                'account_title' => 'Accumulated Impairment Losses - Water Supply Systems',
            ],
            ['full_code' => '1 07 03 050', 'account_title' => 'Power Supply Systems'],
            [
                'full_code' => '1 07 03 051',
                'account_title' => 'Accumulated Depreciation - Power Supply Systems',
            ],
            [
                'full_code' => '1 07 03 052',
                'account_title' => 'Accumulated Impairment Losses - Power Supply Systems',
            ],
            ['full_code' => '1 07 03 060', 'account_title' => 'Communication Networks'],
            [
                'full_code' => '1 07 03 061',
                'account_title' => 'Accumulated Depreciation - Communication Networks',
            ],
            [
                'full_code' => '1 07 03 062',
                'account_title' => 'Accumulated Impairment Losses - Communication Networks',
            ],
            ['full_code' => '1 07 03 070', 'account_title' => 'Seaport Systems'],
            [
                'full_code' => '1 07 03 071',
                'account_title' => 'Accumulated Depreciation - Seaport Systems',
            ],
            [
                'full_code' => '1 07 03 072',
                'account_title' => 'Accumulated Impairment Losses - Seaport Systems',
            ],
            ['full_code' => '1 07 03 080', 'account_title' => 'Airport Systems'],
            [
                'full_code' => '1 07 03 081',
                'account_title' => 'Accumulated Depreciation - Airport Systems',
            ],
            [
                'full_code' => '1 07 03 082',
                'account_title' => 'Accumulated Impairment Losses - Airport Systems',
            ],
            ['full_code' => '1 07 03 090', 'account_title' => 'Parks, Plazas and Monuments'],
            [
                'full_code' => '1 07 03 091',
                'account_title' => 'Accumulated Depreciation - Parks, Plazas and Monuments',
            ],
            [
                'full_code' => '1 07 03 092',
                'account_title' => 'Accumulated Impairment Losses - Parks, Plazas and Monuments',
            ],
            ['full_code' => '1 07 03 990', 'account_title' => 'Other Infrastructure Assets'],
            [
                'full_code' => '1 07 03 991',
                'account_title' => 'Accumulated Depreciation - Other Infrastructure Assets',
            ],
            [
                'full_code' => '1 07 03 992',
                'account_title' => 'Accumulated Impairment Losses - Other Infrastructure Assets',
            ],
            ['full_code' => '1 07 04', 'account_title' => 'Buildings and Other Structures'],
            ['full_code' => '1 07 04 010', 'account_title' => 'Buildings'],
            [
                'full_code' => '1 07 04 011',
                'account_title' => 'Accumulated Depreciation - Buildings',
            ],
            [
                'full_code' => '1 07 04 012',
                'account_title' => 'Accumulated Impairment Losses - Buildings',
            ],
            ['full_code' => '1 07 04 020', 'account_title' => 'School Buildings'],
            [
                'full_code' => '1 07 04 021',
                'account_title' => 'Accumulated Depreciation - School Buildings',
            ],
            [
                'full_code' => '1 07 04 022',
                'account_title' => 'Accumulated Impairment Losses - School Buildings',
            ],
            ['full_code' => '1 07 04 030', 'account_title' => 'Hospitals and Health Centers'],
            [
                'full_code' => '1 07 04 031',
                'account_title' => 'Accumulated Depreciation - Hospitals and Health Centers',
            ],
            [
                'full_code' => '1 07 04 032',
                'account_title' => 'Accumulated Impairment Losses - Hospitals and Health Centers',
            ],
            ['full_code' => '1 07 04 040', 'account_title' => 'Markets'],
            ['full_code' => '1 07 04 041', 'account_title' => 'Accumulated Depreciation - Markets'],
            [
                'full_code' => '1 07 04 042',
                'account_title' => 'Accumulated Impairment Losses - Markets',
            ],
            ['full_code' => '1 07 04 050', 'account_title' => 'Slaughterhouses'],
            [
                'full_code' => '1 07 04 051',
                'account_title' => 'Accumulated Depreciation - Slaughterhouses',
            ],
            [
                'full_code' => '1 07 04 052',
                'account_title' => 'Accumulated Impairment Losses- Slaughterhouses',
            ],
            ['full_code' => '1 07 04 060', 'account_title' => 'Hostels and Dormitories'],
            [
                'full_code' => '1 07 04 061',
                'account_title' => 'Accumulated Depreciation - Hostels and Dormitories',
            ],
            [
                'full_code' => '1 07 04 062',
                'account_title' => 'Accumulated Impairment Losses - Hostels and Dormitories',
            ],
            ['full_code' => '1 07 04 990', 'account_title' => 'Other Structures'],
            [
                'full_code' => '1 07 04 991',
                'account_title' => 'Accumulated Depreciation - Other Structures',
            ],
            [
                'full_code' => '1 07 04 992',
                'account_title' => 'Accumulated Impairment Losses - Other Structures',
            ],
            ['full_code' => '1 07 05', 'account_title' => 'Machinery and Equipment'],
            ['full_code' => '1 07 05 010', 'account_title' => 'Machinery'],
            [
                'full_code' => '1 07 05 011',
                'account_title' => 'Accumulated Depreciation - Machinery',
            ],
            [
                'full_code' => '1 07 05 012',
                'account_title' => 'Accumulated Impairment Losses - Machinery',
            ],
            ['full_code' => '1 07 05 020', 'account_title' => 'Office Equipment'],
            [
                'full_code' => '1 07 05 021',
                'account_title' => 'Accumulated Depreciation - Office Equipment',
            ],
            [
                'full_code' => '1 07 05 022',
                'account_title' => 'Accumulated Impairment Losses - Office Equipment',
            ],
            [
                'full_code' => '1 07 05 030',
                'account_title' => 'Information and Communication Technology Equipment',
            ],
            [
                'full_code' => '1 07 05 031',
                'account_title' =>
                    'Accumulated Depreciation - Information and Communication Technology Equipment',
            ],
            [
                'full_code' => '1 07 05 032',
                'account_title' =>
                    'Accumulated Impairment Losses - Information and Communication Technology Equipment',
            ],
            [
                'full_code' => '1 07 05 040',
                'account_title' => 'Agricultural and Forestry Equipment',
            ],
            [
                'full_code' => '1 07 05 041',
                'account_title' => 'Accumulated Depreciation - Agricultural and Forestry Equipment',
            ],
            [
                'full_code' => '1 07 05 042',
                'account_title' =>
                    'Accumulated Impairment Losses - Agricultural and Forestry Equipment',
            ],
            ['full_code' => '1 07 05 050', 'account_title' => 'Marine and Fishery Equipment'],
            [
                'full_code' => '1 07 05 051',
                'account_title' => 'Accumulated Depreciation - Marine and Fishery Equipment',
            ],
            [
                'full_code' => '1 07 05 052',
                'account_title' => 'Accumulated Impairment Losses - Marine and Fishery Equipment',
            ],
            ['full_code' => '1 07 05 060', 'account_title' => 'Airport Equipment'],
            [
                'full_code' => '1 07 05 061',
                'account_title' => 'Accumulated Depreciation - Airport Equipment',
            ],
            [
                'full_code' => '1 07 05 062',
                'account_title' => 'Accumulated Impairment Losses - Airport Equipment',
            ],
            ['full_code' => '1 07 05 070', 'account_title' => 'Communication Equipment'],
            [
                'full_code' => '1 07 05 071',
                'account_title' => 'Accumulated Depreciation - Communication Equipment',
            ],
            [
                'full_code' => '1 07 05 072',
                'account_title' => 'Accumulated Impairment Losses - Communication Equipment',
            ],
            ['full_code' => '1 07 05 080', 'account_title' => 'Construction and Heavy Equipment'],
            [
                'full_code' => '1 07 05 081',
                'account_title' => 'Accumulated Depreciation - Construction and Heavy Equipment',
            ],
            [
                'full_code' => '1 07 05 082',
                'account_title' =>
                    'Accumulated Impairment Losses - Construction and Heavy Equipment',
            ],
            [
                'full_code' => '1 07 05 090',
                'account_title' => 'Disaster Response and Rescue Equipment',
            ],
            [
                'full_code' => '1 07 05 091',
                'account_title' =>
                    'Accumulated Depreciation - Disaster Response and Rescue Equipment',
            ],
            [
                'full_code' => '1 07 05 092',
                'account_title' =>
                    'Accumulated Impairment Losses - Disaster Response and Rescue Equipment',
            ],
            [
                'full_code' => '1 07 05 100',
                'account_title' => 'Military, Police and Security Equipment',
            ],
            [
                'full_code' => '1 07 05 101',
                'account_title' =>
                    'Accumulated Depreciation - Military, Police and Security Equipment',
            ],
            [
                'full_code' => '1 07 05 102',
                'account_title' =>
                    'Accumulated Impairment Losses - Military, Police and Security Equipment',
            ],
            ['full_code' => '1 07 05 110', 'account_title' => 'Medical Equipment'],
            [
                'full_code' => '1 07 05 111',
                'account_title' => 'Accumulated Depreciation - Medical Equipment',
            ],
            [
                'full_code' => '1 07 05 112',
                'account_title' => 'Accumulated Impairment Losses - Medical Equipment',
            ],
            ['full_code' => '1 07 05 120', 'account_title' => 'Printing Equipment'],
            [
                'full_code' => '1 07 05 121',
                'account_title' => 'Accumulated Depreciation - Printing Equipment',
            ],
            [
                'full_code' => '1 07 05 122',
                'account_title' => 'Accumulated Impairment Losses - Printing Equipment',
            ],
            ['full_code' => '1 07 05 130', 'account_title' => 'Sports Equipment'],
            [
                'full_code' => '1 07 05 131',
                'account_title' => 'Accumulated Depreciation - Sports Equipment',
            ],
            [
                'full_code' => '1 07 05 132',
                'account_title' => 'Accumulated Impairment Losses - Sports Equipment',
            ],
            ['full_code' => '1 07 05 140', 'account_title' => 'Technical and Scientific Equipment'],
            [
                'full_code' => '1 07 05 141',
                'account_title' => 'Accumulated Depreciation - Technical and Scientific Equipment',
            ],
            [
                'full_code' => '1 07 05 142',
                'account_title' =>
                    'Accumulated Impairment Losses - Technical and Scientific Equipment',
            ],
            ['full_code' => '1 07 05 990', 'account_title' => 'Other Machinery and Equipment'],
            [
                'full_code' => '1 07 05 991',
                'account_title' => 'Accumulated Depreciation - Other Machinery and Equipment',
            ],
            [
                'full_code' => '1 07 05 992',
                'account_title' => 'Accumulated Impairment Losses - Other Machinery and Equipment',
            ],
            ['full_code' => '1 07 06', 'account_title' => 'Transportation Equipment'],
            ['full_code' => '1 07 06 010', 'account_title' => 'Motor Vehicles'],
            [
                'full_code' => '1 07 06 011',
                'account_title' => 'Accumulated Depreciation - Motor Vehicles',
            ],
            [
                'full_code' => '1 07 06 012',
                'account_title' => 'Accumulated Impairment Losses - Motor Vehicles',
            ],
            ['full_code' => '1 07 06 020', 'account_title' => 'Trains'],
            ['full_code' => '1 07 06 021', 'account_title' => 'Accumulated Depreciation - Trains'],
            [
                'full_code' => '1 07 06 022',
                'account_title' => 'Accumulated Impairment Losses - Trains',
            ],
            [
                'full_code' => '1 07 06 030',
                'account_title' => 'Aircrafts and Aircrafts Ground Equipment',
            ],
            [
                'full_code' => '1 07 06 031',
                'account_title' =>
                    'Accumulated Depreciation - Aircrafts and Aircrafts Ground Equipment',
            ],
            [
                'full_code' => '1 07 06 032',
                'account_title' =>
                    'Accumulated Impairment Losses - Aircrafts and Aircrafts Ground Equipment',
            ],
            ['full_code' => '1 07 06 040', 'account_title' => 'Watercrafts'],
            [
                'full_code' => '1 07 06 041',
                'account_title' => 'Accumulated Depreciation - Watercrafts',
            ],
            [
                'full_code' => '1 07 06 042',
                'account_title' => 'Accumulated Impairment Losses - Watercrafts',
            ],
            ['full_code' => '1 07 06 990', 'account_title' => 'Other Transportation Equipment'],
            [
                'full_code' => '1 07 06 991',
                'account_title' => 'Accumulated Depreciation - Other Transportation Equipment',
            ],
            [
                'full_code' => '1 07 06 992',
                'account_title' => 'Accumulated Impairment Losses - Other Transportation Equipment',
            ],
            ['full_code' => '1 07 07', 'account_title' => 'Furniture, Fixtures and Books'],
            ['full_code' => '1 07 07 010', 'account_title' => 'Furniture and Fixtures'],
            [
                'full_code' => '1 07 07 011',
                'account_title' => 'Accumulated Depreciation - Furniture and Fixtures',
            ],
            [
                'full_code' => '1 07 07 012',
                'account_title' => 'Accumulated Impairment Losses - Furniture and Fixtures',
            ],
            ['full_code' => '1 07 07 020', 'account_title' => 'Books'],
            ['full_code' => '1 07 07 021', 'account_title' => 'Accumulated Depreciation - Books'],
            [
                'full_code' => '1 07 07 022',
                'account_title' => 'Accumulated Impairment Losses - Books',
            ],
            ['full_code' => '1 07 08', 'account_title' => 'Leased Assets'],
            ['full_code' => '1 07 08 010', 'account_title' => 'Leased Assets, Land'],
            [
                'full_code' => '1 07 08 011',
                'account_title' => 'Accumulated Impairment Losses-Leased Assets, Land',
            ],
            [
                'full_code' => '1 07 08 020',
                'account_title' => 'Leased Assets, Buildings and Other Structures',
            ],
            [
                'full_code' => '1 07 08 021',
                'account_title' =>
                    'Accumulated Depreciation - Leased Assets, Buildings and Other Structures',
            ],
            [
                'full_code' => '1 07 08 022',
                'account_title' =>
                    'Accumulated Impairment Losses - Leased Assets, Buildings and Other Structures',
            ],
            [
                'full_code' => '1 07 08 030',
                'account_title' => 'Leased Assets, Machinery and Equipment',
            ],
            [
                'full_code' => '1 07 08 031',
                'account_title' =>
                    'Accumulated Depreciation - Leased Assets, Machinery and Equipment',
            ],
            [
                'full_code' => '1 07 08 032',
                'account_title' =>
                    'Accumulated Impairment Losses - Leased Assets, Machinery and Equipment',
            ],
            [
                'full_code' => '1 07 08 040',
                'account_title' => 'Leased Assets, Transportation Equipment',
            ],
            [
                'full_code' => '1 07 08 041',
                'account_title' =>
                    'Accumulated Depreciation - Leased Assets, Transportation Equipment',
            ],
            [
                'full_code' => '1 07 08 042',
                'account_title' =>
                    'Accumulated Impairment Losses - Leased Assets, Transportation Equipment',
            ],
            ['full_code' => '1 07 08 990', 'account_title' => 'Other Leased Assets'],
            [
                'full_code' => '1 07 08 991',
                'account_title' => 'Accumulated Depreciation - Other Leased Assets',
            ],
            [
                'full_code' => '1 07 08 992',
                'account_title' => 'Accumulated Impairment Losses - Other Leased Assets',
            ],
            ['full_code' => '1 07 09', 'account_title' => 'Leased Assets Improvements'],
            ['full_code' => '1 07 09 010', 'account_title' => 'Leased Assets Improvements, Land'],
            [
                'full_code' => '1 07 09 011',
                'account_title' => 'Accumulated Depreciation - Leased Assets Improvements, Land',
            ],
            [
                'full_code' => '1 07 09 012',
                'account_title' =>
                    'Accumulated Impairment Losses - Leased Assets Improvements, Land',
            ],
            [
                'full_code' => '1 07 09 020',
                'account_title' => 'Leased Assets Improvements, Buildings',
            ],
            [
                'full_code' => '1 07 09 021',
                'account_title' =>
                    'Accumulated Depreciation - Leased Assets Improvements, Buildings',
            ],
            [
                'full_code' => '1 07 09 022',
                'account_title' =>
                    'Accumulated Impairment Losses - Leased Assets Improvements, Buildings',
            ],
            ['full_code' => '1 07 09 990', 'account_title' => 'Other Leased Assets Improvements'],
            [
                'full_code' => '1 07 09 991',
                'account_title' => 'Accumulated Depreciation - Other Leased Assets Improvements',
            ],
            [
                'full_code' => '1 07 09 992',
                'account_title' =>
                    'Accumulated Impairment Losses - Other Leased Assets Improvements',
            ],
            ['full_code' => '1 07 10', 'account_title' => 'Construction in Progress'],
            [
                'full_code' => '1 07 10 010',
                'account_title' => 'Construction in Progress - Land Improvements',
            ],
            [
                'full_code' => '1 07 10 020',
                'account_title' => 'Construction in Progress - Infrastructure Assets',
            ],
            [
                'full_code' => '1 07 10 030',
                'account_title' => 'Construction in Progress - Buildings and Other Structures',
            ],
            [
                'full_code' => '1 07 10 040',
                'account_title' => 'Construction in Progress - Leased Assets',
            ],
            [
                'full_code' => '1 07 10 050',
                'account_title' => 'Construction in Progress - Leased Assets Improvements',
            ],
            ['full_code' => '1 07 11', 'account_title' => 'Service Concession Assets'],
            ['full_code' => '1 07 11 010', 'account_title' => 'Service Concession Assets'],
            [
                'full_code' => '1 07 11 011',
                'account_title' => 'Accumulated Depreciation - Service Concession Assets',
            ],
            [
                'full_code' => '1 07 11 012',
                'account_title' => 'Accumulated Impairment Losses - Service Concession Assets',
            ],
            ['full_code' => '1 07 99', 'account_title' => 'Other Property, Plant and Equipment'],
            ['full_code' => '1 07 99 010', 'account_title' => 'Work/Zoo Animals'],
            [
                'full_code' => '1 07 99 011',
                'account_title' => 'Accumulated Depreciation - Work/Zoo Animals',
            ],
            [
                'full_code' => '1 07 99 012',
                'account_title' => 'Accumulated Impairment Losses - Work/Zoo Animals',
            ],
            [
                'full_code' => '1 07 99 990',
                'account_title' => 'Other Property, Plant and Equipment',
            ],
            [
                'full_code' => '1 07 99 991',
                'account_title' => 'Accumulated Depreciation - Other Property, Plant and Equipment',
            ],
            [
                'full_code' => '1 07 99 992',
                'account_title' =>
                    'Accumulated Impairment Losses - Other Property, Plant and Equipment',
            ],

            ['full_code' => '1 08', 'account_title' => 'Biological Assets'],
            ['full_code' => '1 08 01', 'account_title' => 'Bearer Biological Assets'],
            ['full_code' => '1 08 01 010', 'account_title' => 'Breeding Stocks'],
            ['full_code' => '1 08 01 020', 'account_title' => 'Plants and Trees'],
            ['full_code' => '1 08 01 030', 'account_title' => 'Aquaculture'],
            ['full_code' => '1 08 01 990', 'account_title' => 'Other Bearer Biological Assets'],

            ['full_code' => '1 09', 'account_title' => 'Intangible Assets'],
            ['full_code' => '1 09 01', 'account_title' => 'Intangible Assets'],
            ['full_code' => '1 09 01 010', 'account_title' => 'Patents/Copyrights'],
            [
                'full_code' => '1 09 01 011',
                'account_title' => 'Accumulated Amortization - Patents/Copyrights',
            ],
            [
                'full_code' => '1 09 01 012',
                'account_title' => 'Accumulated Impairment Losses - Patents/Copyrights',
            ],
            ['full_code' => '1 09 01 020', 'account_title' => 'Computer Software'],
            [
                'full_code' => '1 09 01 021',
                'account_title' => 'Accumulated Amortization - Computer Software',
            ],
            [
                'full_code' => '1 09 01 022',
                'account_title' => 'Accumulated Impairment Losses - Computer Software',
            ],
            ['full_code' => '1 09 01 990', 'account_title' => 'Other Intangible Assets'],
            [
                'full_code' => '1 09 01 991',
                'account_title' => 'Accumulated Amortization - Other Intangible Assets',
            ],
            [
                'full_code' => '1 09 01 992',
                'account_title' => 'Accumulated Impairment Losses - Other Intangible Assets',
            ],
            [
                'full_code' => '1 09 02',
                'account_title' => 'Service Concession Assets - Intangible Assets',
            ],
            [
                'full_code' => '1 09 02 010',
                'account_title' => 'Service Concession Assets - Intangible Assets',
            ],

            // ==================== LIABILITIES ====================
            ['full_code' => '2', 'account_title' => 'Liabilities'],
            ['full_code' => '2 01', 'account_title' => 'Financial Liabilities'],
            ['full_code' => '2 01 01', 'account_title' => 'Payables'],
            ['full_code' => '2 01 01 010', 'account_title' => 'Accounts Payable'],
            ['full_code' => '2 01 01 020', 'account_title' => 'Due to Officers and Employees'],
            ['full_code' => '2 01 01 040', 'account_title' => 'Notes Payable'],
            ['full_code' => '2 01 01 050', 'account_title' => 'Interest Payable'],
            ['full_code' => '2 01 01 060', 'account_title' => 'Operating Lease Payable'],
            ['full_code' => '2 01 01 070', 'account_title' => 'Finance Lease Payable'],
            ['full_code' => '2 01 01 080', 'account_title' => 'Awards and Rewards Payable'],
            [
                'full_code' => '2 01 01 090',
                'account_title' => 'Service Concession Arrangement Payable',
            ],
            ['full_code' => '2 01 01 100', 'account_title' => 'Pension Benefits Payable'],
            ['full_code' => '2 01 01 110', 'account_title' => 'Leave Benefits Payable'],
            ['full_code' => '2 01 01 120', 'account_title' => 'Retirement Gratuity Payable'],
            ['full_code' => '2 01 02', 'account_title' => 'Bills/Bonds/Loans Payable'],
            ['full_code' => '2 01 02 020', 'account_title' => 'Bonds Payable - Domestic'],
            [
                'full_code' => '2 01 02 021',
                'account_title' => 'Discount on Bonds Payable - Domestic',
            ],
            [
                'full_code' => '2 01 02 022',
                'account_title' => 'Premium on Bonds Payable - Domestic',
            ],
            ['full_code' => '2 01 02 040', 'account_title' => 'Loans Payable - Domestic'],
            ['full_code' => '2 01 02 050', 'account_title' => 'Loans Payable - Foreign'],

            ['full_code' => '2 02', 'account_title' => 'Inter-Agency Payables'],
            ['full_code' => '2 02 01', 'account_title' => 'Inter-Agency Payables'],
            ['full_code' => '2 02 01 010', 'account_title' => 'Due to BIR'],
            ['full_code' => '2 02 01 020', 'account_title' => 'Due to GSIS'],
            ['full_code' => '2 02 01 030', 'account_title' => 'Due to Pag-IBIG'],
            ['full_code' => '2 02 01 040', 'account_title' => 'Due to PhilHealth'],
            ['full_code' => '2 02 01 050', 'account_title' => 'Due to NGAs'],
            ['full_code' => '2 02 01 060', 'account_title' => 'Due to GOCCs'],
            ['full_code' => '2 02 01 070', 'account_title' => 'Due to LGUs'],
            ['full_code' => '2 02 01 080', 'account_title' => 'Due to Joint Venture'],

            ['full_code' => '2 03', 'account_title' => 'Intra-Agency Payables'],
            ['full_code' => '2 03 01', 'account_title' => 'Intra-Agency Payables'],
            ['full_code' => '2 03 01 010', 'account_title' => 'Due to Other Funds'],
            ['full_code' => '2 03 01 020', 'account_title' => 'Due to Special Accounts'],
            ['full_code' => '2 03 01 030', 'account_title' => 'Due to Local Economic Enterprises'],

            ['full_code' => '2 04', 'account_title' => 'Trust Liabilities'],
            ['full_code' => '2 04 01', 'account_title' => 'Trust Liabilities'],
            ['full_code' => '2 04 01 010', 'account_title' => 'Trust Liabilities'],
            [
                'full_code' => '2 04 01 020',
                'account_title' =>
                    'Trust Liabilities - Disaster Risk Reduction and Management Fund',
            ],
            ['full_code' => '2 04 01 030', 'account_title' => 'Bail Bonds Payable'],
            ['full_code' => '2 04 01 040', 'account_title' => 'Guaranty/Security Deposits Payable'],
            ['full_code' => '2 04 01 050', 'account_title' => 'Customers\' Deposits Payable'],

            ['full_code' => '2 05', 'account_title' => 'Deferred Credits/Unearned Income'],
            ['full_code' => '2 05 01', 'account_title' => 'Deferred Credits'],
            ['full_code' => '2 05 01 010', 'account_title' => 'Deferred Real Property Tax'],
            [
                'full_code' => '2 05 01 011',
                'account_title' => 'Discount on Advance Payment of Real Property Tax',
            ],
            ['full_code' => '2 05 01 020', 'account_title' => 'Deferred Special Education Tax'],
            [
                'full_code' => '2 05 01 021',
                'account_title' => 'Discount on Advance Payment of Special Education Tax',
            ],
            ['full_code' => '2 05 01 030', 'account_title' => 'Deferred Finance Lease Revenue'],
            [
                'full_code' => '2 05 01 040',
                'account_title' => 'Deferred Service Concession Revenue',
            ],
            [
                'full_code' => '2 05 01 050',
                'account_title' => 'Unearned Revenue - Investment Property',
            ],
            ['full_code' => '2 05 01 990', 'account_title' => 'Other Deferred Credits'],

            ['full_code' => '2 06', 'account_title' => 'Provisions'],
            ['full_code' => '2 06 01', 'account_title' => 'Provisions'],
            ['full_code' => '2 06 01 040', 'account_title' => 'Termination Benefits'],
            ['full_code' => '2 06 01 990', 'account_title' => 'Other Provisions'],

            ['full_code' => '2 99', 'account_title' => 'Other Payables'],
            ['full_code' => '2 99 99', 'account_title' => 'Other Payables'],
            ['full_code' => '2 99 99 990', 'account_title' => 'Other Payables'],

            // ==================== EQUITY ====================
            ['full_code' => '3', 'account_title' => 'Equity'],
            ['full_code' => '3 01', 'account_title' => 'Government Equity'],
            ['full_code' => '3 01 01', 'account_title' => 'Government Equity'],
            ['full_code' => '3 01 01 010', 'account_title' => 'Government Equity'],
            ['full_code' => '3 01 01 020', 'account_title' => 'Prior Period Adjustment'],

            ['full_code' => '3 02', 'account_title' => 'Intermediate Accounts'],
            ['full_code' => '3 02 01', 'account_title' => 'Intermediate Accounts'],
            ['full_code' => '3 02 01 010', 'account_title' => 'Income and Expense Summary'],

            ['full_code' => '3 03', 'account_title' => 'Equity in Joint Venture'],
            ['full_code' => '3 03 01', 'account_title' => 'Equity in Joint Venture'],
            ['full_code' => '3 03 01 010', 'account_title' => 'Equity in Joint Venture'],

            ['full_code' => '3 04', 'account_title' => 'Unrealized Gain/(Loss)'],
            ['full_code' => '3 04 01', 'account_title' => 'Unrealized Gain/(Loss)'],
            [
                'full_code' => '3 04 01 010',
                'account_title' =>
                    'Unrealized Gain/(Loss) from Changes in the Fair Value of Financial Assets',
            ],

            ['full_code' => '3 05', 'account_title' => 'Budgetary Accounts'],
            ['full_code' => '3 05 01', 'account_title' => 'Budgetary Balance'],
            ['full_code' => '3 05 01 010', 'account_title' => 'Fund Balance'],
            ['full_code' => '3 05 01 020', 'account_title' => 'Unappropriated Surplus'],
            ['full_code' => '3 05 01 030', 'account_title' => 'Continuing Allotment'],
            ['full_code' => '3 05 01 040', 'account_title' => 'Continuing Appropriations'],
            ['full_code' => '3 05 01 050', 'account_title' => 'Commitments'],
            ['full_code' => '3 05 02', 'account_title' => 'Estimates/Appropriations/Allotments'],
            [
                'full_code' => '3 05 02 010',
                'account_title' => 'Estimates of Income, Revenues and Receipts',
            ],
            ['full_code' => '3 05 02 020', 'account_title' => 'Estimates-Internal Sources'],
            ['full_code' => '3 05 02 030', 'account_title' => 'Estimates-External Sources'],
            [
                'full_code' => '3 05 02 040',
                'account_title' => 'Realized Income Revenues and Receipts',
            ],
            ['full_code' => '3 05 02 050', 'account_title' => 'Appropriations – Annual Budget'],
            [
                'full_code' => '3 05 02 060',
                'account_title' => 'Appropriations – Supplemental Budget',
            ],
            ['full_code' => '3 05 02 070', 'account_title' => 'Legislative Appropriations'],
            ['full_code' => '3 05 02 080', 'account_title' => 'Released Current Allotments'],
            ['full_code' => '3 05 02 090', 'account_title' => 'Current Allotment'],
            ['full_code' => '3 05 02 100', 'account_title' => 'Released Continuing Allotment'],
            ['full_code' => '3 05 03', 'account_title' => 'Obligations'],
            ['full_code' => '3 05 03 010', 'account_title' => 'Current Allotments - Obligated'],
            ['full_code' => '3 05 03 020', 'account_title' => 'Obligations-Current Allotment'],
            ['full_code' => '3 05 03 030', 'account_title' => 'Continuing Allotments- Obligated'],
            ['full_code' => '3 05 03 040', 'account_title' => 'Obligations-Continuing Allotment'],
            [
                'full_code' => '3 05 03 050',
                'account_title' => 'Current Allotments - Obligations Consummated',
            ],
            [
                'full_code' => '3 05 03 060',
                'account_title' => 'Continuing Allotments - Obligations Consummated',
            ],
            ['full_code' => '3 05 03 070', 'account_title' => 'Consummated Obligations'],
            ['full_code' => '3 05 04', 'account_title' => 'Reversions'],
            [
                'full_code' => '3 05 04 010',
                'account_title' => 'Reversion of Unallotted CY Appropriations',
            ],
            [
                'full_code' => '3 05 04 020',
                'account_title' => 'Reversion of Unobligated CY Allotments',
            ],
            [
                'full_code' => '3 05 04 030',
                'account_title' =>
                    'Reversion of Unutilized Continuing Appropriations and Allotments',
            ],

            // ==================== INCOME ====================
            ['full_code' => '4', 'account_title' => 'Income'],
            ['full_code' => '4 01', 'account_title' => 'Tax Revenue'],
            [
                'full_code' => '4 01 01',
                'account_title' => 'Tax Revenue - Individual and Corporation',
            ],
            ['full_code' => '4 01 01 020', 'account_title' => 'Professional Tax'],
            ['full_code' => '4 01 01 050', 'account_title' => 'Community Tax'],
            ['full_code' => '4 01 02', 'account_title' => 'Tax Revenue - Property'],
            ['full_code' => '4 01 02 040', 'account_title' => 'Real Property Tax- Basic'],
            [
                'full_code' => '4 01 02 041',
                'account_title' => 'Discount on Real Property Tax- Basic',
            ],
            ['full_code' => '4 01 02 050', 'account_title' => 'Special Education Tax'],
            ['full_code' => '4 01 02 051', 'account_title' => 'Discount on Special Education Tax'],
            ['full_code' => '4 01 02 060', 'account_title' => 'Special Levy on Idle Lands'],
            [
                'full_code' => '4 01 02 070',
                'account_title' => 'Special Levy on Lands Benefited by Public Works Projects',
            ],
            ['full_code' => '4 01 02 080', 'account_title' => 'Real Property Transfer Tax'],
            ['full_code' => '4 01 03', 'account_title' => 'Tax Revenue - Goods and Services'],
            ['full_code' => '4 01 03 030', 'account_title' => 'Business Tax'],
            [
                'full_code' => '4 01 03 040',
                'account_title' => 'Tax on Sand, Gravel and Other Quarry Products',
            ],
            ['full_code' => '4 01 03 050', 'account_title' => 'Tax on Delivery Trucks and Vans'],
            ['full_code' => '4 01 03 060', 'account_title' => 'Amusement Tax'],
            ['full_code' => '4 01 03 070', 'account_title' => 'Franchise Tax'],
            ['full_code' => '4 01 03 080', 'account_title' => 'Printing and Publication Tax'],
            ['full_code' => '4 01 04', 'account_title' => 'Tax Revenue - Others'],
            ['full_code' => '4 01 04 990', 'account_title' => 'Other Taxes'],
            ['full_code' => '4 01 05', 'account_title' => 'Tax Revenue - Fines and Penalties'],
            [
                'full_code' => '4 01 05 010',
                'account_title' =>
                    'Tax Revenue - Fines and Penalties - Taxes on Individual and Corporation',
            ],
            [
                'full_code' => '4 01 05 020',
                'account_title' => 'Tax Revenue - Fines and Penalties - Property Taxes',
            ],
            [
                'full_code' => '4 01 05 030',
                'account_title' =>
                    'Tax Revenue - Fines and Penalties - Taxes on Goods and Services',
            ],
            [
                'full_code' => '4 01 05 040',
                'account_title' => 'Tax Revenue - Fines and Penalties - Other Taxes',
            ],
            ['full_code' => '4 01 06', 'account_title' => 'Share from National Taxes'],
            [
                'full_code' => '4 01 06 010',
                'account_title' => 'Share from Internal Revenue Collections (IRA)',
            ],
            [
                'full_code' => '4 01 06 020',
                'account_title' => 'Share from Expanded Value Added Tax',
            ],
            ['full_code' => '4 01 06 030', 'account_title' => 'Share from National Wealth'],
            [
                'full_code' => '4 01 06 040',
                'account_title' => 'Share from Tobacco Excise Tax (RA 7171 and 8240)',
            ],
            ['full_code' => '4 01 06 050', 'account_title' => 'Share from Economic Zones'],

            ['full_code' => '4 02', 'account_title' => 'Service and Business Income'],
            ['full_code' => '4 02 01', 'account_title' => 'Service Income'],
            ['full_code' => '4 02 01 010', 'account_title' => 'Permit Fees'],
            ['full_code' => '4 02 01 020', 'account_title' => 'Registration Fees'],
            [
                'full_code' => '4 02 01 030',
                'account_title' => 'Registration Plates, Tags and Stickers Fees',
            ],
            ['full_code' => '4 02 01 040', 'account_title' => 'Clearance and Certification Fees'],
            [
                'full_code' => '4 02 01 070',
                'account_title' => 'Supervision and Regulation Enforcement Fees',
            ],
            ['full_code' => '4 02 01 100', 'account_title' => 'Inspection Fees'],
            [
                'full_code' => '4 02 01 110',
                'account_title' => 'Verification and Authentication Fees',
            ],
            ['full_code' => '4 02 01 130', 'account_title' => 'Processing Fees'],
            ['full_code' => '4 02 01 140', 'account_title' => 'Occupation Fees'],
            ['full_code' => '4 02 01 150', 'account_title' => 'Fishery Rentals, Fees and Charges'],
            [
                'full_code' => '4 02 01 160',
                'account_title' => 'Fees for Sealing and Licensing of Weights and Measures',
            ],
            [
                'full_code' => '4 02 01 980',
                'account_title' => 'Fines and Penalties - Service Income',
            ],
            ['full_code' => '4 02 01 990', 'account_title' => 'Other Service Income'],
            ['full_code' => '4 02 02', 'account_title' => 'Business Income'],
            ['full_code' => '4 02 02 010', 'account_title' => 'School Fees'],
            ['full_code' => '4 02 02 020', 'account_title' => 'Affiliation Fees'],
            ['full_code' => '4 02 02 040', 'account_title' => 'Seminar/Training Fees'],
            ['full_code' => '4 02 02 050', 'account_title' => 'Rent Income'],
            ['full_code' => '4 02 02 060', 'account_title' => 'Communication Network Fees'],
            ['full_code' => '4 02 02 070', 'account_title' => 'Transportation System Fees'],
            ['full_code' => '4 02 02 080', 'account_title' => 'Road Network Fees'],
            ['full_code' => '4 02 02 090', 'account_title' => 'Waterworks System Fees'],
            ['full_code' => '4 02 02 100', 'account_title' => 'Power Supply System Fees'],
            ['full_code' => '4 02 02 110', 'account_title' => 'Seaport System Fees'],
            ['full_code' => '4 02 02 120', 'account_title' => 'Parking Fees'],
            [
                'full_code' => '4 02 02 130',
                'account_title' =>
                    'Receipts from Operation of Hostels/Dormitories and Other Like Facilities',
            ],
            ['full_code' => '4 02 02 140', 'account_title' => 'Receipts from Market Operations'],
            [
                'full_code' => '4 02 02 150',
                'account_title' => 'Receipts from Slaughterhouse Operations',
            ],
            ['full_code' => '4 02 02 160', 'account_title' => 'Receipts from Cemetery Operations'],
            [
                'full_code' => '4 02 02 170',
                'account_title' => 'Receipts from Printing and Publication',
            ],
            ['full_code' => '4 02 02 180', 'account_title' => 'Sales Revenue'],
            ['full_code' => '4 02 02 181', 'account_title' => 'Sales Discounts'],
            ['full_code' => '4 02 02 190', 'account_title' => 'Garbage Fees'],
            ['full_code' => '4 02 02 200', 'account_title' => 'Hospital Fees'],
            ['full_code' => '4 02 02 210', 'account_title' => 'Dividend Income'],
            ['full_code' => '4 02 02 220', 'account_title' => 'Interest Income'],
            ['full_code' => '4 02 02 230', 'account_title' => 'Service Concession Revenue'],
            ['full_code' => '4 02 02 240', 'account_title' => 'Other Service Concession Revenue'],
            ['full_code' => '4 02 02 250', 'account_title' => 'Finance Lease Revenue'],
            [
                'full_code' => '4 02 02 260',
                'account_title' => 'Share in the Profit of Joint Venture',
            ],
            [
                'full_code' => '4 02 02 980',
                'account_title' => 'Fines and Penalties - Business Income',
            ],
            ['full_code' => '4 02 02 990', 'account_title' => 'Other Business Income'],

            ['full_code' => '4 03', 'account_title' => 'Transfers and Subsidy'],
            ['full_code' => '4 03 01', 'account_title' => 'Subsidy'],
            ['full_code' => '4 03 01 010', 'account_title' => 'Subsidy from National Government'],
            [
                'full_code' => '4 03 01 020',
                'account_title' => 'Subsidy from Other Local Government Units',
            ],
            [
                'full_code' => '4 03 01 030',
                'account_title' => 'Subsidy from Government-Owned and/or Controlled Corporations',
            ],
            ['full_code' => '4 03 01 040', 'account_title' => 'Subsidy from Other Funds'],
            [
                'full_code' => '4 03 01 050',
                'account_title' => 'Subsidy from General Fund Proper/Other Special Accounts',
            ],
            [
                'full_code' => '4 03 01 060',
                'account_title' => 'Subsidy from Other Local Economic Enterprise/Public Utility',
            ],
            ['full_code' => '4 03 02', 'account_title' => 'Transfers'],
            [
                'full_code' => '4 03 02 010',
                'account_title' => 'Transfers from General Fund of LGU Counterpart/Equity Share',
            ],
            [
                'full_code' => '4 03 02 020',
                'account_title' => 'Transfers from General Fund of Unspent DRRMF',
            ],
            ['full_code' => '4 03 02 030', 'account_title' => 'Transfers from National Government'],
            [
                'full_code' => '4 03 02 040',
                'account_title' => 'Transfers from Other Local Government Units',
            ],
            [
                'full_code' => '4 03 02 050',
                'account_title' => 'Transfers from Government-Owned and/or Controlled Corporations',
            ],

            ['full_code' => '4 04', 'account_title' => 'Shares, Grants and Donations'],
            ['full_code' => '4 04 01', 'account_title' => 'Share'],
            ['full_code' => '4 04 01 010', 'account_title' => 'Share from PAGCOR'],
            ['full_code' => '4 04 01 020', 'account_title' => 'Share from PCSO'],
            ['full_code' => '4 04 02', 'account_title' => 'Grants and Donations'],
            ['full_code' => '4 04 02 010', 'account_title' => 'Grants and Donations in Cash'],
            ['full_code' => '4 04 02 020', 'account_title' => 'Grants and Donations in Kind'],
            ['full_code' => '4 04 02 030', 'account_title' => 'Grants from Concessionary loans'],

            ['full_code' => '4 05', 'account_title' => 'Gains'],
            ['full_code' => '4 05 01', 'account_title' => 'Gains'],
            [
                'full_code' => '4 05 01 010',
                'account_title' => 'Gain from Changes in Fair Value of Financial Instruments',
            ],
            ['full_code' => '4 05 01 020', 'account_title' => 'Gain on Foreign Exchange (FOREX)'],
            ['full_code' => '4 05 01 030', 'account_title' => 'Gain on Sale of Investments'],
            [
                'full_code' => '4 05 01 040',
                'account_title' => 'Gain on Sale of Investment Property',
            ],
            [
                'full_code' => '4 05 01 050',
                'account_title' => 'Gain on Sale of Property, Plant and Equipment',
            ],
            [
                'full_code' => '4 05 01 060',
                'account_title' => 'Gain on Initial Recognition of Biological Assets',
            ],
            ['full_code' => '4 05 01 070', 'account_title' => 'Gain on Sale of Biological Assets'],
            [
                'full_code' => '4 05 01 080',
                'account_title' =>
                    'Gain from Changes in Fair Value Less Cost to Sell of Biological Assets Due to Physical Change',
            ],
            [
                'full_code' => '4 05 01 090',
                'account_title' =>
                    'Gain from Changes in Fair Value Less Cost to Sell of Biological Assets Due to Price Change',
            ],
            [
                'full_code' => '4 05 01 100',
                'account_title' => 'Gain from Initial Recognition of Agricultural Produce',
            ],
            ['full_code' => '4 05 01 110', 'account_title' => 'Gain on Sale of Intangible Assets'],
            ['full_code' => '4 05 01 120', 'account_title' => 'Reversal of Impairment Losses'],
            ['full_code' => '4 05 01 990', 'account_title' => 'Other Gains'],

            ['full_code' => '4 06', 'account_title' => 'Miscellaneous Income'],
            ['full_code' => '4 06 01', 'account_title' => 'Miscellaneous Income'],
            ['full_code' => '4 06 01 010', 'account_title' => 'Miscellaneous Income'],

            // ==================== EXPENSES ====================
            ['full_code' => '5', 'account_title' => 'Expenses'],
            ['full_code' => '5 01', 'account_title' => 'Personnel Services'],
            ['full_code' => '5 01 01', 'account_title' => 'Salaries and Wages'],
            ['full_code' => '5 01 01 010', 'account_title' => 'Salaries and Wages - Regular'],
            [
                'full_code' => '5 01 01 020',
                'account_title' => 'Salaries and Wages - Casual/Contractual',
            ],
            ['full_code' => '5 01 02', 'account_title' => 'Other Compensation'],
            [
                'full_code' => '5 01 02 010',
                'account_title' => 'Personnel Economic Relief Allowance (PERA)',
            ],
            ['full_code' => '5 01 02 020', 'account_title' => 'Representation Allowance (RA)'],
            ['full_code' => '5 01 02 030', 'account_title' => 'Transportation Allowance (TA)'],
            ['full_code' => '5 01 02 040', 'account_title' => 'Clothing/Uniform Allowance'],
            ['full_code' => '5 01 02 050', 'account_title' => 'Subsistence Allowance'],
            ['full_code' => '5 01 02 060', 'account_title' => 'Laundry Allowance'],
            ['full_code' => '5 01 02 070', 'account_title' => 'Quarters Allowance'],
            ['full_code' => '5 01 02 080', 'account_title' => 'Productivity Incentive Allowance'],
            ['full_code' => '5 01 02 090', 'account_title' => 'Overseas Allowance'],
            ['full_code' => '5 01 02 100', 'account_title' => 'Honoraria'],
            ['full_code' => '5 01 02 110', 'account_title' => 'Hazard Pay'],
            ['full_code' => '5 01 02 120', 'account_title' => 'Longevity Pay'],
            ['full_code' => '5 01 02 130', 'account_title' => 'Overtime and Night Pay'],
            ['full_code' => '5 01 02 140', 'account_title' => 'Year End Bonus'],
            ['full_code' => '5 01 02 150', 'account_title' => 'Cash Gift'],
            ['full_code' => '5 01 02 990', 'account_title' => 'Other Bonuses and Allowances'],
            ['full_code' => '5 01 03', 'account_title' => 'Personnel Benefit Contributions'],
            [
                'full_code' => '5 01 03 010',
                'account_title' => 'Retirement and Life Insurance Premiums',
            ],
            ['full_code' => '5 01 03 020', 'account_title' => 'Pag-IBIG Contributions'],
            ['full_code' => '5 01 03 030', 'account_title' => 'PhilHealth Contributions'],
            [
                'full_code' => '5 01 03 040',
                'account_title' => 'Employees Compensation Insurance Premiums',
            ],
            [
                'full_code' => '5 01 03 050',
                'account_title' => 'Provident/Welfare Fund Contributions',
            ],
            ['full_code' => '5 01 04', 'account_title' => 'Other Personnel Benefits'],
            ['full_code' => '5 01 04 010', 'account_title' => 'Pension Benefits'],
            ['full_code' => '5 01 04 020', 'account_title' => 'Retirement Gratuity'],
            ['full_code' => '5 01 04 030', 'account_title' => 'Terminal Leave Benefits'],
            ['full_code' => '5 01 04 990', 'account_title' => 'Other Personnel Benefits'],

            ['full_code' => '5 02', 'account_title' => 'Maintenance and Other Operating Expenses'],
            ['full_code' => '5 02 01', 'account_title' => 'Traveling Expenses'],
            ['full_code' => '5 02 01 010', 'account_title' => 'Traveling Expenses - Local'],
            ['full_code' => '5 02 01 020', 'account_title' => 'Traveling Expenses - Foreign'],
            ['full_code' => '5 02 02', 'account_title' => 'Training and Scholarship Expenses'],
            ['full_code' => '5 02 02 010', 'account_title' => 'Training Expenses'],
            ['full_code' => '5 02 02 020', 'account_title' => 'Scholarship Grants/Expenses'],
            ['full_code' => '5 02 03', 'account_title' => 'Supplies and Materials Expenses'],
            ['full_code' => '5 02 03 010', 'account_title' => 'Office Supplies Expenses'],
            ['full_code' => '5 02 03 020', 'account_title' => 'Accountable Forms Expenses'],
            ['full_code' => '5 02 03 030', 'account_title' => 'Non-Accountable Forms Expenses'],
            [
                'full_code' => '5 02 03 040',
                'account_title' => 'Animal/Zoological Supplies Expenses',
            ],
            ['full_code' => '5 02 03 050', 'account_title' => 'Food Supplies Expenses'],
            ['full_code' => '5 02 03 060', 'account_title' => 'Welfare Goods Expenses'],
            ['full_code' => '5 02 03 070', 'account_title' => 'Drugs and Medicines Expenses'],
            [
                'full_code' => '5 02 03 080',
                'account_title' => 'Medical, Dental and Laboratory Supplies Expenses',
            ],
            ['full_code' => '5 02 03 090', 'account_title' => 'Fuel, Oil and Lubricants Expenses'],
            [
                'full_code' => '5 02 03 100',
                'account_title' => 'Agricultural and Marine Supplies Expenses',
            ],
            [
                'full_code' => '5 02 03 110',
                'account_title' => 'Textbooks and Instructional Materials Expenses',
            ],
            [
                'full_code' => '5 02 03 120',
                'account_title' => 'Military, Police and Traffic Supplies Expenses',
            ],
            [
                'full_code' => '5 02 03 130',
                'account_title' => 'Chemical and Filtering Supplies Expenses',
            ],
            [
                'full_code' => '5 02 03 990',
                'account_title' => 'Other Supplies and Materials Expenses',
            ],
            ['full_code' => '5 02 04', 'account_title' => 'Utility Expenses'],
            ['full_code' => '5 02 04 010', 'account_title' => 'Water Expenses'],
            ['full_code' => '5 02 04 020', 'account_title' => 'Electricity Expenses'],
            ['full_code' => '5 02 05', 'account_title' => 'Communication Expenses'],
            ['full_code' => '5 02 05 010', 'account_title' => 'Postage and Courier Services'],
            ['full_code' => '5 02 05 020', 'account_title' => 'Telephone Expenses'],
            ['full_code' => '5 02 05 030', 'account_title' => 'Internet Subscription Expenses'],
            [
                'full_code' => '5 02 05 040',
                'account_title' => 'Cable, Satellite, Telegraph and Radio Expenses',
            ],
            ['full_code' => '5 02 06', 'account_title' => 'Awards/Rewards and Prizes'],
            ['full_code' => '5 02 06 010', 'account_title' => 'Awards/Rewards Expenses'],
            ['full_code' => '5 02 06 020', 'account_title' => 'Prizes'],
            [
                'full_code' => '5 02 07',
                'account_title' => 'Survey, Research, Exploration and Development Expenses',
            ],
            ['full_code' => '5 02 07 010', 'account_title' => 'Survey Expenses'],
            [
                'full_code' => '5 02 07 020',
                'account_title' => 'Research, Exploration and Development Expenses',
            ],
            [
                'full_code' => '5 02 08',
                'account_title' => 'Demolition/Relocation and Desilting/Dredging Expenses',
            ],
            ['full_code' => '5 02 08 010', 'account_title' => 'Demolition and Relocation Expenses'],
            ['full_code' => '5 02 08 020', 'account_title' => 'Desilting and Dredging Expenses'],
            [
                'full_code' => '5 02 09',
                'account_title' => 'Generation, Transmission and Distribution Expenses',
            ],
            [
                'full_code' => '5 02 09 010',
                'account_title' => 'Generation, Transmission and Distribution Expenses',
            ],
            [
                'full_code' => '5 02 10',
                'account_title' => 'Confidential, Intelligence and Extraordinary Expenses',
            ],
            ['full_code' => '5 02 10 010', 'account_title' => 'Confidential Expenses'],
            ['full_code' => '5 02 10 020', 'account_title' => 'Intelligence Expenses'],
            [
                'full_code' => '5 02 10 030',
                'account_title' => 'Extraordinary and Miscellaneous Expenses',
            ],
            ['full_code' => '5 02 11', 'account_title' => 'Professional Services'],
            ['full_code' => '5 02 11 010', 'account_title' => 'Legal Services'],
            ['full_code' => '5 02 11 020', 'account_title' => 'Auditing Services'],
            ['full_code' => '5 02 11 030', 'account_title' => 'Consultancy Services'],
            ['full_code' => '5 02 11 990', 'account_title' => 'Other Professional Services'],
            ['full_code' => '5 02 12', 'account_title' => 'General Services'],
            ['full_code' => '5 02 12 010', 'account_title' => 'Environment/Sanitary Services'],
            ['full_code' => '5 02 12 020', 'account_title' => 'Janitorial Services'],
            ['full_code' => '5 02 12 030', 'account_title' => 'Security Services'],
            ['full_code' => '5 02 12 990', 'account_title' => 'Other General Services'],
            ['full_code' => '5 02 13', 'account_title' => 'Repairs and Maintenance'],
            [
                'full_code' => '5 02 13 010',
                'account_title' => 'Repairs and Maintenance - Investment Property',
            ],
            [
                'full_code' => '5 02 13 020',
                'account_title' => 'Repairs and Maintenance - Land Improvements',
            ],
            [
                'full_code' => '5 02 13 030',
                'account_title' => 'Repairs and Maintenance - Infrastructure Assets',
            ],
            [
                'full_code' => '5 02 13 040',
                'account_title' => 'Repairs and Maintenance - Buildings and Other Structures',
            ],
            [
                'full_code' => '5 02 13 050',
                'account_title' => 'Repairs and Maintenance - Machinery and Equipment',
            ],
            [
                'full_code' => '5 02 13 060',
                'account_title' => 'Repairs and Maintenance - Transportation Equipment',
            ],
            [
                'full_code' => '5 02 13 070',
                'account_title' => 'Repairs and Maintenance - Furniture and Fixtures',
            ],
            [
                'full_code' => '5 02 13 080',
                'account_title' => 'Repairs and Maintenance - Leased Assets',
            ],
            [
                'full_code' => '5 02 13 090',
                'account_title' => 'Repairs and Maintenance - Leased Assets Improvements',
            ],
            [
                'full_code' => '5 02 13 990',
                'account_title' => 'Repairs and Maintenance - Other Property, Plant and Equipment',
            ],
            ['full_code' => '5 02 14', 'account_title' => 'Financial Assistance/Subsidy'],
            [
                'full_code' => '5 02 14 020',
                'account_title' => 'Subsidy to National Government Agencies',
            ],
            [
                'full_code' => '5 02 14 030',
                'account_title' => 'Subsidy to Other Local Government Units',
            ],
            ['full_code' => '5 02 14 060', 'account_title' => 'Subsidy to Other Funds'],
            [
                'full_code' => '5 02 14 070',
                'account_title' => 'Subsidy to General Fund Proper/Special Accounts',
            ],
            [
                'full_code' => '5 02 14 080',
                'account_title' => 'Subsidy to Local Economic Enterprises/Public Utilities',
            ],
            ['full_code' => '5 02 14 990', 'account_title' => 'Subsidies - Others'],
            ['full_code' => '5 02 15', 'account_title' => 'Transfers'],
            [
                'full_code' => '5 02 15 010',
                'account_title' => 'Transfers of Unspent Current Year DRRM Funds to the Trust Fund',
            ],
            [
                'full_code' => '5 02 15 020',
                'account_title' => 'Transfers for Project Equity Share /LGU Counterpart',
            ],
            [
                'full_code' => '5 02 16',
                'account_title' => 'Taxes, Insurance Premiums and Other Fees',
            ],
            ['full_code' => '5 02 16 010', 'account_title' => 'Taxes, Duties and Licenses'],
            ['full_code' => '5 02 16 020', 'account_title' => 'Fidelity Bond Premiums'],
            ['full_code' => '5 02 16 030', 'account_title' => 'Insurance Expenses'],
            [
                'full_code' => '5 02 99',
                'account_title' => 'Other Maintenance and Operating Expenses',
            ],
            ['full_code' => '5 02 99 010', 'account_title' => 'Advertising Expenses'],
            ['full_code' => '5 02 99 020', 'account_title' => 'Printing and Publication Expenses'],
            ['full_code' => '5 02 99 030', 'account_title' => 'Representation Expenses'],
            [
                'full_code' => '5 02 99 040',
                'account_title' => 'Transportation and Delivery Expenses',
            ],
            ['full_code' => '5 02 99 050', 'account_title' => 'Rent Expenses'],
            [
                'full_code' => '5 02 99 060',
                'account_title' => 'Membership Dues and Contributions to Organizations',
            ],
            ['full_code' => '5 02 99 070', 'account_title' => 'Subscription Expenses'],
            ['full_code' => '5 02 99 080', 'account_title' => 'Donations'],
            [
                'full_code' => '5 02 99 990',
                'account_title' => 'Other Maintenance and Operating Expenses',
            ],

            ['full_code' => '5 03', 'account_title' => 'Financial Expenses'],
            ['full_code' => '5 03 01', 'account_title' => 'Financial Expenses'],
            [
                'full_code' => '5 03 01 010',
                'account_title' => 'Management Supervision/Trusteeship Fees',
            ],
            ['full_code' => '5 03 01 020', 'account_title' => 'Interest Expenses'],
            ['full_code' => '5 03 01 030', 'account_title' => 'Guarantee Fees'],
            ['full_code' => '5 03 01 040', 'account_title' => 'Bank Charges'],
            ['full_code' => '5 03 01 050', 'account_title' => 'Commitment Fees'],
            ['full_code' => '5 03 01 990', 'account_title' => 'Other Financial Charges'],

            ['full_code' => '5 04', 'account_title' => 'Direct Costs'],
            ['full_code' => '5 04 01', 'account_title' => 'Cost of Goods Manufactured'],
            ['full_code' => '5 04 01 010', 'account_title' => 'Direct Materials'],
            ['full_code' => '5 04 01 020', 'account_title' => 'Direct Labor'],
            ['full_code' => '5 04 01 030', 'account_title' => 'Manufacturing Overhead'],
            ['full_code' => '5 04 02', 'account_title' => 'Cost of Sales'],
            ['full_code' => '5 04 02 010', 'account_title' => 'Cost of Sales'],

            ['full_code' => '5 05', 'account_title' => 'Non-Cash Expenses'],
            ['full_code' => '5 05 01', 'account_title' => 'Depreciation'],
            ['full_code' => '5 05 01 010', 'account_title' => 'Depreciation - Investment Property'],
            ['full_code' => '5 05 01 020', 'account_title' => 'Depreciation - Land Improvements'],
            [
                'full_code' => '5 05 01 030',
                'account_title' => 'Depreciation - Infrastructure Assets',
            ],
            [
                'full_code' => '5 05 01 040',
                'account_title' => 'Depreciation - Buildings and Other Structures',
            ],
            [
                'full_code' => '5 05 01 050',
                'account_title' => 'Depreciation - Machinery and Equipment',
            ],
            [
                'full_code' => '5 05 01 060',
                'account_title' => 'Depreciation - Transportation Equipment',
            ],
            [
                'full_code' => '5 05 01 070',
                'account_title' => 'Depreciation - Furniture, Fixtures and Books',
            ],
            ['full_code' => '5 05 01 080', 'account_title' => 'Depreciation - Leased Assets'],
            [
                'full_code' => '5 05 01 090',
                'account_title' => 'Depreciation - Leased Assets Improvements',
            ],
            [
                'full_code' => '5 05 01 100',
                'account_title' => 'Depreciation -Service Concession Assets',
            ],
            [
                'full_code' => '5 05 01 990',
                'account_title' => 'Depreciation - Other Property, Plant and Equipment',
            ],
            ['full_code' => '5 05 02', 'account_title' => 'Amortization'],
            ['full_code' => '5 05 02 010', 'account_title' => 'Amortization - Intangible Assets'],
            ['full_code' => '5 05 03', 'account_title' => 'Impairment Loss'],
            [
                'full_code' => '5 05 03 010',
                'account_title' => 'Impairment Loss - Financial Assets Held to Maturity',
            ],
            [
                'full_code' => '5 05 03 020',
                'account_title' => 'Impairment Loss - Loans and Receivables',
            ],
            [
                'full_code' => '5 05 03 030',
                'account_title' => 'Impairment Loss - Lease Receivables',
            ],
            [
                'full_code' => '5 05 03 040',
                'account_title' => 'Impairment Loss - Investments in GOCCs',
            ],
            [
                'full_code' => '5 05 03 050',
                'account_title' => 'Impairment Loss - Investments in Joint Venture',
            ],
            [
                'full_code' => '5 05 03 060',
                'account_title' => 'Impairment Loss - Other Receivables',
            ],
            [
                'full_code' => '5 05 03 070',
                'account_title' => 'Impairment Loss - Investment Property',
            ],
            [
                'full_code' => '5 05 03 080',
                'account_title' => 'Impairment Loss - Property, Plant and Equipment',
            ],
            [
                'full_code' => '5 05 03 090',
                'account_title' => 'Impairment Loss - Intangible Assets',
            ],
            ['full_code' => '5 05 04', 'account_title' => 'Losses'],
            ['full_code' => '5 05 04 010', 'account_title' => 'Loss on Foreign Exchange (FOREX)'],
            ['full_code' => '5 05 04 020', 'account_title' => 'Loss on Sale of Investments'],
            [
                'full_code' => '5 05 04 030',
                'account_title' => 'Loss on Sale of Investment Property',
            ],
            [
                'full_code' => '5 05 04 040',
                'account_title' => 'Loss on Sale of Property, Plant and Equipment',
            ],
            ['full_code' => '5 05 04 050', 'account_title' => 'Loss on Sale of Biological Assets'],
            ['full_code' => '5 05 04 060', 'account_title' => 'Loss on Sale of Intangible Assets'],
            ['full_code' => '5 05 04 070', 'account_title' => 'Loss on Sale of Assets'],
            [
                'full_code' => '5 05 04 080',
                'account_title' => 'Loss on Initial Recognition of Biological Assets',
            ],
            ['full_code' => '5 05 04 090', 'account_title' => 'Loss of Assets'],
            ['full_code' => '5 05 04 100', 'account_title' => 'Loss on Guaranty'],
            [
                'full_code' => '5 05 04 110',
                'account_title' => 'Loss from Changes in Fair Value of Financial Instruments',
            ],
            ['full_code' => '5 05 04 990', 'account_title' => 'Other Losses'],
            ['full_code' => '5 05 05', 'account_title' => 'Grants'],
            ['full_code' => '5 05 05 010', 'account_title' => 'Grants for Concessionary Loans'],
        ];

        $codeToIdMap = [];
        $skippedAccounts = [];

        DB::transaction(function () use ($coas, &$codeToIdMap, &$skippedAccounts) {
            foreach ($coas as $coa) {
                $fullCode = trim($coa['full_code']);
                $segments = explode(' ', $fullCode);
                $level = count($segments);

                $parentId = null;
                if ($level > 1) {
                    $parentSegments = array_slice($segments, 0, -1);
                    $parentFullCode = implode(' ', $parentSegments);

                    // Skip item if its parent hasn't been created/found yet
                    if (!isset($codeToIdMap[$parentFullCode])) {
                        $skippedAccounts[] = [
                            'full_code' => $fullCode,
                            'account_title' => $coa['account_title'],
                            'reason' => "Missing parent record: {$parentFullCode}",
                        ];
                        continue;
                    }

                    $parentId = $codeToIdMap[$parentFullCode];
                }

                $accountNumber = end($segments);
                $path = str_replace(' ', '-', $fullCode);
                $isPostable = $level === 4;

                $newAccount = ChartOfAccount::create([
                    'parent_id' => $parentId,
                    'account_number' => $accountNumber,
                    'account_title' => $coa['account_title'],
                    'path' => $path,
                    'is_postable' => $isPostable,
                    'is_active' => true,
                ]);

                $codeToIdMap[$fullCode] = $newAccount->id;
            }
        });

        // Log skipped items to storage/logs/laravel.log
        if (!empty($skippedAccounts)) {
            Log::warning('ChartOfAccount Seeder: Skipped records due to missing parents.', [
                'count' => count($skippedAccounts),
                'records' => $skippedAccounts,
            ]);
        }
    }
}
