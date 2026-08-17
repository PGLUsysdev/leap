// colDefsSummary.ts
import { Text } from '@react-pdf/renderer';
import { formatCurrency } from '@/lib/utils';

export interface SummaryColumnDef {
    id: string;
    header: string;
    width: string;
    align?: 'left' | 'center' | 'right';
    cell: (item: any) => React.ReactNode;
}

const MONTHS = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
];

export const getSummaryColumnDefs = (): SummaryColumnDef[] => {
    return [
        {
            id: 'coa',
            header: 'Chart of Account',
            width: '28%',
            align: 'left',
            cell: (item) => <Text>{item.accountTitle || '-'}</Text>,
        },
        {
            id: 'account_code',
            header: 'ACCOUNT CODE',
            width: '12%',
            align: 'center',
            cell: (item) => <Text>{item.accountCode || '-'}</Text>,
        },
        {
            id: 'total',
            header: 'TOTAL(IN PPMP)',
            width: '12%',
            align: 'right',
            cell: (item) => <Text>{formatCurrency(item.total)}</Text>,
        },
        {
            id: 'q1',
            header: '1ST QTR',
            width: '12%',
            align: 'right',
            cell: (item) => <Text>{formatCurrency(item.q1)}</Text>,
        },
        {
            id: 'q2',
            header: '2ND QTR',
            width: '12%',
            align: 'right',
            cell: (item) => <Text>{formatCurrency(item.q2)}</Text>,
        },
        {
            id: 'q3',
            header: '3RD QTR',
            width: '12%',
            align: 'right',
            cell: (item) => <Text>{formatCurrency(item.q3)}</Text>,
        },
        {
            id: 'q4',
            header: '4TH QTR',
            width: '12%',
            align: 'right',
            cell: (item) => <Text>{formatCurrency(item.q4)}</Text>,
        },
    ];
};

// Helper to sum monthly amounts for a given set of items
export function sumAmountsForItems(items: any[], monthKeys: string[]): number {
    return items.reduce((sum, item) => {
        let total = 0;
        monthKeys.forEach((m) => {
            total += Number(item[`${m}_amount`]) || 0;
        });

        return sum + total;
    }, 0);
}
