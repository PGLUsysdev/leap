import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash, Plus } from 'lucide-react';
import { Button } from '@/components/base-ui-components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Office } from '@/types';

const columnHelper = createColumnHelper<Office>();

const columns = [
    columnHelper.accessor('full_code', {
        header: 'Office Account Code',
        size: 200,
        cell: (info) => {
            return <code className="font-mono">{info.getValue()}</code>;
        },
    }),
    columnHelper.accessor('name', {
        header: 'Office Name',
        size: 300,
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
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
        header: 'Acronym',
        cell: (value) => (
            <span className="text-wrap">{value.getValue() ?? '-'}</span>
        ),
    }),
    columnHelper.accessor('is_lee', {
        header: 'LEE',
        cell: ({ row }) => (
            <div className="flex items-center">
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
        size: 120,
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
