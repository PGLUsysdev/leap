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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import type { FiscalYear, Ppa, FundingSource } from '@/types/global';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { MultiSelect } from './multiselect';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from '@/components/ui/input-group';
import PpaFundingSourceTablePage from '@/pages/aip-summary/ppa-funding-source-table/page';

interface AipFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: Ppa;
    fiscalYear: FiscalYear;
    fundingSources: FundingSource[];
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
    fundingSource: z
        .array(
            z.object({
                id: z.number(),
            }),
        )
        .min(1, 'Select at least one funding source'),
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
    action,
    readOnly = false,
    className,
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
    action?: React.ReactNode;
    readOnly?: boolean;
    className?: string;
}) => {
    const [isFocused, setIsFocused] = React.useState(false);

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        if (readOnly) return;
        const val = e.target.value;
        if (val && !isNaN(Number(stripCommas(val)))) {
            const roundedValue = parseFloat(stripCommas(val)).toFixed(2);
            field.onChange(roundedValue);
        }
        field.onBlur();
    };

    // Display value depends on focus state and readOnly
    const displayValue = readOnly
        ? formatCurrency(field.value)
        : isFocused
          ? field.value
          : formatCurrency(field.value);

    return (
        <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>

            <div className={`flex gap-2 ${className}`}>
                <Input
                    value={displayValue}
                    id={field.name}
                    name={field.name}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    readOnly={readOnly}
                    onFocus={() => !readOnly && setIsFocused(true)}
                    onBlur={handleBlur}
                    onChange={(e) =>
                        !readOnly && field.onChange(e.target.value)
                    }
                    className={cn(
                        'flex-1 text-right tabular-nums',
                        readOnly &&
                            'cursor-not-allowed bg-muted text-muted-foreground',
                    )}
                />
                {action}
            </div>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
    );
};

export default function AipEntryFormDialog({
    open,
    onOpenChange,
    data,
    fiscalYear,
    fundingSources,
}: AipFormProps) {
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
        fundingSource: d?.aip_entry?.funding_source ?? [],
        amount: {
            ps: d?.aip_entry?.ps_amount || '0.00',
            mooe: d?.aip_entry?.mooe_amount || '0.00',
            fe: d?.aip_entry?.fe_amount || '0.00',
            co: d?.aip_entry?.co_amount || '0.00',
            total: d?.aip_entry?.total_amount || '0.00',
        },
        amountOfCcExpenditure: {
            ccAdaptation: d?.aip_entry?.ccet_adaptation || '0.00',
            ccMitigation: d?.aip_entry?.ccet_mitigation || '0.00',
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

        const payload = {
            ...values,
            fundingSource: values.fundingSource.map((fund) => fund.id),
        };

        // console.log(payload);

        router.put(`/aip-entries/${data.aip_entry?.id}`, payload, {
            onSuccess: () => {
                onOpenChange(false);
            },
            preserveScroll: true,
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="h-[90vh] gap-0 sm:max-w-[70vw]">
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
                            <div className="grid gap-y-8 p-4">
                                <div className="grid grid-cols-2 gap-6">
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
                                                    Implementing Office /
                                                    Department / Location
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
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-6">
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
                                                        Program / Project /
                                                        Activity Description
                                                    </FieldLabel>

                                                    <Textarea
                                                        {...field}
                                                        id={field.name}
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                        // placeholder="I'm a software engineer..."
                                                        className="min-h-15"
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

                                        <div className="grid gap-4 rounded-md border">
                                            <div className="rounded-t-md bg-muted p-4">
                                                <span>
                                                    Schedule of Implementation
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 p-4 pt-0">
                                                <Controller
                                                    name="scheduleOfImplementation.startingDate"
                                                    control={form.control}
                                                    render={({
                                                        field,
                                                        fieldState,
                                                    }) => (
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
                                                                <PopoverTrigger
                                                                    asChild
                                                                >
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
                                                                                Pick
                                                                                a
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
                                                                        fromDate={
                                                                            new Date(
                                                                                Number(
                                                                                    fiscalYear.year,
                                                                                ),
                                                                                0,
                                                                                1,
                                                                            )
                                                                        }
                                                                        toDate={
                                                                            new Date(
                                                                                Number(
                                                                                    fiscalYear.year,
                                                                                ),
                                                                                11,
                                                                                31,
                                                                            )
                                                                        }
                                                                        defaultMonth={
                                                                            new Date(
                                                                                Number(
                                                                                    fiscalYear.year,
                                                                                ),
                                                                                0,
                                                                            )
                                                                        }
                                                                        selected={
                                                                            field.value
                                                                                ? new Date(
                                                                                      field.value,
                                                                                  )
                                                                                : undefined
                                                                        }
                                                                        captionLayout="dropdown" // removes year dropdown
                                                                        onSelect={(
                                                                            date,
                                                                        ) => {
                                                                            if (
                                                                                !date
                                                                            ) {
                                                                                field.onChange(
                                                                                    '',
                                                                                );
                                                                                return;
                                                                            }

                                                                            const finalDate =
                                                                                new Date(
                                                                                    Number(
                                                                                        fiscalYear.year,
                                                                                    ),
                                                                                    date.getMonth(),
                                                                                    date.getDate(),
                                                                                );

                                                                            field.onChange(
                                                                                format(
                                                                                    finalDate,
                                                                                    'yyyy-MM-dd',
                                                                                ),
                                                                            );
                                                                        }}
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
                                                    render={({
                                                        field,
                                                        fieldState,
                                                    }) => (
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
                                                                <PopoverTrigger
                                                                    asChild
                                                                >
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
                                                                                Pick
                                                                                a
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
                                                                        fromDate={
                                                                            new Date(
                                                                                Number(
                                                                                    fiscalYear.year,
                                                                                ),
                                                                                0,
                                                                                1,
                                                                            )
                                                                        }
                                                                        toDate={
                                                                            new Date(
                                                                                Number(
                                                                                    fiscalYear.year,
                                                                                ),
                                                                                11,
                                                                                31,
                                                                            )
                                                                        }
                                                                        defaultMonth={
                                                                            new Date(
                                                                                Number(
                                                                                    fiscalYear.year,
                                                                                ),
                                                                                0,
                                                                            )
                                                                        }
                                                                        selected={
                                                                            field.value
                                                                                ? new Date(
                                                                                      field.value,
                                                                                  )
                                                                                : undefined
                                                                        }
                                                                        captionLayout="dropdown" // removes year dropdown
                                                                        onSelect={(
                                                                            date,
                                                                        ) => {
                                                                            if (
                                                                                !date
                                                                            ) {
                                                                                field.onChange(
                                                                                    '',
                                                                                );
                                                                                return;
                                                                            }

                                                                            const finalDate =
                                                                                new Date(
                                                                                    Number(
                                                                                        fiscalYear.year,
                                                                                    ),
                                                                                    date.getMonth(),
                                                                                    date.getDate(),
                                                                                );

                                                                            field.onChange(
                                                                                format(
                                                                                    finalDate,
                                                                                    'yyyy-MM-dd',
                                                                                ),
                                                                            );
                                                                        }}
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
                                        </div>

                                        <div className="grid gap-4 rounded-md border">
                                            <div className="rounded-t-md bg-muted p-4">
                                                <span>
                                                    Amount (In thousand pesos)
                                                </span>
                                            </div>

                                            <div className="grid-rows grid gap-4 p-4 pt-0">
                                                <Controller
                                                    name="amount.ps"
                                                    control={form.control}
                                                    render={({
                                                        field,
                                                        fieldState,
                                                    }) => (
                                                        <CurrencyInput
                                                            field={field}
                                                            fieldState={
                                                                fieldState
                                                            }
                                                            label="Personal Services (PS)"
                                                            className="pr-10"
                                                        />
                                                    )}
                                                />

                                                <Controller
                                                    name="amount.mooe"
                                                    control={form.control}
                                                    render={({
                                                        field,
                                                        fieldState,
                                                    }) => (
                                                        <CurrencyInput
                                                            field={field}
                                                            fieldState={
                                                                fieldState
                                                            }
                                                            label="Maintenance & Other Operating Expenses (MOOE)"
                                                            readOnly={true}
                                                            action={
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="shrink-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                                                    onClick={() => {
                                                                        if (
                                                                            data?.id
                                                                        ) {
                                                                            router.visit(
                                                                                `/aip/${fiscalYear.id}/summary/${data.aip_entry?.id}/ppmp?choice=MOOE`,
                                                                            );
                                                                        }
                                                                    }}
                                                                    title="Manage Itemized MOOE"
                                                                >
                                                                    <ListPlus className="h-4 w-4" />
                                                                </Button>
                                                            }
                                                        />
                                                    )}
                                                />

                                                <Controller
                                                    name="amount.fe"
                                                    control={form.control}
                                                    render={({
                                                        field,
                                                        fieldState,
                                                    }) => (
                                                        <CurrencyInput
                                                            field={field}
                                                            fieldState={
                                                                fieldState
                                                            }
                                                            label="Financial Expense (FE)"
                                                            className="pr-10"
                                                        />
                                                    )}
                                                />

                                                <Controller
                                                    name="amount.co"
                                                    control={form.control}
                                                    render={({
                                                        field,
                                                        fieldState,
                                                    }) => (
                                                        <CurrencyInput
                                                            field={field}
                                                            fieldState={
                                                                fieldState
                                                            }
                                                            label="Capital Outlay (CO)"
                                                            readOnly={true}
                                                            action={
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="shrink-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                                                    onClick={() => {
                                                                        if (
                                                                            data?.id
                                                                        ) {
                                                                            router.visit(
                                                                                `/aip/${fiscalYear.id}/summary/${data.aip_entry?.id}/ppmp?choice=CO`,
                                                                            );
                                                                        }
                                                                    }}
                                                                    title="Manage Itemized MOOE"
                                                                >
                                                                    <ListPlus className="h-4 w-4" />
                                                                </Button>
                                                            }
                                                        />
                                                    )}
                                                />

                                                <Separator />

                                                <Controller
                                                    name="amount.total"
                                                    control={form.control}
                                                    render={({
                                                        field,
                                                        fieldState,
                                                    }) => (
                                                        <Field
                                                            data-invalid={
                                                                fieldState.invalid
                                                            }
                                                        >
                                                            {/* <FieldLabel
                                                                htmlFor={
                                                                    field.name
                                                                }
                                                            >
                                                                TOTAL
                                                            </FieldLabel> */}

                                                            {/* <Input
                                                                {...field}
                                                                id={field.name}
                                                                aria-invalid={
                                                                    fieldState.invalid
                                                                }
                                                                readOnly
                                                                className="cursor-not-allowed bg-muted font-bold text-muted-foreground"
                                                            /> */}

                                                            <div className="pr-10">
                                                                <InputGroup className="items-center">
                                                                    <InputGroupInput
                                                                        {...field}
                                                                        id={
                                                                            field.name
                                                                        }
                                                                        aria-invalid={
                                                                            fieldState.invalid
                                                                        }
                                                                        className="text-right"
                                                                        readOnly
                                                                    />

                                                                    <InputGroupAddon>
                                                                        <InputGroupText className="text-foreground">
                                                                            TOTAL
                                                                        </InputGroupText>
                                                                    </InputGroupAddon>
                                                                </InputGroup>
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
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-8">
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

                                                    <Textarea
                                                        {...field}
                                                        id={field.name}
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                        // placeholder="I'm a software engineer..."
                                                        className="min-h-34"
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

                                        <div className="rounded-md border p-4">
                                            <Controller
                                                name="fundingSource"
                                                control={form.control}
                                                render={({
                                                    field,
                                                    fieldState,
                                                }) => (
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

                                                        <div
                                                            className="w-[500px]"
                                                            // data-invalid={
                                                            //     fieldState.invalid
                                                            // }
                                                        >
                                                            <MultiSelect
                                                                options={
                                                                    fundingSources
                                                                }
                                                                value={
                                                                    field.value
                                                                }
                                                                onChange={(
                                                                    selectedValues,
                                                                ) =>
                                                                    field.onChange(
                                                                        selectedValues,
                                                                    )
                                                                }
                                                                placeholder="Select funding source..."
                                                            />
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
                                        </div>

                                        <div className="grid gap-4 rounded-md border">
                                            <div className="rounded-t-md bg-muted p-4">
                                                <span>
                                                    Amount of Climate Change
                                                    Expenditure (In thousand
                                                    pesos)
                                                </span>
                                            </div>

                                            <div className="grid gap-4 p-4 pt-0">
                                                <Controller
                                                    name="amountOfCcExpenditure.ccAdaptation"
                                                    control={form.control}
                                                    render={({
                                                        field,
                                                        fieldState,
                                                    }) => (
                                                        <Field
                                                            data-invalid={
                                                                fieldState.invalid
                                                            }
                                                        >
                                                            <FieldLabel
                                                                htmlFor={
                                                                    field.name
                                                                }
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
                                                    render={({
                                                        field,
                                                        fieldState,
                                                    }) => (
                                                        <Field
                                                            data-invalid={
                                                                fieldState.invalid
                                                            }
                                                        >
                                                            <FieldLabel
                                                                htmlFor={
                                                                    field.name
                                                                }
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
                                </div>
                            </div>
                        </form>
                    </Form>

                    {/* table here */}
                    <div className="w-250 rounded-md border p-4">
                        <PpaFundingSourceTablePage data={data} />
                    </div>
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
