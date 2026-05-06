import { createColumnHelper } from '@tanstack/react-table';
import { CheckCircle2, XCircle, Pencil, Trash, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Ppa } from '@/types/global';

const columnHelper = createColumnHelper<Ppa>();

const columns = [
    columnHelper.display({
        id: 'drag-handle',
        // header: '',
        size: 100,
        cell: ({ row, table }) => {
            return (
                <div className="gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                            (table.options.meta as any)?.onMove?.(row.original)
                        }
                    >
                        <Move />
                    </Button>
                </div>
            );
        },
    }),
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
        id: 'action',
        size: 120,
        cell: ({ row, table }) => {
            const childrenCount = row.original.children_count;

            return (
                <div className="flex items-center gap-1">
                    <Button
                        size="icon"
                        variant="outline"
                        title="Open PPA"
                        onClick={() =>
                            table.options.meta?.onShowChildren?.(row.original)
                        }
                        disabled={row.original.type === 'Sub-Activity'}
                    >
                        {childrenCount}
                    </Button>

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
                </div>
            );
        },
    }),
];

export default columns;
