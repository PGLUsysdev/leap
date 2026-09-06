import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/base-ui-components/ui/button';
import type { Ios } from '@/types';

const columnHelper = createColumnHelper<Ios>();

const columns = [
    columnHelper.accessor('occupational_service_code', {
        size: 210,
        header: () => <div className="px-1">Occupational Service Code</div>,
        cell: (info) => (
            <div className="px-1 text-wrap slashed-zero tabular-nums">
                {info.getValue()}
            </div>
        ),
    }),
    columnHelper.accessor('occupational_group_code', {
        size: 200,
        header: () => <div className="px-1">Occupational Group Code</div>,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor('class_id', {
        size: 100,
        header: () => <div className="px-1">Class ID</div>,
        cell: (info) => (
            <div className="px-1 text-wrap slashed-zero tabular-nums">
                {info.getValue()}
            </div>
        ),
    }),
    columnHelper.accessor('class', {
        size: 300,
        header: () => <div className="px-1">Class</div>,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor('salary_grade', {
        size: 110,
        header: () => <div className="px-1">Salary Grade</div>,
        cell: (info) => (
            <div className="px-1 text-wrap slashed-zero tabular-nums">
                {info.getValue()}
            </div>
        ),
    }),
    columnHelper.display({
        id: 'actions',
        size: 82,
        cell: ({ row, table }) => (
            <div className="flex items-center gap-1">
                <Button
                    size="icon"
                    variant="outline"
                    disabled={!table.options.meta?.canEdit}
                    onClick={() => table.options.meta?.onEdit?.(row.original)}
                >
                    <Pencil />
                </Button>
                <Button
                    size="icon"
                    variant="destructive"
                    disabled={!table.options.meta?.canDelete}
                    onClick={() => table.options.meta?.onDelete?.(row.original)}
                >
                    <Trash2 />
                </Button>
            </div>
        ),
    }),
];

export default columns;
