import { createColumnHelper } from "@tanstack/react-table";
import type { Role } from "@/types";
import { Button } from "@/components/ui/button";
import { Pencil, Shield, Trash } from "lucide-react";

const columnHelper = createColumnHelper<Role>();

const columns = (canEditName: boolean, canEditPerms: boolean, canDelete: boolean) => {
    const cols = [
        columnHelper.accessor("name", {
            header: "Role Name",
            cell: (info) => {
                return <div className="text-wrap font-medium">{info.getValue()}</div>;
            },
        }),
    ];

    if (canEditName || canEditPerms || canDelete) {
        cols.push(
            columnHelper.display({
                id: "action",
                size: 130,
                cell: ({ row, table }) => {
                    return (
                        <div className="flex items-center gap-1">
                            {canEditName && (
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => table.options.meta?.onEdit?.(row.original)}
                                    title="Edit role name"
                                >
                                    <Pencil />
                                </Button>
                            )}

                            {canEditPerms && (
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => table.options.meta?.onEditPerms?.(row.original)}
                                    title="Manage permissions"
                                >
                                    <Shield />
                                </Button>
                            )}

                            {canDelete && (
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    onClick={() => table.options.meta?.onDelete?.(row.original)}
                                    title="Delete role"
                                >
                                    <Trash />
                                </Button>
                            )}
                        </div>
                    );
                },
            }),
        );
    }

    return cols;
};

export default columns;
