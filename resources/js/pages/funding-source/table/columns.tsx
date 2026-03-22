import { createColumnHelper } from '@tanstack/react-table';
import type { RowData } from '@tanstack/react-table';
import { Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FundingSource } from '@/types/global';

declare module '@tanstack/table-core' {
    interface TableMeta<TData extends RowData> {
        onEdit?: (record: TData) => void;
        onDelete?: (record: TData) => void;
    }
}

const columnHelper = createColumnHelper<FundingSource>();

export const columns = [
    columnHelper.accessor('fund_type', {
        header: 'Fund Type',
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('code', {
        header: 'Code',
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('title', {
        header: 'Title',
        size: 500,
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('description', {
        header: 'Description',
        size: 300,
        cell: (value) => (
            <span className="text-wrap">{value.getValue() ?? '-'}</span>
        ),
    }),
    // columnHelper.accessor('allow_typhoon', {
    //     header: 'Allow Typhoon',
    //     cell: (value) => (
    //         <span className="text-wrap">
    //             {value.getValue() ? (
    //                 <Badge className="flex items-center gap-1">
    //                     <Check /> True
    //                 </Badge>
    //             ) : (
    //                 <Badge
    //                     variant="secondary"
    //                     className="flex items-center gap-1"
    //                 >
    //                     <X />
    //                     False
    //                 </Badge>
    //             )}
    //         </span>
    //     ),
    // }),
    columnHelper.display({
        id: 'action',
        size: 87,
        cell: ({ row, table }) => (
            <div className="flex gap-1">
                <Button
                    size="icon"
                    onClick={() => table.options.meta?.onEdit?.(row.original)}
                >
                    <Pencil />
                </Button>

                <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => table.options.meta?.onDelete?.(row.original)}
                >
                    <Trash />
                </Button>
            </div>
        ),
    }),
];
