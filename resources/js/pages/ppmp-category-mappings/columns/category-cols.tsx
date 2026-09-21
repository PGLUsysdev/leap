import { createColumnHelper } from '@tanstack/react-table';
import type { PpmpCategory } from '@/types';

const columnHelper = createColumnHelper<PpmpCategory>();

const columns = [
    columnHelper.accessor('name', {
        header: () => <div className="px-1">Category Name</div>,
        size: 240,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor('is_non_procurement', {
        header: () => <div className="px-1">Procurement</div>,
        size: 130,
        cell: (info) => (
            <div className="px-1 text-wrap">
                {info.getValue() ? 'Non-Proc' : 'Proc'}
            </div>
        ),
    }),
    columnHelper.accessor('is_additional', {
        header: () => <div className="px-1">Additional</div>,
        size: 110,
        cell: (info) => (
            <div className="px-1 text-wrap">
                {info.getValue() ? 'Yes' : '—'}
            </div>
        ),
    }),
];

export default columns;
