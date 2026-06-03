import { createColumnHelper } from '@tanstack/react-table';
import type { Office } from '@/types/global';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash, Plus } from 'lucide-react';

const columnHelper = createColumnHelper<Office>();

const columns = () => {
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

    cols.push(
        columnHelper.display({
            id: 'action',
            size: 120,
            cell: ({ row, table }) => {
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
                            onClick={() =>
                                table.options.meta?.onAdd?.(row.original)
                            }
                        >
                            <Plus />
                        </Button>

                        <Button
                            size="icon"
                            variant="outline"
                            disabled={!canEdit}
                            onClick={() =>
                                table.options.meta?.onEdit?.(row.original)
                            }
                        >
                            <Pencil />
                        </Button>

                        <Button
                            size="icon"
                            variant="destructive"
                            disabled={!canDelete}
                            onClick={() =>
                                table.options.meta?.onDelete?.(row.original)
                            }
                        >
                            <Trash />
                        </Button>
                    </div>
                );
            },
        }),
    );

    return cols;
};

export default columns;
