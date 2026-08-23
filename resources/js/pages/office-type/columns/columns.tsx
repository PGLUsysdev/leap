import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash } from "lucide-react";
import { Button } from "@/components/base-ui-components/ui/button";
import type { OfficeType } from "@/types";

const columnHelper = createColumnHelper<OfficeType>();

const columns = [
    columnHelper.accessor("code", {
        size: 100,
        header: () => <div className="px-1">Code</div>,
        cell: (value) => (
            <div className="px-1 text-wrap slashed-zero tabular-nums">
                {value.getValue().padStart(2, "0")}
            </div>
        ),
    }),
    columnHelper.accessor("name", {
        size: 100,
        header: () => <div className="px-1">Type</div>,
        cell: (value) => <div className="px-1 text-wrap">{value.getValue()}</div>,
    }),
    columnHelper.display({
        id: "actions",
        size: 82,
        cell: ({ row, table }) => {
            const meta = table.options.meta as
                | {
                      canEdit?: boolean;
                      canDelete?: boolean;
                      onEdit?: (data: OfficeType) => void;
                      onDelete?: (data: OfficeType) => void;
                  }
                | undefined;

            return (
                <div className="flex items-center gap-1">
                    <Button
                        size="icon"
                        variant="outline"
                        disabled={!meta?.canEdit}
                        onClick={() => meta?.onEdit?.(row.original)}
                    >
                        <Pencil />
                    </Button>

                    <Button
                        size="icon"
                        variant="destructive"
                        disabled={!meta?.canDelete}
                        onClick={() => meta?.onDelete?.(row.original)}
                    >
                        <Trash />
                    </Button>
                </div>
            );
        },
    }),
];

export default columns;
