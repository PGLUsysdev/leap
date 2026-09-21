import { createColumnHelper } from '@tanstack/react-table';
import { Decimal } from 'decimal.js';
import { Plus, Pencil, Trash, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { FlattenedPpa, PpaFundingSource } from '@/types';

export const formatNumber = (val: string | null) => {
    if (!val) {
        return '-';
    }

    const num = parseFloat(val);

    return num
        ? num.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          })
        : '-';
};

export const formatDate = (dateString: string) => {
    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];
    const dateSplit = dateString.split('-');

    return `${months[Number(dateSplit[1]) - 1]}-${dateSplit[0].slice(2)}`;
};

const sumField = (rows: any[], field: keyof PpaFundingSource) => {
    return rows.reduce((sum, row) => {
        const value = row.original.current_fs?.[field];
        const num =
            typeof value === 'string' ? parseFloat(value) : (value ?? 0);

        return sum + (isNaN(num) ? 0 : num);
    }, 0);
};

const columnHelper = createColumnHelper<FlattenedPpa>();

const columns = [
    columnHelper.accessor('full_code', {
        id: 'full_code',
        size: 220,
        header: () => <div className="px-1">AIP Reference Code</div>,
        cell: (info) => {
            return (
                <div className="px-1 font-mono text-wrap">
                    {info.getValue()}
                </div>
            );
        },
        meta: { rowSpan: true },
    }),
    columnHelper.accessor('name', {
        id: 'name',
        size: 400,
        header: () => (
            <div className="px-1">Program/Project/Activity Description</div>
        ),
        cell: ({ row }) => {
            const ppa = row.original;

            return (
                <div className="px-1">
                    <div
                        style={{ paddingLeft: `${ppa.depth * 20}px` }}
                        className="flex gap-2"
                    >
                        {row.original.depth > 0 && (
                            <span className="text-muted-foreground opacity-50">
                                ↳
                            </span>
                        )}

                        <div className="flex flex-col">
                            <span className="text-muted-foreground text-[10px] font-bold uppercase">
                                {ppa.type}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                    className={`wrap-break-words leading-tight whitespace-normal ${
                                        ppa.depth === 0
                                            ? 'font-bold'
                                            : 'font-medium'
                                    }`}
                                >
                                    {ppa.name}
                                </span>

                                {ppa.is_ps_pool && (
                                    <Badge
                                        variant="default"
                                        title="PS Pool"
                                        className="h-fit w-fit min-w-0 bg-emerald-600 p-1 text-white"
                                    >
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        },
        meta: { rowSpan: true },
    }),
    columnHelper.accessor('office.acronym', {
        id: 'office_acronym',
        size: 200,
        header: () => <div className="px-1">Implementing Office</div>,
        cell: ({ row }) => {
            const office = row.original.office;

            if (office?.parent?.acronym && office?.acronym) {
                return (
                    <div className="px-1 text-wrap">
                        {`${office.parent.acronym}/${office.acronym}`}
                    </div>
                );
            }

            return (
                <div className="px-1 text-wrap">{office?.acronym || '-'}</div>
            );
        },
        meta: { rowSpan: true },
    }),
    columnHelper.group({
        id: 'schedule',
        size: 200,
        header: () => <div className="px-1 text-left">Schedule</div>,
        columns: [
            columnHelper.accessor('aip_entry', {
                id: 'start_date',
                size: 100,
                header: () => <div className="px-1">Start</div>,
                cell: (info) => (
                    <div className="px-1 text-wrap">
                        {info.getValue()?.start_date
                            ? formatDate(info.getValue()?.start_date)
                            : '-'}
                    </div>
                ),
                meta: { rowSpan: true },
            }),
            columnHelper.accessor('aip_entry', {
                id: 'end_date',
                size: 100,
                header: () => <div className="px-1">End</div>,
                cell: (info) => (
                    <div className="px-1 text-wrap">
                        {info.getValue()?.end_date
                            ? formatDate(info.getValue()?.end_date)
                            : '-'}
                    </div>
                ),
                meta: { rowSpan: true },
            }),
        ],
    }),
    columnHelper.accessor('aip_entry', {
        id: 'expected_output',
        size: 400,
        header: () => <div className="px-1">Expected Outputs</div>,
        cell: (info) => (
            <div className="px-1 text-wrap">
                {info.getValue()?.expected_output || '—'}
            </div>
        ),
        meta: { rowSpan: true },
    }),
    columnHelper.accessor('current_fs.funding_source.code', {
        id: 'funding_sources',
        size: 300,
        header: () => <div className="px-1">Funding Source</div>,
        cell: (info) => (
            <div className="px-1 text-wrap">
                {info.getValue() ? <Badge>{info.getValue()}</Badge> : '-'}
            </div>
        ),
    }),

    // --- GROUPED AMOUNTS ---
    columnHelper.group({
        id: 'amount',
        // size: 100,
        header: () => (
            <div className="px-1 text-center">Amount (in thousand pesos)</div>
        ),
        columns: [
            columnHelper.accessor('current_fs.ps_amount', {
                id: 'ps_amount',
                size: 150,
                header: () => <div className="px-1 text-right">PS</div>,
                cell: (info) => (
                    <div className="px-1 text-right text-wrap">
                        {formatNumber(info.getValue())}
                    </div>
                ),
                footer: ({ table }) => {
                    const rows = table.getFilteredRowModel().flatRows;
                    const total = sumField(rows, 'ps_amount');

                    return (
                        <div className="px-1 text-right">
                            {formatNumber(total.toString())}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('current_fs.mooe_amount', {
                id: 'mooe_amount',
                size: 150,
                header: () => <div className="px-1 text-right">MOOE</div>,
                cell: (info) => (
                    <div className="px-1 text-right text-wrap">
                        {formatNumber(info.getValue())}
                    </div>
                ),
                footer: ({ table }) => {
                    const rows = table.getFilteredRowModel().flatRows;
                    const total = sumField(rows, 'mooe_amount');

                    return (
                        <div className="px-1 text-right">
                            {formatNumber(total.toString())}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('current_fs.fe_amount', {
                id: 'fe_amount',
                size: 150,
                header: () => <div className="px-1 text-right">FE</div>,
                cell: (info) => (
                    <div className="px-1 text-right text-wrap">
                        {formatNumber(info.getValue())}
                    </div>
                ),
                footer: ({ table }) => {
                    const rows = table.getFilteredRowModel().flatRows;
                    const total = sumField(rows, 'fe_amount');

                    return (
                        <div className="px-1 text-right">
                            {formatNumber(total.toString())}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('current_fs.co_amount', {
                id: 'co_amount',
                size: 150,
                header: () => <div className="px-1 text-right">CO</div>,
                cell: (info) => (
                    <div className="px-1 text-right text-wrap">
                        {formatNumber(info.getValue())}
                    </div>
                ),
                footer: ({ table }) => {
                    const rows = table.getFilteredRowModel().flatRows;
                    const total = sumField(rows, 'co_amount');

                    return (
                        <div className="px-1 text-right">
                            {formatNumber(total.toString())}
                        </div>
                    );
                },
            }),
            columnHelper.display({
                id: 'amount_total',
                size: 150,
                header: () => <div className="px-1 text-right">Total</div>,
                cell: ({ row }) => {
                    const fs = row.original.current_fs;

                    if (!fs) {
                        return <div className="px-1 text-right">-</div>;
                    }

                    const total = new Decimal(fs.co_amount || 0)
                        .plus(fs.fe_amount || 0)
                        .plus(fs.mooe_amount || 0)
                        .plus(fs.ps_amount || 0);

                    return (
                        <div className="px-1 text-right text-wrap">
                            {formatNumber(total.toString())}
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

                        const rowTotal = new Decimal(fs.co_amount || 0)
                            .plus(fs.fe_amount || 0)
                            .plus(fs.mooe_amount || 0)
                            .plus(fs.ps_amount || 0);

                        return sum + rowTotal.toNumber();
                    }, 0);

                    return (
                        <div className="px-1 text-right">
                            {formatNumber(total.toString())}
                        </div>
                    );
                },
            }),
        ],
    }),

    // --- GROUPED CLIMATE CHANGE ---
    columnHelper.group({
        id: 'climateChange',
        // size: 100,
        header: () => (
            <div className="px-1 text-center">Climate Change Expenditure</div>
        ),
        columns: [
            columnHelper.accessor('current_fs.ccet_adaptation', {
                id: 'cc_adaptation',
                size: 150,
                header: () => <div className="px-1 text-right">Adaptation</div>,
                cell: (info) => (
                    <div className="px-1 text-right text-wrap">
                        {formatNumber(info.getValue())}
                    </div>
                ),
                footer: ({ table }) => {
                    const rows = table.getFilteredRowModel().flatRows;
                    const total = sumField(rows, 'ccet_adaptation');

                    return (
                        <div className="px-1 text-right">
                            {formatNumber(total.toString())}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('current_fs.ccet_mitigation', {
                id: 'cc_mitigation',
                size: 150,
                header: () => (
                    <div className="px-1 text-right text-wrap">Mitigation</div>
                ),
                cell: (info) => (
                    <div className="px-1 text-right">
                        {formatNumber(info.getValue())}
                    </div>
                ),
                footer: ({ table }) => {
                    const rows = table.getFilteredRowModel().flatRows;
                    const total = sumField(rows, 'ccet_mitigation');

                    return (
                        <div className="px-1 text-right">
                            {formatNumber(total.toString())}
                        </div>
                    );
                },
            }),
        ],
    }),

    columnHelper.accessor('current_fs.cc_typology.code', {
        id: 'cc_typology_code',
        size: 100,
        header: () => <div className="px-1">Typology</div>,
        cell: (info) => {
            const code = info.getValue();

            return <div className="px-1 text-wrap">{code || '-'}</div>;
        },
        footer: () => <div className="px-1">-</div>,
    }),

    columnHelper.display({
        id: 'actions',
        size: 154,
        cell: ({ row, table }) => {
            const meta = table.options.meta as any;
            const isReadOnly = meta?.readOnly;
            const canSetPsPool = meta?.canSetPsPool;
            const can = row.original.can;
            const canImport = can?.import;
            const canEdit = can?.edit;
            const canDelete = can?.delete;
            const canEditFundingSources = can?.editFundingSources;
            const canViewPpmp = can?.viewPpmp;
            const canViewPsBreakdown = can?.viewPsBreakdown;

            if (isReadOnly) {
                return (
                    <div className="text-muted-foreground text-center">-</div>
                );
            }

            return (
                <div className="flex items-center gap-1">
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={() => meta?.onAdd?.(row.original)}
                        disabled={
                            row.original.type === 'Sub-Activity' || !canImport
                        }
                    >
                        <Plus />
                    </Button>

                    <Button
                        size="icon"
                        variant="outline"
                        onClick={() => meta?.onEdit?.(row.original)}
                        disabled={
                            !canEdit &&
                            !canEditFundingSources &&
                            !canViewPpmp &&
                            !canViewPsBreakdown
                        }
                    >
                        <Pencil />
                    </Button>

                    <Button
                        size="icon"
                        variant="outline"
                        className={
                            row.original.type === 'Program' &&
                            !row.original.is_ps_pool
                                ? 'border-emerald-500 text-emerald-600 hover:bg-emerald-50'
                                : 'border-gray-300 text-gray-300'
                        }
                        onClick={() => meta?.onSetAsPsPool?.(row.original)}
                        disabled={
                            row.original.type !== 'Program' ||
                            row.original.is_ps_pool ||
                            !canSetPsPool
                        }
                        title={
                            !canSetPsPool
                                ? "You don't have permission to set the PS pool"
                                : row.original.type !== 'Program'
                                  ? 'Only Programs can be designated as the PS pool'
                                  : row.original.is_ps_pool
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
                        disabled={!canDelete}
                    >
                        <Trash />
                    </Button>
                </div>
            );
        },
        meta: { rowSpan: true },
    }),
];

export default columns;
