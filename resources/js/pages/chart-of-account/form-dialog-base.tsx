import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/base-ui-components/ui/button';
import { Checkbox } from '@/components/base-ui-components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/base-ui-components/ui/dialog';
import {
    Field,
    FieldError,
    FieldLabel,
    FieldContent,
} from '@/components/base-ui-components/ui/field';
import { Input } from '@/components/base-ui-components/ui/input';
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
import { Textarea } from '@/components/base-ui-components/ui/textarea';
import type { ChartOfAccount } from '@/types';

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: ChartOfAccount | null;
}

const formSchema = z.object({
    account_number: z.string().trim().min(1, 'Account number is required'),
    account_title: z.string().trim().min(1, 'Account title is required'),
    account_type: z.enum(
        ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'],
        { message: 'Account type is required' },
    ),
    expense_class: z.enum(['PS', 'MOOE', 'FE', 'CO'], {
        message: 'Expense class is required',
    }),
    account_series: z.string().trim().nullable().or(z.literal('')),
    is_postable: z.boolean(),
    is_active: z.boolean(),
    normal_balance: z.enum(['DEBIT', 'CREDIT'], {
        message: 'Normal balance is required',
    }),
    description: z.string().trim().nullable().or(z.literal('')),
});

export default function FormDialog({
    open,
    onOpenChange,
    initialData,
}: FormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    const isEditing = !!initialData;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            account_number: '',
            account_title: '',
            account_type: 'ASSET',
            expense_class: 'MOOE',
            account_series: '',
            is_postable: true,
            is_active: true,
            normal_balance: 'DEBIT',
            description: '',
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                account_number: initialData?.account_number ?? '',
                account_title: initialData?.account_title ?? '',
                account_type: (initialData?.account_type as any) ?? 'ASSET',
                expense_class: (initialData?.expense_class as any) ?? 'MOOE',
                account_series: initialData?.account_series ?? '',
                is_postable: initialData?.is_postable ?? true,
                is_active: initialData?.is_active ?? true,
                normal_balance: (initialData?.normal_balance as any) ?? 'DEBIT',
                description: initialData?.description ?? '',
            });
        }
    }, [initialData, open, form]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        const data = {
            ...values,
            account_series:
                values.account_series === '' ? null : values.account_series,
            description: values.description === '' ? null : values.description,
        };

        if (isEditing) {
            router.patch(`/chart-of-accounts/${initialData.id}`, data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                },
                onError: (errors: any) => {
                    const messages = Object.values(errors).flat();
                    const combinedMessage =
                        messages.length > 0
                            ? messages.join(' ')
                            : 'An unexpected error occurred.';

                    setAlertMessage(combinedMessage);
                    setAlertOpen(true);

                    Object.keys(errors).forEach((key) => {
                        form.setError(key as any, {
                            type: 'server',
                            message: errors[key],
                        });
                    });
                },
                onFinish: () => setIsLoading(false),
            });
        } else {
            router.post('/chart-of-accounts', data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                },
                onError: (errors: any) => {
                    const messages = Object.values(errors).flat();
                    const combinedMessage =
                        messages.length > 0
                            ? messages.join(' ')
                            : 'An unexpected error occurred.';

                    setAlertMessage(combinedMessage);
                    setAlertOpen(true);

                    Object.keys(errors).forEach((key) => {
                        form.setError(key as any, {
                            type: 'server',
                            message: errors[key],
                        });
                    });
                },
                onFinish: () => setIsLoading(false),
            });
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing
                                ? 'Edit Chart of Account'
                                : 'Add New Chart of Account'}
                        </DialogTitle>
                        <DialogDescription>
                            Modify or create chart of account details.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex min-h-0">
                        <ScrollArea className="w-full pr-3">
                            <form
                                id="chart-of-account-form"
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="flex flex-col gap-4 py-1"
                            >
                                <Controller
                                    name="account_number"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldContent>
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                    className="gap-1"
                                                >
                                                    Account Number{' '}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </FieldLabel>

                                                <Input
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    placeholder="e.g., 5-02-03-010"
                                                    autoComplete="off"
                                                />

                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </FieldContent>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="account_title"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldContent>
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                    className="gap-1"
                                                >
                                                    Account Title{' '}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </FieldLabel>

                                                <Input
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    placeholder="e.g., Office Supplies"
                                                    autoComplete="off"
                                                />

                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </FieldContent>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="account_type"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldContent>
                                                <FieldLabel className="gap-1">
                                                    Account Type{' '}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </FieldLabel>

                                                <Select
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className="w-full"
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        {[
                                                            'ASSET',
                                                            'LIABILITY',
                                                            'EQUITY',
                                                            'REVENUE',
                                                            'EXPENSE',
                                                        ].map((v) => (
                                                            <SelectItem
                                                                key={v}
                                                                value={v}
                                                            >
                                                                {v}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </FieldContent>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="expense_class"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldContent>
                                                <FieldLabel className="gap-1">
                                                    Expense Class{' '}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </FieldLabel>

                                                <Select
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className="w-full"
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        {[
                                                            'PS',
                                                            'MOOE',
                                                            'FE',
                                                            'CO',
                                                        ].map((v) => (
                                                            <SelectItem
                                                                key={v}
                                                                value={v}
                                                            >
                                                                {v}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </FieldContent>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="account_series"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldContent>
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    Account Series
                                                </FieldLabel>

                                                <Input
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    value={field.value ?? ''}
                                                    autoComplete="off"
                                                />

                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </FieldContent>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="normal_balance"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldContent>
                                                <FieldLabel className="gap-1">
                                                    Normal Balance{' '}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </FieldLabel>

                                                <Select
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className="w-full"
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        <SelectItem value="DEBIT">
                                                            DEBIT
                                                        </SelectItem>

                                                        <SelectItem value="CREDIT">
                                                            CREDIT
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </FieldContent>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="description"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldContent>
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    Description
                                                </FieldLabel>

                                                <Textarea
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    value={field.value ?? ''}
                                                    autoComplete="off"
                                                    className="min-h-15"
                                                />

                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </FieldContent>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="is_postable"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Field orientation="horizontal">
                                            <Checkbox
                                                id={field.name}
                                                checked={field.value}
                                                onCheckedChange={
                                                    field.onChange
                                                }
                                            />

                                            <FieldLabel htmlFor={field.name}>
                                                Is Postable
                                            </FieldLabel>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="is_active"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Field orientation="horizontal">
                                            <Checkbox
                                                id={field.name}
                                                checked={field.value}
                                                onCheckedChange={
                                                    field.onChange
                                                }
                                            />

                                            <FieldLabel htmlFor={field.name}>
                                                Is Active
                                            </FieldLabel>
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
                            form="chart-of-account-form"
                            disabled={isLoading}
                        >
                            {isLoading
                                ? isEditing
                                    ? 'Saving...'
                                    : 'Creating...'
                                : isEditing
                                  ? 'Save Changes'
                                  : 'Create Account'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Error</DialogTitle>
                        <DialogDescription>{alertMessage}</DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setAlertOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
