import type { ChartOfAccount } from "@/types";
import { createColumnHelper } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

const columnHelper = createColumnHelper<ChartOfAccount>();

const currency = (value: number) =>
    value.toLocaleString("en-US", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
    });

const columns = [
    columnHelper.accessor("account_number", {
        header: "Account Code",
        size: 140,
        cell: (info) => <code className="font-mono text-xs">{info.getValue()}</code>,
    }),
    columnHelper.accessor("account_title", {
        header: "Object of Expenditure",
        size: 400,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.display({
        id: "amount",
        header: "Amount",
        size: 150,
        cell: ({ row }) => {
            const coa = row.original;
            // Amount is handled by the column's meta - just display placeholder
            return <span className="text-muted-foreground tabular-nums">—</span>;
        },
        footer: () => (
            <span className="font-semibold tabular-nums">{/* Total computed server-side */}</span>
        ),
    }),
    columnHelper.accessor("account_number", {
        id: "calculation",
        header: "Calculation",
        size: 400,
        cell: (info) => {
            const num = info.getValue();
            switch (num) {
                case "5-01-01-010":
                    return (
                        <span className="text-xs">
                            Sum of Annual Salaries (Regular + Co-terminous)
                        </span>
                    );
                case "5-01-01-020":
                    return (
                        <span className="text-xs">
                            Sum of Annual Salaries (Casual + Contractual)
                        </span>
                    );
                case "5-01-02-010":
                    return (
                        <span className="text-xs">
                            Occupied positions × ₱2,000/month × 12 months
                        </span>
                    );
                // case '5-01-02-020': // RATA — skipped
                // case '5-01-02-030': // TA — skipped
                case "5-01-02-040":
                    return <span className="text-xs">Occupied positions × ₱5,000/year</span>;
                case "5-01-02-050":
                    return (
                        <span className="text-xs">
                            Full-time × ₱50/day × working days + Part-time × ₱25/day × working days
                        </span>
                    );
                case "5-01-02-060":
                    return (
                        <span className="text-xs">Occupied positions × ₱300/month × 12 months</span>
                    );
                // case '5-01-02-070': // Quarters Allowance — skipped
                //     return (
                //         <span className="text-xs">
                //             Occupied positions × ₱500/month × 12 months
                //         </span>
                //     );
                case "5-01-02-080":
                    return <span className="text-xs">Occupied positions × ₱5,000/year</span>;
                case "5-01-02-140":
                    return (
                        <span className="text-xs">Total Annual Salaries (All Occupied) ÷ 12</span>
                    );
                case "5-01-02-150":
                    return <span className="text-xs">Occupied positions × ₱5,000/year</span>;
                case "5-01-03-010":
                    return (
                        <span className="text-xs">
                            Total Annual Salaries (Regular Occupied) × 12%
                        </span>
                    );
                case "5-01-03-020":
                    return (
                        <span className="text-xs">Occupied positions × ₱100/month × 12 months</span>
                    );
                case "5-01-03-030":
                    return (
                        <span className="text-xs">Total Annual Salaries (All Occupied) × 2.5%</span>
                    );
                case "5-01-03-040":
                    return (
                        <span className="text-xs">Total Annual Salaries (All Occupied) × 1%</span>
                    );
                default:
                    return (
                        <span className="text-xs text-muted-foreground">
                            Manual entry (user input)
                        </span>
                    );
            }
        },
    }),
    columnHelper.display({
        id: "action",
        size: 48,
        cell: () => (
            <div className="flex justify-center">
                <Button size="icon" variant="outline">
                    •
                </Button>
            </div>
        ),
    }),
];

export default columns;
