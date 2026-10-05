import type { ChartOfAccount, Position } from '@/types';

/**
 * Hardcoded per-position PS computation (budget year, proposed).
 *
 * Every PS COA maps to exactly one rule below. COAs with no deterministic
 * rule (subsistence, quarters, overseas, honoraria, longevity, overtime,
 * provident, pension/gratuity/terminal-leave, other personnel benefits)
 * return null and render as "-" until manual inputs exist.
 *
 * Eligibility (uses existing columns only, no new data):
 * - Abolished or unfunded posts compute nothing.
 * - Salaries + salary-derived amounts cover all remaining posts.
 * - Flat person-benefits (PERA, RA/TA, clothing, laundry, PEI, cash gift,
 *   hazard) require an occupied post.
 */
function isBudgeted(pos: Position): boolean {
    if (pos.status === 'abolished') {
        return false;
    }

    if (pos.is_funded === false) {
        return false;
    }

    return true;
}

function isOccupied(pos: Position): boolean {
    return isBudgeted(pos) && pos.status === 'occupied';
}

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
    const budgetAnnualRate = annualRateMap[pos.id]?.budget ?? 0;
    const monthlyRate = budgetAnnualRate / 12;
    const sg = pos.ios?.salary_grade ?? null;

    // Full chart code lives in `path` (e.g. 5-01-01-010);
    // `account_number` holds only the last segment (e.g. 010).
    const code = coa.path ?? coa.account_number;

    switch (code) {
        // 5-01-01-010 — Salaries & Wages - Regular (permanent plantilla)
        case '5-01-01-010':
            return isBudgeted(pos) && pos.employment_type === 'permanent'
                ? budgetAnnualRate
                : null;
        // 5-01-01-020 — Salaries & Wages - Casual/Contractual
        // (hardcoded full annual; daily-rate proration needs days worked)
        case '5-01-01-020':
            return isBudgeted(pos) &&
                (pos.employment_type === 'casual' ||
                    pos.employment_type === 'contractual')
                ? budgetAnnualRate
                : null;
        // 5-01-02-010 — PERA: flat monthly rate x 12
        case '5-01-02-010':
            return isOccupied(pos)
                ? (rates['pera_monthly'] ?? 2000) * 12
                : null;
        // 5-01-02-020 — RA: SG-banded monthly RATA x 12
        case '5-01-02-020': {
            if (
                !isOccupied(pos) ||
                pos.employment_type !== 'permanent' ||
                sg === null
            ) {
                return null;
            }

            if (sg >= 24) {
                return (rates['rata_sg_24_above'] ?? 4000) * 12;
            }

            if (sg >= 16) {
                return (rates['rata_sg_16_23'] ?? 2000) * 12;
            }

            return null;
        }
        // 5-01-02-030 — TA: SG-banded monthly RATA x 12
        case '5-01-02-030': {
            if (
                !isOccupied(pos) ||
                pos.employment_type !== 'permanent' ||
                sg === null
            ) {
                return null;
            }

            if (sg >= 24) {
                return (rates['ta_sg_24_above'] ?? 2000) * 12;
            }

            if (sg >= 16) {
                return (rates['ta_sg_16_23'] ?? 1000) * 12;
            }

            return null;
        }
        // 5-01-02-040 — Clothing/Uniform Allowance: flat annual
        case '5-01-02-040':
            return isOccupied(pos)
                ? Number(rates['clothing_annual'] ?? 8000)
                : null;
        // 5-01-02-060 — Laundry Allowance: flat monthly x 12
        case '5-01-02-060':
            return isOccupied(pos)
                ? (rates['laundry_monthly'] ?? 150) * 12
                : null;
        // 5-01-02-080 — PEI: flat annual ceiling
        case '5-01-02-080':
            return isOccupied(pos)
                ? Number(rates['pei_max'] ?? 5000)
                : null;
        // 5-01-02-110 — Hazard Pay: SG-banded % of monthly basic x 12
        case '5-01-02-110': {
            if (!isOccupied(pos) || sg === null) {
                return null;
            }

            return (sg <= 19 ? monthlyRate * 0.25 : monthlyRate * 0.05) * 12;
        }
        // 5-01-02-140 — Year End Bonus: 1 month basic pay
        case '5-01-02-140':
            return isBudgeted(pos) ? monthlyRate : null;
        // 5-01-02-150 — Cash Gift: flat annual
        case '5-01-02-150':
            return isOccupied(pos)
                ? Number(rates['cash_gift'] ?? 5000)
                : null;
        // 5-01-02-990 — Other Bonuses & Allowances: 1 month basic pay placeholder
        case '5-01-02-990':
            return isBudgeted(pos) ? monthlyRate : null;
        // 5-01-03-010 — GSIS employer share: % of annual basic
        case '5-01-03-010':
            return isBudgeted(pos)
                ? budgetAnnualRate * ((rates['gsis_percent'] ?? 12) / 100)
                : null;
        // 5-01-03-020 — Pag-IBIG employer share: 2% capped at MFS 10,000/mo
        case '5-01-03-020':
            return isBudgeted(pos)
                ? Math.min(monthlyRate, 10000) * 0.02 * 12
                : null;
        // 5-01-03-030 — PhilHealth employer share: 2.5% w/ floor 250 / ceiling 2,500 mo
        case '5-01-03-030': {
            if (!isBudgeted(pos)) {
                return null;
            }

            const monthlyShare = Math.min(
                Math.max(monthlyRate * 0.025, 250),
                2500,
            );

            return monthlyShare * 12;
        }
        // 5-01-03-040 — ECIP: 1% of annual basic capped at 1,200
        case '5-01-03-040':
            return isBudgeted(pos)
                ? Math.min(
                      budgetAnnualRate *
                          ((rates['ecip_percent'] ?? 1) / 100),
                      1200,
                  )
                : null;
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
        if (coa.expense_class !== 'PS') {
            continue;
        }

        let total = 0;

        for (const pos of positions) {
            const val = getCellNumericValue(pos, coa, rates, annualRateMap);

            if (val !== null) {
                total += val;
            }
        }

        totals[coa.path ?? coa.account_number] = total;
    }

    return totals;
}
