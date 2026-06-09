import { createColumnHelper } from '@tanstack/react-table';
import type { CcTypology } from '@/types/global';
import { Button } from '@/components/ui/button';
import { Pencil, Trash } from 'lucide-react';

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
        header: 'Code',
        size: 200,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor('description', {
        header: 'Description',
        size: 400,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor('response_type', {
        header: 'Response Type',
        size: 200,
        cell: (info) => (
            <div className="text-wrap">
                {responseTypeLabels[info.getValue()] ?? info.getValue()}
            </div>
        ),
    }),
    columnHelper.accessor('strategic_priority.name', {
        header: 'Strategic Priority',
        size: 200,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor('sub_sector.name', {
        header: 'Sub Sector',
        size: 200,
        cell: (info) => (
            <div className="text-wrap">{info.getValue() ?? '—'}</div>
        ),
    }),
    columnHelper.accessor('category_code', {
        header: 'Category Code',
        size: 200,
        cell: (info) => (
            <div className="text-wrap">
                {categoryLabels[info.getValue()] ?? info.getValue()}
            </div>
        ),
    }),
    columnHelper.accessor('item_num', {
        header: 'Item No.',
        size: 200,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor('is_nccap_activity', {
        header: 'NCCAP Activity',
        size: 200,
        cell: (info) => (
            <div className="text-wrap">{info.getValue() ? 'Yes' : 'No'}</div>
        ),
    }),
    columnHelper.accessor('action', {
        header: null,
        size: 80,
        cell: (info) => (
            <div className="text-wrap">
                <Button size="icon">
                    <Pencil />
                </Button>
                <Button size="icon" variant="destructive">
                    <Trash />
                </Button>
            </div>
        ),
    }),
];

export default columns;
