import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChartOfAccount } from '@/types/global';

const columnHelper = createColumnHelper<ChartOfAccount>();

const columns = [
    columnHelper.accessor('account_number', {
        header: 'Account Number',
        size: 150,
        cell: (value) => (
            <span className="font-mono text-wrap">{value.getValue()}</span>
        ),
    }),
    columnHelper.accessor('account_title', {
        header: 'Account Title',
        size: 300,
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('description', {
        header: 'Description',
        size: 300,
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('account_type', {
        header: 'Account Type',
        size: 100,
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('expense_class', {
        header: 'Expense Class',
        size: 100,
        cell: (value) => (
            <span className="text-wrap">{value.getValue() ?? '-'}</span>
        ),
    }),
    columnHelper.accessor('account_series', {
        header: 'Account Series',
        size: 100,
        cell: (value) => (
            <span className="text-wrap">{value.getValue() ?? '-'}</span>
        ),
    }),
    columnHelper.accessor('normal_balance', {
        header: 'Normal Balance',
        size: 100,
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('is_postable', {
        header: 'Postable',
        size: 80,
        cell: (value) => (
            <span className="text-wrap">{value.getValue() ? 'Yes' : 'No'}</span>
        ),
    }),
    columnHelper.accessor('is_active', {
        header: 'Active',
        size: 60,
        cell: (value) => (
            <span className="text-wrap">{value.getValue() ? 'Yes' : 'No'}</span>
        ),
    }),
    columnHelper.display({
        id: 'action',
        size: 78,
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
