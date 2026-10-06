import { createColumnHelper } from '@tanstack/react-table';
import { getCellNumericValue } from '@/lib/ps-calculations';
import type { ChartOfAccount, Position } from '@/types';

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
    rates: Record<string, number> = {},
    annualRateMap: Record<number, { current: number; budget: number }> = {},
    monthsOfService: Record<number, number> = {},
) {
    // Dynamic columns come strictly from PS chart of accounts.
    const psCoas = coas.filter((coa) => coa.expense_class === 'PS');

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
                    {Number(row.original.user?.step ?? 1)}
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
        ...psCoas.map((coa) =>
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
                        monthsOfService,
                    );

                    return value !== null ? (
                        <div className="px-1 text-right text-wrap">
                            {currency(value)}
                        </div>
                    ) : (
                        <div className="px-1 text-right text-wrap">-</div>
                    );
                },
                footer: ({ table }) => {
                    const total = table
                        .getCoreRowModel()
                        .rows.reduce((sum, row) => {
                            const val = getCellNumericValue(
                                row.original,
                                coa,
                                rates,
                                annualRateMap,
                                monthsOfService,
                            );

                            return sum + (val ?? 0);
                        }, 0);

                    return <div className="px-1 text-right">{currency(total)}</div>;
                },
            }),
        ),
    ];

    return columns;
}
