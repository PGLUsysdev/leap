import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PriceList } from '@/types/global';

const columnHelper = createColumnHelper<PriceList>();

const columns = (canEdit: boolean, canDelete: boolean, canMove: boolean) => {
    const cols = [];

    if (canMove) {
        cols.push(
            columnHelper.display({
                id: 'move-handle',
                size: 50,
                cell: ({ row, table }) => (
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                            table.options.meta?.onMove?.(row.original);
                        }}
                    >
                        <Move />
                    </Button>
                ),
            }),
        );
    }

    cols.push(
        columnHelper.accessor('item_number', {
            header: 'Item Number',
            size: 80,
            cell: (value) => (
                <div className="wrap-break-words whitespace-normal">
                    {value.getValue()}
                </div>
            ),
        }),
        columnHelper.accessor('description', {
            header: 'Description',
            size: 300,
            cell: (value) => (
                <div className="wrap-break-words py-1 leading-tight font-medium whitespace-normal">
                    {value.getValue()}
                </div>
            ),
        }),
        columnHelper.accessor('unit_of_measurement', {
            header: 'UOM',
            size: 100,
            cell: (value) => (
                <div className="whitespace-normal">{value.getValue()}</div>
            ),
        }),
        columnHelper.accessor('price', {
            header: () => (
                <div className="pr-8 text-end">
                    <span>Price</span>
                </div>
            ),
            size: 120,
            cell: (value) => (
                <div className="pr-8 text-end">
                    <span className="font-mono tabular-nums">
                        {value.getValue()}
                    </span>
                </div>
            ),
        }),
        columnHelper.accessor(
            'chart_of_account_ppmp_category.ppmp_category.name',
            {
                header: 'PPMP Category',
                size: 180,
                cell: (value) => (
                    <div className="leading-tight whitespace-normal">
                        {value.getValue()}
                    </div>
                ),
            },
        ),
        columnHelper.accessor(
            'chart_of_account_ppmp_category.chart_of_account.account_title',
            {
                header: 'Chart of Account',
                size: 250,
                cell: (value) => (
                    <div className="wrap-break-words text-xs leading-tight whitespace-normal text-muted-foreground">
                        {value.getValue()}
                    </div>
                ),
            },
        ),
    );

    if (canEdit || canDelete) {
        cols.push(
            columnHelper.display({
                id: 'action',
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
                                <Pencil className="h-4 w-4" />
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
                                <Trash className="h-4 w-4" />
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
