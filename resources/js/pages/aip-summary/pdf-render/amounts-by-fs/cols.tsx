// resources\js\pages\aip-summary\pdf-render\amounts-by-fs\cols.tsx

import { Text } from '@react-pdf/renderer';
import { formatCurrency } from '@/lib/utils';
import type { ColumnDef } from '@/pages/ppmp/pdf-render/types';

const cellStyle = (align: 'left' | 'center' | 'right') => ({
    textAlign: align,
    fontSize: 5,
    color: '#000000',
});

export const FS_SUMMARY_COLUMN_WIDTHS = [
    '22%', // funding_source
    '11%', // ps
    '11%', // mooe
    '11%', // fe
    '11%', // co
    '11%', // ccet_adapt
    '11%', // ccet_miti
    '12%', // total
];

export const getFsSummaryColumnDefs = <
    T extends Record<string, any>,
>(): ColumnDef<T>[] => [
    {
        id: 'funding_source',
        width: FS_SUMMARY_COLUMN_WIDTHS[0],
        header: <Text style={cellStyle('center')}>Funding Source</Text>,
        cell: (item) => (
            <Text style={cellStyle('left')}>
                {item.funding_source?.code || item.funding_source?.title || '-'}
            </Text>
        ),
    },
    {
        id: 'ps',
        width: FS_SUMMARY_COLUMN_WIDTHS[1],
        header: <Text style={cellStyle('center')}>PS</Text>,
        cell: (item) => (
            <Text style={cellStyle('right')}>
                {formatCurrency(item.ps || 0)}
            </Text>
        ),
    },
    {
        id: 'mooe',
        width: FS_SUMMARY_COLUMN_WIDTHS[2],
        header: <Text style={cellStyle('center')}>MOOE</Text>,
        cell: (item) => (
            <Text style={cellStyle('right')}>
                {formatCurrency(item.mooe || 0)}
            </Text>
        ),
    },
    {
        id: 'fe',
        width: FS_SUMMARY_COLUMN_WIDTHS[3],
        header: <Text style={cellStyle('center')}>FE</Text>,
        cell: (item) => (
            <Text style={cellStyle('right')}>
                {formatCurrency(item.fe || 0)}
            </Text>
        ),
    },
    {
        id: 'co',
        width: FS_SUMMARY_COLUMN_WIDTHS[4],
        header: <Text style={cellStyle('center')}>CO</Text>,
        cell: (item) => (
            <Text style={cellStyle('right')}>
                {formatCurrency(item.co || 0)}
            </Text>
        ),
    },
    {
        id: 'total',
        width: FS_SUMMARY_COLUMN_WIDTHS[7],
        header: <Text style={cellStyle('center')}>Total</Text>,
        cell: (item) => (
            <Text style={cellStyle('right')}>
                {formatCurrency(item.total || 0)}
            </Text>
        ),
    },
    {
        id: 'ccet_adapt',
        width: FS_SUMMARY_COLUMN_WIDTHS[5],
        header: <Text style={cellStyle('center')}>Adaptation</Text>,
        cell: (item) => (
            <Text style={cellStyle('right')}>
                {formatCurrency(item.ccet_adapt || 0)}
            </Text>
        ),
    },
    {
        id: 'ccet_miti',
        width: FS_SUMMARY_COLUMN_WIDTHS[6],
        header: <Text style={cellStyle('center')}>Mitigation</Text>,
        cell: (item) => (
            <Text style={cellStyle('right')}>
                {formatCurrency(item.ccet_miti || 0)}
            </Text>
        ),
    },
];
