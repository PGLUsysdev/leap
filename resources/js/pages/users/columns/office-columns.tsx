import { createColumnHelper } from '@tanstack/react-table';
import type { Office } from '@/types';

const columnHelper = createColumnHelper<Office>();

const officeColumns = [
    columnHelper.accessor('acronym', {
        size: 80,
        header: () => <div className="px-1">Acronym</div>,
        cell: (info) => (
            <div className="px-1 font-medium">{info.getValue() ?? '—'}</div>
        ),
    }),
    columnHelper.accessor('name', {
        header: () => <div className="px-1">Office Name</div>,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
];

export default officeColumns;
