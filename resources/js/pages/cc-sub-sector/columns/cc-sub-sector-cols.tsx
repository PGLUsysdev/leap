import { createColumnHelper } from '@tanstack/react-table';
import type { CcSubSector } from '@/types/global';

const columnHelper = createColumnHelper<CcSubSector>();

const columns = [
    columnHelper.accessor('code', {
        header: 'Code',
        size: 200,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor('name', {
        header: 'Name',
        size: 400,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor('strategic_priority.name', {
        header: 'Strategic Priority',
        size: 200,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
];

export default columns;
