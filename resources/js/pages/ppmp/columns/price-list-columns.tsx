import { createColumnHelper } from '@tanstack/react-table';
import type { PriceList } from '@/types';

const columnHelper = createColumnHelper<PriceList>();

const columns = [
    columnHelper.accessor('id', {
        size: 100,
        header: () => <div className="text-center">ID</div>,
        cell: (info) => {
            return <div>{info.getValue()}</div>;
        },
    }),
    columnHelper.accessor('description', {
        size: 100,
        header: () => <div className="text-center">ID</div>,
        cell: (info) => {
            return <div>{info.getValue()}</div>;
        },
    }),
];

export default columns;
