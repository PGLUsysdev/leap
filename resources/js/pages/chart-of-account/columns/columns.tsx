import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChartOfAccount } from '@/types';

const columnHelper = createColumnHelper<ChartOfAccount>();

const columns = [
    columnHelper.accessor('account_number', {
        size: 150,
        header: () => <div className="px-1">Account Number</div>,
        cell: (value) => (
            <div className="px-1 font-mono text-wrap">{value.getValue()}</div>
        ),
    }),
    columnHelper.accessor('account_title', {
        size: 300,
        header: () => <div className="px-1">Account Title</div>,
        cell: (value) => (
            <div className="px-1 text-wrap">{value.getValue()}</div>
        ),
    }),
    columnHelper.accessor('description', {
        size: 300,
        header: () => <div className="px-1">Description</div>,
        cell: (value) => (
            <div className="px-1 text-wrap">{value.getValue()}</div>
        ),
    }),
    columnHelper.accessor('account_type', {
        size: 110,
        header: () => <div className="px-1">Account Type</div>,
        cell: (value) => (
            <div className="px-1 text-wrap">{value.getValue()}</div>
        ),
    }),
    columnHelper.accessor('expense_class', {
        size: 110,
        header: () => <div className="px-1">Expense Class</div>,
        cell: (value) => (
            <div className="px-1 text-wrap">{value.getValue() ?? '-'}</div>
        ),
    }),
    columnHelper.accessor('account_series', {
        size: 120,
        header: () => <div className="px-1">Account Series</div>,
        cell: (value) => (
            <div className="px-1 text-wrap">{value.getValue() ?? '-'}</div>
        ),
    }),
    columnHelper.accessor('normal_balance', {
        size: 130,
        header: () => <div className="px-1">Normal Balance</div>,
        cell: (value) => (
            <div className="px-1 text-wrap">{value.getValue()}</div>
        ),
    }),
    columnHelper.accessor('is_postable', {
        size: 100,
        header: () => <div className="px-1">Postable</div>,
        cell: (value) => (
            <div className="px-1 text-wrap">
                {value.getValue() ? 'Yes' : 'No'}
            </div>
        ),
    }),
    columnHelper.accessor('is_active', {
        size: 100,
        header: () => <div className="px-1">Active</div>,
        cell: (value) => (
            <div className="px-1 text-wrap">
                {value.getValue() ? 'Yes' : 'No'}
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
                    <Trash />
                </Button>
            </div>
        ),
    }),
];

export default columns;
