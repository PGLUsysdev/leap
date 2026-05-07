import { createColumnHelper } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Ppa } from '@/types/global';
import {
    ButtonGroup,
    ButtonGroupSeparator,
    ButtonGroupText,
} from '@/components/ui/button-group';

type SelectablePpa = Ppa & { _isSelected?: boolean; _isAdded?: boolean };

const columnHelper = createColumnHelper<SelectablePpa>();

const columns = [
    columnHelper.display({
        id: 'select',
        size: 50,
        header: ({ table }) => {
            const meta = table.options.meta as any;
            const rows = table.getRowModel().rows;

            // Only consider rows that are NOT already added to the summary
            const selectableRows = rows.filter((row) => !row.original._isAdded);

            // If every selectable row is checked, the header is checked
            const isAllSelected =
                selectableRows.length > 0 &&
                selectableRows.every((row) => row.original._isSelected);

            // If some (but not all) are checked, show indeterminate state
            const isSomeSelected =
                selectableRows.some((row) => row.original._isSelected) &&
                !isAllSelected;

            return (
                <div className="flex items-center justify-center">
                    <Checkbox
                        checked={
                            isAllSelected ||
                            (isSomeSelected ? 'indeterminate' : false)
                        }
                        onCheckedChange={(checked) =>
                            meta.onToggleAll?.(
                                selectableRows.map((r) => r.original),
                                !!checked,
                            )
                        }
                        disabled={selectableRows.length === 0}
                        aria-label="Select all"
                    />
                </div>
            );
        },
        cell: ({ row, table }) => {
            const meta = table.options.meta as any;
            const ppa = row.original;

            // Access the injected properties
            const isSelected = ppa._isSelected;
            const isAdded = ppa._isAdded;

            return (
                <div className="flex items-center justify-center">
                    <Checkbox
                        // Logic: Light up if it's in the staged Map OR already in AIP
                        checked={!!isSelected || !!isAdded}
                        disabled={isAdded}
                        onCheckedChange={() => meta.onToggle?.(ppa)}
                    />
                </div>
            );
        },
    }),
    columnHelper.accessor('full_code', {
        header: 'Code',
        cell: (info) => <code className="text-xs">{info.getValue()}</code>,
    }),
    columnHelper.accessor('name', {
        header: 'Description',
        size: 500,
        cell: ({ row }) => {
            const ppa = row.original;
            const isAdded = ppa._isAdded;

            return (
                <div
                    className={`flex flex-col py-1 ${isAdded ? 'opacity-50' : ''}`}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            {ppa.type}
                        </span>
                        {isAdded && (
                            <Badge
                                variant="outline"
                                className="h-4 px-1 text-[9px]"
                            >
                                <CheckCircle2 className="mr-1 h-2 w-2" /> IN
                                SUMMARY
                            </Badge>
                        )}
                    </div>
                    <span className="text-sm leading-tight font-medium text-wrap">
                        {ppa.name}
                    </span>
                </div>
            );
        },
    }),
    columnHelper.display({
        id: 'action',
        size: 74,
        // header: 'Open',
        cell: ({ row, table }) => {
            const meta = table.options.meta as any;
            const ppa = row.original;
            const canOpen = ppa.type !== 'Sub-Activity';
            const childrenCount = ppa.children_count;

            return (
                // <Button
                //     variant="outline"
                //     size="icon"
                //     disabled={!canOpen}
                //     onClick={() => meta.onNavigate?.(ppa.id)}
                // >
                //     {childrenCount}
                // </Button>

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
                        disabled={!canOpen}
                        onClick={() => meta.onNavigate?.(ppa.id)}
                    >
                        <FolderOpen />
                    </Button>
                </ButtonGroup>
            );
        },
    }),
];

export default columns;
