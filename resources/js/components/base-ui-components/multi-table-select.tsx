import type { ColumnDef } from '@tanstack/react-table';
import { ChevronsUpDown, Delete } from 'lucide-react';
import { useMemo, useState } from 'react';
import DataTable from '@/components/base-ui-components/data-table';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    ButtonGroup,
    ButtonGroupSeparator,
} from '@/components/base-ui-components/ui/button-group';
import { Checkbox } from '@/components/base-ui-components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/base-ui-components/ui/dialog';
import { cn } from '@/lib/utils';

interface MultiTableSelectProps<TData> {
    data: TData[];
    columns: ColumnDef<TData, any>[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Selected ids from the form; re-seeds the local selection when the dialog opens. */
    selectedValues?: string[];
    /** Row property used as the value (default `"id"`). */
    valueKey?: keyof TData;
    /** Called with the selected rows, in selection order, on Confirm. */
    onConfirm?: (selected: TData[]) => void;
    title?: string;
    description?: string;
    className?: string;
}

export function MultiTableSelect<TData>({
    data,
    columns,
    open,
    onOpenChange,
    selectedValues,
    valueKey = 'id' as keyof TData,
    onConfirm,
    title,
    description,
    className,
}: MultiTableSelectProps<TData>) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [seededOpen, setSeededOpen] = useState(false);

    // Re-seed the local selection from the form each time the dialog opens so
    // unconfirmed changes are discarded on cancel/reopen. Adjusting state
    // during render (React's recommended alternative to effects for prop-
    // derived state) avoids cascading renders from setState-in-effect.
    if (open && !seededOpen) {
        setSeededOpen(true);
        setSelectedIds(selectedValues ?? []);
    } else if (!open && seededOpen) {
        setSeededOpen(false);
    }

    const toggle = (id: string) => {
        setSelectedIds((previous) =>
            previous.includes(id)
                ? previous.filter((value) => value !== id)
                : [...previous, id],
        );
    };

    const columnsWithSelection = useMemo<ColumnDef<TData, any>[]>(
        () => [
            {
                id: '__select',
                size: 40,
                header: () => (
                    <div className="text-center text-wrap">&nbsp;</div>
                ),
                cell: ({ row }) => {
                    const id = String(row.original[valueKey]);

                    return (
                        <div
                            className="flex justify-center"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <Checkbox
                                checked={selectedIds.includes(id)}
                                onCheckedChange={() => toggle(id)}
                                aria-label="Toggle selection"
                            />
                        </div>
                    );
                },
            },
            ...columns,
        ],
        [columns, selectedIds, valueKey],
    );

    // Resolved rows in selection order (skips ids missing from `data`)
    const selectedItems = useMemo(
        () =>
            selectedIds
                .map((id) => data.find((item) => String(item[valueKey]) === id))
                .filter((item): item is TData => item !== undefined),
        [selectedIds, data, valueKey],
    );

    function handleConfirm() {
        onConfirm?.(selectedItems);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    'flex max-h-[calc(100dvh-2rem)] flex-col p-0 sm:max-w-96',
                    className,
                )}
            >
                <DialogHeader className="flex-none px-4 pt-4">
                    <DialogTitle>{title ?? 'Title'}</DialogTitle>
                    <DialogDescription>
                        {description ?? 'desc...'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-b-xl">
                    <DataTable
                        className="h-150"
                        data={data}
                        columns={columnsWithSelection}
                        variant="select"
                        onRowClick={(row) => toggle(String(row[valueKey]))}
                    />
                </div>

                <DialogFooter className="flex-none gap-2 px-4 py-3">
                    <span className="text-muted-foreground mr-auto self-center text-sm tabular-nums">
                        {selectedItems.length} selected
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleConfirm}>
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface MultiTableSelectButtonProps {
    /** Text shown when there is a selection (e.g., joined acronyms). */
    displayText?: string;
    placeholder?: string;
    invalid?: boolean;
    onOpen: () => void;
    onClear?: () => void;
    disabled?: boolean;
}

export function MultiTableSelectButton({
    displayText,
    placeholder,
    invalid,
    onOpen,
    onClear,
    disabled = false,
}: MultiTableSelectButtonProps) {
    const hasSelection = Boolean(displayText);

    return (
        <ButtonGroup className="w-full items-stretch">
            <Button
                type="button"
                variant="outline"
                className={cn(
                    'min-w-0 flex-1 justify-between text-left font-normal',
                    'h-auto py-2',
                    !hasSelection
                        ? 'text-muted-foreground hover:text-muted-foreground'
                        : 'hover:text-current',
                )}
                onClick={onOpen}
                aria-invalid={invalid}
                disabled={disabled}
            >
                <span className="min-w-0 flex-1 pr-2 wrap-break-word whitespace-normal">
                    {hasSelection ? displayText : placeholder}
                </span>
                <ChevronsUpDown className="shrink-0" />
            </Button>

            <ButtonGroupSeparator />

            <Button
                type="button"
                variant="secondary"
                className="h-auto"
                aria-label="clear selection"
                aria-invalid={invalid}
                onClick={onClear}
                disabled={disabled || !hasSelection}
            >
                <Delete />
            </Button>
        </ButtonGroup>
    );
}
