import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash, Move } from "lucide-react";
import { Button } from "@/components/base-ui-components/ui/button";
import type { PriceList } from "@/types";

const columnHelper = createColumnHelper<PriceList>();

const columns = [
    columnHelper.display({
        id: "move-handle",
        size: 44,
        cell: ({ row, table }) => (
            <div>
                <Button
                    size="icon"
                    variant="ghost"
                    disabled={!table.options.meta?.onMove}
                    onClick={() => table.options.meta?.onMove?.(row.original)}
                >
                    <Move />
                </Button>
            </div>
        ),
    }),
    columnHelper.accessor("item_number", {
        header: () => <div className="px-1">Item Number</div>,
        size: 120,
        cell: (info) => (
            <div className="px-1 text-wrap slashed-zero tabular-nums">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor("description", {
        header: () => <div className="px-1">Description</div>,
        size: 200,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor("unit_of_measurement", {
        header: () => <div className="px-1">Unit of Measurement</div>,
        size: 170,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor("price", {
        header: () => <div className="px-1 text-right">Price</div>,
        size: 120,
        cell: (info) => (
            <div className="px-1 text-right text-wrap slashed-zero tabular-nums">
                {info.getValue()}
            </div>
        ),
    }),
    columnHelper.accessor("chart_of_account_ppmp_category.ppmp_category.name", {
        header: () => <div className="px-1">PPMP Category</div>,
        size: 200,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor("chart_of_account_ppmp_category.chart_of_account.path", {
        header: () => <div className="px-1">COA Code</div>,
        size: 150,
        cell: (info) => (
            <div className="px-1 text-wrap slashed-zero tabular-nums">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor("chart_of_account_ppmp_category.chart_of_account.account_title", {
        header: () => <div className="px-1">Chart of Account</div>,
        size: 200,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.display({
        id: "actions",
        size: 82,
        cell: ({ row, table }) => (
            <div className="flex items-center gap-1">
                <Button
                    size="icon"
                    variant="outline"
                    disabled={!table.options.meta?.onUpdate}
                    onClick={() => table.options.meta?.onUpdate?.(row.original)}
                >
                    <Pencil className="h-4 w-4" />
                </Button>

                <Button
                    size="icon"
                    variant="destructive"
                    disabled={!table.options.meta?.onDelete}
                    onClick={() => table.options.meta?.onDelete?.(row.original)}
                >
                    <Trash className="h-4 w-4" />
                </Button>
            </div>
        ),
    }),
];

export default columns;

// action cols that contain buttons like move-handle and actions dont have headers
// headers and cells are rendered in a div
// all cells have text-wrap except actions cols
// headers have no text-wrap
// all headers and cells have px-1 except `actions` col
// actions col: no px-1, no text-wrap
// numeric cols have text-right in both header and cell
