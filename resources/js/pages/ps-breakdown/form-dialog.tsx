import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import type { ChartOfAccount } from '@/types/global';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableCoas: ChartOfAccount[];
    ppaFundingSourceId: number | null;
}

const formSchema = z.object({
    chart_of_account_id: z.string().min(1, 'COA is required'),
    amount: z.string().min(1, 'Amount is required'),
});

type FormValues = z.infer<typeof formSchema>;

export function FormDialog({
    open,
    onOpenChange,
    availableCoas,
    ppaFundingSourceId,
}: FormDialogProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { chart_of_account_id: '', amount: '' },
    });

    const selectedCoaId = form.watch('chart_of_account_id');

    useEffect(() => {
        if (open) {
            form.reset({ chart_of_account_id: '', amount: '' });
        }
    }, [open, form]);

    function handleAddSubmit(values: FormValues) {
        router.post(
            '/ps-breakdown-items',
            {
                ppa_funding_source_id: ppaFundingSourceId,
                chart_of_account_id: Number(values.chart_of_account_id),
                amount: Number(values.amount),
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                },
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add PS COA</DialogTitle>
                    <DialogDescription>
                        Select a COA and enter the amount.
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="add-ps-coa"
                    onSubmit={form.handleSubmit(handleAddSubmit)}
                    className="space-y-4"
                >
                    <Controller
                        name="chart_of_account_id"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>
                                    COA
                                </FieldLabel>
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger
                                        id={field.name}
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Select a COA" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableCoas.map((coa) => (
                                            <SelectItem
                                                key={coa.id}
                                                value={String(coa.id)}
                                            >
                                                {coa.account_number} —{' '}
                                                {coa.account_title}
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

                    {selectedCoaId && (
                        <Field
                            data-invalid={
                                !!form.formState.errors.amount
                            }
                        >
                            <FieldLabel htmlFor="amount">Amount</FieldLabel>
                            <Input
                                id="amount"
                                {...form.register('amount')}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                aria-invalid={
                                    !!form.formState.errors.amount
                                }
                            />
                            {form.formState.errors.amount && (
                                <FieldError
                                    errors={[
                                        form.formState.errors.amount,
                                    ]}
                                />
                            )}
                        </Field>
                    )}
                </form>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="add-ps-coa"
                        disabled={form.formState.isSubmitting}
                    >
                        Add
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
