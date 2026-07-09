import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CcStrategicPriority } from "@/types";

const columnHelper = createColumnHelper<CcStrategicPriority>();

const columns = [
    columnHelper.accessor("code", {
        header: "Code",
        size: 200,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.accessor("name", {
        header: "Name",
        size: 400,
        cell: (info) => <div className="text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.display({
        id: "action",
        size: 86,
        cell: ({ row, table }) => (
            <div className="flex gap-1">
                <Button
                    size="icon"
                    variant="outline"
                    disabled={!table.options.meta?.can?.edit}
                    onClick={() => table.options.meta?.onEdit?.(row.original)}
                >
                    <Pencil />
                </Button>
                <Button
                    size="icon"
                    variant="destructive"
                    disabled={!table.options.meta?.can?.delete}
                    onClick={() => table.options.meta?.onDelete?.(row.original)}
                >
                    <Trash />
                </Button>
            </div>
        ),
    }),
];

export default columns;
