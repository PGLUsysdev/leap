// resources\js\pages\ppmp\pdf-render\ppmp\prepare-ppmp-rows.ts

import type { TableRow } from "../types";

// Helper to calculate totals from an array of items
function calculateTotals(items: any[]): Record<string, number> {
    const months = [
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
    ];
    const totals: Record<string, number> = {
        total_qty: 0,
        total_amount: 0,
    };
    months.forEach((m) => {
        totals[`${m}_qty`] = 0;
        totals[`${m}_amount`] = 0;
    });

    items.forEach((item) => {
        months.forEach((m) => {
            totals[`${m}_qty`] += Number(item[`${m}_qty`]) || 0;
            totals[`${m}_amount`] += Number(item[`${m}_amount`]) || 0;
        });
        totals.total_qty += months.reduce((sum, m) => sum + (Number(item[`${m}_qty`]) || 0), 0);
        totals.total_amount += months.reduce(
            (sum, m) => sum + (Number(item[`${m}_amount`]) || 0),
            0,
        );
    });

    return totals;
}

export function preparePpmpRows(rawItems: any[]): TableRow[] {
    const rows: TableRow[] = [];
    const programMap = new Map<string, Map<string, Map<string, { title: string; items: any[] }>>>();

    rawItems.forEach((item) => {
        const category = item.ppmp_price_list?.chart_of_account_ppmp_category?.ppmp_category;
        const coa = item.ppmp_price_list?.chart_of_account_ppmp_category?.chart_of_account;

        const isNonProc = category?.is_non_procurement ?? false;
        const programKey = isNonProc ? "NON-PROCUREMENT ITEMS" : "PROCUREMENT ITEMS";
        const categoryKey = category?.name || "GENERAL CATEGORY";
        const coaKey = coa?.account_number || "UNCATEGORIZED";
        const coaTitle = coa?.account_title || "General Expenses";

        if (!programMap.has(programKey)) {
            programMap.set(programKey, new Map());
        }

        const categoryMap = programMap.get(programKey)!;

        if (!categoryMap.has(categoryKey)) {
            categoryMap.set(categoryKey, new Map());
        }

        const coaMap = categoryMap.get(categoryKey)!;

        if (!coaMap.has(coaKey)) {
            coaMap.set(coaKey, { title: coaTitle, items: [] });
        }

        coaMap.get(coaKey)!.items.push(item);
    });

    for (const [programTitle, categoryMap] of programMap) {
        // Program Banner
        rows.push({
            id: `prog-${programTitle}`,
            type: "banner",
            label: programTitle,
        });

        for (const [categoryName, coaMap] of categoryMap) {
            // Category Banner – include program
            rows.push({
                id: `cat-${programTitle}-${categoryName}`,
                type: "banner",
                label: categoryName,
            });

            for (const [coaKey, coaData] of coaMap) {
                const { title: coaTitle, items } = coaData;
                // COA Banner – include program and category
                rows.push({
                    id: `coa-${programTitle}-${categoryName}-${coaKey}`,
                    type: "banner",
                    label: coaTitle,
                });

                // Item rows – stable ID
                items.forEach((item, idx) => {
                    rows.push({
                        id: `item-${item.id || idx}`,
                        type: "item",
                        item,
                    });
                });
            }

            // Category Subtotal – include program
            const categoryItems = Array.from(coaMap.values()).flatMap((coaData) => coaData.items);
            rows.push({
                id: `cat-total-${programTitle}-${categoryName}`,
                type: "subtotal",
                label: `${categoryName} - TOTAL`,
                totals: calculateTotals(categoryItems),
            });
        }

        // Program Subtotal
        const programItems = Array.from(categoryMap.values()).flatMap((coaMap) =>
            Array.from(coaMap.values()).flatMap((coaData) => coaData.items),
        );
        rows.push({
            id: `prog-total-${programTitle}`,
            type: "subtotal",
            label: `TOTAL FOR ${programTitle}`,
            totals: calculateTotals(programItems),
        });
    }

    // Grand Total
    rows.push({
        id: "grand-total",
        type: "grand-total",
        label: "GRAND TOTAL - FOR THE AIP/PPA",
        totals: calculateTotals(rawItems),
    });

    return rows;
}
