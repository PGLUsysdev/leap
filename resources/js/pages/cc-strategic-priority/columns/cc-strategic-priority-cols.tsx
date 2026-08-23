import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CcStrategicPriority } from "@/types";

const columnHelper = createColumnHelper<CcStrategicPriority>();

const columns = [
    columnHelper.accessor("code", {
        size: 100,
        header: () => <div className="px-1">Code</div>,
        cell: (info) => (
            <div className="px-1 text-wrap slashed-zero tabular-nums">{info.getValue()}</div>
        ),
    }),
    columnHelper.accessor("name", {
        size: 200,
        header: () => <div className="px-1">Name</div>,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.display({
        id: "actions",
        size: 82,
        cell: ({ row, table }) => (
            <div className="flex gap-1">
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
