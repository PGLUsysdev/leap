import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash } from "lucide-react";
import { Button } from "@/components/base-ui-components/ui/button";
import type { Sector } from "@/types";

const columnHelper = createColumnHelper<Sector>();

const columns = [
    columnHelper.accessor("code", {
        header: () => <div className="px-1">Code</div>,
        size: 100,
        cell: (value) => (
            <div className="px-1 text-wrap slashed-zero tabular-nums">{value.getValue()}</div>
        ),
    }),
    columnHelper.accessor("name", {
        header: () => <div className="px-1">Name</div>,
        size: 100,
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
