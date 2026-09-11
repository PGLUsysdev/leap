<?php

namespace App\Services;

/**
 * Derive the budget expense class of a chart of accounts row from its
 * UACS code path (e.g. "5-02-03-010" or "5 02 03 010").
 *
 * - 5-01-* Personnel Services (PS)
 * - 5-02-* Maintenance and Other Operating Expenses (MOOE)
 * - 5-03-* Financial Expenses (FE)
 * - 1-07-* Property, Plant and Equipment (Capital Outlay targets)
 *
 * Returns null when the path does not map to a known class so callers
 * leave manually maintained values untouched.
 */
class ChartOfAccountClassifier
{
    /**
     * @return 'PS'|'MOOE'|'FE'|'CO'|null
     */
    public static function fromPath(?string $path): ?string
    {
        if ($path === null || trim($path) === '') {
            return null;
        }

        $normalized = str_replace(' ', '-', trim($path));

        foreach (self::prefixMap() as $prefix => $class) {
            if ($normalized === $prefix || str_starts_with($normalized, $prefix.'-')) {
                return $class;
            }
        }

        return null;
    }

    /**
     * @return array<string, 'PS'|'MOOE'|'FE'|'CO'>
     */
    public static function prefixMap(): array
    {
        return [
            '5-01' => 'PS',
            '5-02' => 'MOOE',
            '5-03' => 'FE',
            '1-07' => 'CO',
        ];
    }
}
