import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Field,
    // FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldContent,
} from '@/components/ui/field';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { generateYearRange } from '@/pages/aip/utils/generate-year-range';
// import { store } from '@/routes/aip/index';

interface FormDialogProps {
    open: boolean;
    setOpen: (value: boolean) => void;
}

const formSchema = z.object({
    year: z.number().int(),
});

const yearNow = new Date().getFullYear();
const years = generateYearRange(yearNow, 5, 5);

export default function FormDialog({ open, setOpen }: FormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            year: yearNow,
        },
    });

    function onSubmit(data: z.infer<typeof formSchema>) {
        // router.post(store(), data, {
        router.post('/aip', data, {
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setOpen(false);
            },
            onError: (errors) => {
                if (errors.year) {
                    form.setError('year', {
                        type: 'manual',
                        message: errors.year,
                    });
                }
            },
            onFinish: () => setIsLoading(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                onPointerDownOutside={(e) => isLoading && e.preventDefault()}
                onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>
                        Initialize Annual Investment Program
                    </DialogTitle>
                    <DialogDescription>
                        Select a fiscal year to initialize the AIP with.
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="fiscal-year-form"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <FieldGroup>
                        <Controller
                            control={form.control}
                            name="year"
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldContent>
                                        <FieldLabel htmlFor="fiscal-year-form-year">
                                            Fiscal Year
                                        </FieldLabel>
                                    </FieldContent>

                                    <Select
                                        name={field.name}
                                        value={
                                            field.value
                                                ? String(field.value)
                                                : undefined
                                        }
                                        onValueChange={(value) =>
                                            field.onChange(Number(value))
                                        }
                                    >
                                        <SelectTrigger
                                            id="fiscal-year-form-year"
                                            aria-invalid={fieldState.invalid}
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
                    </FieldGroup>
                </form>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>

                    <Button
                        form="fiscal-year-form"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Spinner />
                                Initializing
                            </>
                        ) : (
                            'Initialize'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
