import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/base-ui-components/ui/button';
import type { Ios } from '@/types';

const columnHelper = createColumnHelper<Ios>();

    columnHelper.accessor('occupational_service_code', {
        header: 'Occupational Service Code',
        size: 200,
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('occupational_group_code', {
        header: 'Occupational Group Code',
        size: 200,
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('class_id', {
        header: 'Class ID',
        size: 150,
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('class', {
        header: 'Class',
        size: 300,
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('salary_grade', {
        header: 'Salary Grade',
        size: 100,
        cell: (info) => info.getValue(),
    }),
    columnHelper.display({
        id: 'actions',
        size: 83,
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
