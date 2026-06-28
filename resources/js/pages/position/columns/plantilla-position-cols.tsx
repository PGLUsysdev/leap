import { createColumnHelper } from '@tanstack/react-table';
import type { Position } from '@/types/global';
import { Button } from '@/components/ui/button';
import { Pencil, Trash } from 'lucide-react';

const columnHelper = createColumnHelper<Position>();

const columns = [
    columnHelper.accessor('office_id', {
        header: 'Office ID',
        size: 100,
    }),
    columnHelper.accessor('item_number', {
        header: 'Item No.',
        size: 130,
    }),
    columnHelper.accessor('title', {
        header: 'Position Title',
        size: 250,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor('salary_grade', {
        header: 'Salary Grade',
        size: 120,
    }),
    columnHelper.accessor('employment_type', {
        header: 'Employment Type',
        size: 140,
        cell: (info) => <span className="capitalize">{info.getValue()}</span>,
    }),
    columnHelper.accessor('is_funded', {
        header: 'Funded',
        size: 90,
        cell: (info) => (
            <span
                className={info.getValue() ? 'text-green-600' : 'text-red-600'}
            >
                {info.getValue() ? 'Yes' : 'No'}
            </span>
        ),
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        size: 110,
        cell: (info) => {
            const status = info.getValue();
            const colors: Record<string, string> = {
                occupied: 'text-green-600',
                vacant: 'text-yellow-600',
                abolished: 'text-red-600',
            };
            return (
                <span className={`capitalize ${colors[status] ?? ''}`}>
                    {status}
                </span>
            );
        },
    }),
    columnHelper.display({
        id: 'action',
        size: 100,
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
