import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PpmpCategory, ChartOfAccount } from '@/types/global';

type PpmpCategoriesWithCoa = PpmpCategory & ChartOfAccount;

const columnHelper = createColumnHelper<PpmpCategoriesWithCoa>();

const columns = [
    columnHelper.accessor('name', {
        header: () => <div>Name</div>,
        size: 300,
        cell: (value) => <div className="text-wrap">{value.getValue()}</div>,
    }),
    columnHelper.accessor('is_non_procurement', {
        header: () => <div>Procurement Type</div>,
        size: 300,
        cell: (value) => (
            <div className="text-wrap">
                {value.getValue() ? 'Non-Procurement' : 'Procurement'}
            </div>
        ),
    }),
    columnHelper.accessor('account_title', {
        header: () => <div>Account Title</div>,
        size: 300,
        cell: ({ getValue }) => (
            <div className="text-wrap">{getValue() ?? '-'}</div>
        ),
    }),
    columnHelper.display({
        id: 'action',
        size: 82,
        cell: ({ row, table }) => (
            <div className="flex items-center gap-1">
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
