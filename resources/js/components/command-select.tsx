// src/components/ui/command-select.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
    ButtonGroup,
    ButtonGroupSeparator,
} from '@/components/ui/button-group';

export interface CommandSelectProps<T> {
    value: string | number | null;
    onChange: (value: string | number | null, option: T) => void;
    options: T[];
    // Getters
    getOptionValue: (option: T) => string | number;
    getOptionSearchText: (option: T) => string;
    // Renderers
    renderTrigger: (option: T) => React.ReactNode;
    renderOption: (option: T) => React.ReactNode;
    // Text customization
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    heading?: string;
    // States & Actions
    disabled?: boolean;
    showClear?: boolean;
    onClear?: () => void;
    dialogClassName?: string;
}

export function CommandSelect<T>({
    value,
    onChange,
    options,
    getOptionValue,
    getOptionSearchText,
    renderTrigger,
    renderOption,
    placeholder = 'Select an option',
    searchPlaceholder = 'Search...',
    emptyText = 'No results found.',
    heading = 'Options',
    disabled = false,
    showClear = true,
    onClear,
    dialogClassName = 'sm:max-w-[600px]',
}: CommandSelectProps<T>) {
    const [open, setOpen] = useState(false);

    const selectedOption = options.find(
        (option) => getOptionValue(option) === value,
    );

    return (
        <>
            <ButtonGroup className="flex w-full items-center">
                <Button
                    type="button"
                    variant="outline"
                    className="w-1 flex-1 items-center justify-between overflow-hidden"
                    onClick={() => setOpen(true)}
                    disabled={disabled}
                >
                    {selectedOption ? (
                        renderTrigger(selectedOption)
                    ) : (
                        <span className="truncate">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>

                {showClear && (
                    <>
                        <ButtonGroupSeparator />
                        <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="w-20 shrink-0"
                            onClick={onClear}
                            disabled={disabled}
                        >
                            Clear
                        </Button>
                    </>
                )}
            </ButtonGroup>

            <CommandDialog
                open={open}
                onOpenChange={setOpen}
                className={dialogClassName}
            >
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList className="max-h-[50vh] flex-1">
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup heading={heading}>
                            {options.map((option) => {
                                const optionValue = getOptionValue(option);
                                const isSelected = value === optionValue;

                                return (
                                    <CommandItem
                                        key={String(optionValue)}
                                        value={getOptionSearchText(option)}
                                        onSelect={() => {
                                            onChange(optionValue, option);
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="flex w-full items-center justify-between">
                                            {renderOption(option)}
                                            {isSelected && (
                                                <Check className="ml-2 h-4 w-4 shrink-0 opacity-100" />
                                            )}
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </CommandDialog>
        </>
    );
}
