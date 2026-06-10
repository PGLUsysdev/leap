<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\CcTypology;

class CcTypologySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $typologies = [
            // =========================================================================
            // STRATEGIC PRIORITY 1: FOOD SECURITY
            // =========================================================================

            // --- Sub-Sector 1: Agriculture and Livestock (ID: 1) ---
            // Policy Development and Governance (Category: '1')
            [
                'code' => 'A111-01',
                'description' =>
                    'Incorporate climate change and climate variability considerations in policies and institutions',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A111-02',
                'description' =>
                    'Regulate commodity shifting and agricultural land conversion',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '1',
                'item_num' => 2,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A111-03',
                'description' =>
                    'Design and implement climate change risk transfer and social protection mechanisms in agriculture and fisheries',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '1',
                'item_num' => 3,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A111-04',
                'description' =>
                    'Incorporate risks from climate change and climate variability in irrigation/water management planning',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '1',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M111-01',
                'description' =>
                    'Enact/Implement ordinances and policies to reduce the emissions of greenhouse gases (GHGs), or absorption of GHGs in the agricultural sector',
                'response_type' => 'M',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M111-03',
                'description' => 'Monitor carbon sequestration',
                'response_type' => 'M',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '1',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],

            // Research, Development and Extension (Category: '2')
            [
                'code' => 'A112-01',
                'description' =>
                    'Conduct agricultural vulnerability and risk assessments, impact assessments and simulation models on major crops and livestock',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '2',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A112-02',
                'description' =>
                    'Develop, test and popularize climate-resilient crop and livestock production systems and technologies',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '2',
                'item_num' => 2,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A112-03',
                'description' =>
                    'Research on new threats to agriculture, fishing, and forestry from CC and CV',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '2',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A112-04',
                'description' =>
                    'Produce and distribute climate resilient rice varieties',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '2',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M112-01',
                'description' =>
                    'Develop, test and introduce practices or techniques that reduce GHG emissions and practices or techniques to sequester carbon dioxide (CO2) in crop production systems, animal husbandry systems, forest management systems and aquaculture management systems',
                'response_type' => 'M',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '2',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M112-02',
                'description' =>
                    'Sector studies, surveys, assessments on energy and water use efficiency in agriculture',
                'response_type' => 'M',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '2',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],

            // Knowledge Sharing and Capacity Building (Category: '3')
            [
                'code' => 'A113-01',
                'description' =>
                    'Awareness raising of risks from climate change, or/and benefits of adaptation',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A113-02',
                'description' =>
                    'Establish climate information systems and database/resource network for agriculture and fisheries sectors',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '3',
                'item_num' => 2,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A113-03',
                'description' =>
                    'Establish and/or popularize farmers\' field school/climate field school to demonstrate best adaptation practices',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '3',
                'item_num' => 3,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A113-04',
                'description' =>
                    'Develop formal and non-formal training programs on climate change adaptation (CCA) and disaster risk reduction (DRR)',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '3',
                'item_num' => 4,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A113-06',
                'description' => 'Conduct of non-farm entrepreneurial courses',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '3',
                'item_num' => 6,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A113-07',
                'description' =>
                    'Conduct Slope Agriculture Land Technology (SALT) training and other soil conservation measures in sloping lands for farmers',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '3',
                'item_num' => 7,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A113-08',
                'description' =>
                    'Improve the adaptive capacity of farmers and fisherfolk through the provision of relevant technologies and information',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '3',
                'item_num' => 8,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M113-01',
                'description' =>
                    'Establish or strengthen institutions, information systems and capacity building on energy and water use efficiency in agriculture sector',
                'response_type' => 'M',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],

            // Service Delivery (Category: '4')
            [
                'code' => 'A114-01',
                'description' =>
                    'Establish early warning systems for agriculture',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A114-02',
                'description' =>
                    'Introduce or expand soil management practices that control soil erosion, nutrient loss and improve the water regime in the soil profile',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A114-03',
                'description' =>
                    'Introduce or expand use of crops or crop mix more suited to climate change and climate variability',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A114-04',
                'description' =>
                    'Reduce vulnerability of crop storage facilities and irrigation systems to climate change and climate variability',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 4,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A114-05',
                'description' =>
                    'Construct/Repair/Rehabilitate national and communal irrigation systems, dams and water storage systems to manage changes in the water cycle due to climate change and climate variability',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 5,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A114-06',
                'description' =>
                    'Introduce weather or climate indexed insurance programs (e.g. crop insurance)',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 6,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A114-08',
                'description' =>
                    'Change management practices or techniques to reduce vulnerability to climate change and climate variability in animal health service, pasture management, fodder production and storage practices',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 8,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A114-09',
                'description' =>
                    'Develop innovative financing mechanisms to provide seed capital for the implementation of CCA among farmers and fisherfolks organization',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 9,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A114-10',
                'description' =>
                    'Construct water impounding dams, rainwater harvesting facilities for irrigation, and water storage systems to manage changes in the water cycle due to CC and CV',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 10,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A114-11',
                'description' =>
                    'Construct crop storage facilities that consider climate change and variability',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 11,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A114-12',
                'description' =>
                    'Promote agro-forestry such as cacao/coffee/rubber production and seedling distribution',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 12,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A114-13',
                'description' => 'Establish Integrated Pests Management',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 13,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A114-14',
                'description' =>
                    'Develop climate resilient livestock production system and technologies',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 14,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M114-01',
                'description' =>
                    'Integrated organic and inorganic nutrient management',
                'response_type' => 'M',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M114-02',
                'description' =>
                    'Switch to soil management techniques that reduce GHG emissions or increase carbon sequestration',
                'response_type' => 'M',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M114-03',
                'description' =>
                    'Intensify or expand farm and fodder production using techniques that reduce GHG emissions or increase carbon sequestration',
                'response_type' => 'M',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M114-04',
                'description' =>
                    'Manure management and methane capture in animal husbandry',
                'response_type' => 'M',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M114-05',
                'description' =>
                    'Change forage systems to reduce ruminant methane emissions',
                'response_type' => 'M',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 5,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M114-06',
                'description' =>
                    'Introduce or expand water pumping for irrigation using renewable energy sources',
                'response_type' => 'M',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 6,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M114-07',
                'description' =>
                    'Replace existing water pumps with more energy efficient pumps',
                'response_type' => 'M',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 7,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M114-08',
                'description' =>
                    'Implement agricultural and fisheries waste recycling and composting',
                'response_type' => 'M',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 8,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'M114-09',
                'description' => 'Switch to less water intensive crops',
                'response_type' => 'M',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 9,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M114-10',
                'description' =>
                    'Establish communal school gardens, and other community gardens for local consumption',
                'response_type' => 'M',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 1,
                'category_code' => '4',
                'item_num' => 10,
                'is_nccap_activity' => false,
            ],

            // --- Sub-Sector 2: Fisheries (ID: 2) ---
            [
                'code' => 'A121-02',
                'description' =>
                    'Formulate/implement ordinances on reversion of abandoned fishponds back to mangroves',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 2,
                'category_code' => '1',
                'item_num' => 2,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A121-03',
                'description' =>
                    'Harmonize climate change adaptation plans in local resource management and local fisheries development',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 2,
                'category_code' => '1',
                'item_num' => 3,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'M121-01',
                'description' =>
                    'Formulate/implement ordinances to reduce the emissions of GHGs, or absorption of GHGs in the fishing sectors',
                'response_type' => 'M',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 2,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M121-02',
                'description' =>
                    'Develop ordinances to reduce municipal fishing boats/improve fuel efficiency of municipal fishing boats',
                'response_type' => 'M',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 2,
                'category_code' => '1',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A122-01',
                'description' =>
                    'Conduct of provincial-level vulnerability and risk assessments for fisheries',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 2,
                'category_code' => '2',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A122-02',
                'description' =>
                    'Conduct researches on best practices in fisheries and coastal climate change adaptation, technologies and tools',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 2,
                'category_code' => '2',
                'item_num' => 2,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A122-04',
                'description' =>
                    'Develop and/or update climate change R&D agenda for fisheries sectors',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 2,
                'category_code' => '2',
                'item_num' => 4,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A122-05',
                'description' =>
                    'Promote fish farming and aquaculture practices or techniques to reduce vulnerability to CC&CV (i.e. due to changes in water quality or variation in fishing season)',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 2,
                'category_code' => '2',
                'item_num' => 5,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A122-06',
                'description' =>
                    'Establish climate information systems and database for fisheries sector',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 2,
                'category_code' => '2',
                'item_num' => 6,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A123-01',
                'description' =>
                    'Establish a resource network / information system and database on climate change and fisheries',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 2,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'M123-01',
                'description' =>
                    'Establish or strengthen institutions, information systems and capacity building on energy and water use efficiency in fishing sector',
                'response_type' => 'M',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 2,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A124-02',
                'description' =>
                    'Establish early warning systems for fisheries',
                'response_type' => 'A',
                'strategic_priority_id' => 1,
                'sub_sector_id' => 2,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => true,
            ],

            // =========================================================================
            // STRATEGIC PRIORITY 2: WATER SUFFICIENCY
            // =========================================================================

            // --- Sub-Sector 3: Water Supply (ID: 3) ---
            [
                'code' => 'A211-01',
                'description' =>
                    'Develop ordinances, policies and guidelines for water conservation, allocation, recycling and reuse',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A211-02',
                'description' =>
                    'Review and streamline existing water resources management and institutional structure and policies',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '1',
                'item_num' => 2,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A211-03',
                'description' =>
                    'Develop and implement a comprehensive ground water management program that includes vulnerability assessment',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '1',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A211-04',
                'description' =>
                    'Develop public financing mechanism for water supply infrastructures rehabilitation and development',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '1',
                'item_num' => 4,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A211-05',
                'description' =>
                    'Incorporate risks from climate change and climate variability in water, sanitation and flood protection planning',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '1',
                'item_num' => 5,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A211-06',
                'description' =>
                    'Review financing, tariffs, and system of incentives to reflect the full cost of providing safe water',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '1',
                'item_num' => 6,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'M211-01',
                'description' =>
                    'Sector reform to improve water use efficiency to reduce energy use for pumping water (e.g. water pricing)',
                'response_type' => 'M',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A212-01',
                'description' =>
                    'Study "low cost, no regrets" adaptation measures and technologies under various hydrologic conditions, supply-demand conditions, and policy scenarios for surface and groundwater systems',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '2',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A212-02',
                'description' =>
                    'Define areas not suitable for large water infrastructure development and settlements based on vulnerability assessment',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '2',
                'item_num' => 2,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A212-03',
                'description' =>
                    'Conduct ground water resource vulnerability and recharge areas assessment in water stressed cities',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '2',
                'item_num' => 3,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A212-05',
                'description' =>
                    'Identify alternative water sources and demand management especially for urbanized areas that rely on reservoirs and are prone to recurrent and severe drought events',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '2',
                'item_num' => 5,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A212-06',
                'description' =>
                    'Study and adopt centralized wastewater treatment systems to improve quality in highly urbanized and densely populated areas',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '2',
                'item_num' => 6,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A212-07',
                'description' =>
                    'Conduct water resource supply and demand analysis under various hydrologic conditions and climate scenarios',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '2',
                'item_num' => 7,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A212-08',
                'description' =>
                    'Incorporate water cycles change from CC & CV into trans-boundary water basin planning',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '2',
                'item_num' => 8,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M212-01',
                'description' =>
                    'Administration, sector studies, surveys, assessments, information systems and capacity building for energy and water use efficiency in water, sanitation and flood protection',
                'response_type' => 'M',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '2',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A213-01',
                'description' =>
                    'Training for community-based water associations to manage water supply infrastructures',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A213-02',
                'description' =>
                    'Conduct Integrated Water Resource Management and CC adaptation and disaster risk reduction training for vulnerable communities',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '3',
                'item_num' => 2,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A213-03',
                'description' =>
                    'Develop gendered and accessible knowledge products and IEC materials that include local and indigenous knowledge on water resources management, CC impacts on water resources and adaptation best practices',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '3',
                'item_num' => 3,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A213-04',
                'description' =>
                    'Develop and network government database on water resources and users',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '3',
                'item_num' => 4,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'M213-01',
                'description' =>
                    'Train managers or workers to improve water or energy efficiency in business operations',
                'response_type' => 'M',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A214-01',
                'description' =>
                    'Incorporate climate change and climate variability in water supply infrastructure / Rehabilitate water infrastructure with climate lens (use of climate projections and other relevant climate data)',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A214-02',
                'description' =>
                    'Construct new and expand existing water supply infrastructures for waterless communities',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A214-03',
                'description' =>
                    'Treatment of wastewater for conservation/re-use purposes to respond to declines in water availability due to climate change and climate variability',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '4',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A214-04',
                'description' =>
                    'Incorporate changes in design of sanitation systems, wastewater treatment and disposal system in response to extreme weather and flood events arising from climate change and climate variability',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '4',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A214-05',
                'description' =>
                    'Implement/install water harvesting technologies (e.g. small water impounding project)',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '4',
                'item_num' => 5,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'M214-01',
                'description' =>
                    'Reduce energy intensity of existing water supply systems (e.g. replacing pumps)',
                'response_type' => 'M',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M214-02',
                'description' =>
                    'Reduce or capture methane emission from ventilated improved pit latrines.',
                'response_type' => 'M',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M214-03',
                'description' =>
                    'Reduce per capita water consumption using demand-side interventions (e.g. household water, shower, toilet, and dishwasher)',
                'response_type' => 'M',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '4',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M214-04',
                'description' =>
                    'Reduce GHG emission (methane and nitrous oxide) from wastewater',
                'response_type' => 'M',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '4',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M214-05',
                'description' =>
                    'Reduce energy consumption during wastewater treatment (e.g. from activated sludge to up flow anaerobic sludge)',
                'response_type' => 'M',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 3,
                'category_code' => '4',
                'item_num' => 5,
                'is_nccap_activity' => false,
            ],

            // --- Sub-Sector 4: Flood Protection (ID: 4) ---
            [
                'code' => 'A221-01',
                'description' =>
                    'Formulate and implement ordinances and policies for rain water collection, such small water impoundments, retarding basins, mini dams to address water shortage and flooding',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 4,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A221-02',
                'description' =>
                    'Design guidelines, emergency protocols, and encourage preparedness and risk/contingency planning in communities that are at risk to present or future flooding',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 4,
                'category_code' => '1',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A222-01',
                'description' =>
                    'Conduct vulnerability assessments in communities, LGUs, and sectors that are at risk to present or future flooding',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 4,
                'category_code' => '2',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A222-02',
                'description' =>
                    'Improve hydromet infrastructure and monitoring systems for data collection and management and the development and delivery of information, products and services to increase flood resilience',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 4,
                'category_code' => '2',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A222-03',
                'description' =>
                    'Develop innovative technologies and methodologies to communicating flood emergency information and longer-term risks of flooding to relevant populations and communities',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 4,
                'category_code' => '2',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A223-01',
                'description' =>
                    'Build local capacity for the management of climate change and extreme flood risks, and increase capacity in conducting vulnerability assessments',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 4,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A223-02',
                'description' =>
                    'Increase knowledge to consider climate change information and climate risk in water resources management',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 4,
                'category_code' => '3',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A224-01',
                'description' =>
                    'Incorporate climate change and climate variability in design standards for flood control and drainage systems',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 4,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A224-02',
                'description' =>
                    'Improve resilience of infrastructure (bridges, water supply, community infrastructure, water storage, coastal defense, etc) to account for climate change and climate variability related extreme weather and climate variability that could increase flood risks in infrastructure',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 4,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A224-03',
                'description' =>
                    'Protect or re-establish mangrove forests, wetlands, and other ecosystems as protection against floods risks',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 4,
                'category_code' => '4',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A224-05',
                'description' =>
                    'Improve early warning information and alert systems to increase readiness to extreme flood risks',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 4,
                'category_code' => '4',
                'item_num' => 5,
                'is_nccap_activity' => false,
            ],

            // --- Sub-Sector 5: Water and Sanitation (ID: 5) ---
            [
                'code' => 'A231-01',
                'description' =>
                    'Design guidance for incorporating climate change risk into water sanitation and treatment planning, operation, and management (including accounting for increased construction and maintenance costs that account for climate risk)',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 5,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A231-03',
                'description' =>
                    'Incorporate risk of sea level rise, storm surge, and saltwater intrusion on the design and upgrades of coastal water sanitation infrastructure',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 5,
                'category_code' => '1',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A232-01',
                'description' =>
                    'Study and adopt centralized wastewater treatment systems to improve quality in highly urbanized and densely populated areas with respect to increased flooding, storm surge, and extreme precipitation events',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 5,
                'category_code' => '2',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A232-02',
                'description' =>
                    'Conduct vulnerability assessments for the sanitation and treatment of water supply',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 5,
                'category_code' => '2',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A233-01',
                'description' =>
                    'Increase local knowledge for how to consider climate change information and climate risk in water quality and wastewater treatment',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 5,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A234-01',
                'description' =>
                    'Expand the establishment of alternative micro-water purification systems especially to areas that cannot be reached by safe water supply',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 5,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A234-02',
                'description' =>
                    'Monitor impact of climate change and climate variability as part of water resource management',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 5,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A234-03',
                'description' =>
                    'Incorporate changes in design of sanitation systems, wastewater treatment and disposal system in response to extreme weather and flood events arising from climate change and climate variability',
                'response_type' => 'A',
                'strategic_priority_id' => 2,
                'sub_sector_id' => 5,
                'category_code' => '4',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],

            // =========================================================================
            // STRATEGIC PRIORITY 3: ECOLOGICAL & ENVIRONMENTAL STABILITY
            // =========================================================================

            // --- Sub-Sector 6: Forest and Biodiversity (ID: 6) ---
            [
                'code' => 'A311-01',
                'description' =>
                    'Design and implement payments for environmental services and other innovative conservation financing mechanisms to support ecosystem-based adaptation and mitigation',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A311-03',
                'description' =>
                    'Integrated ecosystem management approaches for watersheds and wetlands to reduce vulnerability to climate change and climate variability',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '1',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A311-05',
                'description' =>
                    'Develop guidelines for implementing Integrated Water Resources Management (IWRM) and climate change adaptation at the local, watershed and river basin level',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '1',
                'item_num' => 5,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A311-06',
                'description' =>
                    'Formulate ordinances/policies to reduce the human-related impacts to coral reefs to help lessen the reefs\' vulnerability to climate change',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '1',
                'item_num' => 6,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M311-01',
                'description' =>
                    'Implement and monitor progress of Reducing Emissions from Deforestation and Forest Degradation (REDD+) related policies',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A312-01',
                'description' =>
                    'Conduct ecosystems vulnerability and risk assessment',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '2',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A312-02',
                'description' =>
                    'Study, design and implement financing mechanisms for IWRM and climate change adaptation implementation in critical watersheds and river basins',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '2',
                'item_num' => 2,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'M312-01',
                'description' => 'Greenhouse gas accounting and inventory',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '2',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A313-01',
                'description' =>
                    'Training on vulnerability and risk assessments',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A313-03',
                'description' =>
                    'Establish management information system for different ecosystems that link various data sources',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '3',
                'item_num' => 3,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A313-04',
                'description' =>
                    'Document and disseminate best practices, including climate change responsive indigenous practices',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '3',
                'item_num' => 4,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A313-05',
                'description' =>
                    'Festivals and events which advocate the protection and preservation of nature',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '3',
                'item_num' => 5,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A314-01',
                'description' =>
                    'Delineate/Rehabilitate/Reforest degraded watersheds and forest areas',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A314-02',
                'description' =>
                    'Conserve and protect existing watershed and protected areas',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A314-03',
                'description' =>
                    'Delineate "ridge-to-reef" ecosystem-based management zones for the ecotowns through multi-stakeholder process',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '4',
                'item_num' => 3,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A314-04',
                'description' =>
                    'Update status of Protected Areas and Key Biodiversity Areas from results from the vulnerability and risk assessment',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '4',
                'item_num' => 4,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A314-06',
                'description' =>
                    'Improve physical system performance of river basins',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '4',
                'item_num' => 6,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A314-07',
                'description' =>
                    'Seedling production; management of mangrove nursery',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '4',
                'item_num' => 7,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A314-08',
                'description' =>
                    'Agro-forestry to diversify farmers\' incomes and provide alternative livelihood during extreme weather events (i.e. drought)',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '4',
                'item_num' => 8,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A314-09',
                'description' =>
                    'Integrated tree planting along riverbanks/ river bank rehabilitation / that reduce the risk of flooding',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '4',
                'item_num' => 9,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A314-10',
                'description' =>
                    'Establishment of database network on wildlife, genetic biodiversity and biosafety',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '4',
                'item_num' => 10,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M314-01',
                'description' =>
                    'Re-forestation and afforestation that increases vegetative cover or sequesters carbon',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M314-02',
                'description' =>
                    'Sustainable peat land/ wetland/forest management and protection',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M314-03',
                'description' =>
                    'Avoided deforestation (e.g. Bantay Gubat, Bantay Bakawan)',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '4',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M314-04',
                'description' =>
                    'Management and protection of Tree Parks/Provincial Forests and Nursery',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '4',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M314-05',
                'description' => 'Oplan Sagip Kalikasan/Urban greening program',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '4',
                'item_num' => 5,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M314-06',
                'description' =>
                    'Identify and implement a moratorium of mining operations in protected areas pending vulnerability and risk assessment and economic valuation studies',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '4',
                'item_num' => 6,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'M314-07',
                'description' =>
                    'Re-establish and protect mangroves, floodplains and seagrass beds with carbon sequestration properties',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '4',
                'item_num' => 7,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M314-08',
                'description' =>
                    'Green charcoal briquetting facility that reduce deforestation',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '4',
                'item_num' => 8,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M314-09',
                'description' =>
                    'Monitor illegal mining activities that emit greenhouse gasses',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 6,
                'category_code' => '4',
                'item_num' => 9,
                'is_nccap_activity' => false,
            ],

            // --- Sub-Sector 7: Solid Waste (ID: 7) ---
            [
                'code' => 'A321-01',
                'description' =>
                    'Incorporate change in design of solid waste management systems in response to extreme weather and flood events arising from CC&CV',
                'response_type' => 'A',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 7,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M321-01',
                'description' =>
                    'Develop and implement ordinances and policies that promote a system of incentives for the use of reusable bags and containers/ban or impose a fee on the use of plastic bags',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 7,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'M322-01',
                'description' =>
                    'Conduct Waste Amount & Composition Study (WACS)',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 7,
                'category_code' => '2',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M323-01',
                'description' =>
                    'Conduct intensive IEC on waste reduction, segregation and composting',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 7,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M324-01',
                'description' =>
                    'Waste reduction and diversion program/Intensify waste segregation at source, discard recovery, composting and recycling',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 7,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'M324-02',
                'description' =>
                    'Construction and operation of Materials Composting and Recovery Facility (MRCF) Building; Buyback Center; Purchase of MCRF equipment',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 7,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M324-03',
                'description' =>
                    'Upgrade existing landfills to capture methane for energy generation or gas flaring for CO2 generation',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 7,
                'category_code' => '4',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M324-04',
                'description' =>
                    'Establish and implement ecological solid waste management (ESWM) program in accordance with Republic Act 9003',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 7,
                'category_code' => '4',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M324-05',
                'description' =>
                    'Close solid waste management sites in environmentally critical areas',
                'response_type' => 'M',
                'strategic_priority_id' => 3,
                'sub_sector_id' => 7,
                'category_code' => '4',
                'item_num' => 5,
                'is_nccap_activity' => false,
            ],

            // =========================================================================
            // STRATEGIC PRIORITY 4: HUMAN SECURITY
            // =========================================================================

            // --- Sub-Sector 8: Health (ID: 8) ---
            [
                'code' => 'A411-01',
                'description' =>
                    'Develop guidelines on treatment of health issues due to climate change and climate variability',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A411-02',
                'description' =>
                    'Include climate related diseases in basic benefits of insurance policies',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '1',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A411-03',
                'description' =>
                    'Develop policy requiring integration of climate change and disaster risk reduction concepts and approaches in medical and allied training courses',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '1',
                'item_num' => 3,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A411-04',
                'description' =>
                    'Develop and implement monitoring health infrastructure damage and rehabilitation plan',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '1',
                'item_num' => 4,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A411-05',
                'description' =>
                    'Develop and implement post disaster epidemic outbreak management and disease surveillance system (ex. waterborne diseases and other health risks due to climate change)',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '1',
                'item_num' => 5,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A411-06',
                'description' =>
                    'Planning for Climate Change Adaptation for health sector',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '1',
                'item_num' => 6,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A411-07',
                'description' =>
                    'Expand insurance eligibility to populations vulnerable to climate related diseases',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '1',
                'item_num' => 7,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A412-01',
                'description' =>
                    'Assess changes in risk, exposure or sensitivity to climate change and climate variability related diseases for vulnerable groups',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '2',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A412-02',
                'description' =>
                    'Assess impact of climate change and climate variability on livelihoods and poverty with focus on vulnerable groups',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '2',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A412-03',
                'description' =>
                    'Vulnerability and risk assessment for government infrastructure (e.g. hospitals, health centers, and barangay health units)',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '2',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A412-04',
                'description' => 'Risk Assessment for barangays',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '2',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A413-01',
                'description' =>
                    'Training and education of health personnel on treatment, monitoring and surveillance of climate change and climate variability related health issues',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A413-02',
                'description' =>
                    'Strengthen health management information management',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '3',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A413-03',
                'description' =>
                    'Incorporate climate related health risks into clinical practice guidelines, and curricula for continuous medical education',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '3',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A413-04',
                'description' =>
                    'Training for health emergency preparedness and response',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '3',
                'item_num' => 4,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A414-01',
                'description' =>
                    'Develop and implement program for community-based adaptation measures and health emergency preparedness',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A414-02',
                'description' =>
                    'Upgrade health systems to respond to changes in environmental health risks from climate change and climate variability (e.g. malaria)',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A414-03',
                'description' =>
                    'Develop food safety/ food security measures that take account of new conditions caused by climate change',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '4',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A414-04',
                'description' =>
                    'Development of livelihood diversification strategies to reduce dependence of climate related income opportunities',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '4',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A414-05',
                'description' =>
                    'Implement program for community health emergency preparedness and response',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '4',
                'item_num' => 5,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A414-06',
                'description' =>
                    'Development of social protection strategies to respond to climate change and climate variability',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 8,
                'category_code' => '4',
                'item_num' => 6,
                'is_nccap_activity' => false,
            ],

            // --- Sub-Sector 9: Settlements and Local Land Use (ID: 9) ---
            [
                'code' => 'A421-01',
                'description' =>
                    'Mainstreaming of CC-DRRM in local plans (PDPFP, CLUP, CDP, ELA)',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A421-02',
                'description' =>
                    'Incorporate vulnerability to CC and CV in housing design standards',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '1',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A421-03',
                'description' =>
                    'Develop green building ordinance/rating scheme, specifications and criteria',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '1',
                'item_num' => 3,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A421-04',
                'description' =>
                    'Develop and implement programs and incentive system for CC proofing and retrofitting water infrastructure at the household/community level',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '1',
                'item_num' => 4,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A421-05',
                'description' =>
                    'Regulate settlements in areas vulnerable to CC & CV',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '1',
                'item_num' => 5,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A422-01',
                'description' =>
                    'Identify, map and profile areas and communities highly prone to climate-related disasters',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '2',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A422-02',
                'description' => 'Conduct risk and vulnerability assessment',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '2',
                'item_num' => 2,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A422-03',
                'description' =>
                    'Conduct a study on population carrying capacity of areas and CC adaptive capacity of various communities',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '2',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A422-04',
                'description' =>
                    'Identify most CC vulnerable sectors and population',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '2',
                'item_num' => 4,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A422-05',
                'description' => 'Conduct of CBMS with DRRM/CCA',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '2',
                'item_num' => 5,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A423-01',
                'description' =>
                    'Develop and implement knowledge management on climate change and disaster risks for local government units and communities',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A423-02',
                'description' =>
                    'Increase local capacity for forecasting, early warning (including indigenous systems) and disaster risk communication',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '3',
                'item_num' => 2,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A423-03',
                'description' =>
                    'Conduct training of trainers to respond to the needs of communities for CCA',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '3',
                'item_num' => 3,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A424-01',
                'description' =>
                    'Identify and implement gender-responsive sustainable livelihood and social protection programs for resettled and vulnerable poor families',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A424-02',
                'description' =>
                    'Develop and implement post-disaster resettlement and counseling of displaced families and communities',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A424-03',
                'description' =>
                    'Implement mixed-use, medium-to-high density developments, integrated land use-transport plan in developing new urban communities or in expanding existing ones',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '4',
                'item_num' => 3,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A424-04',
                'description' =>
                    'Expand the establishment of alternative micro-water purification systems especially to areas that cannot be reached by safe water supply',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '4',
                'item_num' => 4,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A424-05',
                'description' =>
                    'Develop and implement a CC adaptation plan for settlement/resettlement in consultation with affected communities, private sector, and civil society organization',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '4',
                'item_num' => 5,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A424-06',
                'description' =>
                    'Construct new low-cost housing, relocation, and other mass dwellings to climate resilient design standards',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '4',
                'item_num' => 6,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A424-07',
                'description' =>
                    'Reconstruction of housing projects damaged by calamities (Building Back Better)',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '4',
                'item_num' => 7,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A424-08',
                'description' =>
                    'Relocating flood prone communities and commercial centers to safer areas',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '4',
                'item_num' => 8,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A424-09',
                'description' => 'Disaster and Climate Risk Monitoring System',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '4',
                'item_num' => 9,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A424-11',
                'description' =>
                    'Construction of climate resilient elementary and secondary school buildings (safe from climate hazards; considers climate risks)',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '4',
                'item_num' => 11,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A424-12',
                'description' =>
                    'Climate proofing/retrofitting or relocating of government infrastructure (i.e. schools and government hospitals, health centers, rural health units, teen centers) from climate hazards',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '4',
                'item_num' => 12,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A424-13',
                'description' =>
                    'Demolition of illegal structures occupied by informal settlers in high risk areas/ Relocation of informal settlers',
                'response_type' => 'A',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '4',
                'item_num' => 13,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M424-01',
                'description' =>
                    'Retrofit/ Install new heating and cooling systems using renewable energy',
                'response_type' => 'M',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M424-02',
                'description' => 'Promote/Build energy efficient housing',
                'response_type' => 'M',
                'strategic_priority_id' => 4,
                'sub_sector_id' => 9,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],

            // =========================================================================
            // STRATEGIC PRIORITY 5: CLIMATE SMART INDUSTRIES AND SERVICES
            // =========================================================================

            // --- Sub-Sector 10: Tourism, Trade and Industries (ID: 10) ---
            [
                'code' => 'A511-02',
                'description' =>
                    'Incorporate new CC&CV resilient design standards in new buildings',
                'response_type' => 'A',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '1',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A511-04',
                'description' =>
                    'Formulate/enhance tourism plans, policies and strategies to promote green tourism',
                'response_type' => 'A',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '1',
                'item_num' => 4,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A511-05',
                'description' =>
                    'Create an enabling ordinance/policy for the development and implementation of climate-smart industries and services',
                'response_type' => 'A',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '1',
                'item_num' => 5,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A511-06',
                'description' =>
                    'Introduce regulations and programs to support climate resilient investments',
                'response_type' => 'A',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '1',
                'item_num' => 6,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M511-01',
                'description' =>
                    'Introduce rules and regulations to reduce GHG emissions or absorb of GHGs in industry and trade',
                'response_type' => 'M',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M511-03',
                'description' =>
                    'Introduce a system of incentives to encourage the use of climate-smart technologies and practices',
                'response_type' => 'M',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '1',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M511-04',
                'description' =>
                    'Integrate monitoring of existing and new climate smart industries and services within existing business registration system',
                'response_type' => 'M',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '1',
                'item_num' => 4,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'M511-05',
                'description' =>
                    'Implement a system of collection, analysis and reporting of baseline and new data on green jobs and employment',
                'response_type' => 'M',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '1',
                'item_num' => 5,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A512-01',
                'description' =>
                    'Identify the carrying capacity of tourism areas',
                'response_type' => 'A',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '2',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A512-02',
                'description' =>
                    'Aquasilviculture Demo Farm to rehabilitate mangroves and address climate change and provide livelihood',
                'response_type' => 'A',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '2',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M512-01',
                'description' =>
                    'Conduct baseline inventory of climate-smart industries and services and good practices in the local government unit',
                'response_type' => 'M',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '2',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'M512-02',
                'description' =>
                    'Baseline data on GHG emissions from industry and other sources',
                'response_type' => 'M',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '2',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M512-04',
                'description' =>
                    'Forge partnerships with industry, academe, and research organizations on R&D of climate-smart technologies and products in the locality',
                'response_type' => 'M',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '2',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A513-01',
                'description' =>
                    'Promote public-private partnership to increase investments in the development of climate-smart technologies, products and services',
                'response_type' => 'A',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A513-07',
                'description' =>
                    'Assist SMEs in developing capacity for eco-efficient production',
                'response_type' => 'A',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '3',
                'item_num' => 7,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'M513-01',
                'description' =>
                    'Develop modules and conduct trainings to capacitate industries to conduct GHG emissions inventory and carbon footprint',
                'response_type' => 'M',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A514-01',
                'description' =>
                    'Marketing and trade support for changing agricultural product mix in response to climate change and climate variability',
                'response_type' => 'A',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A514-02',
                'description' =>
                    'Support new income generating opportunities and industries utilizing natural resource better adapted to climate change and climate variability',
                'response_type' => 'A',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A514-03',
                'description' =>
                    'Retrofit assets and capital to protect against CC and CV',
                'response_type' => 'A',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '4',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A514-04',
                'description' =>
                    'Support industries that are better adapted to CC and CV (e.g. Tiger-grass production for agri-business)',
                'response_type' => 'A',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '4',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M514-01',
                'description' =>
                    'Marketing and trade support for products that reduce GHG emissions per unit of output',
                'response_type' => 'M',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M514-02',
                'description' =>
                    'Marketing and trade support for agricultural products that use integrated organic and inorganic nutrient management',
                'response_type' => 'M',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M514-03',
                'description' => 'Rehabilitate/reforest degraded tourism areas',
                'response_type' => 'M',
                'strategic_priority_id' => 5,
                'sub_sector_id' => 10,
                'category_code' => '4',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],

            // =========================================================================
            // STRATEGIC PRIORITY 6: SUSTAINABLE ENERGY
            // =========================================================================

            // --- Sub-Sector 11: Energy Efficiency (ID: 11) ---
            [
                'code' => 'A611-04',
                'description' =>
                    'Mandatory implementation of AO110 and AO126 directing the institutionalization of Government Energy Management Program',
                'response_type' => 'A',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 11,
                'category_code' => '1',
                'item_num' => 4,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'M611-01',
                'description' =>
                    'Change operational procedures or techniques, or retrofit technologies to reduce GHG emissions/ energy efficiency in existing operations',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 11,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M611-03',
                'description' =>
                    'Develop/implement ordinances and policies to improve energy efficiency - in buildings, agriculture, industry and city/municipal services (e.g. public building maintenance program to improve energy efficiency; use of more energy efficient street lighting such as LED).',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 11,
                'category_code' => '1',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M611-04',
                'description' =>
                    'Develop a certification system/incentives for voluntary adoption of energy efficiency labelling, green building rating, and ISO 50001 certification',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 11,
                'category_code' => '1',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M611-05',
                'description' => 'Develop a local renewable energy program',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 11,
                'category_code' => '1',
                'item_num' => 5,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A612-01',
                'description' =>
                    'Conduct sustainable and renewable energy resource assessments (e.g. hydro, geothermal, biomass, wind, ocean and solar)',
                'response_type' => 'A',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 11,
                'category_code' => '2',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'M612-02',
                'description' =>
                    'Sector studies, surveys, assessments and information systems on energy efficiency, efficient energy pricing, and promotion of renewable energy',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 11,
                'category_code' => '2',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A613-02',
                'description' =>
                    'Conduct capacity building of community-based renewable energy organizations on system maintenance, energy efficiency and conservation, organizational development, tariff setting and management systems',
                'response_type' => 'A',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 11,
                'category_code' => '3',
                'item_num' => 2,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'M613-01',
                'description' =>
                    'Sector reform and capacity building related to energy efficiency in energy sector, promotion of renewable energy and efficient energy pricing',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 11,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M613-02',
                'description' =>
                    'Strengthen regulatory and institutional framework to support expansion of renewable power generation',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 11,
                'category_code' => '3',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M613-03',
                'description' =>
                    'Strengthen capacity of institutions to plan for low-carbon growth and environmentally sustainable energy supply',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 11,
                'category_code' => '3',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A614-01',
                'description' =>
                    'Design and implement system of incentives for renewable energy for host communities and local government units that can be used for sustainable livelihood programs and climate change adaptation measures',
                'response_type' => 'A',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 11,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'M614-02',
                'description' =>
                    'Pilot programs on energy efficiency activities',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 11,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],

            // --- Sub-Sector 12: Power Generation (ID: 12) ---
            [
                'code' => 'M621-04',
                'description' =>
                    'Develop RE project-based and service contracts-based portfolios to encourage potential investors in identified sites',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 12,
                'category_code' => '1',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M622-02',
                'description' =>
                    'Conduct survey of RE potential in off-grid areas',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 12,
                'category_code' => '2',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M623-01',
                'description' =>
                    'Conduct capacity building of community-based RE organizations on RE system maintenance, EE&C organizational development, tariff setting and management systems',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 12,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A624-02',
                'description' =>
                    'Flood protection or irrigation from construction of dams or water storage system that manage changes in the water cycle due to CC & CV',
                'response_type' => 'A',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 12,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A624-03',
                'description' =>
                    'Improve design of wind turbine structures to withstand higher wind speeds as a result of extreme weather events',
                'response_type' => 'A',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 12,
                'category_code' => '4',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A624-04',
                'description' =>
                    'Improve design of solar panels to withstand higher intensity storms resulting from climate change and climate variability',
                'response_type' => 'A',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 12,
                'category_code' => '4',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A624-05',
                'description' =>
                    'Secure access to water for crops used as bioenergy source',
                'response_type' => 'A',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 12,
                'category_code' => '4',
                'item_num' => 5,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M624-06',
                'description' =>
                    'Development of renewable energy ( i.e. Establishment of Solar Panels/Installation of Wind Mill/Bio-Gas)',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 12,
                'category_code' => '4',
                'item_num' => 6,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M624-07',
                'description' =>
                    'Clean Cities Initiatives or those that promote/increase utilization of alternative/clean fuels for the transport sector (tricycle, jeepney, bus, private and government vehicles)',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 12,
                'category_code' => '4',
                'item_num' => 7,
                'is_nccap_activity' => false,
            ],

            // --- Sub-Sector 13: Transportation and Communication (ID: 13) ---
            [
                'code' => 'A631-01',
                'description' =>
                    'Incorporate risks from climate change and climate variability in transportation system planning',
                'response_type' => 'A',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 13,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M631-01',
                'description' => 'Improve vehicle emission standards',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 13,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M631-02',
                'description' => 'Improve fuel efficiency standards',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 13,
                'category_code' => '1',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M631-03',
                'description' =>
                    'Strengthen vehicle inspection systems on emissions and fuel efficiency',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 13,
                'category_code' => '1',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M631-04',
                'description' =>
                    'Develop ordinances/policies to encourage shift from higher carbon to lower carbon transport modes (i.e. pedestrianization, bicycle lanes, public transport)',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 13,
                'category_code' => '1',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M633-01',
                'description' =>
                    'Capacity building related to energy efficiency in the transport sector',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 13,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A634-01',
                'description' =>
                    'Protect transport infrastructure against extreme weather events (especially floods and storms) becoming more frequent and violent due to CC and CV',
                'response_type' => 'A',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 13,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A634-02',
                'description' =>
                    'Establish emergency services designed to cope with climate change and climate variability related emergencies in the transport sector',
                'response_type' => 'A',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 13,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A634-03',
                'description' =>
                    'Construct new roads, ports, airports and aviation infrastructure to climate resilient design standards',
                'response_type' => 'A',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 13,
                'category_code' => '4',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A634-04',
                'description' =>
                    'Upgrade existing roads, ports and aviation infrastructure to climate resilient design standards',
                'response_type' => 'A',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 13,
                'category_code' => '4',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A634-05',
                'description' =>
                    'Development of telecommunications infrastructure for use as part of an emergency response system during extreme weather events',
                'response_type' => 'A',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 13,
                'category_code' => '4',
                'item_num' => 5,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A634-06',
                'description' =>
                    'Enhance road maintenance to respond to climate change and climate variability',
                'response_type' => 'A',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 13,
                'category_code' => '4',
                'item_num' => 6,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A634-07',
                'description' =>
                    'Enhanced waterway maintenance to respond to climate change and climate variability',
                'response_type' => 'A',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 13,
                'category_code' => '4',
                'item_num' => 7,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M634-01',
                'description' =>
                    'Urban traffic management (e.g. improve traffic flow) to reduce GHG emissions per unit transported',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 13,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M634-02',
                'description' =>
                    'Improved waterways, port and aviation facilities to reduce the carbon intensity per unit transported',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 13,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M634-03',
                'description' =>
                    'New railway lines for electricity based railcars',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 13,
                'category_code' => '4',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M634-05',
                'description' =>
                    'Improve energy efficiency in telecommunications information technologies',
                'response_type' => 'M',
                'strategic_priority_id' => 6,
                'sub_sector_id' => 13,
                'category_code' => '4',
                'item_num' => 5,
                'is_nccap_activity' => false,
            ],

            // =========================================================================
            // STRATEGIC PRIORITY 7: KNOWLEDGE AND CAPACITY DEVELOPMENT
            // =========================================================================

            // --- Sub-Sector 14: Education and Climate Science (ID: 14) ---
            [
                'code' => 'A711-04',
                'description' =>
                    'Creation of offices with a mandate for climate change adaptation and mitigation',
                'response_type' => 'A',
                'strategic_priority_id' => 7,
                'sub_sector_id' => 14,
                'category_code' => '1',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A713-01',
                'description' =>
                    'Awareness raising programs on climate change and climate variability',
                'response_type' => 'A',
                'strategic_priority_id' => 7,
                'sub_sector_id' => 14,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A713-02',
                'description' =>
                    'Training for pre-elementary, elementary, high school and college teachers on integrating climate change in basic courses',
                'response_type' => 'A',
                'strategic_priority_id' => 7,
                'sub_sector_id' => 14,
                'category_code' => '3',
                'item_num' => 2,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A713-03',
                'description' =>
                    'Upgrade personnel\'s capacity and skills on climate change modeling and weather forecasting',
                'response_type' => 'A',
                'strategic_priority_id' => 7,
                'sub_sector_id' => 14,
                'category_code' => '3',
                'item_num' => 3,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A713-04',
                'description' =>
                    'Capacity building to address vulnerability to climate change and climate variability',
                'response_type' => 'A',
                'strategic_priority_id' => 7,
                'sub_sector_id' => 14,
                'category_code' => '3',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A713-05',
                'description' =>
                    'Climate Change 101 or Introductory Course on Climate Change',
                'response_type' => 'A',
                'strategic_priority_id' => 7,
                'sub_sector_id' => 14,
                'category_code' => '3',
                'item_num' => 5,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A713-06',
                'description' =>
                    'Support to international campaigns that promote climate change adaptation and mitigation (e.g. Earth month)',
                'response_type' => 'A',
                'strategic_priority_id' => 7,
                'sub_sector_id' => 14,
                'category_code' => '3',
                'item_num' => 6,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A714-01',
                'description' =>
                    'Review and development of curricula to take account of climate aspects in basic education, vocational training and other forms of follow-up training and education',
                'response_type' => 'A',
                'strategic_priority_id' => 7,
                'sub_sector_id' => 14,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A714-02',
                'description' =>
                    'Review and revise, current textbooks, modules and exemplars for pre-elementary, elementary, for climate change content and gender-sensitivity',
                'response_type' => 'A',
                'strategic_priority_id' => 7,
                'sub_sector_id' => 14,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A714-03',
                'description' =>
                    'Review and revise, current textbooks, modules and exemplars for high school and alternative learning system for climate change content and gender-sensitivity',
                'response_type' => 'A',
                'strategic_priority_id' => 7,
                'sub_sector_id' => 14,
                'category_code' => '4',
                'item_num' => 3,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A714-05',
                'description' =>
                    'Improve government systems and infrastructure required for climate change modeling and climate forecasting',
                'response_type' => 'A',
                'strategic_priority_id' => 7,
                'sub_sector_id' => 14,
                'category_code' => '4',
                'item_num' => 5,
                'is_nccap_activity' => true,
            ],
            [
                'code' => 'A714-06',
                'description' =>
                    'Establish centers on climate change adaptation/mitigation and best practices and innovations (e.g. Climate Change Academy)',
                'response_type' => 'A',
                'strategic_priority_id' => 7,
                'sub_sector_id' => 14,
                'category_code' => '4',
                'item_num' => 6,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M714-01',
                'description' =>
                    'Development of curricula or programs focused on reducing GHG emissions, energy consumption or water consumption for elementary and high school',
                'response_type' => 'M',
                'strategic_priority_id' => 7,
                'sub_sector_id' => 14,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],

            // =========================================================================
            // STRATEGIC PRIORITY 8: FINANCE
            // =========================================================================

            // --- Sub-Sector 15: Finance (ID: 15) ---
            [
                'code' => 'A811-01',
                'description' =>
                    'Introduce ordinances and programs to support climate resilient investments',
                'response_type' => 'A',
                'strategic_priority_id' => 8,
                'sub_sector_id' => null,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A811-02',
                'description' =>
                    'Expand insurance eligibility to populations vulnerable to climate related diseases',
                'response_type' => 'A',
                'strategic_priority_id' => 8,
                'sub_sector_id' => null,
                'category_code' => '1',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A811-03',
                'description' =>
                    'Regulate or provide incentives in housing finance to encourage upgrading of existing real estate that reduces vulnerability to CC and CV',
                'response_type' => 'A',
                'strategic_priority_id' => 8,
                'sub_sector_id' => null,
                'category_code' => '1',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A811-04',
                'description' =>
                    'Develop and introduce weather or climate indexed insurance programs (e.g. crop insurance)',
                'response_type' => 'A',
                'strategic_priority_id' => 8,
                'sub_sector_id' => null,
                'category_code' => '1',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M811-01',
                'description' =>
                    'Introduce ordinances, programs or financial instruments to support GHG reducing activities',
                'response_type' => 'M',
                'strategic_priority_id' => 8,
                'sub_sector_id' => null,
                'category_code' => '1',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M811-02',
                'description' =>
                    'Strengthen institution and policies to mobilize carbon finance',
                'response_type' => 'M',
                'strategic_priority_id' => 8,
                'sub_sector_id' => null,
                'category_code' => '1',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M811-03',
                'description' =>
                    'Prepare for carbon markets or implement carbon finance market transactions',
                'response_type' => 'M',
                'strategic_priority_id' => 8,
                'sub_sector_id' => null,
                'category_code' => '1',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M811-04',
                'description' =>
                    'Develop ordinances or provide incentives in housing finance to support energy saving designs and standards',
                'response_type' => 'M',
                'strategic_priority_id' => 8,
                'sub_sector_id' => null,
                'category_code' => '1',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A812-04',
                'description' =>
                    'Economic analysis of financial needs for adapting to climate change and climate variability (cost of adaptation)',
                'response_type' => 'A',
                'strategic_priority_id' => 8,
                'sub_sector_id' => null,
                'category_code' => '2',
                'item_num' => 4,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M812-03',
                'description' =>
                    'Reduce fossil-fuel consumption through taxes, levies or fees on energy or transport services',
                'response_type' => 'M',
                'strategic_priority_id' => 8,
                'sub_sector_id' => null,
                'category_code' => '2',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M813-01',
                'description' =>
                    'Strengthen LGUs in developing policies to mobilize carbon finance',
                'response_type' => 'M',
                'strategic_priority_id' => 8,
                'sub_sector_id' => null,
                'category_code' => '3',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'A814-02',
                'description' =>
                    'Introduce green bonds or other securities specifically targeted at adaptation to climate change and climate variability',
                'response_type' => 'A',
                'strategic_priority_id' => 8,
                'sub_sector_id' => null,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M814-01',
                'description' =>
                    'Provide lines of credit for investments in reduction of GHG emissions and/or absorption of GHGs',
                'response_type' => 'M',
                'strategic_priority_id' => 8,
                'sub_sector_id' => null,
                'category_code' => '4',
                'item_num' => 1,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M814-02',
                'description' => 'Support to access carbon markets',
                'response_type' => 'M',
                'strategic_priority_id' => 8,
                'sub_sector_id' => null,
                'category_code' => '4',
                'item_num' => 2,
                'is_nccap_activity' => false,
            ],
            [
                'code' => 'M814-03',
                'description' =>
                    'Introduce green bonds or other securities specifically targeted at reducing GHG emission or sequestering GHGs',
                'response_type' => 'M',
                'strategic_priority_id' => 8,
                'sub_sector_id' => null,
                'category_code' => '4',
                'item_num' => 3,
                'is_nccap_activity' => false,
            ],
        ];

        foreach ($typologies as $typology) {
            CcTypology::create($typology);
        }
    }
}
