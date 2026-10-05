// resources\js\pages\personnel-schedule\pdf-render\prepare-rows.ts

import { Decimal } from 'decimal.js';
import type { TableRow } from '@/pages/ppmp/pdf-render/types';
import type { PersonnelScheduleItem } from '../data-table/columns';

/**
 * Amount columns that are summed into the grand total row. Each key matches a
 * ColumnDef id in cols.tsx so the totals map lines up with the columns.
 */
const AMOUNT_FIELDS = [
    'current_year_amount',
    'proposed_amount',
    'increase_decrease',
] as const;

function sumAmounts(items: PersonnelScheduleItem[]) {
    return items.reduce(
        (totals, item) => {
            for (const field of AMOUNT_FIELDS) {
                const value = Number(item[field] ?? 0);

                totals[field] = (totals[field] ?? new Decimal(0)).plus(
                    Number.isNaN(value) ? 0 : value,
                );
            }

            return totals;
        },
        {} as Record<(typeof AMOUNT_FIELDS)[number], Decimal>,
    );
}

/**
 * Flattens personnel schedule items into the shared PDF row model: one item row
 * per entry, followed by a grand total row when there is anything to total.
 * The totals row carries no label; each amount lands under its own column.
 */
export function prepareLbpForm3Rows(
    items: PersonnelScheduleItem[],
): TableRow[] {
    const rows: TableRow[] = [];
    let rowIdCounter = 0;

    for (const item of items) {
        rows.push({
            id: `row-${rowIdCounter++}`,
            type: 'item',
            item,
        });
    }

    if (items.length > 0) {
        const summed = sumAmounts(items);

        const totals: Record<string, number> = {};

        for (const field of AMOUNT_FIELDS) {
            totals[field] = summed[field].toNumber();
        }

        rows.push({
            id: `row-${rowIdCounter++}`,
            type: 'grand-total',
            totals,
        });
    }

    return rows;
}
