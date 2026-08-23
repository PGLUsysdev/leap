import { createColumnHelper } from "@tanstack/react-table";
import { CheckCircle2, XCircle, Pencil, Trash, Move, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import type { Ppa } from "@/types";

const columnHelper = createColumnHelper<Ppa>();

const columns = [
    columnHelper.display({
        id: "drag-handle",
        size: 48,
        cell: ({ row, table }) => (
            <div className="flex gap-1">
                <Button
                    size="icon"
                    variant="ghost"
                    disabled={!row.original.can?.move}
                    onClick={() => (table.options.meta as any)?.onMove?.(row.original)}
                >
                    <Move />
                </Button>
            </div>
        ),
    }),
    columnHelper.accessor("full_code", {
        size: 200,
        header: () => <div className="px-1">AIP Reference Code</div>,
        cell: (value) => (
            <div className="px-1 text-wrap slashed-zero tabular-nums">
                {value.getValue<string>()}
            </div>
        ),
    }),
    columnHelper.accessor("name", {
        size: 400,
        header: () => <div className="px-1">Program/Project/Activity Description</div>,
        cell: (info) => {
            const ppa = info.row.original;

            return (
                <div
                    style={{ paddingLeft: `${info.row.depth * 24}px` }}
                    className="flex items-center gap-2 px-1"
                >
                    {info.row.depth > 0 && (
                        <span className="text-muted-foreground opacity-50">↳</span>
                    )}

                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            {ppa.type}
                        </span>

                        <span
                            className={`leading-tight break-words whitespace-normal ${
                                info.row.depth === 0 ? "font-bold" : "font-medium"
                            }`}
                        >
                            {ppa.name}
                        </span>
                    </div>
                </div>
            );
        },
    }),
    columnHelper.accessor("is_active", {
        size: 150,
        header: () => <div className="px-1">Status</div>,
        cell: (value) => {
            const active = value.getValue<boolean>();

            return (
                <div className="px-1 text-wrap">
                    {active ? (
                        <Badge variant="default">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                        </Badge>
                    ) : (
                        <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" /> Inactive
                        </Badge>
                    )}
                </div>
            );
        },
    }),
    columnHelper.display({
        id: "actions",
        size: 146,
        cell: ({ row, table }) => {
            const meta = table.options.meta as any;
            const ppaTypes = meta?.ppaTypes || [];
            const isLastLeaf =
                ppaTypes.length > 0 ? row.original.type === ppaTypes[ppaTypes.length - 1] : false;
            const childrenCount = row.original.children_count;
            const canEdit = row.original.can?.edit;
            const canDelete = row.original.can?.delete;

            return (
                <div className="flex items-center gap-1">
                    <ButtonGroup>
                        <Button
                            variant="outline"
                            className="w-7 shrink overflow-hidden px-0"
                            disabled
                        >
                            {childrenCount}
                        </Button>
                        <Button
                            size="icon"
                            variant="outline"
                            title="Open PPA"
                            onClick={() => meta?.onShowChildren?.(row.original)}
                            disabled={isLastLeaf}
                        >
                            <FolderOpen />
                        </Button>
                    </ButtonGroup>

                    <Button
                        size="icon"
                        variant="outline"
                        disabled={!canEdit}
                        onClick={() => table.options.meta?.onEdit?.(row.original)}
                        title="Edit PPA"
                    >
                        <Pencil />
                    </Button>

                    <Button
                        size="icon"
                        variant="destructive"
                        disabled={!canDelete}
                        onClick={() => table.options.meta?.onDelete?.(row.original)}
                        title="Delete PPA"
                    >
                        <Trash />
                    </Button>
                </div>
            );
        },
    }),
];

export default columns;
