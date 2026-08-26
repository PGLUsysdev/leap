// resources\js\pages\aip\pdf-render\prepare-rows.ts

import type { TableRow } from "@/pages/ppmp/pdf-render/types";
import type { App, AppItem } from "@/types";

const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

const sumBy = (items: AppItem[], key: keyof AppItem) =>
    items.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);

function buildCategoryTotals(items: AppItem[]): Record<string, number> {
    return {
        total_amount: sumBy(items, "total_amount"),
        q1_amount: sumBy(items, "q1_amount"),
        q2_amount: sumBy(items, "q2_amount"),
        q3_amount: sumBy(items, "q3_amount"),
        q4_amount: sumBy(items, "q4_amount"),
    };
}

/**
 * Walks the controller's nested grouping (category -> chart of account ->
 * items) and flattens it into generic table rows:
 *
 * - `banner`   category (gray) / chart-of-account (peach) title rows
 * - `item`     procurement list rows
 * - `subtotal` inline "{CATEGORY} - TOTAL" row right after each category
 * - `subtotal` summary section repeating every "{CATEGORY} - TOTAL"
 * - `grand-total` final "TOTAL BUDGET" row
 */
export function prepareAppRows(data: App): TableRow[] {
    const rows: TableRow[] = [];
    const allCategoryTotals: Record<string, number>[] = [];

    Object.entries(data).forEach(([categoryName, chartOfAccounts], catIdx) => {
        const categorySlug = `${catIdx}-${slugify(categoryName)}`;
        const categoryItems = Object.values(chartOfAccounts).flat();

        rows.push({
            id: `cat-${categorySlug}`,
            type: "banner",
            label: categoryName,
        });

        Object.entries(chartOfAccounts).forEach(([accountTitle, items], coaIdx) => {
            rows.push({
                id: `coa-${categorySlug}-${coaIdx}-${slugify(accountTitle)}`,
                type: "banner",
                label: accountTitle,
            });

            items.forEach((item, idx) => {
                rows.push({
                    id: `item-${categorySlug}-${coaIdx}-${idx}`,
                    type: "item",
                    item,
                });
            });
        });

        const totals = buildCategoryTotals(categoryItems);
        allCategoryTotals.push(totals);

        // Inline yellow subtotal directly after the category block.
        rows.push({
            id: `cat-total-${categorySlug}`,
            type: "subtotal",
            label: `${categoryName.toUpperCase()} - TOTAL`,
            totals,
        });
    });

    // Summary section: repeat each category total, then the grand total.
    Object.entries(data).forEach(([categoryName], catIdx) => {
        rows.push({
            id: `summary-cat-${catIdx}-${slugify(categoryName)}`,
            type: "subtotal",
            label: `${categoryName.toUpperCase()} - TOTAL`,
            totals: allCategoryTotals[catIdx],
        });
    });

    rows.push({
        id: "summary-grand-total",
        type: "grand-total",
        label: "TOTAL BUDGET",
        totals: allCategoryTotals.reduce(
            (acc, totals) => ({
                total_amount: acc.total_amount + totals.total_amount,
                q1_amount: acc.q1_amount + totals.q1_amount,
                q2_amount: acc.q2_amount + totals.q2_amount,
                q3_amount: acc.q3_amount + totals.q3_amount,
                q4_amount: acc.q4_amount + totals.q4_amount,
            }),
            { total_amount: 0, q1_amount: 0, q2_amount: 0, q3_amount: 0, q4_amount: 0 },
        ),
    });

    return rows;
}

/**
 * Grand total amount shown in the fixed header ("Planned Amount").
 */
export function getGrandTotalAmount(data: App): number {
    return Object.values(data)
        .flatMap((chartOfAccounts) => Object.values(chartOfAccounts).flat())
        .reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
}
