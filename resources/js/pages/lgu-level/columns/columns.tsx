import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash } from "lucide-react";
import { Button } from "@/components/base-ui-components/ui/button";
import type { LguLevel } from "@/types";

const columnHelper = createColumnHelper<LguLevel>();

const columns = [
    columnHelper.accessor("code", {
        size: 100,
        header: () => <div className="px-1">Code</div>,
        cell: (value) => (
            <div className="px-1 text-wrap slashed-zero tabular-nums">{value.getValue()}</div>
        ),
    }),
    columnHelper.accessor("name", {
        size: 100,
        header: () => <div className="px-1">Name</div>,
        cell: (value) => <div className="px-1 text-wrap">{value.getValue()}</div>,
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
