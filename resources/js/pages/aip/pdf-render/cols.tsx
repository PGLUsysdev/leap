// resources\js\pages\aip\pdf-render\cols.tsx

import { Text } from '@react-pdf/renderer';
import type { ColumnDef } from '@/pages/ppmp/pdf-render/types';
import type { AppItem } from '@/types';

/**
 * Column widths (%) matching the legacy APP layout:
 * 0 item_no | 1 description | 2 unit | 3 unit_cost | 4 qty | 5 total_cost |
 * 6 q1_qty | 7 q1_amount | 8 q2_qty | 9 q2_amount | 10 q3_qty | 11 q3_amount |
 * 12 q4_qty | 13 q4_amount
 */
export const APP_COLUMN_WIDTHS = [
    '5%',
    '20%',
    '5%',
    '10%',
    '5%',
    '11%',
    '4%',
    '6%',
    '4%',
    '6%',
    '4%',
    '6%',
    '4%',
    '10%',
];

export const formatAppNumber = (value: number | string | null | undefined) => {
    if (value === undefined || value === null) {
        return '-';
    }

    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num) || num === 0) {
        return '-';
    }

    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

const cellCenter = {
    margin: 2,
    fontSize: 6.5,
    paddingVertical: 1,
    textAlign: 'center' as const,
};
const cellLeft = { ...cellCenter, textAlign: 'left' as const };
const cellRight = { ...cellCenter, textAlign: 'right' as const };

const quarterDefs = ([1, 2, 3, 4] as const).flatMap<ColumnDef<AppItem>>((q) => [
    {
        id: `q${q}_qty`,
        width: APP_COLUMN_WIDTHS[4 + q * 2],
        cell: (item) => (
            <Text style={cellCenter}>{item[`q${q}_qty`] || '-'}</Text>
        ),
    },
    {
        id: `q${q}_amount`,
        width: APP_COLUMN_WIDTHS[5 + q * 2],
        cell: (item) => (
            <Text style={cellRight}>
                {formatAppNumber(item[`q${q}_amount`])}
            </Text>
        ),
    },
]);

export function getAppColumnDefs(): ColumnDef<AppItem>[] {
    return [
        {
            id: 'item_no',
            width: APP_COLUMN_WIDTHS[0],
            cell: (item) => (
                <Text style={cellCenter}>
                    {item.ppmp_price_list?.item_number}
                </Text>
            ),
        },
        {
            id: 'description',
            width: APP_COLUMN_WIDTHS[1],
            cell: (item) => (
                <Text style={cellLeft}>
                    {item.ppmp_price_list?.description}
                </Text>
            ),
        },
        {
            id: 'uom',
            width: APP_COLUMN_WIDTHS[2],
            cell: (item) => (
                <Text style={cellCenter}>
                    {item.ppmp_price_list?.unit_of_measurement}
                </Text>
            ),
        },
        {
            id: 'price',
            width: APP_COLUMN_WIDTHS[3],
            cell: (item) => (
                <Text style={cellRight}>
                    {formatAppNumber(item.ppmp_price_list?.price)}
                </Text>
            ),
        },
        {
            id: 'qty',
            width: APP_COLUMN_WIDTHS[4],
            cell: (item) => <Text style={cellCenter}>{item.total_qty}</Text>,
        },
        {
            id: 'total_amount',
            width: APP_COLUMN_WIDTHS[5],
            cell: (item) => (
                <Text style={cellRight}>
                    {formatAppNumber(item.total_amount)}
                </Text>
            ),
        },
        ...quarterDefs,
    ];
}
