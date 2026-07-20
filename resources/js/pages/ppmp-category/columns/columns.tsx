import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PpmpCategory } from '@/types';

const columnHelper = createColumnHelper<PpmpCategory>();

const columns = (canEdit: boolean, canDelete: boolean) => {
    const cols = [
        columnHelper.accessor('name', {
            header: () => <div>Category Name</div>,
            size: 300,
            cell: (value) => (
                <div className="text-wrap">{value.getValue()}</div>
            ),
        }),
        columnHelper.accessor('is_non_procurement', {
            header: () => <div>Procurement Type</div>,
            size: 300,
            cell: (value) => (
                <div className="text-wrap">
                    {value.getValue() ? 'Non-Procurement' : 'Procurement'}
                </div>
            ),
        }),
        columnHelper.accessor('chart_of_account_ppmp_categories', {
            header: () => <div>Chart of Accounts</div>,
            size: 300,
            cell: ({ getValue }) => {
                return (
                    <div className="flex flex-wrap gap-2">
                        {getValue().map((item) => {
                            return (
                                <Badge key={item.id}>
                                    {item.chart_of_account?.account_title}
                                </Badge>
                            );
                        })}
                    </div>
                );
            },
        }),
    ];

    if (canEdit || canDelete) {
        cols.push(
            columnHelper.display({
                id: 'actions',
                size: canEdit && canDelete ? 82 : 48,
                cell: ({ row, table }) => (
                    <div className="flex items-center gap-1">
                        {canEdit && (
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={() =>
                                    table.options.meta?.onEdit?.(row.original)
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
                                    table.options.meta?.onDelete?.(row.original)
                                }
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
