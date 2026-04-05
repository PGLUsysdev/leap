import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import type { ChartOfAccount } from '@/types/global';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { router } from '@inertiajs/react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface FormDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    initialData: ChartOfAccount | null;
}

// 1. Schema: Only account_series and description are optional (nullable)
const formSchema = z.object({
    account_number: z.string().trim().min(1, 'Account number is required'),
    account_title: z.string().trim().min(1, 'Account title is required'),
    account_type: z.enum(
        ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'],
        {
            message: 'Account type is required',
        },
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
    setOpen,
    initialData,
}: FormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

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
                    setOpen(false);
                    form.reset();
                },
                onFinish: () => setIsLoading(false),
            });
        } else {
            router.post('/chart-of-accounts', data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => {
                    setOpen(false);
                    form.reset();
                },
                onFinish: () => setIsLoading(false),
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogDescription></DialogDescription>
            <DialogContent
                className="flex max-h-[90vh] flex-col gap-0 overflow-hidden"
                onPointerDownOutside={(e) => isLoading && e.preventDefault()}
                onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit' : 'Add New'} Chart of Account
                    </DialogTitle>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 pt-2">
                    <ScrollArea className="w-full flex-1 pr-3">
                        <form
                            id="chart-of-account-form"
                            onSubmit={form.handleSubmit(onSubmit)}
                        >
                            <FieldGroup className="pb-4">
                                <Controller
                                    name="account_number"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel>
                                                Account Number{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                placeholder="e.g., 5-02-03-010"
                                            />
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="account_title"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel>
                                                Account Title{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                placeholder="e.g., Office Supplies"
                                            />
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="account_type"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel>
                                                Account Type{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <SelectTrigger>
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
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="expense_class"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel>
                                                Expense Class{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <SelectTrigger>
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
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="account_series"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Field>
                                            <FieldLabel>
                                                Account Series (Optional)
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                value={field.value ?? ''}
                                            />
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="normal_balance"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel>
                                                Normal Balance{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <SelectTrigger>
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
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="description"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Field>
                                            <FieldLabel>
                                                Description (Optional)
                                            </FieldLabel>
                                            <Textarea
                                                {...field}
                                                value={field.value ?? ''}
                                            />
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="is_postable"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Field>
                                            <div className="mt-2 flex items-center gap-2 rounded-md border p-2">
                                                <Checkbox
                                                    id="is_postable"
                                                    checked={field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                                <label
                                                    htmlFor="is_postable"
                                                    className="text-sm"
                                                >
                                                    Is Postable
                                                </label>
                                            </div>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="is_active"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Field>
                                            <div className="mt-2 flex items-center gap-2 rounded-md border p-2">
                                                <Checkbox
                                                    id="is_active"
                                                    checked={field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                                <label
                                                    htmlFor="is_active"
                                                    className="text-sm"
                                                >
                                                    Is Active
                                                </label>
                                            </div>
                                        </Field>
                                    )}
                                />
                            </FieldGroup>
                        </form>
                    </ScrollArea>
                </div>

                <DialogFooter className="pt-4">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        form="chart-of-account-form"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            isEditing ? (
                                <span className="flex items-center gap-1">
                                    <Spinner />
                                    Saving Changes
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <Spinner />
                                    Creating Account
                                </span>
                            )
                        ) : isEditing ? (
                            'Save Changes'
                        ) : (
                            'Create Account'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
