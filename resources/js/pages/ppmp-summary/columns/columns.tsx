import { createColumnHelper } from "@tanstack/react-table";

interface PriceListRow {
    id: number;
    item_number: number;
    description: string;
    unit_of_measurement: string;
    price: string;
    chart_of_account_ppmp_category?: {
        chart_of_account_id: number;
        ppmp_category_id: number;
        chart_of_account?: {
            id: number;
            account_number: string;
            account_title: string;
        };
        ppmp_category?: {
            id: number;
            name: string;
        };
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
        ppa_funding_source: {
            aip_entry: {
                ppa: {
                    id: number;
                    name: string;
                };
            };
        };
    }>;
}

const columnHelper = createColumnHelper<PriceListRow>();

export const getPriceListColumns = (data: PriceListRow[]) => {
    const uniquePPAs = Array.from(
        new Map(
            data.flatMap((row) =>
                row.ppmps.map((p) => [
                    p.ppa_funding_source.aip_entry.ppa.id,
                    p.ppa_funding_source.aip_entry.ppa,
                ]),
            ),
        ).values(),
    );

    return [
        columnHelper.accessor("item_number", {
            size: 200,
            header: () => <div className="px-1">Item #</div>,
            cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
        }),
        columnHelper.accessor("description", {
            size: 800,
            header: () => <div className="px-1">Description</div>,
            cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
        }),
        columnHelper.accessor("unit_of_measurement", {
            size: 200,
            header: () => <div className="px-1">Unit</div>,
            cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
        }),
        columnHelper.accessor("price", {
            size: 300,
            header: () => <div className="px-1 text-right">Price</div>,
            cell: (info) => <div className="px-1 text-right text-wrap">{info.getValue()}</div>,
        }),

        columnHelper.group({
            id: "grand_totals",
            size: 500,
            columns: [
                columnHelper.display({
                    id: "total_qty",
                    size: 100,
                    header: () => <div className="px-1 text-right">Total QTY</div>,
                    cell: ({ row }) => (
                        <div className="px-1 text-right text-wrap">
                            {row.original.ppmps.reduce((sum, p) => sum + (p.total_qty || 0), 0)}
                        </div>
                    ),
                }),
                columnHelper.display({
                    id: "total_cost",
                    size: 100,
                    header: () => <div className="px-1 text-right">Total Cost</div>,
                    cell: ({ row }) => {
                        const total = row.original.ppmps.reduce(
                            (sum, p) => sum + Number(p.total_amount || 0),
                            0,
                        );

                        return (
                            <div className="px-1 text-right text-wrap">
                                {total.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                })}
                            </div>
                        );
                    },
                    footer: () => {
                        const grandTotal = data.reduce(
                            (sum, row) =>
                                sum +
                                row.ppmps.reduce(
                                    (rowSum, p) => rowSum + Number(p.total_amount || 0),
                                    0,
                                ),
                            0,
                        );

                        return (
                            <div className="px-1 text-right">
                                {grandTotal.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                })}
                            </div>
                        );
                    },
                }),
            ],
        }),

        // 1. Level 1: PPA Name Group
        ...uniquePPAs.map((ppa) =>
            columnHelper.group({
                id: `group_ppa_${ppa.id}`,
                size: 1600,
                header: () => <div className="px-1 text-center">{ppa.name}</div>,
                columns: [1, 2, 3, 4].map((q) =>
                    columnHelper.group({
                        id: `ppa_${ppa.id}_q${q}_group`,
                        size: 100,
                        header: () => <div className="px-1 text-center">Quarter {q}</div>,
                        columns: [
                            columnHelper.display({
                                id: `ppa_${ppa.id}_q${q}_qty`,
                                size: 100,
                                header: () => <div className="px-1 text-right">Qty</div>,
                                cell: ({ row }) => {
                                    const entries = row.original.ppmps.filter(
                                        (p) => p.ppa_funding_source.aip_entry.ppa.id === ppa.id,
                                    );

                                    return (
                                        <div className="px-1 text-right text-wrap">
                                            {entries.reduce(
                                                (sum, e) =>
                                                    sum + Number((e as any)[`q${q}_qty`] || 0),
                                                0,
                                            )}
                                        </div>
                                    );
                                },
                            }),
                            columnHelper.display({
                                id: `ppa_${ppa.id}_q${q}_cost`,
                                size: 100,
                                header: () => <div className="px-1 text-right">Cost</div>,
                                cell: ({ row }) => {
                                    const entries = row.original.ppmps.filter(
                                        (p) => p.ppa_funding_source.aip_entry.ppa.id === ppa.id,
                                    );
                                    const amount = entries.reduce(
                                        (sum, e) => sum + Number((e as any)[`q${q}_amount`] || 0),
                                        0,
                                    );

                                    return (
                                        <div className="px-1 text-right text-wrap">
                                            {Number(amount).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                            })}
                                        </div>
                                    );
                                },
                                footer: () => {
                                    const quarterTotal = data.reduce((sum, row) => {
                                        const entries = row.ppmps.filter(
                                            (p) => p.ppa_funding_source.aip_entry.ppa.id === ppa.id,
                                        );

                                        return (
                                            sum +
                                            entries.reduce(
                                                (rowSum, e) =>
                                                    rowSum +
                                                    Number((e as any)[`q${q}_amount`] || 0),
                                                0,
                                            )
                                        );
                                    }, 0);

                                    return (
                                        <div className="px-1 text-right">
                                            {quarterTotal.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                            })}
                                        </div>
                                    );
                                },
                            }),
                        ],
                    }),
                ),
            }),
        ),
    ];
};
