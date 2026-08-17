import { Text } from '@react-pdf/renderer';
import Decimal from 'decimal.js';
import type React from 'react';
import { formatCurrency } from '@/lib/utils';

export interface ColumnDef<T> {
    id: string;
    header: React.ReactNode; // now a ReactNode, not a string
    width: string;
    cell: (item: T) => React.ReactNode;
}

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

const REG_QTY_COL_WIDTH = '1.5%';
const TOTAL_QTY_COL_WIDTH = '2.5%';
const AMT_COL_WIDTH = '3.8%';
const COA_COL_WIDTH = '6.8%';
const DESC_COL_WIDTH = '15.5%';
const UOM_COL_WIDTH = '2.5%';

// Helper for consistent cell styling
const cellStyle = (align: 'left' | 'center' | 'right') => ({
    textAlign: align,
    fontSize: 5,
    color: '#000000',
});

// Helper for consistent header styling
const headerStyle = (align: 'left' | 'center' | 'right') => ({
    textAlign: align,
    fontSize: 5,
    fontWeight: 'bold' as const,
});

export const getPpmpColumnDefs = <
    T extends Record<string, any>,
>(): ColumnDef<T>[] => [
    {
        id: 'coa',
        header: <Text style={headerStyle('center')}>Chart of Account</Text>,
        width: COA_COL_WIDTH,
        cell: (item) => (
            <Text style={cellStyle('center')}>
                {item.ppmp_price_list?.chart_of_account_ppmp_category
                    ?.chart_of_account?.account_title ??
                    item.accountTitle ??
                    ''}
            </Text>
        ),
    },
    {
        id: 'item_no',
        header: <Text style={headerStyle('center')}>Item No.</Text>,
        width: REG_QTY_COL_WIDTH,
        cell: (item) => (
            <Text style={cellStyle('center')}>
                {item.ppmp_price_list?.item_number ?? item.item_number ?? '-'}
            </Text>
        ),
    },
    {
        id: 'description',
        header: <Text style={headerStyle('left')}>Description</Text>,
        width: DESC_COL_WIDTH,
        cell: (item) => (
            <Text style={cellStyle('left')}>
                {item.ppmp_price_list?.description ?? item.description ?? '-'}
            </Text>
        ),
    },
    {
        id: 'uom',
        header: <Text style={headerStyle('center')}>UOM</Text>,
        width: UOM_COL_WIDTH,
        cell: (item) => (
            <Text style={cellStyle('center')}>
                {item.ppmp_price_list?.unit_of_measurement ??
                    item.unit_of_measurement ??
                    '-'}
            </Text>
        ),
    },
    {
        id: 'price',
        header: <Text style={headerStyle('right')}>PRICELIST</Text>,
        width: AMT_COL_WIDTH,
        cell: (item) => (
            <Text style={cellStyle('right')}>
                {formatCurrency(item.ppmp_price_list?.price ?? item.price)}
            </Text>
        ),
    },
    {
        id: 'total_qty',
        header: <Text style={headerStyle('center')}>Total Qty</Text>,
        width: TOTAL_QTY_COL_WIDTH,
        cell: (item) => {
            if (item.total_qty !== undefined) {
                return (
                    <Text style={cellStyle('center')}>
                        {formatQty(item.total_qty)}
                    </Text>
                );
            }

            const total = MONTHS.reduce(
                (sum, m) => sum + (Number(item[`${m.key}_qty`]) || 0),
                0,
            );

            return <Text style={cellStyle('center')}>{formatQty(total)}</Text>;
        },
    },
    {
        id: 'total_amount',
        header: <Text style={headerStyle('right')}>TOTAL</Text>,
        width: AMT_COL_WIDTH,
        cell: (item) => {
            if (item.total_amount !== undefined) {
                return (
                    <Text style={cellStyle('right')}>
                        {formatCurrency(item.total_amount)}
                    </Text>
                );
            }

            const total = MONTHS.reduce(
                (sum, m) => sum.plus(new Decimal(item[`${m.key}_amount`] || 0)),
                new Decimal(0),
            );

            return (
                <Text style={cellStyle('right')}>
                    {formatCurrency(total.toString())}
                </Text>
            );
        },
    },

    // Monthly Columns
    ...MONTHS.flatMap(({ key, label }) => [
        {
            id: `${key}_qty`,
            header: <Text style={headerStyle('center')}>{label} Qty</Text>,
            width: REG_QTY_COL_WIDTH,
            cell: (item: T) => (
                <Text style={cellStyle('center')}>
                    {formatQty(item[`${key}_qty`])}
                </Text>
            ),
        },
        {
            id: `${key}_amount`,
            header: <Text style={headerStyle('right')}>{label}</Text>,
            width: AMT_COL_WIDTH,
            cell: (item: T) => (
                <Text style={cellStyle('right')}>
                    {formatCurrency(item[`${key}_amount`])}
                </Text>
            ),
        },
    ]),
];
