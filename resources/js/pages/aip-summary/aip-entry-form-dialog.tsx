import React, { useEffect } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Decimal from 'decimal.js';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { ListPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form } from '@/components/ui/form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { FiscalYear, AipEntry, Ppa } from '@/pages/types/types';

interface AipFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: Ppa;
    fiscalYear: FiscalYear;
}

const amountSchema = z
    .string()
    .trim()
    .refine((val) => !val || !isNaN(Number(val)), 'Must be a valid number')
    .refine((val) => Number(val) >= 0, 'Amount must be positive');

const formSchema = z.object({
    ppa_id: z.number(),
    aipRefCode: z.string().min(1, 'Reference code is required'),
    ppaDescription: z.string().min(1, 'Description is required'),
    implementingOfficeDepartmentLocation: z
        .string()
        .min(1, 'Location is required'),
    scheduleOfImplementation: z.object({
        startingDate: z.string().min(1, 'Start date is required'),
        completionDate: z.string().min(1, 'End date is required'),
    }),
    expectedOutputs: z.string().min(1, 'Outputs are required'),
    fundingSource: z.string().min(1, 'Funding source is required'),
    amount: z.object({
        ps: amountSchema,
        mooe: amountSchema,
        fe: amountSchema,
        co: amountSchema,
        total: z.string(),
    }),
    amountOfCcExpenditure: z.object({
        ccAdaptation: amountSchema,
        ccMitigation: amountSchema,
    }),
    ccTypologyCode: z.string().min(1, 'Typology code is required'),
});

// Helper to remove all non-numeric characters except the decimal point
const stripCommas = (val: string) => val.replace(/,/g, '');

// Helper to format string into currency with commas
const formatCurrency = (val: string) => {
    if (!val) return '';
    const numericValue = stripCommas(val);
    if (isNaN(Number(numericValue))) return val;

    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(parseFloat(numericValue));
};

// Currency Input Component with proper hook usage
const CurrencyInput = ({
    field,
    fieldState,
    label,
}: {
    field: {
        value: string;
        onChange: (value: string) => void;
        onBlur: () => void;
        name: string;
    };
    fieldState: {
        invalid: boolean;
        error?: { message?: string };
    };
    label: string;
}) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const displayValue = isFocused ? field.value : formatCurrency(field.value);

    return (
        <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            <Input
                value={displayValue}
                id={field.name}
                name={field.name}
                aria-invalid={fieldState.invalid}
                autoComplete="off"
                onFocus={() => setIsFocused(true)}
                onBlur={(e) => {
                    setIsFocused(false);
                    const val = e.target.value;
                    if (val && !isNaN(Number(stripCommas(val)))) {
                        const roundedValue = parseFloat(
                            stripCommas(val),
                        ).toFixed(2);
                        field.onChange(roundedValue);
                    }
                    field.onBlur();
                }}
                onChange={(e) => field.onChange(e.target.value)}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
    );
};

export default function AipEntryFormDialog({
    open,
    onOpenChange,
    data,
    fiscalYear,
}: AipFormProps) {
    console.log(data);

    // Mapping incoming JSON (Snake Case) to Form State (Camel Case)
    const getInitialValues = (d: Ppa | null): z.infer<typeof formSchema> => ({
        ppa_id: d?.aip_entry?.ppa_id || 0,
        aipRefCode: d?.full_code || '',
        ppaDescription: d?.title || '',
        implementingOfficeDepartmentLocation: d?.office?.name || '',
        scheduleOfImplementation: {
            startingDate: d?.aip_entry?.start_date || '',
            completionDate: d?.aip_entry?.end_date || '',
        },
        expectedOutputs: d?.aip_entry?.expected_output || '',
        fundingSource: d?.aip_entry?.funding_source || '',
        amount: {
            ps: d?.aip_entry?.ps_amount || '0.00',
            mooe: d?.aip_entry?.mooe_amount || '0.00',
            fe: d?.aip_entry?.fe_amount || '0.00',
            co: d?.aip_entry?.co_amount || '0.00',
            total: d?.aip_entry?.total_amount || '0.00',
        },
        amountOfCcExpenditure: {
            ccAdaptation: d?.aip_entry?.ccet_adaptation || '0.00',
            ccMitigation: d?.aip_entry?.ccet_adaptation || '0.00',
        },
        ccTypologyCode: d?.aip_entry?.cc_typology_code || '',
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: getInitialValues(data),
    });

    useEffect(() => {
        if (open) form.reset(getInitialValues(data));
    }, [data, open, form]);

    const watchedAmounts = useWatch({ control: form.control, name: 'amount' });

    // Calculate Total when individual components change
    useEffect(() => {
        const { ps, mooe, fe, co } = watchedAmounts || {};

        try {
            const sum = new Decimal(stripCommas(ps || '0') || 0)
                .plus(stripCommas(mooe || '0') || 0)
                .plus(stripCommas(fe || '0') || 0)
                .plus(stripCommas(co || '0') || 0);

            const totalValue = sum.toFixed(2);
            const formattedTotal = formatCurrency(totalValue);

            // Only update if value is different to avoid loops
            if (watchedAmounts?.total !== formattedTotal) {
                form.setValue('amount.total', formattedTotal);
            }
        } catch (e) {
            console.error('Calculation error', e);
        }
    }, [
        watchedAmounts?.ps,
        watchedAmounts?.mooe,
        watchedAmounts?.fe,
        watchedAmounts?.co,
        form,
    ]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!data?.id) return;

        console.log(data.aip_entry.id);

        // router.put(`/aip-entries/${data.id}`, values, {
        router.put(`/aip-entries/${data.aip_entry.id}`, values, {
            onSuccess: () => {
                onOpenChange(false);
            },
            preserveScroll: true,
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="h-[90vh] sm:max-w-[90vw]">
                <DialogHeader>
                    <DialogTitle>Edit AIP Entry</DialogTitle>
                    <DialogDescription></DialogDescription>
                </DialogHeader>

                <ScrollArea className="min-h-0 flex-1">
                    <Form {...form}>
                        <form
                            id="aip-entry-form"
                            onSubmit={form.handleSubmit(onSubmit)}
                        >
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Controller
                                        name="aipRefCode"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    AIP Reference Code
                                                </FieldLabel>
                                                <Input
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    readOnly
                                                    className="cursor-not-allowed bg-muted text-muted-foreground"
                                                />
                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        name="expectedOutputs"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    Expected Outputs
                                                </FieldLabel>
                                                <Input
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    autoComplete="off"
                                                />
                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </Field>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Controller
                                        name="ppaDescription"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    Program/Project/Activity
                                                    Description
                                                </FieldLabel>
                                                <Input
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    autoComplete="off"
                                                />
                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        name="fundingSource"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    Funding Source
                                                </FieldLabel>
                                                <Input
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    autoComplete="off"
                                                />
                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </Field>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Controller
                                        name="implementingOfficeDepartmentLocation"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    Implementing
                                                    Office/Department
                                                </FieldLabel>
                                                {/* Changed from Select to ReadOnly Input */}
                                                <Input
                                                    {...field}
                                                    id={field.name}
                                                    readOnly
                                                    className="cursor-not-allowed bg-muted text-muted-foreground"
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                />
                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        name="ccTypologyCode"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    CC Typology Code
                                                </FieldLabel>
                                                <Input
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    autoComplete="off"
                                                />
                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </Field>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Date Pickers Section */}
                                    <div className="grid grid-rows-2 gap-4 rounded-md border p-4">
                                        <Controller
                                            name="scheduleOfImplementation.startingDate"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                    className="flex flex-col"
                                                >
                                                    <FieldLabel>
                                                        Start Date
                                                    </FieldLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant={
                                                                    'outline'
                                                                }
                                                                className={cn(
                                                                    'w-full justify-start text-left font-normal',
                                                                    !field.value &&
                                                                        'text-muted-foreground',
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(
                                                                        new Date(
                                                                            field.value,
                                                                        ),
                                                                        'PPP',
                                                                    )
                                                                ) : (
                                                                    <span>
                                                                        Pick a
                                                                        date
                                                                    </span>
                                                                )}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent
                                                            className="w-auto overflow-hidden p-0"
                                                            align="start"
                                                        >
                                                            <Calendar
                                                                mode="single"
                                                                selected={
                                                                    field.value
                                                                        ? new Date(
                                                                              field.value,
                                                                          )
                                                                        : undefined
                                                                }
                                                                defaultMonth={
                                                                    field.value
                                                                        ? new Date(
                                                                              field.value,
                                                                          )
                                                                        : undefined
                                                                }
                                                                captionLayout="dropdown"
                                                                onSelect={(
                                                                    date,
                                                                ) =>
                                                                    field.onChange(
                                                                        date
                                                                            ? format(
                                                                                  date,
                                                                                  'yyyy-MM-dd',
                                                                              )
                                                                            : '',
                                                                    )
                                                                }
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    {fieldState.invalid && (
                                                        <FieldError
                                                            errors={[
                                                                fieldState.error,
                                                            ]}
                                                        />
                                                    )}
                                                </Field>
                                            )}
                                        />

                                        <Controller
                                            name="scheduleOfImplementation.completionDate"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                    className="flex flex-col"
                                                >
                                                    <FieldLabel>
                                                        Completion Date
                                                    </FieldLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant={
                                                                    'outline'
                                                                }
                                                                className={cn(
                                                                    'w-full justify-start text-left font-normal',
                                                                    !field.value &&
                                                                        'text-muted-foreground',
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(
                                                                        new Date(
                                                                            field.value,
                                                                        ),
                                                                        'PPP',
                                                                    )
                                                                ) : (
                                                                    <span>
                                                                        Pick a
                                                                        date
                                                                    </span>
                                                                )}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent
                                                            className="w-auto overflow-hidden p-0"
                                                            align="start"
                                                        >
                                                            <Calendar
                                                                mode="single"
                                                                selected={
                                                                    field.value
                                                                        ? new Date(
                                                                              field.value,
                                                                          )
                                                                        : undefined
                                                                }
                                                                defaultMonth={
                                                                    field.value
                                                                        ? new Date(
                                                                              field.value,
                                                                          )
                                                                        : undefined
                                                                }
                                                                captionLayout="dropdown"
                                                                onSelect={(
                                                                    date,
                                                                ) =>
                                                                    field.onChange(
                                                                        date
                                                                            ? format(
                                                                                  date,
                                                                                  'yyyy-MM-dd',
                                                                              )
                                                                            : '',
                                                                    )
                                                                }
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    {fieldState.invalid && (
                                                        <FieldError
                                                            errors={[
                                                                fieldState.error,
                                                            ]}
                                                        />
                                                    )}
                                                </Field>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-rows-2 gap-4 rounded-md border p-4">
                                        <Controller
                                            name="amountOfCcExpenditure.ccAdaptation"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                    >
                                                        Climate Change
                                                        Adaptation
                                                    </FieldLabel>
                                                    <Input
                                                        {...field}
                                                        id={field.name}
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                        autoComplete="off"
                                                    />
                                                    {fieldState.invalid && (
                                                        <FieldError
                                                            errors={[
                                                                fieldState.error,
                                                            ]}
                                                        />
                                                    )}
                                                </Field>
                                            )}
                                        />

                                        <Controller
                                            name="amountOfCcExpenditure.ccMitigation"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                    >
                                                        Climate Change
                                                        Mitigation
                                                    </FieldLabel>
                                                    <Input
                                                        {...field}
                                                        id={field.name}
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                        autoComplete="off"
                                                    />
                                                    {fieldState.invalid && (
                                                        <FieldError
                                                            errors={[
                                                                fieldState.error,
                                                            ]}
                                                        />
                                                    )}
                                                </Field>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-md border p-4">
                                    <div className="grid grid-cols-5 gap-4">
                                        <Controller
                                            name="amount.ps"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <CurrencyInput
                                                    field={field}
                                                    fieldState={fieldState}
                                                    label="PS"
                                                />
                                            )}
                                        />

                                        <Controller
                                            name="amount.mooe"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                    >
                                                        MOOE
                                                    </FieldLabel>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            {...field}
                                                            id={field.name}
                                                            aria-invalid={
                                                                fieldState.invalid
                                                            }
                                                            placeholder="0.00"
                                                            readOnly
                                                            className="cursor-not-allowed bg-muted text-right font-mono text-muted-foreground"
                                                            value={formatCurrency(
                                                                field.value,
                                                            )}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="shrink-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                                            onClick={() => {
                                                                if (data?.id) {
                                                                    router.visit(
                                                                        `/aip/${fiscalYear.id}/summary/${data.aip_entry.id}/ppmp`,
                                                                    );
                                                                }
                                                            }}
                                                            title="Manage Itemized MOOE"
                                                        >
                                                            <ListPlus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    {fieldState.invalid && (
                                                        <FieldError
                                                            errors={[
                                                                fieldState.error,
                                                            ]}
                                                        />
                                                    )}
                                                </Field>
                                            )}
                                        />

                                        <Controller
                                            name="amount.fe"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <CurrencyInput
                                                    field={field}
                                                    fieldState={fieldState}
                                                    label="FE"
                                                />
                                            )}
                                        />

                                        <Controller
                                            name="amount.co"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <CurrencyInput
                                                    field={field}
                                                    fieldState={fieldState}
                                                    label="CO"
                                                />
                                            )}
                                        />

                                        <Controller
                                            name="amount.total"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                    >
                                                        TOTAL
                                                    </FieldLabel>
                                                    <Input
                                                        {...field}
                                                        id={field.name}
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                        readOnly
                                                        className="cursor-not-allowed bg-muted font-bold text-muted-foreground"
                                                    />
                                                    {fieldState.invalid && (
                                                        <FieldError
                                                            errors={[
                                                                fieldState.error,
                                                            ]}
                                                        />
                                                    )}
                                                </Field>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </Form>
                </ScrollArea>

                <DialogFooter className="mt-auto flex-none shrink-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        form="aip-entry-form"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting
                            ? 'Saving...'
                            : 'Save changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
