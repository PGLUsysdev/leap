<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\PpmpPriceList;
use App\Models\ChartOfAccount;
use App\Models\PpmpCategory;
use Illuminate\Support\Facades\File;

class PpmpPriceListSeeder extends Seeder
{
    /**
     * Map CSV expense account names to actual ChartOfAccount account_titles.
     * Use this when the CSV name differs from the database title.
     */
    protected $expenseAccountTitleMap = [
        'Representation Expenses' =>
            'Representation Expenses (ex. meals and snacks)',
        'Fuel, Oil, and Lubricants Expenses' =>
            'Fuel, Oil and Lubricants Expenses',
        'Information and Communication Technology Equipment' =>
            'Information and Communication Technology Equip.',
        // Add other mappings here
    ];

    protected $categoryNameMap = [
        'FUEL, OIL AND LUBRICANTS' => 'Fuel, Oil, and Lubricants',
        'POSTAGE & COURIER SERVICES' => 'Postage & Courier Service',
        'Buffet Meals and Snacks (For OPG, OVG, OSP and ADM only)' =>
            'Buffet Meals and Snacks (For OPG, OVG, OSP, and ADM only)',
        // Add other mappings if needed
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Load all postable Chart of Accounts and create a normalized title → ID map
        $accounts = ChartOfAccount::where('is_postable', true)->get();
        $accountMap = [];
        foreach ($accounts as $account) {
            $normalizedTitle = $this->normalizeString($account->account_title);
            $accountMap[$normalizedTitle] = $account->id;
        }

        // 2. Load all PPMP categories and create a normalized name → ID map
        $categories = PpmpCategory::all();
        $categoryMap = $this->createCategoryMap($categories);

        // 3. Path to CSV file (adjust if needed)
        $csvPath = database_path('seeders/data/ppmp_price_lists.csv');

        if (!File::exists($csvPath)) {
            $this->command->error("CSV file not found at: $csvPath");
            return;
        }

        $items = [];
        $itemCounter = 1;
        $rowNumber = 0;
        $currentCategory = null;

        $handle = fopen($csvPath, 'r');
        if ($handle === false) {
            $this->command->error('Unable to open CSV file.');
            return;
        }

        // Read and skip header row
        $header = fgetcsv($handle);
        if ($header === false) {
            $this->command->error('CSV file is empty.');
            fclose($handle);
            return;
        }
        // Remove UTF-8 BOM from first header column if present
        $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', $header[0]);

        // Process each row
        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;
            // Ensure row has at least 5 columns (we need columns 0,2,3,4)
            if (count($row) < 5) {
                $this->command->warn(
                    "Row $rowNumber has insufficient columns, skipping.",
                );
                continue;
            }

            $expenseAccount = trim($row[0]);
            $description = trim($row[2]);
            $unit = trim($row[3]);
            $price = trim($row[4]);

            // Skip empty rows (all columns empty or only spaces)
            if (
                empty($expenseAccount) &&
                empty($description) &&
                empty($unit) &&
                empty($price)
            ) {
                continue;
            }

            // If expense account is empty but description is not, treat as category header
            if (empty($expenseAccount) && !empty($description)) {
                $currentCategory = $description;
                continue;
            }

            $mappedTitle =
                $this->expenseAccountTitleMap[$expenseAccount] ??
                $expenseAccount;

            // Now we have a normal item row (expense account is not empty)
            // Find ChartOfAccount ID by normalized account title
            $normalizedTitle = $this->normalizeString($mappedTitle);
            if (!isset($accountMap[$normalizedTitle])) {
                $this->command->warn(
                    "Row $rowNumber: No ChartOfAccount found for title '$expenseAccount' (mapped to '$mappedTitle'), skipping.",
                );
                continue;
            }
            $chartOfAccountId = $accountMap[$normalizedTitle];

            // Determine category ID from the current category header
            if (empty($currentCategory)) {
                $this->command->warn(
                    "Row $rowNumber: No category header found before this row, skipping.",
                );
                continue;
            }

            $mappedCategory =
                $this->categoryNameMap[$currentCategory] ?? $currentCategory;

            $normalizedCategory = $this->normalizeString($mappedCategory);
            if (!isset($categoryMap[$normalizedCategory])) {
                $this->command->warn(
                    "Row $rowNumber: Category '$currentCategory' not found in PpmpCategory table, skipping.",
                );
                continue;
            }
            $ppmpCategoryId = $categoryMap[$normalizedCategory];

            // Build the item
            $items[] = [
                'item_number' => $itemCounter++,
                'description' => $description,
                'unit_of_measurement' => $unit,
                'price' => (float) $price,
                'ppmp_category_id' => $ppmpCategoryId,
                'chart_of_account_id' => $chartOfAccountId,
            ];
        }

        fclose($handle);

        // Insert all items
        foreach ($items as $item) {
            PpmpPriceList::create($item);
        }

        $this->command->info(
            'Created ' . count($items) . ' PPMP price list items from CSV.',
        );
    }

    /**
     * Create a mapping of category names (lowercase) to their IDs.
     */
    private function createCategoryMap($categories): array
    {
        $map = [];
        foreach ($categories as $category) {
            $map[$this->normalizeString($category->name)] = $category->id;
        }
        return $map;
    }

    /**
     * Normalize a string for case‑insensitive matching.
     * Removes extra spaces, lowercases, and strips punctuation if needed.
     */
    private function normalizeString(string $string): string
    {
        // Trim, lowercase, and replace multiple spaces with a single space
        $normalized = preg_replace('/\s+/', ' ', trim($string));
        return strtolower($normalized);
    }
}
