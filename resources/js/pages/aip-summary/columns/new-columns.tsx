import { createColumnHelper } from '@tanstack/react-table';
import { Decimal } from 'decimal.js';
import { Pencil, Plus, ShieldCheck, Trash } from 'lucide-react';
import { Badge } from '@/components/base-ui-components/ui/badge';
import { Button } from '@/components/base-ui-components/ui/button';
import type { AipEntry, AipOutput, PpaFundingSource } from '@/types';

type FundingSourceRow = AipEntry & {
    number: string;
    current_fs: PpaFundingSource | null;
    output: AipOutput | null;
    // Flat grouping keys used by DataTable column meta.spanKey:
    entryId: number;
    outputId: number | null;
};

const columnHelper = createColumnHelper<FundingSourceRow>();

function formatText(value: string | null | undefined) {
    return value?.trim() ? (
        value
    ) : (
        <div className="text-muted-foreground">-</div>
    );
}

function formatNumeric(value: string | null | undefined) {
    if (!value || Number(value) === 0) {
        return <div className="text-muted-foreground">-</div>;
    }

    return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);

    const month = new Intl.DateTimeFormat('en-US', {
        month: 'short',
    }).format(date);

    const year = new Intl.DateTimeFormat('en-US', {
        year: '2-digit',
    }).format(date);

    return `${month}-${year}`;
}

function formatDateCell(value: string | null | undefined) {
    return value ? (
        formatDate(value)
    ) : (
        <div className="text-muted-foreground">-</div>
    );
}

type AmountField =
    | 'ps_amount'
    | 'mooe_amount'
    | 'fe_amount'
    | 'co_amount'
    | 'ccet_adaptation'
    | 'ccet_mitigation';

function sumField(
    rows: Array<{ original: FundingSourceRow }>,
    field: AmountField,
) {
    return rows.reduce((sum, row) => {
        const fs = row.original.current_fs;
        const value = fs?.[field];

        if (!value || isNaN(Number(value))) {
            return sum;
        }

        return sum.plus(value);
    }, new Decimal(0));
}

const columns = [
    columnHelper.accessor('ppa.full_code', {
        size: 400,
        header: () => (
            <div className="text-center text-wrap">AIP Reference Code</div>
        ),
        cell: (info) => (
            <div className="text-wrap">{formatText(info.getValue())}</div>
        ),
        // footer: () => <div className="font-bold">Total</div>,
        meta: { rowSpan: true, spanKey: 'entryId' },
    }),
    columnHelper.accessor('ppa.name', {
        size: 600,
        header: () => (
            <div className="text-center text-wrap">
                Program / Project / Activity Description
            </div>
        ),
        cell: (info) => {
            const original = info.row.original as AipEntry & {
                number: string;
            };

            return (
                <div className="flex gap-1">
                    <span className="text-muted-foreground tabular-nums">
                        {original.number}
                    </span>{' '}
                    <div className="text-wrap">
                        {formatText(info.getValue())}
                    </div>
                    {original.ppa?.is_ps_pool && (
                        <Badge
                            variant="default"
                            title="PS Pool"
                            className="h-fit w-fit min-w-0 bg-emerald-600 p-1 text-white"
                        >
                            <ShieldCheck className="h-3.5 w-3.5" />
                        </Badge>
                    )}
                </div>
            );
        },
        meta: { rowSpan: true, spanKey: 'entryId' },
    }),
    columnHelper.accessor('output.office.acronym', {
        size: 400,
        header: () => (
            <div className="text-center text-wrap">
                Implementing Office / Department / Location
            </div>
        ),
        cell: (info) => (
            <div className="text-center text-wrap">
                {formatText(info.getValue())}
            </div>
        ),
        meta: { rowSpan: true, spanKey: 'outputId' },
    }),
    columnHelper.group({
        id: 'schedule',
        size: 500,
        header: () => (
            <div className="text-center text-wrap">
                Schedule of Implementation
            </div>
        ),
        columns: [
            columnHelper.accessor('output.start_date', {
                size: 100,
                header: () => (
                    <div className="text-center text-wrap">Starting Date</div>
                ),
                cell: (info) => (
                    <div className="text-center text-wrap">
                        {formatDateCell(info.getValue())}
                    </div>
                ),
                meta: { rowSpan: true, spanKey: 'outputId' },
            }),
            columnHelper.accessor('output.end_date', {
                size: 100,
                header: () => (
                    <div className="text-center text-wrap">Completion Date</div>
                ),
                cell: (info) => (
                    <div className="text-center text-wrap">
                        {formatDateCell(info.getValue())}
                    </div>
                ),
                meta: { rowSpan: true, spanKey: 'outputId' },
            }),
        ],
    }),
    columnHelper.accessor('output.expected_output', {
        size: 600,
        header: () => (
            <div className="text-center text-wrap">Expected Outputs</div>
        ),
        cell: (info) => (
            <div className="text-wrap">{formatText(info.getValue())}</div>
        ),
        meta: { rowSpan: true, spanKey: 'outputId' },
    }),
    columnHelper.accessor('ppa_funding_sources', {
        id: 'fs',
        size: 400,
        header: () => (
            <div className="text-center text-wrap">Funding Source</div>
        ),
        cell: (info) => {
            const fs = info.row.original.current_fs;

            return (
                <div className="text-center text-wrap">
                    {formatText(fs?.funding_source?.code)}
                </div>
            );
        },
    }),
    columnHelper.group({
        id: 'amount',
        size: 2000,
        header: () => (
            <div className="text-center text-wrap">
                Amount (in Thousand Pesos)
            </div>
        ),
        columns: [
            columnHelper.accessor('ppa_funding_sources', {
                id: 'ps',
                size: 100,
                header: () => (
                    <div className="text-center text-wrap">
                        Personal Services (PS)
                    </div>
                ),
                cell: (info) => {
                    const fs = info.row.original.current_fs;

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(fs?.ps_amount)}
                        </div>
                    );
                },
                footer: ({ table }) => {
                    const rows = table.getFilteredRowModel().flatRows;
                    const total = sumField(rows, 'ps_amount');

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(total.toString())}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('ppa_funding_sources', {
                id: 'mooe',
                size: 100,
                header: () => (
                    <div className="text-center text-wrap">
                        Maintenance & Other Operating Expenses (MOOE)
                    </div>
                ),
                cell: (info) => {
                    const fs = info.row.original.current_fs;

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(fs?.mooe_amount)}
                        </div>
                    );
                },
                footer: ({ table }) => {
                    const rows = table.getFilteredRowModel().flatRows;
                    const total = sumField(rows, 'mooe_amount');

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(total.toString())}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('ppa_funding_sources', {
                id: 'fe',
                size: 100,
                header: () => (
                    <div className="text-center text-wrap">
                        Financial Expenses (FE)
                    </div>
                ),
                cell: (info) => {
                    const fs = info.row.original.current_fs;

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(fs?.fe_amount)}
                        </div>
                    );
                },
                footer: ({ table }) => {
                    const rows = table.getFilteredRowModel().flatRows;
                    const total = sumField(rows, 'fe_amount');

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(total.toString())}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('ppa_funding_sources', {
                id: 'co',
                size: 100,
                header: () => (
                    <div className="text-center text-wrap">
                        Capital Outlay (CO)
                    </div>
                ),
                cell: (info) => {
                    const fs = info.row.original.current_fs;

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(fs?.co_amount)}
                        </div>
                    );
                },
                footer: ({ table }) => {
                    const rows = table.getFilteredRowModel().flatRows;
                    const total = sumField(rows, 'co_amount');

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(total.toString())}
                        </div>
                    );
                },
            }),
            columnHelper.display({
                id: 'total',
                size: 100,
                header: () => (
                    <div className="text-center text-wrap">Total</div>
                ),
                cell: (info) => {
                    const fs = info.row.original.current_fs;

                    if (!fs) {
                        return (
                            <div className="text-right text-wrap slashed-zero tabular-nums">
                                -
                            </div>
                        );
                    }

                    const total = new Decimal(fs.ps_amount || 0)
                        .plus(fs.mooe_amount || 0)
                        .plus(fs.fe_amount || 0)
                        .plus(fs.co_amount || 0);

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(total.toString())}
                        </div>
                    );
                },
                footer: ({ table }) => {
                    const rows = table.getFilteredRowModel().flatRows;
                    const total = rows.reduce((sum, row) => {
                        const fs = row.original.current_fs;

                        if (!fs) {
                            return sum;
                        }

                        return sum
                            .plus(fs.ps_amount || 0)
                            .plus(fs.mooe_amount || 0)
                            .plus(fs.fe_amount || 0)
                            .plus(fs.co_amount || 0);
                    }, new Decimal(0));

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(total.toString())}
                        </div>
                    );
                },
            }),
        ],
    }),
    columnHelper.group({
        id: 'climate-change',
        size: 800,
        header: () => (
            <div className="text-center text-wrap">
                Amount of Climate Change Expenditure (in Thousand Pesos)
            </div>
        ),
        columns: [
            columnHelper.accessor('ppa_funding_sources', {
                id: 'cc-adapt',
                size: 100,
                header: () => (
                    <div className="text-center text-wrap">
                        Climate Change Adaptation
                    </div>
                ),
                cell: (info) => {
                    const fs = info.row.original.current_fs;

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(fs?.ccet_adaptation)}
                        </div>
                    );
                },
                footer: ({ table }) => {
                    const rows = table.getFilteredRowModel().flatRows;
                    const total = sumField(rows, 'ccet_adaptation');

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(total.toString())}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('ppa_funding_sources', {
                id: 'cc-mitig',
                size: 100,
                header: () => (
                    <div className="text-center text-wrap">
                        Climate Change Mitigation
                    </div>
                ),
                cell: (info) => {
                    const fs = info.row.original.current_fs;

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(fs?.ccet_mitigation)}
                        </div>
                    );
                },
                footer: ({ table }) => {
                    const rows = table.getFilteredRowModel().flatRows;
                    const total = sumField(rows, 'ccet_mitigation');

                    return (
                        <div className="text-right text-wrap slashed-zero tabular-nums">
                            {formatNumeric(total.toString())}
                        </div>
                    );
                },
            }),
        ],
    }),
    columnHelper.accessor('ppa_funding_sources', {
        id: 'cc-typo',
        size: 200,
        header: () => (
            <div className="text-center text-wrap">CC Typology Code</div>
        ),
        cell: (info) => {
            const fs = info.row.original.current_fs;

            return (
                <div className="text-center text-wrap">
                    {formatText(fs?.cc_typology?.code)}
                </div>
            );
        },
    }),
    columnHelper.display({
        id: 'actions',
        size: 154,
        cell: ({ row, table }) => {
            const meta = table.options.meta;

            // console.log(row.original);

            // const isReadOnly = meta?.readOnly;
            // const canSetPsPool = meta?.canSetPsPool;
            // const can = row.original.can;
            // const canImport = can?.import;
            // const canEdit = can?.edit;
            // const canDelete = can?.delete;
            // const canEditFundingSources = can?.editFundingSources;
            // const canViewPpmp = can?.viewPpmp;
            // const canViewPsBreakdown = can?.viewPsBreakdown;

            // if (isReadOnly) {
            //     return (
            //         <div className="text-center text-muted-foreground">-</div>
            //     );
            // }

            return (
                <div className="flex items-center gap-1">
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={() => meta?.onAdd?.(row.original)}
                        disabled={row.original.ppa?.type === 'Sub-Activity'}
                    >
                        <Plus />
                    </Button>

                    <Button
                        size="icon"
                        variant="outline"
                        onClick={() => meta?.onEdit?.(row.original.id)}
                        // disabled={
                        //     !canEdit &&
                        //     !canEditFundingSources &&
                        //     !canViewPpmp &&
                        //     !canViewPsBreakdown
                        // }
                    >
                        <Pencil />
                    </Button>

                    <Button
                        size="icon"
                        variant="outline"
                        className={
                            row.original.ppa?.type === 'Program' &&
                            !row.original.ppa?.is_ps_pool
                                ? 'border-emerald-500 text-emerald-600 hover:bg-emerald-50'
                                : 'border-gray-300 text-gray-300'
                        }
                        onClick={() => meta?.onSetAsPsPool?.(row.original)}
                        disabled={
                            row.original.ppa?.type !== 'Program' ||
                            row.original.ppa?.is_ps_pool ||
                            !meta?.canSetPsPool
                        }
                        title={
                            !meta?.canSetPsPool
                                ? "You don't have permission to set the PS pool"
                                : row.original.ppa?.type !== 'Program'
                                  ? 'Only Programs can be designated as the PS pool'
                                  : row.original.ppa?.is_ps_pool
                                    ? 'This Program is already the PS pool'
                                    : 'Designate this Program as the PS pool'
                        }
                    >
                        <ShieldCheck className="h-4 w-4" />
                    </Button>

                    <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => meta?.onDelete?.(row.original)}
                        disabled={!meta?.canDelete}
                    >
                        <Trash />
                    </Button>
                </div>
            );
        },
        meta: { rowSpan: true, spanKey: 'entryId' },
    }),
];

export default columns;
