import { createColumnHelper } from '@tanstack/react-table';
import type { ChartOfAccount, Position } from '@/types/global';
import type { PsBreakdownItem } from '@/types/global';
import { Input } from '@/components/ui/input';
import { router } from '@inertiajs/react';

const columnHelper = createColumnHelper<Position>();

const currency = (value: string | number | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    return num.toLocaleString('en-US', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    });
};

function getCellNumericValue(
    pos: Position,
    coa: ChartOfAccount,
    rates: Record<string, number>,
    annualRateMap: Record<number, { current: number; budget: number }>,
): number | null {
    const isOccupied = pos.status === 'occupied';
    const isRegular =
        pos.employment_type === 'permanent' ||
        pos.employment_type === 'coterminous';

    const currentAnnualRate = annualRateMap[pos.id]?.current ?? 0;
    const budgetAnnualRate = annualRateMap[pos.id]?.budget ?? 0;

    switch (coa.account_number) {
        case '5-01-01-010':
            return isRegular ? budgetAnnualRate : null;
        case '5-01-01-020':
            return pos.employment_type === 'casual' ||
                pos.employment_type === 'contractual'
                ? budgetAnnualRate
                : null;
        case '5-01-02-010':
            return isOccupied ? (rates['pera_monthly'] ?? 2000) * 12 : null;
        // case '5-01-02-020': // RATA — skipped
        //     if (isOccupied && isRegular && pos.salary_grade >= 16) {
        //         const ra =
        //             pos.salary_grade >= 24
        //                 ? (rates['rata_sg_24_above'] ?? 4000)
        //                 : (rates['rata_sg_16_23'] ?? 2000);
        //         return ra * 12;
        //     }
        //     return null;
        // case '5-01-02-030': // TA — skipped
        //     if (isOccupied && isRegular && pos.salary_grade >= 16) {
        //         const ta =
        //             pos.salary_grade >= 24
        //                 ? (rates['ta_sg_24_above'] ?? 2000)
        //                 : (rates['ta_sg_16_23'] ?? 1000);
        //         return ta * 12;
        //     }
        //     return null;
        case '5-01-02-040':
            return isOccupied ? Number(rates['clothing_annual'] ?? 5000) : null;
        case '5-01-02-050':
            if (isRegular) {
                return isOccupied
                    ? Number(rates['subsistence_daily_fulltime'] ?? 50) *
                          Number(rates['num_days_annual'] ?? 264)
                    : null;
            }
            return isOccupied
                ? Number(rates['subsistence_daily_parttime'] ?? 25) *
                      Number(rates['num_days_annual'] ?? 264)
                : null;
        case '5-01-02-060':
            return isOccupied ? (rates['laundry_monthly'] ?? 300) * 12 : null;
        // case '5-01-02-070': // Quarters Allowance — skipped
        //     return isOccupied ? (rates['quarters_monthly'] ?? 500) * 12 : null;
        case '5-01-02-080':
            return isOccupied ? Number(rates['pei_max'] ?? 5000) : null;
        case '5-01-02-140':
            return isOccupied ? currentAnnualRate / 12 : null;
        case '5-01-02-150':
            return isOccupied ? Number(rates['cash_gift'] ?? 5000) : null;
        case '5-01-03-010':
            return isOccupied && isRegular
                ? currentAnnualRate * ((rates['gsis_percent'] ?? 12) / 100)
                : null;
        case '5-01-03-020':
            return isOccupied ? (rates['pagibig_monthly'] ?? 100) * 12 : null;
        case '5-01-03-030':
            return isOccupied
                ? currentAnnualRate *
                      ((rates['philhealth_percent'] ?? 2.5) / 100)
                : null;
        case '5-01-03-040':
            return isOccupied
                ? currentAnnualRate * ((rates['ecip_percent'] ?? 1) / 100)
                : null;
        default:
            return null;
    }
}

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
                    {info.getValue()} — {info.row.original.title}
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
            id: 'monthly_salary',
            header: 'Monthly Salary',
            size: 140,
            cell: ({ row }) => {
                const monthly =
                    (annualRateMap[row.original.id]?.current ?? 0) / 12;
                return (
                    <span className="text-sm tabular-nums">
                        {currency(monthly)}
                    </span>
                );
            },
        }),
        columnHelper.display({
            id: 'months',
            header: '# of Months',
            size: 100,
            cell: () => <span className="text-sm tabular-nums">3</span>,
        }),
        columnHelper.display({
            id: 'annual_salary',
            header: 'Annual Salary',
            size: 150,
            cell: ({ row }) => {
                const monthly =
                    (annualRateMap[row.original.id]?.current ?? 0) / 12;
                const annual = monthly * 3;
                return (
                    <span className="text-sm tabular-nums">
                        {currency(annual)}
                    </span>
                );
            },
        }),
        columnHelper.display({
            id: 'total_annual_salary',
            header: 'Total Annual Salary',
            size: 150,
            cell: ({ row }) => (
                <span className="text-sm tabular-nums">
                    {currency(annualRateMap[row.original.id]?.current ?? 0)}
                </span>
            ),
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
