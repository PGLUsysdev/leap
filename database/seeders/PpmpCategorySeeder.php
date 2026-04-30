<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PpmpCategory;
use Illuminate\Support\Facades\DB;

class PpmpCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Disable mass-assignment protection so we can force the 'id'
        PpmpCategory::unguard();

        $categories = [
            // MOOE ---
            // Traveling Expenses - Local
            [
                'id' => 25,
                'name' => 'Non-Procurement Items - Traveling Expenses - Local',
                // 'chart_of_account_id' => 28,
                'is_non_procurement' => true,
            ],

            // Traveling Expenses - Foreign
            [
                'id' => 26,
                'name' =>
                    'Non-Procurement Items - Traveling Expenses - Foreign',
                // 'chart_of_account_id' => 29,
                'is_non_procurement' => true,
            ],

            // Training Expenses
            [
                'id' => 27,
                'name' => 'Non-Procurement Items - Training Expenses',
                // 'chart_of_account_id' => 30,
                'is_non_procurement' => true,
            ],

            // Scholarship Grants/Expenses
            [
                'id' => 28,
                'name' => 'Non-Procurement Items - Scholarship Grants/Expenses',
                // 'chart_of_account_id' => 31,
                'is_non_procurement' => true,
            ],

            // Office Supplies Expenses
            [
                'id' => 6,
                'name' => 'Computer Supplies',
                // 'chart_of_account_id' => 32,
            ],
            [
                'id' => 7,
                'name' => 'Computer Ink and Toner',
                // 'chart_of_account_id' => 32,
            ],
            [
                'id' => 8,
                'name' => 'Computer Supplies - Kyocera',
                // 'chart_of_account_id' => 32,
            ],
            [
                'id' => 9,
                'name' => 'Computer Supplies - Canon',
                // 'chart_of_account_id' => 32,
            ],
            [
                'id' => 10,
                'name' => 'Computer Supplies - Duplo',
                // 'chart_of_account_id' => 32,
            ],
            [
                'id' => 11,
                'name' => 'Computer Supplies - Lexmark',
                // 'chart_of_account_id' => 32,
            ],
            [
                'id' => 12,
                'name' => 'Computer Supplies - Sharp',
                // 'chart_of_account_id' => 32,
            ],
            [
                'id' => 13,
                'name' => 'Computer Supplies - Neo Brand',
                // 'chart_of_account_id' => 32,
            ],
            [
                'id' => 20,
                'name' => 'Computer Supplies - Epson',
                // 'chart_of_account_id' => 32,
            ],
            [
                'id' => 22,
                'name' => 'Office Supplies',
                // 'chart_of_account_id' => 32,
            ],

            // Accountable Forms Expenses
            [
                'id' => 1,
                'name' => 'Accountable Forms',
                // 'chart_of_account_id' => 33,
            ],

            // Non-Accountable Forms Expenses
            [
                'id' => 29,
                'name' => 'Non-Accountable Forms Expenses',
                // 'chart_of_account_id' => 34,
            ],

            // Animal/Zoological Supplies Expenses
            [
                'id' => 30,
                'name' => 'Animal/Zoological Supplies Expenses',
                // 'chart_of_account_id' => 35,
            ],

            // Food Supplies Expenses
            [
                'id' => 31,
                'name' => 'Food Supplies Expenses',
                // 'chart_of_account_id' => 36,
            ],

            // Welfare Goods Expenses
            [
                'id' => 32,
                'name' => 'General Welfare Goods',
                // 'chart_of_account_id' => 37,
            ],

            // Drugs and Medicines Expenses
            [
                'id' => 33,
                'name' => 'Drugs and Medicines Expenses',
                // 'chart_of_account_id' => 38,
            ],

            // Medical, Dental and Laboratory Supplies Expenses
            [
                'id' => 34,
                'name' => 'Medical, Dental and Laboratory Supplies Expenses',
                // 'chart_of_account_id' => 39,
            ],

            // Fuel, Oil, and Lubricants Expenses
            [
                'id' => 17,
                'name' => 'Fuel, Oil, and Lubricants Expenses',
                // 'chart_of_account_id' => 40,
            ],

            // Agricultural and Marine Supplies Expenses
            [
                'id' => 35,
                'name' => 'Agricultural and Marine Supplies Expenses',
                // 'chart_of_account_id' => 41,
            ],

            // Textbooks and Instructional Materials Expenses
            [
                'id' => 36,
                'name' => 'Textbooks and Instructional Materials Expenses',
                // 'chart_of_account_id' => 42,
            ],

            // Military, Police and Traffic Supplies Expenses
            [
                'id' => 37,
                'name' => 'Military, Police and Traffic Supplies Expenses',
                // 'chart_of_account_id' => 43,
            ],

            // Chemical and Filtering Supplies Expenses
            [
                'id' => 38,
                'name' => 'Chemical and Filtering Supplies Expenses',
                // 'chart_of_account_id' => 44,
            ],

            // Semi-Expendable Machinery and Equipment Expenses
            [
                'id' => 39,
                'name' => 'Semi-Expendable Machinery and Equipment Expenses',
                // 'chart_of_account_id' => 45,
            ],

            // Semi-Expendable Furniture, Fixtures and Book Expenses
            [
                'id' => 40,
                'name' =>
                    'Semi-Expendable Furniture, Fixtures and Book Expenses',
                // 'chart_of_account_id' => 46,
            ],

            // Other Supplies and Materials Expenses
            [
                'id' => 4,
                'name' => 'Carpentry Tools and Equipment',
                // 'chart_of_account_id' => 47,
            ],
            [
                'id' => 5,
                'name' => 'Carpentry Supplies',
                // 'chart_of_account_id' => 47,
            ],
            [
                'id' => 14,
                'name' => 'Electrical Supplies',
                // 'chart_of_account_id' => 47,
            ],
            [
                'id' => 15,
                'name' => 'Electrical Tools',
                // 'chart_of_account_id' => 47,
            ],
            [
                'id' => 16,
                'name' => 'Electrical Equipment',
                // 'chart_of_account_id' => 47,
            ],
            [
                'id' => 18,
                'name' => 'Janitorial Supplies',
                // 'chart_of_account_id' => 47,
            ],
            [
                'id' => 19,
                'name' => 'Gardening Supplies & Tools',
                // 'chart_of_account_id' => 47,
            ],
            [
                'id' => 21,
                'name' => 'Plumbing Tools',
                // 'chart_of_account_id' => 47,
            ],
            [
                'id' => 41,
                'name' => 'Trophies, Plaques & Medals',
                // 'chart_of_account_id' => 47,
            ],
            [
                'id' => 42,
                'name' => 'Sports Supplies',
                // 'chart_of_account_id' => 47,
            ],
            [
                'id' => 43,
                'name' => 'Tokens/Souvenirs',
                // 'chart_of_account_id' => 47,
            ],

            // Water Expenses
            [
                'id' => 44,
                'name' => 'Non-Procurement Items - Water ',
                // 'chart_of_account_id' => 48,
                'is_non_procurement' => true,
            ],

            // Electricity Expenses
            [
                'id' => 45,
                'name' => 'Non-Procurement Items - Electricity ',
                // 'chart_of_account_id' => 49,
                'is_non_procurement' => true,
            ],

            // Postage and Courier Services
            [
                'id' => 23,
                'name' => 'Postage and Courier Services',
                // 'chart_of_account_id' => 50,
            ],

            // Telephone Expenses
            [
                'id' => 46,
                'name' => 'Non-Procurement Items - Telephone ',
                // 'chart_of_account_id' => 51,
                'is_non_procurement' => true,
            ],

            // Internet Subscription Expenses
            [
                'id' => 47,
                'name' => 'Internet Subscription Expenses',
                // 'chart_of_account_id' => 52,
            ],

            // Cable, Satellite, Telegraph and Radio Expenses
            [
                'id' => 48,
                'name' => 'Cable, Satellite, Telegraph and Radio Expenses',
                // 'chart_of_account_id' => 53,
            ],

            // Awards and Rewards Expenses
            [
                'id' => 49,
                'name' => 'Non-Procurement Items - Awards and Rewards Expenses',
                // 'chart_of_account_id' => 54,
                'is_non_procurement' => true,
            ],

            // Prizes
            [
                'id' => 50,
                'name' => 'Non-Procurement Items - Prizes',
                // 'chart_of_account_id' => 55,
                'is_non_procurement' => true,
            ],

            // Survey Expenses
            [
                'id' => 51,
                'name' => 'Non-Procurement Items - Survey ',
                // 'chart_of_account_id' => 56,
                'is_non_procurement' => true,
            ],

            // Research, Exploration and Development Expenses
            [
                'id' => 52,
                'name' => 'Research, Exploration and Development Expenses',
                // 'chart_of_account_id' => 57,
            ],

            // Demolition and Relocation Expenses
            [
                'id' => 53,
                'name' => 'Demolition and Relocation Expenses',
                // 'chart_of_account_id' => 58,
            ],

            // Desilting and Dredging Expenses
            [
                'id' => 54,
                'name' => 'Desilting and Dredging Expenses',
                // 'chart_of_account_id' => 59,
            ],

            // Generation, Transmission and Distribution Expenses
            [
                'id' => 55,
                'name' => 'Generation, Transmission and Distribution Expenses',
                // 'chart_of_account_id' => 60,
            ],

            // Confidential Expenses
            [
                'id' => 56,
                'name' => 'Confidential Expenses',
                // 'chart_of_account_id' => 61,
            ],

            // Intelligence Expenses
            [
                'id' => 57,
                'name' => 'Intelligence Expenses',
                // 'chart_of_account_id' => 62,
            ],

            // Extraordinary and Miscellaneous Expenses
            [
                'id' => 58,
                'name' => 'Extraordinary and Miscellaneous Expenses',
                // 'chart_of_account_id' => 63,
            ],

            // Legal Services
            [
                'id' => 59,
                'name' => 'Legal Services',
                // 'chart_of_account_id' => 64,
            ],

            // Auditing Services
            [
                'id' => 60,
                'name' => 'Auditing Services',
                // 'chart_of_account_id' => 65,
            ],

            // Consultancy Services
            [
                'id' => 61,
                'name' => 'Consultancy Services',
                // 'chart_of_account_id' => 66,
            ],

            // Other Professional Services
            [
                'id' => 62,
                'name' => 'Other Professional Services',
                // 'chart_of_account_id' => 67,
            ],

            // Environment/Sanitary Services
            [
                'id' => 63,
                'name' => 'Environment/Sanitary Services',
                // 'chart_of_account_id' => 68,
            ],

            // Janitorial Services
            [
                'id' => 64,
                'name' => 'Janitorial Services',
                // 'chart_of_account_id' => 69,
            ],

            // Security Services
            [
                'id' => 65,
                'name' => 'Security Services',
                // 'chart_of_account_id' => 70,
            ],

            // Other General Services
            [
                'id' => 66,
                'name' => 'Non-Procurement Items - Other General Services',
                // 'chart_of_account_id' => 71,
                'is_non_procurement' => true,
            ],

            // Repair and Maintenance - Investment Property
            [
                'id' => 67,
                'name' => 'Repair and Maintenance - Investment Property',
                // 'chart_of_account_id' => 72,
            ],

            // Repair and Maintenance - Land Improvements
            [
                'id' => 68,
                'name' => 'Repair and Maintenance - Land Improvements',
                // 'chart_of_account_id' => 73,
            ],

            // Repair and Maintenance - Infrastructure Assets
            [
                'id' => 69,
                'name' => 'Repair and Maintenance - Infrastructure Assets',
                // 'chart_of_account_id' => 74,
            ],

            // Repair and Maintenance - Buildings and Other Structures
            [
                'id' => 70,
                'name' =>
                    'Repair and Maintenance - Buildings and Other Structures',
                // 'chart_of_account_id' => 75,
            ],

            // Repair and Maintenance - Machinery and Equipment
            [
                'id' => 71,
                'name' => 'Repair and Maintenance - Machinery and Equipment',
                // 'chart_of_account_id' => 76,
            ],

            // Repair and Maintenance - Transportation Equipment
            [
                'id' => 72,
                'name' => 'Repair and Maintenance - Transportation Equipment',
                // 'chart_of_account_id' => 77,
            ],

            // Repair and Maintenance - Furniture and Fixtures
            [
                'id' => 73,
                'name' => 'Repair and Maintenance - Furniture and Fixtures',
                // 'chart_of_account_id' => 78,
            ],
            // Repair and Maintenance - Leased Assets
            [
                'id' => 74,
                'name' => 'Repair and Maintenance - Leased Assets',
                // 'chart_of_account_id' => 79,
            ],

            // Repair and Maintenance - Leased Assets Improvements
            [
                'id' => 75,
                'name' => 'Repair and Maintenance - Leased Assets Improvements',
                // 'chart_of_account_id' => 80,
            ],

            // Repair and Maintenance - Other Property, Plant and Equipment
            [
                'id' => 76,
                'name' =>
                    'Repair and Maintenance - Other Property, Plant and Equipment',
                // 'chart_of_account_id' => 81,
            ],

            // Subsidy to National Government Agencies
            [
                'id' => 77,
                'name' =>
                    'Non-Procurement Items - Subsidy to National Government Agenices ',
                // 'chart_of_account_id' => 82,
                'is_non_procurement' => true,
            ],

            // Subsidy to Other Local Government Units
            [
                'id' => 78,
                'name' =>
                    'Non-Procurement Items - Subsidy to Other Local Government Units',
                // 'chart_of_account_id' => 83,
                'is_non_procurement' => true,
            ],

            // Subsidy to Other Funds
            [
                'id' => 79,
                'name' => 'Non-Procurement Items - Subsidy to Other Funds',
                // 'chart_of_account_id' => 84,
                'is_non_procurement' => true,
            ],

            // Subsidy to General Fund Proper/Special Accounts
            [
                'id' => 80,
                'name' =>
                    'Non-Procurement Items - Subsidy to General Fund Proper/Special Accounts',
                // 'chart_of_account_id' => 85,
                'is_non_procurement' => true,
            ],

            // Subsidy to Local Economic Enterprises/Public Utilities
            [
                'id' => 81,
                'name' =>
                    'Non-Procurement Items - Subsidy to Local Economic Enterprises/Public Utilities',
                // 'chart_of_account_id' => 86,
                'is_non_procurement' => true,
            ],

            // Subsidy-Others
            [
                'id' => 82,
                'name' => 'Non-Procurement Items - Others',
                // 'chart_of_account_id' => 87,
                'is_non_procurement' => true,
            ],

            // Transfers of Unspent Current Year DRRM Funds to the Trust Funds
            [
                'id' => 83,
                'name' =>
                    'Non-Procurement Items - Transfers of Unspent Current Year DRRM Funds to the Trust Funds',
                // 'chart_of_account_id' => 88,
                'is_non_procurement' => true,
            ],

            // Transfers for Project Equity Share/LGU Counterpart
            [
                'id' => 84,
                'name' =>
                    'Non-Procurement Items - Transfers for Project Equity Share/LGU Counterpart',
                // 'chart_of_account_id' => 89,
                'is_non_procurement' => true,
            ],

            // Taxes, Duties and Licenses
            [
                'id' => 85,
                'name' => 'Taxes, Duties and Licenses',
                // 'chart_of_account_id' => 90,
            ],

            // Fidelity Bond Premiums
            [
                'id' => 86,
                'name' => 'Fidelity Bond Premiums',
                // 'chart_of_account_id' => 91,
            ],

            // Insurance Expenses
            [
                'id' => 87,
                'name' => 'Insurance Expenses',
                // 'chart_of_account_id' => 92,
            ],

            // Advertising Expenses
            [
                'id' => 2,
                'name' => 'Advertising Expenses',
                // 'chart_of_account_id' => 93,
            ],

            // Printing and Publication Expenses
            [
                'id' => 24,
                'name' => 'Printing and Publication Expenses',
                // 'chart_of_account_id' => 94,
            ],

            // Representation Expenses
            [
                'id' => 3,
                'name' => 'Beverages',
                // 'chart_of_account_id' => 95,
            ],
            [
                'id' => 88,
                'name' => 'Buffet Meals and Snacks',
                // 'chart_of_account_id' => 95,
            ],
            [
                'id' => 89,
                'name' => 'Meals and Snacks',
                // 'chart_of_account_id' => 95,
            ],

            // Transportation and Delivery Expenses
            [
                'id' => 90,
                'name' => 'Transportation and Delivery Expenses',
                // 'chart_of_account_id' => 96,
            ],

            // Rent Expenses
            [
                'id' => 91,
                'name' => 'Rent Expenses',
                // 'chart_of_account_id' => 97,
            ],

            // Membership Dues and Contributions to Organizations
            [
                'id' => 92,
                'name' =>
                    'Non-Procurement Items - Membership Dues and Contributions to Organizations',
                // 'chart_of_account_id' => 98,
                'is_non_procurement' => true,
            ],

            // Subscription Expenses
            [
                'id' => 93,
                'name' => 'Subscription Expenses',
                // 'chart_of_account_id' => 99,
            ],

            // Donations
            [
                'id' => 94,
                'name' => 'Donations' /* 'chart_of_account_id' => 100 */,
            ],

            // Other Maintenance and Operating Expenses
            [
                'id' => 95,
                'name' =>
                    'Non-Procurement Items - Other Maintenance and Operating Expenses',
                // 'chart_of_account_id' => 101,
                'is_non_procurement' => true,
            ],

            // Capital Outlay ---
            [
                'id' => 96,
                'name' => 'Land',
                // 'chart_of_account_id' => 102,
            ],
            [
                'id' => 97,
                'name' => 'Other Land Improvements',
                // 'chart_of_account_id' => 103,
            ],
            [
                'id' => 98,
                'name' => 'Road Networks',
                // 'chart_of_account_id' => 104,
            ],
            [
                'id' => 99,
                'name' => 'Flood Control System',
                // 'chart_of_account_id' => 105,
            ],
            [
                'id' => 100,
                'name' => 'Sewer Systems',
                // 'chart_of_account_id' => 106,
            ],
            [
                'id' => 101,
                'name' => 'Water Supply Systems',
                // 'chart_of_account_id' => 107,
            ],
            [
                'id' => 102,
                'name' => 'Power Supply Systems',
                // 'chart_of_account_id' => 108,
            ],
            [
                'id' => 103,
                'name' => 'Communication Networks',
                // 'chart_of_account_id' => 109,
            ],
            [
                'id' => 104,
                'name' => 'Seaport Systems',
                // 'chart_of_account_id' => 110,
            ],
            [
                'id' => 105,
                'name' => 'Airport Systems',
                // 'chart_of_account_id' => 111,
            ],
            [
                'id' => 106,
                'name' => 'Park, Plazas and Monuments',
                // 'chart_of_account_id' => 112,
            ],
            [
                'id' => 107,
                'name' => 'Other Infrastructure Assets',
                // 'chart_of_account_id' => 113,
            ],
            [
                'id' => 108,
                'name' => 'Buildings',
                // 'chart_of_account_id' => 114,
            ],
            [
                'id' => 109,
                'name' => 'School Buildings',
                // 'chart_of_account_id' => 115,
            ],
            [
                'id' => 110,
                'name' => 'Hospitals and Health Centers',
                // 'chart_of_account_id' => 116,
            ],
            [
                'id' => 111,
                'name' => 'Markets',
                // 'chart_of_account_id' => 117,
            ],
            [
                'id' => 112,
                'name' => 'Slaughterhouses',
                // 'chart_of_account_id' => 118,
            ],
            [
                'id' => 113,
                'name' => 'Hostels and Dormitories',
                // 'chart_of_account_id' => 119,
            ],
            [
                'id' => 114,
                'name' => 'Other Structures',
                // 'chart_of_account_id' => 120,
            ],
            [
                'id' => 115,
                'name' => 'Machinery',
                // 'chart_of_account_id' => 121,
            ],
            [
                'id' => 116,
                'name' => 'Office Equipment',
                // 'chart_of_account_id' => 122,
            ],
            [
                'id' => 117,
                'name' => 'Information and Communication Technology Equipment',
                // 'chart_of_account_id' => 123,
            ],
            [
                'id' => 118,
                'name' => 'Agricultural and Forestry Equipment',
                // 'chart_of_account_id' => 124,
            ],
            [
                'id' => 119,
                'name' => 'Marine and Fishery Equipment',
                // 'chart_of_account_id' => 125,
            ],
            [
                'id' => 120,
                'name' => 'Airport Equipment',
                // 'chart_of_account_id' => 126,
            ],
            [
                'id' => 121,
                'name' => 'Communication Equipment',
                // 'chart_of_account_id' => 127,
            ],
            [
                'id' => 122,
                'name' => 'Construction and Heavy Equipment',
                // 'chart_of_account_id' => 128,
            ],
            [
                'id' => 123,
                'name' => 'Disaster Response and Rescue Equipment',
                // 'chart_of_account_id' => 129,
            ],
            [
                'id' => 124,
                'name' => 'Military, Police and Security Equipment',
                // 'chart_of_account_id' => 130,
            ],
            [
                'id' => 125,
                'name' => 'Medical Equipment',
                // 'chart_of_account_id' => 131,
            ],
            [
                'id' => 126,
                'name' => 'Printing Equipment',
                // 'chart_of_account_id' => 132,
            ],
            [
                'id' => 127,
                'name' => 'Sports Equipment',
                // 'chart_of_account_id' => 133,
            ],
            [
                'id' => 128,
                'name' => 'Technical and Scientific Equipment',
                // 'chart_of_account_id' => 134,
            ],
            [
                'id' => 129,
                'name' => 'Other Machinery and Equipment',
                // 'chart_of_account_id' => 135,
            ],
            [
                'id' => 130,
                'name' => 'Motor Vehicles',
                // 'chart_of_account_id' => 136,
            ],
            [
                'id' => 131,
                'name' => 'Trains',
                // 'chart_of_account_id' => 137,
            ],
            [
                'id' => 132,
                'name' => 'Aircrafts and Aircrafts Ground Equipment',
                // 'chart_of_account_id' => 138,
            ],
            [
                'id' => 133,
                'name' => 'Watercrafts',
                // 'chart_of_account_id' => 139,
            ],
            [
                'id' => 134,
                'name' => 'Other Transportation Equipment',
                // 'chart_of_account_id' => 140,
            ],
            [
                'id' => 135,
                'name' => 'Furniture and Fixtures',
                // 'chart_of_account_id' => 141,
            ],
            [
                'id' => 136,
                'name' => 'Books',
                // 'chart_of_account_id' => 142,
            ],
            [
                'id' => 137,
                'name' => 'Work/Zoo Animals',
                // 'chart_of_account_id' => 143,
            ],
            [
                'id' => 138,
                'name' => 'Other Property, Plant, and Equipment',
                // 'chart_of_account_id' => 144,
            ],
            [
                'id' => 139,
                'name' => 'Breeding Stocks',
                // 'chart_of_account_id' => 145,
            ],
            [
                'id' => 140,
                'name' => 'Plants and Trees',
                // 'chart_of_account_id' => 146,
            ],
            [
                'id' => 141,
                'name' => 'Aquaculture',
                // 'chart_of_account_id' => 147,
            ],
            [
                'id' => 142,
                'name' => 'Other Bearer Biological Assets',
                // 'chart_of_account_id' => 148,
            ],
            [
                'id' => 143,
                'name' => 'Patents/Copyrights',
                // 'chart_of_account_id' => 149,
            ],
            [
                'id' => 144,
                'name' => 'Computer Software',
                // 'chart_of_account_id' => 150,
            ],
            [
                'id' => 145,
                'name' => 'Other Intangible Assets',
                // 'chart_of_account_id' => 151,
            ],
        ];

        foreach ($categories as $category) {
            // We search by ID to ensure we update the correct record
            PpmpCategory::updateOrCreate(
                ['id' => $category['id']],
                [
                    'name' => $category['name'],
                    // 'chart_of_account_id' => $category['chart_of_account_id'],
                    'is_non_procurement' =>
                        $category['is_non_procurement'] ?? false,
                ],
            );
        }

        // 2. Fix the Auto-Increment (MySQL specific)
        // This ensures the next item created via the app starts at 146
        $nextId = PpmpCategory::max('id') + 1;
        DB::statement("ALTER TABLE ppmp_categories AUTO_INCREMENT = $nextId;");

        // 3. Re-enable protection
        PpmpCategory::reguard();
    }
}
