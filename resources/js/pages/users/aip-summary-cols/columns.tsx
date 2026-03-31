import { createColumnHelper } from '@tanstack/react-table';
import { Plus, Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Decimal } from 'decimal.js';

const formatNumber = (val: string | null) => {
    if (!val) return '-';
    const num = parseFloat(val);
    return num
        ? num.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          })
        : '-';
};

const formatDate = (dateString: string) => {
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
    return `${months[Number(dateSplit[1]) - 1]}-${dateSplit[2]}`;
};

const columnHelper = createColumnHelper<any>();

const columns = [
    columnHelper.accessor('full_code', {
        id: 'full_code',
        header: () => <div className="text-left">AIP Reference Code</div>,
        size: 200,
        cell: (info) => <code>{info.getValue()}</code>,
    }),
    columnHelper.accessor('name', {
        id: 'name',
        header: () => (
            <div className="text-left">
                Program/Project/Activity Description
            </div>
        ),
        size: 400,
        cell: ({ row, getValue }) => (
            <div
                style={{ paddingLeft: `${row.original.depth * 20}px` }}
                className="flex gap-2"
            >
                {row.original.depth > 0 && (
                    <span className="text-muted-foreground opacity-50">↳</span>
                )}

                <span className="text-wrap">{getValue()}</span>
            </div>
        ),
    }),
    columnHelper.accessor('office.acronym', {
        id: 'office_acronym',
        header: () => <div className="text-left">Implementing Office</div>,
        size: 150,
        cell: (info) => info.getValue(),
    }),
    columnHelper.group({
        id: 'schedule',
        header: () => <div className="text-left">Schedule</div>,
        columns: [
            columnHelper.accessor('aip_entries', {
                id: 'start_date',
                header: () => <div className="text-left">Start</div>,
                cell: (info) =>
                    info.getValue()?.[0]
                        ? formatDate(info.getValue()[0].start_date)
                        : '—',
            }),
            columnHelper.accessor('aip_entries', {
                id: 'end_date',
                header: () => <div className="text-left">End</div>,
                cell: (info) =>
                    info.getValue()?.[0]
                        ? formatDate(info.getValue()[0].end_date)
                        : '—',
            }),
        ],
    }),
    columnHelper.accessor('aip_entries', {
        id: 'expected_output',
        header: () => <div className="text-left">Expected Outputs</div>,
        size: 400,
        cell: (info) => (
            <div className="text-wrap">
                {info.getValue()?.[0]?.expected_output || '—'}
            </div>
        ),
    }),
    columnHelper.accessor('current_fs.funding_source.code', {
        id: 'funding_sources',
        header: () => <div className="text-left">Funding Source</div>,
        size: 250,
        cell: (info) =>
            info.getValue() ? <Badge>{info.getValue()}</Badge> : '-',
    }),

    // --- GROUPED AMOUNTS ---
    columnHelper.group({
        id: 'amount',
        header: () => (
            <div className="text-left">Amount (in thousand pesos)</div>
        ),
        size: 400,
        columns: [
            columnHelper.accessor('current_fs.ps_amount', {
                id: 'ps_amount',
                header: () => <div className="text-right">PS</div>,
                cell: (info) => (
                    <div className="text-right">
                        {formatNumber(info.getValue())}
                    </div>
                ),
            }),
            columnHelper.accessor('current_fs.mooe_amount', {
                id: 'mooe_amount',
                header: () => <div className="text-right">MOOE</div>,
                cell: (info) => (
                    <div className="text-right">
                        {formatNumber(info.getValue())}
                    </div>
                ),
            }),
            columnHelper.accessor('current_fs.fe_amount', {
                id: 'fe_amount',
                header: () => <div className="text-right">FE</div>,
                cell: (info) => (
                    <div className="text-right">
                        {formatNumber(info.getValue())}
                    </div>
                ),
            }),
            columnHelper.accessor('current_fs.co_amount', {
                id: 'co_amount',
                header: () => <div className="text-right">CO</div>,
                cell: (info) => (
                    <div className="text-right">
                        {formatNumber(info.getValue())}
                    </div>
                ),
            }),
            columnHelper.display({
                id: 'amount_total',
                header: () => <div className="text-right font-bold">Total</div>,
                cell: ({ row }) => {
                    const fs = row.original.current_fs;
                    if (!fs) return <div className="text-right">-</div>;
                    const total = new Decimal(fs.co_amount || 0)
                        .plus(fs.fe_amount || 0)
                        .plus(fs.mooe_amount || 0)
                        .plus(fs.ps_amount || 0);
                    return (
                        <div className="text-right font-bold">
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
        header: () => (
            <div className="text-left">Climate Change Expenditure</div>
        ),
        size: 250,
        columns: [
            columnHelper.accessor('current_fs.ccet_adaptation', {
                id: 'cc_adaptation',
                header: () => <div className="text-right">Adaptation</div>,
                cell: (info) => (
                    <div className="text-right">
                        {formatNumber(info.getValue())}
                    </div>
                ),
            }),
            columnHelper.accessor('current_fs.ccet_mitigation', {
                id: 'cc_mitigation',
                header: () => <div className="text-right">Mitigation</div>,
                cell: (info) => (
                    <div className="text-right">
                        {formatNumber(info.getValue())}
                    </div>
                ),
            }),
        ],
    }),

    columnHelper.display({
        id: 'cc_typology_code',
        header: 'Typology',
        cell: () => <div className="text-right">-</div>,
    }),
    columnHelper.display({
        id: 'actions',
        size: 124,
        cell: ({ row, table }) => (
            <div className="flex items-center gap-1">
                <Button
                    size="icon"
                    onClick={() => table.options.meta?.onAdd?.(row.original)}
                    disabled={row.original.type === 'Sub-Activity'}
                >
                    <Plus className="h-4 w-4" />
                </Button>

                <Button
                    size="icon"
                    onClick={() => table.options.meta?.onEdit?.(row.original)}
                >
                    <Pencil className="h-4 w-4" />
                </Button>

                <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => table.options.meta?.onDelete?.(row.original)}
                >
                    <Trash className="h-4 w-4" />
                </Button>
            </div>
        ),
    }),
];

export default columns;
