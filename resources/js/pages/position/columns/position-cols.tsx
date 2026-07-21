import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/base-ui-components/ui/button';
import type { Position } from '@/types';

const columnHelper = createColumnHelper<Position>();

const columns = [
    columnHelper.accessor('item_number', {
        header: 'Item No.',
        size: 100,
    }),
    columnHelper.accessor('office_id', {
        header: 'Office',
        size: 100,
        cell: (info) => {
            const row = info.row.original;
            const office = row.office;

            return office?.acronym ?? office?.name ?? info.getValue();
        },
    }),
    columnHelper.accessor('ios_id', {
        header: 'Class',
        size: 200,
        cell: (info) => {
            const row = info.row.original;

            return row.ios?.class ?? info.getValue();
        },
    }),
    columnHelper.accessor('ios_id', {
        id: 'salary_grade',
        header: 'Salary Grade',
        size: 100,
        cell: (info) => {
            const row = info.row.original;

            return row.ios?.salary_grade ?? info.getValue();
        },
    }),
    columnHelper.accessor('employment_type', {
        header: 'Employment Type',
        size: 150,
        cell: (info) => <span className="capitalize">{info.getValue()}</span>,
    }),
    columnHelper.accessor('is_funded', {
        header: 'Funded',
        size: 100,
        cell: (info) => <span>{info.getValue() ? 'Yes' : 'No'}</span>,
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        size: 100,
        cell: (info) => {
            const status = info.getValue();

            return <span className="capitalize">{status}</span>;
        },
    }),
    columnHelper.display({
        id: 'action',
        size: 84,
        cell: ({ row, table }) => (
            <div className="flex items-center gap-1">
                {table.options.meta?.onEdit && (
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={() =>
                            table.options.meta?.onEdit?.(row.original)
                        }
                    >
                        <Pencil />
                    </Button>
                )}
                {table.options.meta?.onDelete && (
                    <Button
                        size="icon"
                        variant="destructive"
                        onClick={() =>
                            table.options.meta?.onDelete?.(row.original)
                        }
                    >
                        <Trash2 />
                    </Button>
                )}
            </div>
        ),
    }),
];

export default columns;
