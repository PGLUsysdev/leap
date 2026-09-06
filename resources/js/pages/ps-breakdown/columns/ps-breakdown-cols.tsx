import { router } from '@inertiajs/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Input } from '@/components/base-ui-components/ui/input';
import { getCellNumericValue } from '@/lib/ps-calculations';
import type { ChartOfAccount, Position } from '@/types';
import type { PsBreakdownItem } from '@/types';

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
            size: 300,
            header: () => <div className="px-1">Position</div>,
            cell: (info) => (
                <div className="px-1 text-wrap">
                    {info.row.original.ios?.class ?? '—'}
                </div>
            ),
            footer: () => <div className="px-1 font-semibold">Total</div>,
        }),
        columnHelper.accessor('user', {
            id: 'incumbent_name',
            size: 200,
            header: () => <div className="px-1">Name</div>,
            cell: (info) => (
                <div className="px-1 text-wrap">
                    {info.getValue()?.name ?? 'Vacant'}
                </div>
            ),
        }),
        columnHelper.display({
            id: 'sg_step',
            size: 100,
            header: () => <div className="px-1">SG/Step</div>,
            cell: ({ row }) => (
                <div className="px-1 text-wrap">
                    {row.original.ios?.salary_grade ?? '—'}/
                    {row.original.user?.step ?? 1}
                </div>
            ),
        }),
        columnHelper.display({
            id: 'monthly_salary',
            size: 150,
            header: () => <div className="px-1 text-right">Monthly Salary</div>,
            cell: ({ row }) => {
                const monthly =
                    (annualRateMap[row.original.id]?.budget ?? 0) / 12;

                return (
                    <div className="px-1 text-right text-wrap">
                        {currency(monthly)}
                    </div>
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

                return <div className="px-1 text-right">{currency(total)}</div>;
            },
        }),
        columnHelper.display({
            id: 'months',
            size: 100,
            header: () => <div className="px-1"># of Months</div>,
            cell: () => <div className="px-1 text-wrap">12</div>,
        }),
        columnHelper.display({
            id: 'annual_salary',
            size: 150,
            header: () => <div className="px-1 text-right">Annual Salary</div>,
            cell: ({ row }) => {
                const annual = annualRateMap[row.original.id]?.budget ?? 0;

                return (
                    <div className="px-1 text-right text-wrap">
                        {currency(annual)}
                    </div>
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

                return <div className="px-1 text-right">{currency(total)}</div>;
            },
        }),
        ...coas.map((coa) =>
            columnHelper.display({
                id: `coa_${coa.id}`,
                size: 310,
                header: () => (
                    <div className="px-1 text-right">{coa.account_title}</div>
                ),
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
                                className="bg-background text-foreground focus:ring-primary w-full rounded border px-2 py-1 text-sm focus:ring-2 focus:outline-none"
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
                        <div className="px-1 text-right text-wrap">
                            {currency(value)}
                        </div>
                    ) : (
                        <div className="px-1 text-right text-wrap">-</div>
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
                        <div className="px-1 text-right">
                            {coa.is_manual && total <= 0
                                ? '—'
                                : currency(total)}
                        </div>
                    );
                },
            }),
        ),
    ];

    return columns;
}
