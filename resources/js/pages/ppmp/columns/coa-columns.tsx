import { createColumnHelper } from '@tanstack/react-table';
import type { ChartOfAccount } from '@/types';

const columnHelper = createColumnHelper<ChartOfAccount>();

const columns = [
    columnHelper.accessor('id', {
        size: 100,
        header: () => <div className="text-center">ID</div>,
        cell: (info) => {
            return <div>{info.getValue()}</div>;
        },
    }),
    columnHelper.accessor('account_title', {
        size: 100,
        header: () => <div className="text-center">ID</div>,
        cell: (info) => {
            return <div>{info.getValue()}</div>;
        },
    }),
];

export default columns;
