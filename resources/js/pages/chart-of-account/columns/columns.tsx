import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash } from "lucide-react";
import { Badge } from "@/components/base-ui-components/ui/badge";
import { Button } from "@/components/base-ui-components/ui/button";
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
    columnHelper.display({
        id: "account_group",
        size: 180,
        header: () => <div className="px-1">Account Group</div>,
        cell: ({ row, table }) => {
            const path = row.original.path;
            const ag = path?.split("-")[0];
            if (!ag) return <div className="px-1 text-wrap">-</div>;
            const agPath = ag;
            const metaChart = (table.options.meta as any)?.chartOfAccounts as (ChartOfAccount & { path: string | null })[] | undefined;
            const data = (metaChart ?? (table.options.data as (ChartOfAccount & { path: string | null })[]));
            const title = data.find((c) => c.path === agPath)?.account_title ?? ag;
            return <div className="px-1 text-wrap">{title}</div>;
        },
    }),
    columnHelper.display({
        id: "major_account_group",
        size: 220,
        header: () => <div className="px-1">Major Account Group</div>,
        cell: ({ row, table }) => {
            const parts = row.original.path?.split("-");
            const ag = parts?.[0];
            const mag = parts?.[1];
            if (!ag || !mag) return <div className="px-1 text-wrap">-</div>;
            const magPath = `${ag}-${mag}`;
            const metaChart = (table.options.meta as any)?.chartOfAccounts as (ChartOfAccount & { path: string | null })[] | undefined;
            const data = (metaChart ?? (table.options.data as (ChartOfAccount & { path: string | null })[]));
            const title = data.find((c) => c.path === magPath)?.account_title ?? mag;
            return <div className="px-1 text-wrap">{title}</div>;
        },
    }),
    columnHelper.display({
        id: "sub_major_account_group",
        size: 220,
        header: () => <div className="px-1">Sub-Major Account Group</div>,
        cell: ({ row, table }) => {
            const parts = row.original.path?.split("-");
            const ag = parts?.[0];
            const mag = parts?.[1];
            const smag = parts?.[2];
            if (!ag || !mag || !smag) return <div className="px-1 text-wrap">-</div>;
            const smagPath = `${ag}-${mag}-${smag}`;
            const metaChart = (table.options.meta as any)?.chartOfAccounts as (ChartOfAccount & { path: string | null })[] | undefined;
            const data = (metaChart ?? (table.options.data as (ChartOfAccount & { path: string | null })[]));
            const title = data.find((c) => c.path === smagPath)?.account_title ?? smag;
            return <div className="px-1 text-wrap">{title}</div>;
        },
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
