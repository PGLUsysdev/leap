'use client';

import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/base-ui-components/ui/button';
import { Calendar } from '@/components/base-ui-components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/base-ui-components/ui/popover';
import { cn } from '@/lib/utils';

type DatePickerProps = Omit<
    React.ComponentProps<typeof Calendar>,
    'mode' | 'selected' | 'onSelect'
> & {
    year?: number;
    value?: Date;
    onValueChange?: (date: Date | undefined) => void;
};

export function DatePicker({
    year,
    value,
    onValueChange,
    ...props
}: DatePickerProps) {
    const [internalDate, setInternalDate] = React.useState<Date>();

    const date = value !== undefined ? value : internalDate;

    const handleSelect = (selected: Date | undefined) => {
        if (onValueChange) {
            onValueChange(selected);
        } else {
            setInternalDate(selected);
        }
    };

    return (
        <Popover>
            <PopoverTrigger
                render={
                    <Button
                        variant="outline"
                        data-empty={!date}
                        className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                    />
                }
            >
                <CalendarIcon />
                {date ? format(date, 'PPP') : <span>Pick a date</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleSelect}
                    {...props}
                    defaultMonth={
                        year != null ? new Date(year, 0) : props.defaultMonth
                    }
                    startMonth={
                        year != null ? new Date(year, 0) : props.startMonth
                    }
                    endMonth={
                        year != null ? new Date(year, 11) : props.endMonth
                    }
                    showOutsideDays={
                        year != null ? false : props.showOutsideDays
                    }
                />
            </PopoverContent>
        </Popover>
    );
}
