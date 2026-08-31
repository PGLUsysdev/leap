import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PpmpCategory } from "@/types";

const columnHelper = createColumnHelper<PpmpCategory>();

const columns = [
    columnHelper.accessor("name", {
        size: 300,
        header: () => <div className="px-1">Category Name</div>,
        cell: (value) => <div className="px-1 text-wrap">{value.getValue()}</div>,
    }),
    columnHelper.accessor("is_non_procurement", {
        size: 200,
        header: () => <div className="px-1">Procurement Type</div>,
        cell: (value) => (
            <div className="px-1 text-wrap">
                {value.getValue() ? "Non-Procurement" : "Procurement"}
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
