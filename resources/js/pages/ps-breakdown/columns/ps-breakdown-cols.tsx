import { createColumnHelper } from '@tanstack/react-table';
import type { ChartOfAccount, Position } from '@/types/global';
import type { PsBreakdownItem } from '@/types/global';
import { Input } from '@/components/ui/input';
import { router } from '@inertiajs/react';
import { getCellNumericValue } from '@/lib/ps-calculations';

const columnHelper = createColumnHelper<Position>();

const currency = (value: string | number | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    return num.toLocaleString('en-US', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    });
};

export default function getColumns(
    coas: ChartOfAccount[],
    breakdownItems: PsBreakdownItem[],
    ppaFundingSourceId: number | null,
    rates: Record<string, number> = {},
    annualRateMap: Record<number, { current: number; budget: number }> = {},
) {
    const manualLookup = new Map<string, string>();
    for (const item of breakdownItems) {
        const key = `${item.chart_of_account_id}_${item.plantilla_position_id ?? ''}`;
        manualLookup.set(key, item.amount);
    }

    const columns = [
        columnHelper.accessor('item_number', {
            header: 'Position',
            size: 300,
            cell: (info) => (
                <span className="text-sm">
                    {info.row.original.ios?.class ?? '—'}
                </span>
            ),
            footer: () => <span className="font-semibold">Total</span>,
        }),
        columnHelper.accessor('user', {
            header: 'Name',
            size: 180,
            id: 'incumbent_name',
            cell: (info) => (
                <span className="text-sm">
                    {info.getValue()?.name ?? 'Vacant'}
                </span>
            ),
        }),
        columnHelper.display({
            id: 'sg_step',
            header: 'SG/Step',
            size: 90,
            cell: ({ row }) => (
                <span className="text-sm tabular-nums">
                    {row.original.ios?.salary_grade ?? '—'}/
                    {row.original.user?.step ?? 1}
                </span>
            ),
        }),
        columnHelper.display({
            id: 'monthly_salary',
            header: 'Monthly Salary',
            size: 140,
            cell: ({ row }) => {
                const monthly =
                    (annualRateMap[row.original.id]?.budget ?? 0) / 12;
                return (
                    <span className="text-sm tabular-nums">
                        {currency(monthly)}
                    </span>
                );
            },
            footer: ({ table }) => {
                const total = table
                    .getCoreRowModel()
                    .rows.reduce((sum, row) => {
                        return (
                            sum +
                            (annualRateMap[row.original.id]?.budget ?? 0) / 12
                        );
                    }, 0);
                return (
                    <span className="font-semibold tabular-nums">
                        {currency(total)}
                    </span>
                );
            },
        }),
        columnHelper.display({
            id: 'months',
            header: '# of Months',
            size: 100,
            cell: () => <span className="text-sm tabular-nums">12</span>,
        }),
        columnHelper.display({
            id: 'annual_salary',
            header: 'Annual Salary',
            size: 150,
            cell: ({ row }) => {
                const annual = annualRateMap[row.original.id]?.budget ?? 0;
                return (
                    <span className="text-sm tabular-nums">
                        {currency(annual)}
                    </span>
                );
            },
            footer: ({ table }) => {
                const total = table
                    .getCoreRowModel()
                    .rows.reduce((sum, row) => {
                        return (
                            sum + (annualRateMap[row.original.id]?.budget ?? 0)
                        );
                    }, 0);
                return (
                    <span className="font-semibold tabular-nums">
                        {currency(total)}
                    </span>
                );
            },
        }),
        ...coas.map((coa) =>
            columnHelper.display({
                id: `coa_${coa.id}`,
                header: coa.account_title,
                size: 300,
                cell: ({ row }) => {
                    const value = getCellNumericValue(
                        row.original,
                        coa,
                        rates,
                        annualRateMap,
                    );

                    if (coa.is_manual) {
                        const storedKey = `${coa.id}_${row.original.id}`;
                        const storedValue = manualLookup.get(storedKey);

                        return (
                            <Input
                                type="number"
                                className="w-full rounded border bg-background px-2 py-1 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                                defaultValue={storedValue ?? ''}
                                placeholder="0.00"
                                onBlur={(e) => {
                                    const parsed = Number(e.target.value);
                                    const newValue =
                                        e.target.value === '' || isNaN(parsed)
                                            ? null
                                            : parsed;

                                    if (
                                        ppaFundingSourceId &&
                                        newValue !== null
                                    ) {
                                        router.post(
                                            '/ps-breakdown-items',
                                            {
                                                ppa_funding_source_id:
                                                    ppaFundingSourceId,
                                                chart_of_account_id: coa.id,
                                                position_id: row.original.id,
                                                amount: newValue,
                                            },
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                            },
                                        );
                                    }
                                }}
                            />
                        );
                    }

                    return value !== null ? (
                        <span className="text-sm tabular-nums">
                            {currency(value)}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    );
                },
                footer: ({ table }) => {
                    let total;

                    if (coa.is_manual) {
                        total = breakdownItems
                            .filter(
                                (item) => item.chart_of_account_id === coa.id,
                            )
                            .reduce(
                                (sum, item) => sum + parseFloat(item.amount),
                                0,
                            );
                    } else {
                        total = table
                            .getCoreRowModel()
                            .rows.reduce((sum, row) => {
                                const val = getCellNumericValue(
                                    row.original,
                                    coa,
                                    rates,
                                    annualRateMap,
                                );
                                return sum + (val ?? 0);
                            }, 0);
                    }

                    return (
                        <span className="font-semibold tabular-nums">
                            {coa.is_manual && total <= 0
                                ? '—'
                                : currency(total)}
                        </span>
                    );
                },
            }),
        ),
    ];

    return columns;
}
