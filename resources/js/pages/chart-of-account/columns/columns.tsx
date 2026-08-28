import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash } from "lucide-react";
import { Badge } from "@/components/base-ui-components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChartOfAccount } from "@/types";

const columnHelper = createColumnHelper<ChartOfAccount & { path: string | null }>();

const columns = [
    columnHelper.accessor("path", {
        size: 150,
        header: () => <div className="px-1">Account Number</div>,
        cell: (value) => (
            <div className="px-1 text-wrap slashed-zero tabular-nums">{value.getValue()}</div>
        ),
    }),
    columnHelper.accessor("account_title", {
        size: 300,
        header: () => <div className="px-1">Account Title</div>,
        cell: (value) => <div className="px-1 text-wrap">{value.getValue()}</div>,
    }),
    columnHelper.accessor("description", {
        size: 300,
        header: () => <div className="px-1">Description</div>,
        cell: (value) => <div className="px-1 text-wrap">{value.getValue()}</div>,
    }),
    columnHelper.accessor("account_type", {
        size: 110,
        header: () => <div className="px-1">Account Type</div>,
        cell: (value) => <div className="px-1 text-wrap">{value.getValue()}</div>,
    }),
    columnHelper.accessor("expense_class", {
        size: 110,
        header: () => <div className="px-1">Expense Class</div>,
        cell: (value) => <div className="px-1 text-wrap">{value.getValue() ?? "-"}</div>,
    }),
    columnHelper.accessor("account_series", {
        size: 120,
        header: () => <div className="px-1">Account Series</div>,
        cell: (value) => <div className="px-1 text-wrap">{value.getValue() ?? "-"}</div>,
    }),
    columnHelper.accessor("normal_balance", {
        size: 130,
        header: () => <div className="px-1">Normal Balance</div>,
        cell: (value) => <div className="px-1 text-wrap">{value.getValue()}</div>,
    }),
    columnHelper.accessor("is_postable", {
        size: 100,
        header: () => <div className="px-1 text-center">Postable</div>,
        cell: (value) => (
            <div className="flex justify-center">
                {value.getValue() ? (
                    <Badge variant="default">true</Badge>
                ) : (
                    <Badge variant="destructive">false</Badge>
                )}
            </div>
        ),
    }),
    columnHelper.accessor("is_active", {
        size: 100,
        header: () => <div className="px-1 text-center">Active</div>,
        cell: (value) => (
            <div className="flex justify-center">
                {value.getValue() ? (
                    <Badge variant="default">true</Badge>
                ) : (
                    <Badge variant="destructive">false</Badge>
                )}
            </div>
        ),
    }),
    columnHelper.display({
        id: "actions",
        size: 82,
        cell: ({ row, table }) => (
            <div className="flex items-center gap-1">
                <Button
                    size="icon"
                    variant="outline"
                    disabled={!table.options.meta?.canEdit}
                    onClick={() => table.options.meta?.onEdit?.(row.original)}
                >
                    <Pencil />
                </Button>

                <Button
                    size="icon"
                    variant="destructive"
                    disabled={!table.options.meta?.canDelete}
                    onClick={() => table.options.meta?.onDelete?.(row.original)}
                >
                    <Trash />
                </Button>
            </div>
        ),
    }),
];

export default columns;
