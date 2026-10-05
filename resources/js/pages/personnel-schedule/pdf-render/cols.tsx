// resources\js\pages\personnel-schedule\pdf-render\cols.tsx

import { Text } from '@react-pdf/renderer';
import { formatCurrency } from '@/lib/utils';
import type { ColumnDef } from '@/pages/ppmp/pdf-render/types';
import type { PersonnelScheduleItem } from '../data-table/columns';

const cellStyle = (align: 'left' | 'center' | 'right') => ({
    textAlign: align,
    fontSize: 5,
    color: '#000000',
});

export const LBP_FORM_3_COLUMN_WIDTHS = [
    '4%', // 0 old
    '4%', // 1 new
    '18%', // 2 position_title
    '15%', // 3 incumbent_name
    '10%', // 4 current_year_sg_step
    '10%', // 5 current_year_amount
    '10%', // 6 proposed_sg_step
    '10%', // 7 proposed_amount
    '9%', // 8 increase_decrease
    '10%', // 9 step_increment_effectivity
];

export const LBP_FORM_3_AMOUNT_COLUMN_IDS = [
    'current_year_amount',
    'proposed_amount',
    'increase_decrease',
] as const;

export const getLbpForm3ColumnDefs = (): ColumnDef<PersonnelScheduleItem>[] => [
    {
        id: 'old',
        width: LBP_FORM_3_COLUMN_WIDTHS[0],
        header: <Text style={cellStyle('center')}>OLD</Text>,
        cell: (item) => (
            <Text style={cellStyle('center')}>{item.old || '-'}</Text>
        ),
    },
    {
        id: 'new',
        width: LBP_FORM_3_COLUMN_WIDTHS[1],
        header: <Text style={cellStyle('center')}>NEW</Text>,
        cell: (item) => (
            <Text style={cellStyle('center')}>{item.new || '-'}</Text>
        ),
    },
    {
        id: 'position_title',
        width: LBP_FORM_3_COLUMN_WIDTHS[2],
        header: <Text style={cellStyle('center')}>POSITION TITLE</Text>,
        cell: (item) => (
            <Text style={cellStyle('left')}>{item.position_title || '-'}</Text>
        ),
    },
    {
        id: 'incumbent_name',
        width: LBP_FORM_3_COLUMN_WIDTHS[3],
        header: <Text style={cellStyle('center')}>NAME OF INCUMBENT</Text>,
        cell: (item) => (
            <Text style={cellStyle('left')}>{item.incumbent_name || '-'}</Text>
        ),
    },
    {
        id: 'current_year_sg_step',
        width: LBP_FORM_3_COLUMN_WIDTHS[4],
        header: <Text style={cellStyle('center')}>SALARY GRADE (SG)/STEP</Text>,
        cell: (item) => (
            <Text style={cellStyle('center')}>
                {item.current_year_sg_step || '-'}
            </Text>
        ),
    },
    {
        id: 'current_year_amount',
        width: LBP_FORM_3_COLUMN_WIDTHS[5],
        header: <Text style={cellStyle('center')}>AMOUNT</Text>,
        cell: (item) => (
            <Text style={cellStyle('right')}>
                {formatCurrency(item.current_year_amount || '')}
            </Text>
        ),
    },
    {
        id: 'proposed_sg_step',
        width: LBP_FORM_3_COLUMN_WIDTHS[6],
        header: <Text style={cellStyle('center')}>SALARY GRADE (SG)/STEP</Text>,
        cell: (item) => (
            <Text style={cellStyle('center')}>
                {item.proposed_sg_step || '-'}
            </Text>
        ),
    },
    {
        id: 'proposed_amount',
        width: LBP_FORM_3_COLUMN_WIDTHS[7],
        header: <Text style={cellStyle('center')}>AMOUNT</Text>,
        cell: (item) => (
            <Text style={cellStyle('right')}>
                {formatCurrency(item.proposed_amount || '')}
            </Text>
        ),
    },
    {
        id: 'increase_decrease',
        width: LBP_FORM_3_COLUMN_WIDTHS[8],
        header: <Text style={cellStyle('center')}>INCREASE/DECREASE</Text>,
        cell: (item) => (
            <Text style={cellStyle('right')}>
                {formatCurrency(item.increase_decrease || '')}
            </Text>
        ),
    },
    {
        id: 'step_increment_effectivity',
        width: LBP_FORM_3_COLUMN_WIDTHS[9],
        header: (
            <Text style={cellStyle('center')}>
                EFFECTIVITY OF STEP INCREMENT
            </Text>
        ),
        cell: (item) => (
            <Text style={cellStyle('center')}>
                {item.step_increment_effectivity || '-'}
            </Text>
        ),
    },
];
