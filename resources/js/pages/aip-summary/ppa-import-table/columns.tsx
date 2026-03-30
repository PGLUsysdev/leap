import type { RowSelectionState, Row } from '@tanstack/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { Ppa } from '@/types/global';

interface ColumnProps {
    setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;
    existingPpaIds: Set<number>;
}

const columnHelper = createColumnHelper<Ppa>();

export const getPpaColumns = ({
    setRowSelection,
    existingPpaIds,
}: ColumnProps) => [
    columnHelper.display({
        id: 'select',
        size: 50,
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => {
            const isAlreadyAdded = existingPpaIds.has(row.original.id);

            return (
                <Checkbox
                    checked={row.getIsSelected() || isAlreadyAdded}
                    disabled={isAlreadyAdded}
                    onCheckedChange={(value) => {
                        if (isAlreadyAdded) return;

                        setRowSelection((prev) => {
                            const next = { ...prev };
                            const isChecked = !!value;

                            if (isChecked) {
                                // 1. Select Current
                                next[row.id] = true;

                                // 2. Select All Children (Downward)
                                const selectChildren = (r: Row<Ppa>) => {
                                    r.subRows.forEach((child) => {
                                        if (
                                            !existingPpaIds.has(
                                                child.original.id,
                                            )
                                        ) {
                                            next[child.id] = true;
                                        }
                                        selectChildren(child);
                                    });
                                };
                                selectChildren(row);

                                // 3. Select All Parents (Upward)
                                let parent = row.getParentRow();
                                while (parent) {
                                    if (
                                        !existingPpaIds.has(parent.original.id)
                                    ) {
                                        next[parent.id] = true;
                                    }
                                    parent = parent.getParentRow();
                                }
                            } else {
                                // 1. Unselect Current
                                delete next[row.id];

                                // 2. Unselect All Children (Downward)
                                const unselectChildren = (r: Row<Ppa>) => {
                                    r.subRows.forEach((child) => {
                                        delete next[child.id];
                                        unselectChildren(child);
                                    });
                                };
                                unselectChildren(row);
                            }
                            return next;
                        });
                    }}
                    aria-label="Select row"
                />
            );
        },
    }),
    columnHelper.accessor('name', {
        header: 'Type & Title',
        size: 500,
        cell: ({ row, getValue }) => {
            const type = row.original.type;
            const title = getValue();

            return (
                <div
                    style={{ paddingLeft: `${row.depth * 24}px` }}
                    className="flex items-center gap-2"
                >
                    {row.depth > 0 && (
                        <span className="text-muted-foreground opacity-50">
                            ↳
                        </span>
                    )}
                    <div className="flex flex-col">
                        <span className="text-[10px] leading-none font-bold text-muted-foreground uppercase">
                            {type}
                        </span>
                        <span
                            className={`leading-tight break-words whitespace-normal ${
                                row.depth === 0 ? 'font-bold' : 'font-medium'
                            }`}
                        >
                            {title}
                        </span>
                    </div>
                </div>
            );
        },
    }),
    columnHelper.accessor('full_code', {
        header: 'Code',
        // size: 100,
        cell: (info) => (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold">
                {info.getValue()}
            </code>
        ),
    }),
    columnHelper.accessor('is_active', {
        header: 'Status',
        cell: ({ row, getValue }) => {
            const isActive = getValue();
            const isAdded = existingPpaIds.has(row.original.id);

            if (isAdded) {
                return (
                    <Badge
                        variant="outline"
                        className="h-5 px-1.5 text-[10px] text-muted-foreground"
                    >
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Added
                    </Badge>
                );
            }

            return isActive ? (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                </Badge>
            ) : (
                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                    <XCircle className="mr-1 h-3 w-3" /> Inactive
                </Badge>
            );
        },
    }),
];
