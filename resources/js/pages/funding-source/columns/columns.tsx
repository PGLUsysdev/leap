import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FundingSource } from "@/types";

const columnHelper = createColumnHelper<FundingSource>();

const columns = [
    columnHelper.accessor("fund_type", {
        size: 100,
        header: () => <div className="px-1">Fund Type</div>,
        cell: (value) => <div className="px-1 text-wrap">{value.getValue()}</div>,
    }),
    columnHelper.accessor("code", {
        size: 100,
        header: () => <div className="px-1">Code</div>,
        cell: (value) => <div className="px-1 text-wrap">{value.getValue()}</div>,
    }),
    columnHelper.accessor("title", {
        size: 300,
        header: () => <div className="px-1">Title</div>,
        cell: (value) => <div className="px-1 text-wrap">{value.getValue()}</div>,
    }),
    columnHelper.accessor("description", {
        size: 300,
        header: () => <div className="px-1">Description</div>,
        cell: (value) => <div className="px-1 text-wrap">{value.getValue() ?? "-"}</div>,
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
