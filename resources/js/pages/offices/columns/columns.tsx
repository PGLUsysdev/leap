import { createColumnHelper } from '@tanstack/react-table';
import type { Office } from '@/types/global';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash, Plus } from 'lucide-react';

const columnHelper = createColumnHelper<Office>();

const columns = (canAddSubUnit: boolean, canEdit: boolean, canDelete: boolean) => {
    const cols = [
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
                        className={`flex gap-2 text-wrap ${
                            row.original.parent_id ? 'ml-8' : ''
                        }`}
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
    ];

    if (canAddSubUnit || canEdit || canDelete) {
        cols.push(
            columnHelper.display({
                id: 'action',
                size: canAddSubUnit && canEdit && canDelete ? 120 : canAddSubUnit ? 120 : 82,
                cell: ({ row, table }) => (
                    <div className="flex items-center gap-1">
                        {canAddSubUnit && (
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={() => table.options.meta?.onAdd?.(row.original)}
                                disabled={!!row.original.parent_id}
                            >
                                <Plus />
                            </Button>
                        )}

                        {canEdit && (
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={() => table.options.meta?.onEdit?.(row.original)}
                            >
                                <Pencil />
                            </Button>
                        )}

                        {canDelete && (
                            <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => table.options.meta?.onDelete?.(row.original)}
                            >
                                <Trash />
                            </Button>
                        )}
                    </div>
                ),
            }),
        );
    }

    return cols;
};

export default columns;
