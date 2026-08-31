import { createColumnHelper } from "@tanstack/react-table";
import type { ChartOfAccount } from "@/types";

const columnHelper = createColumnHelper<ChartOfAccount>();

const columns = [
    columnHelper.accessor("path", {
        header: () => <div className="px-1">Account Number</div>,
        size: 140,
        cell: (info) => (
            <div className="px-1 text-wrap slashed-zero tabular-nums">{info.getValue() ?? "-"}</div>
        ),
    }),
    columnHelper.accessor("account_title", {
        header: () => <div className="px-1">Account Title</div>,
        size: 200,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor("expense_class", {
        header: () => <div className="px-1">Expense Class</div>,
        size: 100,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor("description", {
        header: () => <div className="px-1">Description</div>,
        size: 200,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
];

export default columns;
