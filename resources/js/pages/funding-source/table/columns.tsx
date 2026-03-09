import { ColumnDef, createColumnHelper, RowData } from '@tanstack/react-table';
import { FundingSource } from '@/pages/types/types';
import { Button } from '@/components/ui/button';
import { Pencil, Trash } from 'lucide-react';

declare module '@tanstack/table-core' {
    interface TableMeta<TData extends RowData> {
        onEdit?: (record: TData) => void;
        onDelete?: (record: TData) => void;
    }
}

const columnHelper = createColumnHelper<FundingSource>();

export const columns: ColumnDef<FundingSource, any>[] = [
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
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('allow_typhoon', {
        header: 'Allow Typhoon',
        cell: (value) => (
            <span className="text-wrap">
                {value.getValue() ? 'True' : 'False'}
            </span>
        ),
    }),
    columnHelper.display({
        id: 'action',
        cell: ({ row, table }) => (
            <div className="flex">
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
