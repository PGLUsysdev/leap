import { createColumnHelper } from '@tanstack/react-table';

interface PriceListRow {
    id: number;
    item_number: number;
    description: string;
    unit_of_measurement: string;
    price: string;
    category: { id: number; name: string };
    chart_of_account: {
        id: number;
        account_number: string;
        account_title: string;
    };
    ppmps: Array<{
        id: number;
        q1_qty: number;
        q2_qty: number;
        q3_qty: number;
        q4_qty: number;
        q1_amount: string | number;
        q2_amount: string | number;
        q3_amount: string | number;
        q4_amount: string | number;
        total_qty: number;
        total_amount: string | number;
        aip_entry: {
            ppa: {
                id: number;
                title: string;
            };
        };
    }>;
}

const columnHelper = createColumnHelper<PriceListRow>();

export const getPriceListColumns = (data: PriceListRow[]) => {
    const uniquePPAs = Array.from(
        new Map(
            data.flatMap((row) =>
                row.ppmps.map((p) => [p.aip_entry.ppa.id, p.aip_entry.ppa]),
            ),
        ).values(),
    );

    return [
        // ... Static Columns (Item #, Description, etc.)
        columnHelper.accessor('item_number', { header: 'Item #', size: 50 }),
        columnHelper.accessor('description', {
            header: 'Description',
            size: 300,
            cell: (info) => (
                <div className="min-w-[300px] text-wrap">{info.getValue()}</div>
            ),
        }),
        columnHelper.accessor('unit_of_measurement', {
            header: 'Unit',
            size: 50,
        }),
        columnHelper.accessor('price', { header: 'Price', size: 100 }),
        columnHelper.group({
            id: 'grand_totals',
            size: 200,
            columns: [
                columnHelper.display({
                    id: 'total_qty',
                    header: 'Total QTY',
                    cell: ({ row }) =>
                        row.original.ppmps.reduce(
                            (sum, p) => sum + (p.total_qty || 0),
                            0,
                        ),
                }),
                columnHelper.display({
                    id: 'total_cost',
                    header: 'Total Cost',
                    cell: ({ row }) => {
                        const total = row.original.ppmps.reduce(
                            (sum, p) => sum + Number(p.total_amount || 0),
                            0,
                        );
                        return (
                            <span className="font-bold text-blue-600">
                                {total.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                })}
                            </span>
                        );
                    },
                    footer: () => {
                        const grandTotal = data.reduce(
                            (sum, row) =>
                                sum +
                                row.ppmps.reduce(
                                    (rowSum, p) =>
                                        rowSum + Number(p.total_amount || 0),
                                    0,
                                ),
                            0,
                        );
                        return (
                            <span className="font-bold text-blue-600">
                                {grandTotal.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                })}
                            </span>
                        );
                    },
                }),
            ],
        }),

        // 1. Level 1: PPA Name Group
        ...uniquePPAs.map((ppa) =>
            columnHelper.group({
                id: `group_ppa_${ppa.id}`,
                size: 400,
                header: () => <div className="font-bold">{ppa.name}</div>,
                columns: [
                    // 2. Level 2: Quarter Groups (Nested inside PPA)
                    ...[1, 2, 3, 4].map((q) =>
                        columnHelper.group({
                            id: `ppa_${ppa.id}_q${q}_group`,
                            header: () => <div>Quarter {q}</div>,
                            columns: [
                                // 3. Level 3: The actual data columns
                                columnHelper.display({
                                    id: `ppa_${ppa.id}_q${q}_qty`,
                                    header: 'Qty',
                                    cell: ({ row }) => {
                                        const entry = row.original.ppmps.find(
                                            (p) =>
                                                p.aip_entry.ppa.id === ppa.id,
                                        );
                                        return entry
                                            ? (entry as any)[`q${q}_qty`]
                                            : 0;
                                    },
                                }),
                                columnHelper.display({
                                    id: `ppa_${ppa.id}_q${q}_cost`,
                                    header: 'Cost',
                                    cell: ({ row }) => {
                                        const entry = row.original.ppmps.find(
                                            (p) =>
                                                p.aip_entry.ppa.id === ppa.id,
                                        );
                                        const amount = entry
                                            ? (entry as any)[`q${q}_amount`]
                                            : 0;
                                        return Number(amount).toLocaleString(
                                            undefined,
                                            { minimumFractionDigits: 2 },
                                        );
                                    },
                                    footer: () => {
                                        const quarterTotal = data.reduce(
                                            (sum, row) => {
                                                const entry = row.ppmps.find(
                                                    (p) =>
                                                        p.aip_entry.ppa.id ===
                                                        ppa.id,
                                                );
                                                return (
                                                    sum +
                                                    Number(
                                                        entry
                                                            ? (entry as any)[
                                                                  `q${q}_amount`
                                                              ]
                                                            : 0,
                                                    )
                                                );
                                            },
                                            0,
                                        );
                                        return quarterTotal.toLocaleString(
                                            undefined,
                                            { minimumFractionDigits: 2 },
                                        );
                                    },
                                }),
                            ],
                        }),
                    ),
                    // Optional: Total for this PPA across all quarters
                    // columnHelper.display({
                    //     id: `ppa_${ppa.id}_ppa_total`,
                    //     header: 'PPA Total',
                    //     cell: ({ row }) => {
                    //         const entry = row.original.ppmps.find(
                    //             (p) => p.aip_entry.ppa.id === ppa.id,
                    //         );
                    //         return (
                    //             <span className="font-bold">
                    //                 {Number(
                    //                     entry?.total_amount || 0,
                    //                 ).toLocaleString()}
                    //             </span>
                    //         );
                    //     },
                    // }),
                ],
            }),
        ),
    ];
};
