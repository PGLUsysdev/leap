import { ChevronsUpDown, Delete } from 'lucide-react';
import type { useTableSelect } from '@/hooks/use-table-select';
import { Button } from './ui/button';
import { ButtonGroup, ButtonGroupSeparator } from './ui/button-group';

interface TableSelectButtonProps<TData> {
    hook: ReturnType<typeof useTableSelect<TData>>;
    displayValue?: (item: TData | undefined) => string | undefined;
    placeholder?: string;
    valueKey?: keyof TData;
    invalid?: boolean;
    onClear: () => void;
}

export function TableSelectButton<TData>({
    hook,
    displayValue,
    placeholder,
    valueKey = 'id' as keyof TData,
    invalid,
    onClear,
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
            >
                <Delete />
            </Button>
        </ButtonGroup>
    );
}
