import { createColumnHelper } from '@tanstack/react-table';
import type { FundingSource } from '@/types/global';
import { Decimal } from 'decimal.js';

const columnHelper = createColumnHelper<FundingSource>();

export const formatNumber = (val: string) => {
    const num = parseFloat(val);

    return num
        ? num.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          })
        : '-';
};

export const columns = [
    columnHelper.accessor('code', {
        header: 'Fund Type',
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('pivot.ps_amount', {
        // header: 'PERSONNAL SERVICES (PS)',
        header: 'PS',
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('pivot.mooe_amount', {
        // header: 'MAINTENANCE & OTHER OPERATING EXPENSES (MOOE)',
        header: 'MOOE',
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('pivot.fe_amount', {
        // header: 'FIANCIAL EXPENSES (FE)',
        header: 'FE',
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('pivot.co_amount', {
        header: 'CO',
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.display({
        id: 'amount_total',
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => {
            const items = row.original;
            console.log(items);

            function calcTotalAmount(data) {
                const pivot = data.pivot;

                // Use Decimal.js for precise addition
                const total = new Decimal(pivot.co_amount || 0)
                    .plus(new Decimal(pivot.fe_amount || 0))
                    .plus(new Decimal(pivot.mooe_amount || 0))
                    .plus(new Decimal(pivot.ps_amount || 0));

                return total.toString();
            }

            return (
                <div className="flex flex-col gap-4">
                    <span key={items.id} className="block text-right">
                        {formatNumber(calcTotalAmount(items))}
                    </span>
                </div>
            );
        },
    }),
    columnHelper.accessor('pivot.ccet_adaptation', {
        header: 'Fund Type',
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    columnHelper.accessor('pivot.ccet_mitigation', {
        header: 'Fund Type',
        cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
    }),
    // columnHelper.display({
    //     id: 'action',
    //     size: 86,
    //     cell: ({ row, table }) => (
    //         <div className="flex items-center gap-1">
    //             <Button
    //                 size="icon"
    //                 onClick={() => table.options.meta?.onEdit?.(row.original)}
    //             >
    //                 <Pencil />
    //             </Button>

    //             <Button
    //                 size="icon"
    //                 variant="destructive"
    //                 onClick={() => table.options.meta?.onDelete?.(row.original)}
    //             >
    //                 <Trash />
    //             </Button>
    //         </div>
    //     ),
    // }),
];
