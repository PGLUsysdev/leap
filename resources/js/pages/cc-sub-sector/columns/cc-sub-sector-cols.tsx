import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    columnHelper.display({
        id: 'action',
        size: 86,
        cell: ({ row, table }) => (
            <div className="flex gap-1">
                <Button
                    size="icon"
                    variant="outline"
                    onClick={() => table.options.meta?.onEdit?.(row.original)}
                >
                    <Pencil />
                </Button>
                <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => table.options.meta?.onDelete?.(row.original)}
                >
                    <Trash />
                </Button>
            </div>
        ),
    }),
];

export default columns;
