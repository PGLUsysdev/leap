import React, { useState } from 'react';
import { ChevronsUpDown, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandDialog,
} from '@/components/ui/command';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import type { FundingSource } from '@/types/global';

interface MultiSelectProps {
    options: FundingSource[];
    value: FundingSource[];
    onChange: (value: FundingSource[]) => void;
    placeholder?: string;
}

export function MultiSelect({
    options,
    value,
    onChange,
    placeholder = 'Select items',
}: MultiSelectProps) {
    const [openDialog, setOpenDialog] = useState(false);

    const toggle = (option: FundingSource) => {
        const exists = value.some((v) => v.id === option.id);

        if (exists) {
            onChange(value.filter((v) => v.id !== option.id));
        } else {
            onChange([...value, option]);
        }
    };

    const remove = (option: FundingSource) => {
        onChange(value.filter((v) => v.id !== option.id));
    };

    return (
        <>
            <div className="flex flex-col gap-2">
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="h-auto w-full justify-between py-2"
                    onClick={() => setOpenDialog(true)}
                >
                    <div className="flex flex-wrap gap-1">
                        {value.length === 0 && (
                            <span className="text-muted-foreground">
                                {placeholder}
                            </span>
                        )}

                        {value.map((option) => (
                            <Badge key={option.id} variant="secondary">
                                {option.code}

                                <X
                                    className="ml-1 h-3 w-3 cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        remove(option);
                                    }}
                                />
                            </Badge>
                        ))}
                    </div>

                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>

                {/* Selected Items Display */}
                <div className="flex flex-col gap-2">
                    {value.map((option) => (
                        <div
                            key={option.id}
                            className="rounded-md border bg-muted p-2"
                        >
                            {option.code} - {option.title}
                        </div>
                    ))}
                </div>
            </div>

            <CommandDialog
                open={openDialog}
                onOpenChange={setOpenDialog}
                className="top-1/4 sm:max-w-[800px]"
            >
                <Command>
                    <CommandInput placeholder="Search funding source..." />
                    <CommandEmpty>No item found.</CommandEmpty>

                    <CommandGroup>
                        <ScrollArea className="h-[400px]">
                            {options.map((option) => {
                                const selected = value.some(
                                    (v) => v.id === option.id,
                                );

                                return (
                                    <CommandItem
                                        key={option.id}
                                        onSelect={() => toggle(option)}
                                        className="py-2"
                                    >
                                        <Checkbox
                                            checked={selected}
                                            onCheckedChange={() =>
                                                toggle(option)
                                            }
                                            className="mr-2"
                                        />

                                        <div>
                                            <p className="text-xs opacity-50">
                                                {option.fund_type}
                                            </p>

                                            <div className="flex items-center gap-2">
                                                <p className="font-bold whitespace-nowrap">
                                                    {option.code}
                                                </p>

                                                <Separator orientation="vertical" />

                                                <p>{option.title}</p>
                                            </div>
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </ScrollArea>
                    </CommandGroup>
                </Command>
            </CommandDialog>
        </>
    );
}
