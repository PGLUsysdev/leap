import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OfficeType } from "@/types";

const columnHelper = createColumnHelper<OfficeType>();

const columns = (canEdit: boolean, canDelete: boolean) => {
    const cols = [
        columnHelper.accessor("code", {
            header: "Code",
            cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
        }),
        columnHelper.accessor("name", {
            header: "Type",
            cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
        }),
    ];

    if (canEdit || canDelete) {
        cols.push(
            columnHelper.display({
                id: "action",
                size: canEdit && canDelete ? 82 : 48,
                cell: ({ row, table }) => (
                    <div className="flex items-center gap-1">
                        {canEdit && (
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={() => table.options.meta?.onEdit?.(row.original)}
                            >
                                <Pencil />
                            </Button>
                        )}

                        {canDelete && (
                            <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => table.options.meta?.onDelete?.(row.original)}
                            >
                                <Trash />
                            </Button>
                        )}
                    </div>
                ),
            }),
        );
    }

    return cols;
};

export default columns;
