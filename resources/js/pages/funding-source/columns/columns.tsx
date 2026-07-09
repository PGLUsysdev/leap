import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FundingSource } from "@/types";

const columnHelper = createColumnHelper<FundingSource>();

const columns = (canEdit: boolean, canDelete: boolean) => {
    const cols = [
        columnHelper.accessor("fund_type", {
            header: "Fund Type",
            cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
        }),
        columnHelper.accessor("code", {
            header: "Code",
            cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
        }),
        columnHelper.accessor("title", {
            header: "Title",
            size: 500,
            cell: (value) => <span className="text-wrap">{value.getValue()}</span>,
        }),
        columnHelper.accessor("description", {
            header: "Description",
            size: 300,
            cell: (value) => <span className="text-wrap">{value.getValue() ?? "-"}</span>,
        }),
    ];

    if (canEdit || canDelete) {
        cols.push(
            columnHelper.display({
                id: "action",
                // size: 82,
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
