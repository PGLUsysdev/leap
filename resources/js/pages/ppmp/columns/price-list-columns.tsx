import { createColumnHelper } from '@tanstack/react-table';
import { formatCurrency } from '@/lib/utils';
import type { PriceList } from '@/types';

const columnHelper = createColumnHelper<PriceList>();

const columns = [
    columnHelper.accessor('item_number', {
        size: 100,
        header: () => <div className="text-center text-wrap">Item Number</div>,
        cell: (info) => {
            return <div>{info.getValue()}</div>;
        },
    }),
    columnHelper.accessor('description', {
        size: 600,
        header: () => <div className="text-center text-wrap">Description</div>,
        cell: (info) => {
            return (
                <div className="text-wrap slashed-zero tabular-nums">
                    {info.getValue()}
                </div>
            );
        },
    }),
    columnHelper.accessor('unit_of_measurement', {
        size: 200,
        header: () => (
            <div className="text-center text-wrap">Unit of Measurement</div>
        ),
        cell: (info) => {
            return <div className="text-wrap">{info.getValue()}</div>;
        },
    }),
    columnHelper.accessor('price', {
        size: 200,
        header: () => <div className="text-center text-wrap">Price</div>,
        cell: (info) => {
            return (
                <div className="text-right text-wrap slashed-zero tabular-nums">
                    {formatCurrency(info.getValue())}
                </div>
            );
        },
    }),
];

export default columns;
