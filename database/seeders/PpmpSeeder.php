<?php

namespace Database\Seeders;

use App\Models\AipEntry;
use App\Models\FundingSource;
use App\Models\Ppmp;
use App\Models\PpmpPriceList;
use Illuminate\Database\Seeder;

class PpmpSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get required data
        $aipEntry = AipEntry::find(1);
        $fundingSourceItem = FundingSource::first();
        $priceListItems = PpmpPriceList::limit(10)->get();

        if (! $aipEntry || $priceListItems->isEmpty()) {
            $this->command->warn(
                'Missing required data for PPMP seeder. Please run AIP Entry and Price List seeders first.',
            );

            return;
        }

        if (! $fundingSourceItem) {
            $fundingSourceItem = FundingSource::create([
                'name' => 'General Fund',
            ]);
        }

        // Create 10 sample PPMP items
        foreach ($priceListItems as $index => $priceListItem) {
            // We still need a target number to distribute, even if we don't save it
            $targetTotalQuantity = ($index + 1) * 10;
            $unitPrice = $priceListItem->price;

            // Distribute quantity across months (evenly)
            $monthlyQty = floor($targetTotalQuantity / 12);
            $remainingQty = $targetTotalQuantity % 12;

            $ppmpData = [
                'aip_entry_id' => $aipEntry->id,
                'ppmp_price_list_id' => $priceListItem->id,
                'funding_source_id' => $fundingSourceItem->id,
                // 'quantity' removed from here
            ];

            // Add monthly distribution
            $months = [
                'jan',
                'feb',
                'mar',
                'apr',
                'may',
                'jun',
                'jul',
                'aug',
                'sep',
                'oct',
                'nov',
                'dec',
            ];

            foreach ($months as $monthIndex => $month) {
                $qtyForMonth =
                    $monthlyQty + ($monthIndex < $remainingQty ? 1 : 0);
                $ppmpData["{$month}_qty"] = $qtyForMonth;
                $ppmpData["{$month}_amount"] = $qtyForMonth * $unitPrice;
            }

            Ppmp::create($ppmpData);
        }

        $this->command->info(
            'PPMP items seeded successfully for AIP entry 1 with 10 price list items!',
        );
    }
}
