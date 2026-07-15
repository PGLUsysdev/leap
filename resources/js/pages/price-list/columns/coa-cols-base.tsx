import { createColumnHelper } from '@tanstack/react-table';
import type { ChartOfAccount } from '@/types';

const columnHelper = createColumnHelper<ChartOfAccount>();

const columns = [
    columnHelper.accessor('account_number', {
        header: 'Account Number',
        // size: 80,
        cell: (info) => (
            <div className="wrap-break-words whitespace-normal">
                {info.getValue()}
            </div>
        ),
    }),
    columnHelper.accessor('account_title', {
        header: 'Account Title',
        // size: 80,
        cell: (info) => (
            <div className="wrap-break-words whitespace-normal">
                {info.getValue()}
            </div>
        ),
    }),
    columnHelper.accessor('expense_class', {
        header: 'Expense Class',
        // size: 80,
        cell: (info) => (
            <div className="wrap-break-words whitespace-normal">
                {info.getValue()}
            </div>
        ),
    }),
    columnHelper.accessor('description', {
        header: 'Description',
        // size: 80,
        cell: (info) => (
            <div className="wrap-break-words whitespace-normal">
                {info.getValue()}
            </div>
        ),
    }),
];

export default columns;
