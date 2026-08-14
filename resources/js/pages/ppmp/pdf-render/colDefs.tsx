import type React from 'react';

export interface ColumnDef<T> {
    id: string;
    header: string;
    width: string;
    align?: 'left' | 'center' | 'right';
    cell: (item: T) => React.ReactNode;
}

export const formatCurrency = (val?: string | number) => {
    const num = Number(val);

    return num && num > 0
        ? num.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          })
        : '-';
};

export const formatQty = (val?: number) =>
    val && val > 0 ? val.toString() : '';

const MONTHS = [
    { key: 'jan', label: 'Jan' },
    { key: 'feb', label: 'Feb' },
    { key: 'mar', label: 'Mar' },
    { key: 'apr', label: 'Apr' },
    { key: 'may', label: 'May' },
    { key: 'jun', label: 'Jun' },
    { key: 'jul', label: 'Jul' },
    { key: 'aug', label: 'Aug' },
    { key: 'sep', label: 'Sep' },
    { key: 'oct', label: 'Oct' },
    { key: 'nov', label: 'Nov' },
    { key: 'dec', label: 'Dec' },
];

const REG_QTY_COL_WIDTH = '1.5%'; // 13 cols = 19.5%
const TOTAL_QTY_COL_WIDTH = '2.5%'; // 1 col  = 2.5%
const AMT_COL_WIDTH = '3.8%'; // 14 cols = 53.2%
const COA_COL_WIDTH = '6.8%';
const DESC_COL_WIDTH = '15.5%';
const UOM_COL_WIDTH = '2.5%';

export const getPpmpColumnDefs = <T extends Record<string, any>>(
    year: number,
): ColumnDef<T>[] => [
    {
        id: 'coa',
        header: 'Chart of Account',
        width: COA_COL_WIDTH,
        align: 'left',
        cell: (item) =>
            item.ppmp_price_list?.chart_of_account_ppmp_category
                ?.chart_of_account?.account_title ??
            item.accountTitle ??
            '',
    },
    {
        id: 'item_no',
        header: 'Item No.',
        width: REG_QTY_COL_WIDTH,
        align: 'center',
        cell: (item) =>
            item.ppmp_price_list?.item_number ?? item.item_number ?? '-',
    },
    {
        id: 'description',
        header: 'Description',
        width: DESC_COL_WIDTH,
        align: 'left',
        cell: (item) =>
            item.ppmp_price_list?.description ?? item.description ?? '-',
    },
    {
        id: 'uom',
        header: 'UOM',
        width: UOM_COL_WIDTH,
        align: 'center',
        cell: (item) =>
            item.ppmp_price_list?.unit_of_measurement ??
            item.unit_of_measurement ??
            '-',
    },
    {
        id: 'price',
        header: 'PRICELIST',
        width: AMT_COL_WIDTH,
        align: 'right',
        cell: (item) =>
            formatCurrency(item.ppmp_price_list?.price ?? item.price),
    },
    {
        id: 'total_qty',
        header: 'Total Qty',
        width: TOTAL_QTY_COL_WIDTH,
        align: 'center',
        cell: (item) => {
            if (item.total_qty !== undefined) return formatQty(item.total_qty);

            const total = MONTHS.reduce(
                (sum, m) => sum + (Number(item[`${m.key}_qty`]) || 0),
                0,
            );

            return formatQty(total);
        },
    },
    {
        id: 'total_amount',
        header: 'TOTAL',
        width: AMT_COL_WIDTH,
        align: 'right',
        cell: (item) => {
            if (item.total_amount !== undefined) {
                return formatCurrency(item.total_amount);
            }

            const total = MONTHS.reduce(
                (sum, m) => sum + (Number(item[`${m.key}_amount`]) || 0),
                0,
            );

            return formatCurrency(total);
        },
    },

    // Monthly Columns
    ...MONTHS.flatMap(({ key, label }) => [
        {
            id: `${key}_qty`,
            header: `${label} Qty`,
            width: REG_QTY_COL_WIDTH,
            align: 'center' as const,
            cell: (item: T) => formatQty(item[`${key}_qty`]),
        },
        {
            id: `${key}_amount`,
            header: `${label}`,
            width: AMT_COL_WIDTH,
            align: 'right' as const,
            cell: (item: T) => formatCurrency(item[`${key}_amount`]),
        },
    ]),
];
