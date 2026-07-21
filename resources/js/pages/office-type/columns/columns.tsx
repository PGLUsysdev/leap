import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/base-ui-components/ui/button';
import type { OfficeType } from '@/types';

const columnHelper = createColumnHelper<OfficeType>();

const columns = [
    columnHelper.accessor('code', {
        header: 'Code',
        cell: (value) => (
            <span className="text-wrap">{value.getValue()}</span>
        ),
    }),
    columnHelper.accessor('name', {
        header: 'Type',
        cell: (value) => (
            <span className="text-wrap">{value.getValue()}</span>
        ),
    }),
    columnHelper.display({
        id: 'actions',
        size: 82,
        cell: ({ row, table }) => {
            const meta = table.options.meta as
                | {
                      canEdit?: boolean;
                      canDelete?: boolean;
                      onEdit?: (data: OfficeType) => void;
                      onDelete?: (data: OfficeType) => void;
                  }
                | undefined;
            const canEdit = meta?.canEdit ?? false;
            const canDelete = meta?.canDelete ?? false;

            if (!canEdit && !canDelete) {
                return null;
            }

            return (
                <div className="flex items-center gap-1">
                    {canEdit && (
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={() =>
                                meta?.onEdit?.(row.original)
                            }
                        >
                            <Pencil />
                        </Button>
                    )}

                    {canDelete && (
                        <Button
                            size="icon"
                            variant="destructive"
                            onClick={() =>
                                meta?.onDelete?.(row.original)
                            }
                        >
                            <Trash />
                        </Button>
                    )}
                </div>
            );
        },
    }),
];

export default columns;
