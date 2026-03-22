import type { RowData } from '@tanstack/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { CheckCircle2, XCircle, Pencil, Trash, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Ppa } from '@/types/global';

declare module '@tanstack/table-core' {
    interface TableMeta<TData extends RowData> {
        onAdd?: (parent: TData, childType: string) => void;
        onEdit?: (record: TData) => void;
        onDelete?: (record: TData) => void;
    }
}

const columnHelper = createColumnHelper<Ppa>();

export const columns = [
    columnHelper.accessor('full_code', {
        header: 'AIP Reference Code',
        size: 100,
        cell: (value) => (
            <code className="font-mono text-xs">{`${value.getValue<string>()}`}</code>
        ),
    }),
    columnHelper.accessor('title', {
        header: 'Program/Project/Activity Description',
        size: 300,
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
                            {ppa.title}
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
        size: 58,
        minSize: 58,
        maxSize: 58,
        cell: ({ row, table }) => (
            <div className="flex gap-1">
                <Button
                    onClick={() => {
                        // Logic to determine what the next child level should be
                        let nextType: 'Project' | 'Activity' | 'Sub-Activity';

                        if (row.original.type === 'Program')
                            nextType = 'Project';
                        else if (row.original.type === 'Project')
                            nextType = 'Activity';
                        else nextType = 'Sub-Activity'; // If it's an Activity, add a Sub-Activity

                        table.options.meta?.onAdd?.(row.original, nextType);
                    }}
                    size="icon"
                    disabled={row.original.type === 'Sub-Activity'}
                >
                    <Plus className="h-4 w-4" />
                </Button>

                <Button
                    size="icon"
                    onClick={() => table.options.meta?.onEdit?.(row.original)}
                >
                    <Pencil />
                </Button>

                <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => table.options.meta?.onDelete?.(row.original)}
                >
                    <Trash />
                </Button>
            </div>
        ),
    }),
];
