import { createColumnHelper } from '@tanstack/react-table';
import { PriceList } from '@/pages/types/types';
import { Button } from '@/components/ui/button';
import { Pencil, Trash } from 'lucide-react';

const columnHelper = createColumnHelper<PriceList>();

export const columns = [
    columnHelper.accessor('item_number', {
        header: 'Item Number',
        size: 100,
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('description', {
        header: 'Description',
        size: 200,
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('unit_of_measurement', {
        header: 'Unit of Measurement',
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('price', {
        header: () => (
            <div className="pr-8 text-end">
                <span>Price</span>
            </div>
        ),
        cell: (value) => (
            <div className="pr-8 text-end">
                <span className="text-wrap tabular-nums">
                    {value.getValue()}
                </span>
            </div>
        ),
    }),
    columnHelper.accessor('category.name', {
        header: 'PPMP Category',
        size: 200,
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('chart_of_account.account_title', {
        header: 'Expense Account',
        size: 300,
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.display({
        id: 'action',
        size: 85,
        cell: () => (
            <div className="flex gap-0.5">
                <Button size="icon">
                    <Pencil />
                </Button>
                <Button size="icon" variant="destructive">
                    <Trash />
                </Button>
            </div>
        ),
    }),
];
