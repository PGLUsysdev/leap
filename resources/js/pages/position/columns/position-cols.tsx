import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/base-ui-components/ui/button';
import type { Position } from '@/types';

const columnHelper = createColumnHelper<Position>();

const columns = [
    columnHelper.accessor('item_number', {
        size: 100,
        header: () => <div className="px-1">Item No.</div>,
        cell: (info) => (
            <div className="px-1 text-wrap slashed-zero tabular-nums">
                {info.getValue()}
            </div>
        ),
    }),
    columnHelper.accessor('office_id', {
        size: 100,
        header: () => <div className="px-1">Office</div>,
        cell: (info) => {
            const row = info.row.original;
            const office = row.office;

            return (
                <div className="px-1 text-wrap">
                    {office?.acronym ?? office?.name ?? info.getValue()}
                </div>
            );
        },
    }),
    columnHelper.accessor('ios_id', {
        size: 200,
        header: () => <div className="px-1">Class</div>,
        cell: (info) => {
            const row = info.row.original;

            return (
                <div className="px-1 text-wrap">
                    {row.ios?.class ?? info.getValue()}
                </div>
            );
        },
    }),
    columnHelper.accessor('ios_id', {
        id: 'salary_grade',
        size: 110,
        header: () => <div className="px-1">Salary Grade</div>,
        cell: (info) => {
            const row = info.row.original;

            return (
                <div className="px-1 text-wrap slashed-zero tabular-nums">
                    {row.ios?.salary_grade ?? info.getValue()}
                </div>
            );
        },
    }),
    columnHelper.accessor('employment_type', {
        size: 150,
        header: () => <div className="px-1">Employment Type</div>,
        cell: (info) => (
            <div className="px-1 text-wrap capitalize">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor('is_funded', {
        size: 100,
        header: () => <div className="px-1">Funded</div>,
        cell: (info) => (
            <div className="px-1 text-wrap">
                {info.getValue() ? 'Yes' : 'No'}
            </div>
        ),
    }),
    columnHelper.accessor('status', {
        size: 100,
        header: () => <div className="px-1">Status</div>,
        cell: (info) => {
            const status = info.getValue();

            return <div className="px-1 text-wrap capitalize">{status}</div>;
        },
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
                    <Trash2 />
                </Button>
            </div>
        ),
    }),
];

export default columns;
