import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash, Plus } from 'lucide-react';
import { Button } from '@/components/base-ui-components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Office } from '@/types';

const columnHelper = createColumnHelper<Office>();

const columns = [
    columnHelper.accessor('full_code', {
        size: 200,
        header: () => <div className="px-1">Office Account Code</div>,
        cell: (info) => (
            <div className="px-1 font-mono text-wrap">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor('name', {
        size: 400,
        header: () => <div className="px-1">Office Name</div>,
        cell: ({ row }) => (
            <div className="flex items-center gap-2 px-1 text-wrap">
                <span
                    className={`flex gap-2 text-wrap ${row.original.parent_id ? 'ml-8' : ''}`}
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
        size: 100,
        header: () => <div className="px-1">Acronym</div>,
        cell: (value) => (
            <div className="px-1 text-wrap">{value.getValue() ?? '-'}</div>
        ),
    }),
    columnHelper.accessor('is_lee', {
        size: 100,
        header: () => <div className="px-1">LEE</div>,
        cell: ({ row }) => (
            <div className="flex items-center px-1 text-wrap">
                {row.getValue('is_lee') ? (
                    <Badge>Yes</Badge>
                ) : (
                    <Badge variant="secondary">No</Badge>
                )}
            </div>
        ),
    }),
    columnHelper.display({
        id: 'actions',
        size: 118,
        cell: ({ row, table }) => {
            const meta = table.options.meta as
                | {
                      onAdd?: (data: Office) => void;
                      onEdit?: (data: Office) => void;
                      onDelete?: (data: Office) => void;
                  }
                | undefined;
            const canAddSubUnit =
                !row.original.parent_id && row.original.can?.addSubUnit;
            const canEdit = row.original.parent_id
                ? row.original.can?.editSubUnit
                : row.original.can?.editOffice;
            const canDelete = row.original.parent_id
                ? row.original.can?.deleteSubUnit
                : row.original.can?.deleteOffice;

            return (
                <div className="flex items-center gap-1">
                    <Button
                        size="icon"
                        variant="outline"
                        disabled={!canAddSubUnit}
                        onClick={() => meta?.onAdd?.(row.original)}
                    >
                        <Plus />
                    </Button>

                    <Button
                        size="icon"
                        variant="outline"
                        disabled={!canEdit}
                        onClick={() => meta?.onEdit?.(row.original)}
                    >
                        <Pencil />
                    </Button>

                    <Button
                        size="icon"
                        variant="destructive"
                        disabled={!canDelete}
                        onClick={() => meta?.onDelete?.(row.original)}
                    >
                        <Trash />
                    </Button>
                </div>
            );
        },
    }),
];

export default columns;
