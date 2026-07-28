import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CcTypology } from '@/types';

const columnHelper = createColumnHelper<CcTypology>();

const responseTypeLabels: Record<string, string> = {
    A: 'Adaptation',
    M: 'Mitigation',
};

const categoryLabels: Record<string, string> = {
    '1': 'Policy Development and Governance',
    '2': 'Research, Development and Extension',
    '3': 'Knowledge Sharing and Capacity Building',
    '4': 'Service Delivery',
};

const columns = [
    columnHelper.accessor('code', {
        size: 100,
        header: () => <div className="px-1">Code</div>,
        cell: (info) => (
            <div className="px-1 text-wrap slashed-zero tabular-nums">
                {info.getValue()}
            </div>
        ),
    }),
    columnHelper.accessor('description', {
        size: 400,
        header: () => <div className="px-1">Description</div>,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor('response_type', {
        size: 120,
        header: () => <div className="px-1">Response Type</div>,
        cell: (info) => (
            <div className="px-1 text-wrap">
                {responseTypeLabels[info.getValue()] ?? info.getValue()}
            </div>
        ),
    }),
    columnHelper.accessor('strategic_priority.name', {
        size: 200,
        header: () => <div className="px-1">Strategic Priority</div>,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor('sub_sector.name', {
        size: 200,
        header: () => <div className="px-1">Sub Sector</div>,
        cell: (info) => (
            <div className="px-1 text-wrap">{info.getValue() ?? '—'}</div>
        ),
    }),
    columnHelper.accessor('category_code', {
        size: 200,
        header: () => <div className="px-1">Category Code</div>,
        cell: (info) => (
            <div className="px-1 text-wrap">
                {categoryLabels[info.getValue()] ?? info.getValue()}
            </div>
        ),
    }),
    columnHelper.accessor('item_num', {
        size: 100,
        header: () => <div className="px-1">Item No.</div>,
        cell: (info) => (
            <div className="px-1 text-wrap slashed-zero tabular-nums">
                {info.getValue()}
            </div>
        ),
    }),
    columnHelper.accessor('is_nccap_activity', {
        size: 120,
        header: () => <div className="px-1">NCCAP Activity</div>,
        cell: (info) => (
            <div className="px-1 text-wrap">
                {info.getValue() ? 'Yes' : 'No'}
            </div>
        ),
    }),
    columnHelper.display({
        id: 'actions',
        size: 82,
        cell: (info) => (
            <div className="flex gap-1">
                <Button
                    size="icon"
                    variant="outline"
                    disabled={!info.table.options.meta?.canEdit}
                    onClick={() =>
                        info.table.options.meta?.onEdit?.(info.row.original)
                    }
                >
                    <Pencil />
                </Button>
                <Button
                    size="icon"
                    variant="destructive"
                    disabled={!info.table.options.meta?.canDelete}
                    onClick={() =>
                        info.table.options.meta?.onDelete?.(info.row.original)
                    }
                >
                    <Trash />
                </Button>
            </div>
        ),
    }),
];

export default columns;
