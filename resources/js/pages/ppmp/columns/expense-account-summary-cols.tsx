import { createColumnHelper } from '@tanstack/react-table';
import type { Ppmp, PriceList, ChartOfAccount } from '@/types/global';

type CoaWithPriceLists = ChartOfAccount & {
    price_lists: (PriceList & Ppmp)[];
};

const columnHelper = createColumnHelper<CoaWithPriceLists>();

const calculateQuarterlyTotal = (
    priceLists: CoaWithPriceLists['price_lists'],
    months: (
        | 'jan_amount'
        | 'feb_amount'
        | 'mar_amount'
        | 'apr_amount'
        | 'may_amount'
        | 'jun_amount'
        | 'jul_amount'
        | 'aug_amount'
        | 'sep_amount'
        | 'oct_amount'
        | 'nov_amount'
        | 'dec_amount'
    )[],
) => {
    return priceLists.reduce((total, item) => {
        return (
            total +
            months.reduce((sum, month) => {
                return sum + parseFloat(item[month] || '0');
            }, 0)
        );
    }, 0);
};

const columns = [
    columnHelper.accessor('account_title', {
        size: 200,
        header: () => <div>EXPENSE ACCOUNT</div>,
        footer: () => <div className="font-bold">Sub-total</div>,
        cell: ({ getValue }) => {
            return getValue();
        },
    }),
    columnHelper.accessor('account_number', {
        header: () => <div>ACCOUNT CODE</div>,
        footer: () => <div />,
        cell: ({ getValue }) => {
            return getValue();
        },
    }),
    columnHelper.display({
        id: 'total',
        header: () => <div>TOTAL (IN PPMP)</div>,
        footer: ({ table }) => {
            const total = table.getRowModel().rows.reduce((sum, row) => {
                const rowTotal = calculateQuarterlyTotal(
                    row.original.price_lists,
                    [
                        'jan_amount',
                        'feb_amount',
                        'mar_amount',
                        'apr_amount',
                        'may_amount',
                        'jun_amount',
                        'jul_amount',
                        'aug_amount',
                        'sep_amount',
                        'oct_amount',
                        'nov_amount',
                        'dec_amount',
                    ],
                );
                return sum + rowTotal;
            }, 0);
            return <div className="font-bold">{total.toFixed(2)}</div>;
        },
        cell: ({ row }) => {
            const total = calculateQuarterlyTotal(row.original.price_lists, [
                'jan_amount',
                'feb_amount',
                'mar_amount',
                'apr_amount',
                'may_amount',
                'jun_amount',
                'jul_amount',
                'aug_amount',
                'sep_amount',
                'oct_amount',
                'nov_amount',
                'dec_amount',
            ]);
            return total.toFixed(2);
        },
    }),
    columnHelper.display({
        id: 'q1',
        header: () => <div>1ST QTR</div>,
        footer: ({ table }) => {
            const total = table.getRowModel().rows.reduce((sum, row) => {
                const rowTotal = calculateQuarterlyTotal(
                    row.original.price_lists,
                    ['jan_amount', 'feb_amount', 'mar_amount'],
                );
                return sum + rowTotal;
            }, 0);
            return <div className="font-bold">{total.toFixed(2)}</div>;
        },
        cell: ({ row }) => {
            const total = calculateQuarterlyTotal(row.original.price_lists, [
                'jan_amount',
                'feb_amount',
                'mar_amount',
            ]);
            return total.toFixed(2);
        },
    }),
    columnHelper.display({
        id: 'q2',
        header: () => <div>2ND QTR</div>,
        footer: ({ table }) => {
            const total = table.getRowModel().rows.reduce((sum, row) => {
                const rowTotal = calculateQuarterlyTotal(
                    row.original.price_lists,
                    ['apr_amount', 'may_amount', 'jun_amount'],
                );
                return sum + rowTotal;
            }, 0);
            return <div className="font-bold">{total.toFixed(2)}</div>;
        },
        cell: ({ row }) => {
            const total = calculateQuarterlyTotal(row.original.price_lists, [
                'apr_amount',
                'may_amount',
                'jun_amount',
            ]);
            return total.toFixed(2);
        },
    }),
    columnHelper.display({
        id: 'q3',
        header: () => <div>3RD QTR</div>,
        footer: ({ table }) => {
            const total = table.getRowModel().rows.reduce((sum, row) => {
                const rowTotal = calculateQuarterlyTotal(
                    row.original.price_lists,
                    ['jul_amount', 'aug_amount', 'sep_amount'],
                );
                return sum + rowTotal;
            }, 0);
            return <div className="font-bold">{total.toFixed(2)}</div>;
        },
        cell: ({ row }) => {
            const total = calculateQuarterlyTotal(row.original.price_lists, [
                'jul_amount',
                'aug_amount',
                'sep_amount',
            ]);
            return total.toFixed(2);
        },
    }),
    columnHelper.display({
        id: 'q4',
        header: () => <div>4TH QTR</div>,
        footer: ({ table }) => {
            const total = table.getRowModel().rows.reduce((sum, row) => {
                const rowTotal = calculateQuarterlyTotal(
                    row.original.price_lists,
                    ['oct_amount', 'nov_amount', 'dec_amount'],
                );
                return sum + rowTotal;
            }, 0);
            return <div className="font-bold">{total.toFixed(2)}</div>;
        },
        cell: ({ row }) => {
            const total = calculateQuarterlyTotal(row.original.price_lists, [
                'oct_amount',
                'nov_amount',
                'dec_amount',
            ]);
            return total.toFixed(2);
        },
    }),
];

export default columns;
