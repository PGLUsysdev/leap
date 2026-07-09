import type { ChartOfAccount, Position } from "@/types";

/**
 * Compute the budget-year (proposed) amount for a single position + COA combination,
 * matching the logic used in the PS Breakdown data table.
 */
export function getCellNumericValue(
    pos: Position,
    coa: ChartOfAccount,
    rates: Record<string, number>,
    annualRateMap: Record<number, { current: number; budget: number }>,
): number | null {
    const isRegular = pos.employment_type === "permanent";
    const budgetAnnualRate = annualRateMap[pos.id]?.budget ?? 0;

    switch (coa.account_number) {
        case "5-01-01-010":
            return isRegular ? budgetAnnualRate : null;
        case "5-01-01-020":
            return pos.employment_type === "casual" || pos.employment_type === "contractual"
                ? budgetAnnualRate
                : null;
        case "5-01-02-010":
            return (rates["pera_monthly"] ?? 2000) * 12;
        case "5-01-02-040":
            return Number(rates["clothing_annual"] ?? 5000);
        case "5-01-02-080":
            return Number(rates["pei_max"] ?? 5000);
        case "5-01-02-140":
            return budgetAnnualRate / 12;
        case "5-01-02-150":
            return Number(rates["cash_gift"] ?? 5000);
        case "5-01-02-990":
            return budgetAnnualRate / 12;
        case "5-01-03-010":
            return budgetAnnualRate * ((rates["gsis_percent"] ?? 12) / 100);
        case "5-01-03-020":
            return (rates["pagibig_monthly"] ?? 100) * 12;
        case "5-01-03-030":
            return budgetAnnualRate * ((rates["philhealth_percent"] ?? 2.5) / 100);
        default:
            return null;
    }
}

/**
 * Compute PS COA totals (budget year) across all positions.
 * Returns a map of account_number → total amount.
 */
export function computePsCoaTotals(
    positions: Position[],
    chartOfAccounts: ChartOfAccount[],
    rates: Record<string, number>,
    annualRateMap: Record<number, { current: number; budget: number }>,
): Record<string, number> {
    const totals: Record<string, number> = {};

    for (const coa of chartOfAccounts) {
        if (coa.expense_class !== "PS") continue;

        let total = 0;
        for (const pos of positions) {
            const val = getCellNumericValue(pos, coa, rates, annualRateMap);
            if (val !== null) {
                total += val;
            }
        }
        totals[coa.account_number] = total;
    }

    return totals;
}
