import { createColumnHelper } from '@tanstack/react-table';
import type { PpmpCategory } from '@/types';

const columnHelper = createColumnHelper<PpmpCategory>();

const columns = [
    columnHelper.accessor('id', {
        size: 100,
        header: () => <div className="text-center">ID</div>,
        cell: (info) => {
            return <div>{info.getValue()}</div>;
        },
    }),
    columnHelper.accessor('name', {
        size: 100,
        header: () => <div className="text-center">ID</div>,
        cell: (info) => {
            return <div>{info.getValue()}</div>;
        },
    }),
];

export default columns;
