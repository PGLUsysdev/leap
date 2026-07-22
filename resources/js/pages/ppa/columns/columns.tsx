import { createColumnHelper } from '@tanstack/react-table';
import {
    CheckCircle2,
    XCircle,
    Pencil,
    Trash,
    Move,
    FolderOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ButtonGroup,
    ButtonGroupSeparator,
    ButtonGroupText,
} from '@/components/ui/button-group';
import type { Ppa } from '@/types';

const columnHelper = createColumnHelper<Ppa>();

const columns = (ppaData: Ppa[]) => {
    const cols: any[] = [];

    const hasMove = ppaData.some((p) => p.can?.move);
    const hasEdit = ppaData.some((p) => p.can?.edit);
    const hasDelete = ppaData.some((p) => p.can?.delete);
    const actionSize =
        hasEdit && hasDelete ? 146 : hasEdit || hasDelete ? 112 : 78;

    if (hasMove) {
        cols.push(
            columnHelper.display({
                id: 'drag-handle',
                size: 100,
                cell: ({ row, table }) => {
                    return (
                        <div className="gap-1">
                            {row.original.can?.move && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() =>
                                        (table.options.meta as any)?.onMove?.(
                                            row.original,
                                        )
                                    }
                                >
                                    <Move />
                                </Button>
                            )}
                        </div>
                    );
                },
            }),
        );
    }

    cols.push(
        columnHelper.accessor('full_code', {
            header: 'AIP Reference Code',
            size: 200,
            cell: (value) => {
                return (
                    <code className="font-mono text-xs">{`${value.getValue<string>()}`}</code>
                );
            },
        }),
        columnHelper.accessor('name', {
            header: 'Program/Project/Activity Description',
            size: 400,
            cell: (info) => {
                const ppa = info.row.original;

                return (
                    <div
                        style={{ paddingLeft: `${info.row.depth * 24}px` }}
                        className="flex items-center gap-2"
                    >
                        {info.row.depth > 0 && (
                            <span className="text-muted-foreground opacity-50">
                                ↳
                            </span>
                        )}

                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                {ppa.type}
                            </span>

                            <span
                                className={`leading-tight break-words whitespace-normal ${
                                    info.row.depth === 0
                                        ? 'font-bold'
                                        : 'font-medium'
                                }`}
                            >
                                {ppa.name}
                            </span>
                        </div>
                    </div>
                );
            },
        }),
        columnHelper.accessor('is_active', {
            header: 'Status',
            cell: (value) => {
                const active = value.getValue<boolean>();

                return active ? (
                    <Badge variant="default">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                    </Badge>
                ) : (
                    <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" /> Inactive
                    </Badge>
                );
            },
        }),
        columnHelper.display({
            id: 'actions',
            size: actionSize,
            cell: ({ row, table }) => {
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
                                onClick={() =>
                                    table.options.meta?.onShowChildren?.(
                                        row.original,
                                    )
                                }
                                disabled={row.original.type === 'Sub-Activity'}
                            >
                                <FolderOpen />
                            </Button>
                        </ButtonGroup>

                        {canEdit && (
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={() =>
                                    table.options.meta?.onEdit?.(row.original)
                                }
                                title="Edit PPA"
                            >
                                <Pencil />
                            </Button>
                        )}

                        {canDelete && (
                            <Button
                                size="icon"
                                variant="destructive"
                                onClick={() =>
                                    table.options.meta?.onDelete?.(row.original)
                                }
                                title="Delete PPA"
                            >
                                <Trash />
                            </Button>
                        )}
                    </div>
                );
            },
        }),
    );

    return cols;
};

export default columns;
