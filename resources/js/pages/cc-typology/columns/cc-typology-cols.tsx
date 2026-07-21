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

export interface ColumnActions {
    onEdit: (typology: CcTypology) => void;
    onDelete: (typology: CcTypology) => void;
    can?: {
        add: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export default function columns({ onEdit, onDelete, can }: ColumnActions) {
    return [
        columnHelper.accessor('code', {
            header: 'Code',
            size: 150,
            cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
        }),
        columnHelper.accessor('description', {
            header: 'Description',
            size: 400,
            cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
        }),
        columnHelper.accessor('response_type', {
            header: 'Response Type',
            size: 150,
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
            size: 150,
            cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
        }),
        columnHelper.accessor('is_nccap_activity', {
            header: 'NCCAP Activity',
            size: 150,
            cell: (info) => (
                <div className="text-wrap">
                    {info.getValue() ? 'Yes' : 'No'}
                </div>
            ),
        }),
        columnHelper.display({
            id: 'action',
            size: 84,
            cell: (info) => (
                <div className="flex gap-1">
                    <Button
                        size="icon"
                        variant="outline"
                        disabled={!can?.edit}
                        onClick={() => onEdit(info.row.original)}
                    >
                        <Pencil />
                    </Button>
                    <Button
                        size="icon"
                        variant="destructive"
                        disabled={!can?.delete}
                        onClick={() => onDelete(info.row.original)}
                    >
                        <Trash />
                    </Button>
                </div>
            ),
        }),
    ];
}
