import { createColumnHelper } from '@tanstack/react-table';
import type { ChartOfAccount } from '@/types';

const columnHelper = createColumnHelper<ChartOfAccount>();

const columns = [
    // columnHelper.accessor('id', {
    //     size: 100,
    //     header: () => <div className="text-center">ID</div>,
    //     cell: (info) => {
    //         return <div>{info.getValue()}</div>;
    //     },
    // }),
    columnHelper.accessor('account_number', {
        size: 100,
        header: () => (
            <div className="text-center text-wrap">Account Number</div>
        ),
        cell: (info) => {
            return (
                <div className="text-wrap slashed-zero tabular-nums">
                    {info.getValue()}
                </div>
            );
        },
    }),
    columnHelper.accessor('account_title', {
        size: 200,
        header: () => <div className="text-center text-wrap">Account Name</div>,
        cell: (info) => {
            return <div className="text-wrap">{info.getValue()}</div>;
        },
    }),
    columnHelper.accessor('expense_class', {
        size: 100,
        header: () => (
            <div className="text-center text-wrap">Expense Class</div>
        ),
        cell: (info) => {
            return (
                <div className="text-center text-wrap">{info.getValue()}</div>
            );
        },
    }),
];

export default columns;
