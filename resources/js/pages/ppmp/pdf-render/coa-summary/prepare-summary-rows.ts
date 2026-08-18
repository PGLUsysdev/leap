// resources\js\pages\ppmp\pdf-render\coa-summary\prepare-summary-rows.ts

import type { TableRow } from '../types';

const EXPENSE_CLASSES = ['MOOE', 'CO', 'FE'] as const;
type ExpenseClass = (typeof EXPENSE_CLASSES)[number];

function sumMonthRange(item: any, months: string[]): number {
    return months.reduce(
        (sum, m) => sum + (Number(item[`${m}_amount`]) || 0),
        0,
    );
}

function calculateTotals(items: any[]) {
    const totals = { total: 0, q1: 0, q2: 0, q3: 0, q4: 0 };
    items.forEach((item) => {
        const q1 = sumMonthRange(item, ['jan', 'feb', 'mar']);
        const q2 = sumMonthRange(item, ['apr', 'may', 'jun']);
        const q3 = sumMonthRange(item, ['jul', 'aug', 'sep']);
        const q4 = sumMonthRange(item, ['oct', 'nov', 'dec']);
        totals.total += q1 + q2 + q3 + q4;
        totals.q1 += q1;
        totals.q2 += q2;
        totals.q3 += q3;
        totals.q4 += q4;
    });

    return totals;
}

export function prepareSummaryRows(rawItems: any[]): TableRow[] {
    const rows: TableRow[] = [];
    const classMap = new Map<
        ExpenseClass,
        Map<string, { accountCode: string; accountTitle: string; items: any[] }>
    >();
    EXPENSE_CLASSES.forEach((cls) => classMap.set(cls, new Map()));

    rawItems.forEach((item) => {
        const coa =
            item.ppmp_price_list?.chart_of_account_ppmp_category
                ?.chart_of_account;

        if (!coa) return;

        const expenseClass = coa.expense_class as ExpenseClass;

        if (!expenseClass || !EXPENSE_CLASSES.includes(expenseClass)) return;

        const accountCode = coa.account_number;
        const accountTitle = coa.account_title;
        const map = classMap.get(expenseClass)!;

        if (!map.has(accountCode)) {
            map.set(accountCode, { accountCode, accountTitle, items: [] });
        }

        map.get(accountCode)!.items.push(item);
    });

    for (const expenseClass of EXPENSE_CLASSES) {
        const coaMap = classMap.get(expenseClass)!;
        // Banner – already unique
        rows.push({
            id: `prog-${expenseClass}`,
            type: 'banner',
            label: expenseClass,
        });

        const coaEntries = Array.from(coaMap.values());
        coaEntries.forEach((entry) => {
            const totals = calculateTotals(entry.items);
            rows.push({
                id: `item-${expenseClass}-${entry.accountCode}`, // unique per expense class
                type: 'item',
                item: {
                    accountCode: entry.accountCode,
                    accountTitle: entry.accountTitle,
                    total: totals.total,
                    q1: totals.q1,
                    q2: totals.q2,
                    q3: totals.q3,
                    q4: totals.q4,
                },
            });
        });

        const subtotal = calculateTotals(coaEntries.flatMap((e) => e.items));
        rows.push({
            id: `summary-subtotal-${expenseClass}`, // unique
            type: 'subtotal',
            label: `${expenseClass} - SUBTOTAL`,
            totals: {
                total: subtotal.total,
                q1: subtotal.q1,
                q2: subtotal.q2,
                q3: subtotal.q3,
                q4: subtotal.q4,
            },
        });

        rows.push({
            id: `spacer-${expenseClass}`, // unique
            type: 'spacer',
        });
    }

    const grand = calculateTotals(rawItems);
    rows.push({
        id: 'summary-grand-total', // unique
        type: 'grand-total',
        label: 'GRAND TOTAL - FOR THE PPA',
        totals: {
            total: grand.total,
            q1: grand.q1,
            q2: grand.q2,
            q3: grand.q3,
            q4: grand.q4,
        },
    });

    return rows;
}
