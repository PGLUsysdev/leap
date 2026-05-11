import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PriceList } from '@/types/global';
import { Checkbox } from '@/components/ui/checkbox';

const columnHelper = createColumnHelper<PriceList>();

const columns = [
    columnHelper.display({
        id: 'select',
        size: 50,
        cell: ({ row, table }) => {
            const meta = table.options.meta;
            const rowData = row.original;
            const selectedItemToMoveId = meta?.selectedItemToMove.id;

            return (
                <Checkbox
                    aria-label="Select row"
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => {
                        row.toggleSelected(!!value);
                        meta?.onSelect?.(rowData, value);
                    }}
                    disabled={rowData.id === selectedItemToMoveId}
                />
            );
        },
    }),
    columnHelper.accessor('item_number', {
        header: 'Item Number',
        size: 80,
        cell: (value) => {
            return (
                <div className="wrap-break-words whitespace-normal">
                    {value.getValue()}
                </div>
            );
        },
    }),
    columnHelper.accessor('description', {
        header: 'Description',
        size: 300,
        cell: (value) => {
            return (
                <div className="wrap-break-words py-1 leading-tight font-medium whitespace-normal">
                    {value.getValue()}
                </div>
            );
        },
    }),
    columnHelper.accessor('unit_of_measurement', {
        header: 'UOM',
        size: 100,
        cell: (value) => {
            return <div className="whitespace-normal">{value.getValue()}</div>;
        },
    }),
    columnHelper.accessor('price', {
        header: () => {
            return (
                <div className="pr-8 text-end">
                    <span>Price</span>
                </div>
            );
        },
        size: 120,
        cell: (value) => {
            return (
                <div className="pr-8 text-end">
                    <span className="font-mono tabular-nums">
                        {value.getValue()}
                    </span>
                </div>
            );
        },
    }),
    columnHelper.accessor('category.name', {
        header: 'PPMP Category',
        size: 180,
        cell: (value) => {
            return (
                <div className="leading-tight whitespace-normal">
                    {value.getValue()}
                </div>
            );
        },
    }),
    columnHelper.accessor('chart_of_account.account_title', {
        header: 'Expense Account',
        size: 250,
        cell: (value) => {
            return (
                <div className="wrap-break-words text-xs leading-tight whitespace-normal">
                    {value.getValue()}
                </div>
            );
        },
    }),
    // columnHelper.display({
    //     id: 'action',
    //     size: 82,
    //     cell: ({ row, table }) => (
    //         <div className="flex items-center gap-1">
    //             <Button
    //                 size="icon"
    //                 variant="outline"
    //                 slot=""
    //                 onClick={() => table.options.meta?.onEdit?.(row.original)}
    //             >
    //                 <Pencil className="h-4 w-4" />
    //             </Button>

    //             <Button
    //                 size="icon"
    //                 variant="destructive"
    //                 onClick={() => table.options.meta?.onDelete?.(row.original)}
    //             >
    //                 <Trash className="h-4 w-4" />
    //             </Button>
    //         </div>
    //     ),
    // }),
];

export default columns;
