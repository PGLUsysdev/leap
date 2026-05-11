import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LguLevel } from '@/types/global';

const columnHelper = createColumnHelper<LguLevel>();

const columns = [
    columnHelper.accessor('code', {
        header: 'Code',
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('name', {
        header: 'Name',
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.display({
        id: 'action',
        size: 82,
        cell: ({ row, table }) => (
            <div className="flex items-center gap-1">
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
