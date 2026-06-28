import { createColumnHelper } from '@tanstack/react-table';
import type { SalaryScheduleMatrixRow } from '@/types/global';

const currency = (value: number | null) =>
    value != null
        ? value.toLocaleString('en-US', {
              minimumFractionDigits: 2,
          })
        : '-';

const columns = (maxStep: number) => {
    const columnHelper = createColumnHelper<SalaryScheduleMatrixRow>();

    const cols = [
        // Added Fiscal Year column
        // columnHelper.accessor('fiscal_year_id', {
        //     header: 'Fiscal Year',
        //     size: 100,
        //     cell: (info) => (
        //         <span className="text-muted-foreground">{info.getValue()}</span>
        //     ),
        // }),
        columnHelper.accessor('salary_grade', {
            header: 'Salary Grade',
            size: 120,
            cell: (info) => (
                <span className="font-medium">{info.getValue()}</span>
            ),
        }),
    ];

    for (let step = 1; step <= maxStep; step++) {
        const key = `step_${step}` as const;
        cols.push(
            columnHelper.accessor(key as any, {
                // Cast as any to handle dynamic keys safely
                header: `Step ${step}`,
                size: 130,
                cell: (info) => (
                    <span className="tabular-nums">
                        {currency(info.getValue() as number | null)}
                    </span>
                ),
            }),
        );
    }

    return cols;
};

export default columns;
