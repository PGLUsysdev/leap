import { createColumnHelper } from '@tanstack/react-table';
import { Trash } from 'lucide-react';
import { Badge } from '@/components/base-ui-components/ui/badge';
import { Button } from '@/components/base-ui-components/ui/button';
import type { ChartOfAccountPpmpCategory } from '@/types';

const columnHelper = createColumnHelper<ChartOfAccountPpmpCategory>();

const columns = [
    columnHelper.accessor('ppmp_category.name', {
        header: () => <div className="px-1">Category</div>,
        size: 220,
        cell: (info) => (
            <div className="px-1 font-medium text-wrap">
                {info.getValue() ?? '-'}
            </div>
        ),
    }),
    columnHelper.accessor('ppmp_category.is_additional', {
        header: () => <div className="px-1">Additional</div>,
        size: 90,
        cell: (info) => (
            <div className="px-1 text-wrap">
                {info.getValue() ? 'Yes' : '—'}
            </div>
        ),
    }),
    columnHelper.accessor('chart_of_account.path', {
        header: () => <div className="px-1">Account No.</div>,
        size: 140,
        cell: (info) => (
            <div className="px-1 text-wrap slashed-zero tabular-nums">
                <code className="bg-muted rounded px-1 py-0.5 text-xs">
                    {info.getValue() ?? '-'}
                </code>
            </div>
        ),
    }),
    columnHelper.accessor('chart_of_account.account_title', {
        header: () => <div className="px-1">Account Title</div>,
        size: 260,
        cell: (info) => (
            <div className="px-1 text-wrap">{info.getValue() ?? '-'}</div>
        ),
    }),
    columnHelper.accessor('chart_of_account.expense_class', {
        header: () => <div className="px-1">Class</div>,
        size: 90,
        cell: (info) => (
            <div className="px-1 text-wrap">{info.getValue() ?? '-'}</div>
        ),
    }),
    columnHelper.accessor('ppmp_price_lists_count' as any, {
        header: () => <div className="px-1">Price Lists</div>,
        size: 110,
        cell: (info) => {
            const count = info.getValue() as number | undefined;
            return (
                <div className="px-1">
                    {count !== undefined ? (
                        <Badge variant={count > 0 ? 'default' : 'secondary'}>
                            {count}
                        </Badge>
                    ) : (
                        '-'
                    )}
                </div>
            );
        },
    }),
    columnHelper.display({
        id: 'actions',
        size: 80,
        cell: ({ row, table }) => (
            <div className="flex items-center gap-1">
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
