import { createColumnHelper } from "@tanstack/react-table";
import type { SalaryScheduleMatrixRow } from "@/types";

const currency = (value: number | null) =>
    value != null
        ? value.toLocaleString("en-US", {
              minimumFractionDigits: 2,
          })
        : "-";

const columns = (maxStep: number) => {
    const columnHelper = createColumnHelper<SalaryScheduleMatrixRow>();

    const cols = [
        columnHelper.accessor("salary_grade", {
            size: 100,
            header: () => <div className="px-1">Salary Grade</div>,
            cell: (info) => (
                <div className="px-1 text-wrap slashed-zero tabular-nums">{info.getValue()}</div>
            ),
        }),
    ];

    for (let step = 1; step <= maxStep; step++) {
        const key = `step_${step}` as const;
        cols.push(
            columnHelper.accessor(key as any, {
                size: 150,
                header: () => <div className="px-1 text-right">Step {step}</div>,
                cell: (info) => (
                    <div className="px-1 text-right text-wrap slashed-zero tabular-nums">
                        {currency(info.getValue() as number | null)}
                    </div>
                ),
            }),
        );
    }

    return cols;
};

export default columns;
