import { Text } from '@react-pdf/renderer';
import { formatCurrency } from '@/lib/utils';
import type { ColumnDef } from '@/pages/ppmp/pdf-render/types';

const cellStyle = (align: 'left' | 'center' | 'right') => ({
    textAlign: align,
    fontSize: 5,
    color: '#000000',
});

// Schedule dates (YYYY-MM-DD) display as month + 2-digit year, e.g. "Dec-27"
const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

const formatScheduleDate = (value: string) => {
    const [year, month] = value.split('-');

    return `${MONTHS[Number(month) - 1]}-${year.slice(2)}`;
};

export const AIP_SUMMARY_COLUMN_WIDTHS = [
    '7.78%', // ref_code
    '17.86%', // description
    '6.5%', // implementing_office
    '5.36%', // start_date
    '5.36%', // end_date
    '7.14%', // expected_output
    '5.36%', // funding_source
    '5.36%', // ps
    '5.36%', // mooe
    '5.36%', // fe
    '5.36%', // co
    '7.14%', // total
    '5.36%', // ccet_adapt
    '5.36%', // ccet_miti
    '5.34%', // cc_typology
];

export const getAipSummaryColumnDefs = <
    T extends Record<string, any>,
>(): ColumnDef<T>[] => [
    {
        id: 'ref_code',
        width: AIP_SUMMARY_COLUMN_WIDTHS[0],
        cell: (item) => (
            <Text style={cellStyle('center')}>{item.ref_code || ''}</Text>
        ),
    },
    {
        id: 'description',
        width: AIP_SUMMARY_COLUMN_WIDTHS[1],
        cell: (item) => (
            <Text style={cellStyle('left')}>{item.label || ''}</Text>
        ),
    },
    {
        id: 'implementing_office',
        width: AIP_SUMMARY_COLUMN_WIDTHS[2],
        cell: (item) => (
            <Text style={cellStyle('center')}>{item.officeAcronyms || ''}</Text>
        ),
    },
    {
        id: 'start_date',
        width: AIP_SUMMARY_COLUMN_WIDTHS[3],
        cell: (item) => (
            <Text style={cellStyle('center')}>
                {item.start_date ? formatScheduleDate(item.start_date) : ''}
            </Text>
        ),
    },
    {
        id: 'end_date',
        width: AIP_SUMMARY_COLUMN_WIDTHS[4],
        cell: (item) => (
            <Text style={cellStyle('center')}>
                {item.end_date ? formatScheduleDate(item.end_date) : ''}
            </Text>
        ),
    },
    {
        id: 'expected_output',
        width: AIP_SUMMARY_COLUMN_WIDTHS[5],
        cell: (item) => (
            <Text style={cellStyle('center')}>
                {item.expected_output || ''}
            </Text>
        ),
    },
    {
        id: 'funding_source',
        width: AIP_SUMMARY_COLUMN_WIDTHS[6],
        cell: (item) => (
            <Text style={cellStyle('center')}>
                {item.funding_source_code || '-'}
            </Text>
        ),
    },
    {
        id: 'ps',
        width: AIP_SUMMARY_COLUMN_WIDTHS[7],
        cell: (item) => (
            <Text style={cellStyle('right')}>
                {formatCurrency(item.ps || 0)}
            </Text>
        ),
    },
    {
        id: 'mooe',
        width: AIP_SUMMARY_COLUMN_WIDTHS[8],
        cell: (item) => (
            <Text style={cellStyle('right')}>
                {formatCurrency(item.mooe || 0)}
            </Text>
        ),
    },
    {
        id: 'fe',
        width: AIP_SUMMARY_COLUMN_WIDTHS[9],
        cell: (item) => (
            <Text style={cellStyle('right')}>
                {formatCurrency(item.fe || 0)}
            </Text>
        ),
    },
    {
        id: 'co',
        width: AIP_SUMMARY_COLUMN_WIDTHS[10],
        cell: (item) => (
            <Text style={cellStyle('right')}>
                {formatCurrency(item.co || 0)}
            </Text>
        ),
    },
    {
        id: 'total',
        width: AIP_SUMMARY_COLUMN_WIDTHS[11],
        cell: (item) => (
            <Text style={cellStyle('right')}>
                {formatCurrency(item.total || 0)}
            </Text>
        ),
    },
    {
        id: 'ccet_adapt',
        width: AIP_SUMMARY_COLUMN_WIDTHS[12],
        cell: (item) => (
            <Text style={cellStyle('right')}>
                {formatCurrency(item.ccet_adapt || 0)}
            </Text>
        ),
    },
    {
        id: 'ccet_miti',
        width: AIP_SUMMARY_COLUMN_WIDTHS[13],
        cell: (item) => (
            <Text style={cellStyle('right')}>
                {formatCurrency(item.ccet_miti || 0)}
            </Text>
        ),
    },
    {
        id: 'cc_typology',
        width: AIP_SUMMARY_COLUMN_WIDTHS[14],
        cell: (item) => (
            <Text style={cellStyle('center')}>
                {item.cc_typology_code || '-'}
            </Text>
        ),
    },
];
