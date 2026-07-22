import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/base-ui-components/ui/dialog';
import {
    Field,
    FieldError,
    FieldLabel,
} from '@/components/base-ui-components/ui/field';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/base-ui-components/ui/select';
import { generateYearRange } from '@/pages/aip/utils/generate-year-range';

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
    year: z.string().min(1, 'Fiscal year is required'),
});

const yearNow = new Date().getFullYear();
const years = generateYearRange(yearNow, 5, 5);

export default function FormDialog({ open, onOpenChange }: FormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            year: String(yearNow),
        },
    });

    function handleDialogOpenChange(isOpen: boolean) {
        onOpenChange(isOpen);

        if (!isOpen) {
            form.reset();
        }
    }

    function onSubmit(data: z.infer<typeof formSchema>) {
        router.post(
            '/aip',
            { year: Number(data.year) },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onError: (errors) => {
                    if (errors.year) {
                        form.setError('year', {
                            type: 'year',
                            message: errors.year,
                        });
                    }
                },
                onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                },
                onFinish: () => setIsLoading(false),
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-sm">
                <DialogHeader className="flex-none">
                    <DialogTitle>
                        Initialize Annual Investment Program
                    </DialogTitle>
                    <DialogDescription>
                        Select a fiscal year to initialize the AIP with.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-1">
                    <ScrollArea className="w-full pr-3">
                        <form
                            id="aip-form"
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="flex flex-col gap-4 py-1"
                        >
                            <Controller
                                name="year"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="aip-form-year">
                                            Fiscal Year
                                        </FieldLabel>

                                        <Select
                                            name={field.name}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger
                                                id="aip-form-year"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <SelectValue placeholder="Select year" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                {years.map((year) => (
                                                    <SelectItem
                                                        key={year}
                                                        value={String(year)}
                                                    >
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                )}
                            />
                        </form>

                        <ScrollBar orientation="vertical" />
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        form="aip-form"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Initializing...' : 'Initialize'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
