import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PpmpCategory } from '@/types/global';
import { Badge } from '@/components/ui/badge';

const columnHelper = createColumnHelper<PpmpCategory>();

const columns = [
    columnHelper.accessor('name', {
        header: () => <div>Category Name</div>,
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
    columnHelper.accessor('chart_of_accounts', {
        header: () => <div>Expense Accounts</div>,
        size: 300,
        cell: ({ getValue }) => (
            <div className="flex flex-wrap gap-2">
                {getValue().map((account) => (
                    <Badge key={account.id}>{account.account_title}</Badge>
                ))}
            </div>
        ),
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
