import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { Plus, Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Ppa, FundingSource } from '@/types/global';
import { Badge } from '@/components/ui/badge';
import { Decimal } from 'decimal.js'; // Added Decimal.js import

export const formatNumber = (val: string) => {
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

    return `${months[Number(dateSplit[1]) - 1]}-${dateSplit[2]}`;
};

interface ColumnActions {
    onAddEntry: (entry: Ppa) => void;
    onEdit: (entry: Ppa) => void;
    onDelete: (entry: Ppa) => void;
    masterPpas: Ppa[];
}

const columnHelper = createColumnHelper<Ppa>();

const findPpaInTree = (nodes: Ppa[], targetId: number): Ppa | null => {
    for (const node of nodes) {
        if (node.id === targetId) return node;
        if (node.children && node.children.length > 0) {
            const found = findPpaInTree(node.children, targetId);
            if (found) return found;
        }
    }
    return null;
};

export const useAipColumns = (actions: ColumnActions) => {
    return useMemo(() => getColumns(actions), [actions]);
};

export const getColumns = ({
    onAddEntry,
    onEdit,
    onDelete,
    masterPpas,
}: ColumnActions): ColumnDef<Ppa, any>[] => [
    columnHelper.accessor('full_code', {
        header: 'AIP Reference Code',
        size: 200,
        cell: (info) => (
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-[12px]">
                {info.getValue()}
            </code>
        ),
    }),
    columnHelper.accessor('title', {
        header: 'Program/Project/Activity Description',
        size: 400,
        filterFn: (row, _columnId, value) => {
            const description: string = row.getValue('title');
            const refCode: string = row.getValue('full_code');
            const searchValue = (value as string)?.toLowerCase() || '';

            return (
                description.toLowerCase().includes(searchValue) ||
                refCode.toLowerCase().includes(searchValue)
            );
        },
        cell: ({ row, getValue }) => (
            <div
                style={{ paddingLeft: `${row.depth * 20}px` }}
                className="flex gap-2"
            >
                {row.depth > 0 && (
                    <span className="text-muted-foreground opacity-50">↳</span>
                )}
                <span className="break-words whitespace-normal">
                    {getValue()}
                </span>
            </div>
        ),
    }),
    columnHelper.accessor('office.acronym', {
        header: 'Implementing Office/Department',
        size: 250,
        cell: (info) => (
            <div className="break-words whitespace-normal">
                {info.getValue()}
            </div>
        ),
    }),
    columnHelper.group({
        header: 'Schedule of Implementation',
        size: 250,
        columns: [
            columnHelper.accessor('aip_entry.start_date', {
                header: 'Start Date',
                cell: (info) => formatDate(info.getValue()),
            }),
            columnHelper.accessor('aip_entry.end_date', {
                header: 'Completion Date',
                cell: (info) => formatDate(info.getValue()),
            }),
        ],
    }),
    columnHelper.accessor('aip_entry.expected_output', {
        header: 'Expected Outputs',
        size: 500,
        cell: (info) => (
            <div className="break-words whitespace-normal">
                {info.getValue()}
            </div>
        ),
    }),
    columnHelper.accessor('aip_entry.funding_source', {
        header: 'Funding Source',
        size: 300,
        cell: (info) =>
            info.getValue().length !== 0 ? (
                <div className="flex flex-col gap-4">
                    {info.getValue().map((value: FundingSource) => (
                        <Badge key={value.id}>{value.code}</Badge>
                    ))}
                </div>
            ) : (
                '-'
            ),
    }),
    columnHelper.group({
        header: 'Amount (in thousand pesos)',
        size: 600,
        columns: [
            columnHelper.accessor('aip_entry.funding_source', {
                id: 'ps_amount',
                header: () => <div className="text-right">PS</div>,
                cell: (info) => {
                    return info.getValue().length !== 0 ? (
                        <div className="flex flex-col gap-4">
                            {info.getValue().map((amount) => {
                                return (
                                    <span
                                        key={amount.id}
                                        className="block text-right"
                                    >
                                        {formatNumber(amount.pivot.ps_amount)}
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        <span className="block text-right">-</span>
                    );
                },
            }),
            columnHelper.accessor('aip_entry.funding_source', {
                id: 'mooe_amount',
                header: () => <div className="text-right">MOOE</div>,
                cell: (info) => {
                    return info.getValue().length !== 0 ? (
                        <div className="flex flex-col gap-4">
                            {info.getValue().map((amount) => {
                                return (
                                    <span
                                        key={amount.id}
                                        className="block text-right"
                                    >
                                        {formatNumber(amount.pivot.mooe_amount)}
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        <span className="block text-right">-</span>
                    );
                },
            }),
            columnHelper.accessor('aip_entry.funding_source', {
                id: 'fe_amount',
                header: () => <div className="text-right">FE</div>,
                cell: (info) => {
                    return info.getValue().length !== 0 ? (
                        <div className="flex flex-col gap-4">
                            {info.getValue().map((amount) => {
                                return (
                                    <span
                                        key={amount.id}
                                        className="block text-right"
                                    >
                                        {formatNumber(amount.pivot.fe_amount)}
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        <span className="block text-right">-</span>
                    );
                },
            }),
            columnHelper.accessor('aip_entry.funding_source', {
                id: 'co_amount',
                header: () => <div className="text-right">CO</div>,
                cell: (info) => {
                    return info.getValue().length !== 0 ? (
                        <div className="flex flex-col gap-4">
                            {info.getValue().map((amount) => {
                                return (
                                    <span
                                        key={amount.id}
                                        className="block text-right"
                                    >
                                        {formatNumber(amount.pivot.co_amount)}
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        <span className="block text-right">-</span>
                    );
                },
            }),
            columnHelper.display({
                id: 'amount_total',
                header: () => <div className="text-right">Total</div>,
                cell: ({ row }) => {
                    const items = row.original.aip_entry?.funding_source;

                    function calcTotalAmount(data) {
                        const pivot = data.pivot;

                        // Use Decimal.js for precise addition
                        const total = new Decimal(pivot.co_amount || 0)
                            .plus(new Decimal(pivot.fe_amount || 0))
                            .plus(new Decimal(pivot.mooe_amount || 0))
                            .plus(new Decimal(pivot.ps_amount || 0));

                        return total.toString();
                    }

                    return items?.length !== 0 ? (
                        <div className="flex flex-col gap-4">
                            {items?.map((amount) => {
                                return (
                                    <span
                                        key={amount.id}
                                        className="block text-right"
                                    >
                                        {formatNumber(calcTotalAmount(amount))}
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        <span className="block text-right">-</span>
                    );
                },
            }),
        ],
    }),
    columnHelper.group({
        header: 'AMOUNT of Climate Change Expenditure (in thousand pesos)',
        size: 400,
        columns: [
            columnHelper.accessor('aip_entry.funding_source', {
                id: 'cc_adaptation',
                header: () => (
                    <div className="text-right">Climate Change Adaptation</div>
                ),
                cell: (info) => {
                    return info.getValue().length !== 0 ? (
                        <div className="flex flex-col gap-4">
                            {info.getValue().map((amount) => {
                                return (
                                    <span
                                        key={amount.id}
                                        className="block text-right"
                                    >
                                        {formatNumber(
                                            amount.pivot.ccet_adaptation,
                                        )}
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        <span className="block text-right">-</span>
                    );
                },
            }),
            columnHelper.accessor('aip_entry.funding_source', {
                id: 'cc_mitigation',
                header: () => (
                    <div className="text-right">Climate Change Mitigation</div>
                ),
                cell: (info) => {
                    return info.getValue().length !== 0 ? (
                        <div className="flex flex-col gap-4">
                            {info.getValue().map((amount) => {
                                return (
                                    <span
                                        key={amount.id}
                                        className="block text-right"
                                    >
                                        {formatNumber(
                                            amount.pivot.ccet_mitigation,
                                        )}
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        <span className="block text-right">-</span>
                    );
                },
            }),
        ],
    }),
    columnHelper.display({
        id: 'cc_typology_code',
        header: 'CC Typology Code',
        size: 124,
        cell: () => {
            return <span className="block text-right">-</span>;
        },
    }),
    columnHelper.display({
        id: 'actions',
        size: 124,
        cell: ({ row }) => {
            const entry = row.original;
            const ppaId = entry.aip_entry?.ppa_id;
            const masterNode = ppaId ? findPpaInTree(masterPpas, ppaId) : null;
            const isSubActivity = masterNode?.type === 'Sub-Activity';

            return (
                <div className="flex items-center gap-1">
                    <Button
                        title="Add PPA"
                        size="icon"
                        onClick={() => onAddEntry(entry)}
                        disabled={isSubActivity}
                    >
                        <Plus />
                    </Button>

                    <Button
                        title="Edit"
                        size="icon"
                        onClick={() => onEdit(entry)}
                    >
                        <Pencil />
                    </Button>

                    <Button
                        title="Delete"
                        size="icon"
                        variant="destructive"
                        onClick={() => onDelete(entry)}
                    >
                        <Trash />
                    </Button>
                </div>
            );
        },
    }),
];
