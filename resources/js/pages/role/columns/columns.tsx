import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Shield, Trash } from "lucide-react";
import { Button } from "@/components/base-ui-components/ui/button";
import type { Role } from "@/types";

const columnHelper = createColumnHelper<Role>();

const columns = [
    columnHelper.accessor("name", {
        size: 100,
        header: () => <div className="px-1">Role Name</div>,
        cell: (info) => <div className="px-1 text-wrap">{info.getValue()}</div>,
    }),
    columnHelper.display({
        id: "actions",
        size: 118,
        cell: ({ row, table }) => (
            <div className="flex items-center gap-1">
                <Button
                    size="icon"
                    variant="outline"
                    disabled={!table.options.meta?.canEdit}
                    onClick={() => table.options.meta?.onEdit?.(row.original)}
                    title="Edit role name"
                >
                    <Pencil />
                </Button>
                <Button
                    size="icon"
                    variant="outline"
                    disabled={!table.options.meta?.canEditPerms}
                    onClick={() => table.options.meta?.onEditPerms?.(row.original)}
                    title="Manage permissions"
                >
                    <Shield />
                </Button>
                <Button
                    size="icon"
                    variant="destructive"
                    disabled={!table.options.meta?.canDelete}
                    onClick={() => table.options.meta?.onDelete?.(row.original)}
                    title="Delete role"
                >
                    <Trash />
                </Button>
            </div>
        ),
    }),
];

export default columns;
