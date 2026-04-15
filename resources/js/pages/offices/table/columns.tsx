import { createColumnHelper } from '@tanstack/react-table';
import type { Office } from '@/types/global';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash, Plus } from 'lucide-react';

const columnHelper = createColumnHelper<Office>();

const columns = [
    columnHelper.accessor('full_code', {
        // id: 'full_code',
        header: 'Office Account Code',
        size: 200,
        cell: (info) => {
            return <code className="font-mono">{info.getValue()}</code>;
        },
    }),
    columnHelper.accessor('name', {
        header: 'Office Name',
        size: 300,
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <span
                    className={`flex gap-2 text-wrap ${
                        row.original.parent_id ? 'ml-8' : ''
                    }`}
                >
                    {row.original.parent_id && (
                        <span className="text-muted-foreground opacity-50">
                            ↳
                        </span>
                    )}
                    {row.getValue('name')}
                </span>
            </div>
        ),
    }),
    columnHelper.accessor('acronym', {
        header: 'Acronym',
        // size: 200,
        cell: (value) => (
            <span className="text-wrap">{value.getValue() ?? '-'}</span>
        ),
    }),
    columnHelper.accessor('is_lee', {
        header: 'LEE',
        // size: 80,
        cell: ({ row }) => (
            <div className="flex items-center">
                {row.getValue('is_lee') ? (
                    <Badge>Yes</Badge>
                ) : (
                    <Badge variant="secondary">No</Badge>
                )}
            </div>
        ),
    }),
    columnHelper.display({
        id: 'action',
        size: 120,
        cell: ({ row, table }) => (
            <div className="flex items-center gap-1">
                <Button
                    size="icon"
                    onClick={() => table.options.meta?.onAdd?.(row.original)}
                    disabled={!!row.original.parent_id}
                >
                    <Plus />
                </Button>

                <Button
                    size="icon"
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
