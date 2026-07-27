import { createColumnHelper } from '@tanstack/react-table';
import type { PpmpCategory } from '@/types';

const columnHelper = createColumnHelper<PpmpCategory>();

const columns = [
    columnHelper.accessor('name', {
        header: 'Category Name',
        // size: 80,
        cell: (info) => (
            <div className="wrap-break-words whitespace-normal">
                {info.getValue()}
            </div>
        ),
    }),
];

export default columns;
