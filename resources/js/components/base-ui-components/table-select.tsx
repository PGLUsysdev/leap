import type { ColumnDef } from '@tanstack/react-table';
import { ChevronsUpDown, Delete } from 'lucide-react';
import { useState } from 'react';
import DataTable from '@/components/base-ui-components/data-table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/base-ui-components/ui/dialog';
// import type { useTableSelect } from '@/hooks/use-table-select';
import { cn } from '@/lib/utils';
import type { PaginatedResponse } from '@/types';
import { Button } from './ui/button';
import { ButtonGroup, ButtonGroupSeparator } from './ui/button-group';

interface TableSelectProps<TData> {
    data: TData[];
    columns: ColumnDef<TData, any>[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRowSelect: (row: TData) => void;
    value?: string;
    valueKey?: keyof TData;
    className?: string;
    title?: string;
    description?: string;
    paginationData?: Omit<PaginatedResponse<TData>, 'data'>;
    only?: string[];
}

export function TableSelect<TData>({
    data,
    columns,
    open,
    onOpenChange,
    onRowSelect,
    value,
    valueKey,
    className,
    title,
    description,
    paginationData,
    only,
}: TableSelectProps<TData>) {
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
                        columns={columns}
                        variant="select"
                        paginationData={paginationData}
                        only={only}
                        onRowClick={(row) => {
                            onRowSelect(row);
                            onOpenChange(false);
                        }}
                        selectedValue={value}
                        selectedKey={valueKey}
                    ></DataTable>
                </div>
            </DialogContent>
        </Dialog>
    );
}

interface TableSelectButtonProps<TData> {
    hook: ReturnType<typeof useTableSelect<TData>>;
    displayValue?: (item: TData | undefined) => string | undefined;
    placeholder?: string;
    valueKey?: keyof TData;
    invalid?: boolean;
    onClear?: () => void;
    disabled?: boolean;
}

export function TableSelectButton<TData>({
    hook,
    displayValue,
    placeholder,
    valueKey = 'id' as keyof TData,
    invalid,
    onClear,
    disabled = false,
}: TableSelectButtonProps<TData>) {
    const text = displayValue
        ? (displayValue(hook.selectedItem) ?? placeholder)
        : hook.selectedItem
          ? String(hook.selectedItem[valueKey])
          : placeholder;

    return (
        <ButtonGroup className="w-full">
            <Button
                type="button"
                variant="outline"
                className="min-w-0 flex-1 justify-between text-left font-normal hover:text-current"
                onClick={hook.openDialog}
                aria-invalid={invalid}
                disabled={disabled}
            >
                <span className="truncate">{text}</span>
                <ChevronsUpDown />
            </Button>
            <ButtonGroupSeparator />
            <Button
                type="button"
                variant="secondary"
                aria-label="clear selection"
                aria-invalid={invalid}
                onClick={onClear}
                disabled={disabled}
            >
                <Delete />
            </Button>
        </ButtonGroup>
    );
}

interface UseTableSelectArgs<TData> {
    data: TData[];
    value?: string;
    valueKey?: keyof TData;
}

export function useTableSelect<TData>({
    data,
    value,
    valueKey = 'id' as keyof TData,
}: UseTableSelectArgs<TData>) {
    const [open, setOpen] = useState(false);

    const selectedItem = value
        ? data.find((item) => String(item[valueKey]) === value)
        : undefined;

    return {
        open,
        setOpen,
        selectedItem,
        value,
        openDialog: () => setOpen(true),
        closeDialog: () => setOpen(false),
    };
}
