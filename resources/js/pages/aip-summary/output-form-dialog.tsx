import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { DatePicker } from '@/components/base-ui-components/date-picker';
import {
    TableSelect,
    TableSelectButton,
    useTableSelect,
} from '@/components/base-ui-components/table-select';
import { Badge } from '@/components/base-ui-components/ui/badge';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/base-ui-components/ui/dialog';
import { Spinner } from '@/components/base-ui-components/ui/spinner';
import { Textarea } from '@/components/base-ui-components/ui/textarea';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { store, update } from '@/routes/aip-outputs';
import type { AipEntry, AipOutput, Office } from '@/types';
import officeColumns from './columns/office-columns';

interface OutputFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entry: AipEntry; // parent entry
    output?: AipOutput | null; // null for add, otherwise edit
    offices?: Office[];
}

const outputFormSchema = z.object({
    officeId: z.string().min(1, 'Office is required'),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    expectedOutput: z.string().optional(),
});

type OutputFormValues = z.infer<typeof outputFormSchema>;

function toDate(isoDate: string | null | undefined) {
    return isoDate ? new Date(isoDate) : undefined;
}

function toIsoDate(date: Date | undefined) {
    return date ? date.toISOString().slice(0, 10) : null;
}

export default function OutputFormDialog({
    open,
    onOpenChange,
    entry,
    output,
    offices,
}: OutputFormDialogProps) {
    const isEditing = !!output;
    const [loadingState, setLoadingState] = useState<
        'idle' | 'saving' | 'saved'
    >('idle');

    const form = useForm<OutputFormValues>({
        resolver: zodResolver(outputFormSchema),
        defaultValues: {
            officeId: '',
            startDate: undefined,
            endDate: undefined,
            expectedOutput: '',
        },
    });

    const watchOfficeId = useWatch({ control: form.control, name: 'officeId' });

    const officeHook = useTableSelect({
        data: offices ?? [],
        value: watchOfficeId ? String(watchOfficeId) : undefined,
    });

    useEffect(() => {
        if (!open) return;

        if (isEditing && output) {
            form.reset({
                officeId:
                    output.office_id != null ? String(output.office_id) : '',
                startDate: toDate(output.start_date),
                endDate: toDate(output.end_date),
                expectedOutput: output.expected_output ?? '',
            });
        } else {
            // New output: default to PPA's office
            const defaultOfficeId =
                entry.ppa?.office_id != null ? String(entry.ppa.office_id) : '';
            form.reset({
                officeId: defaultOfficeId,
                startDate: undefined,
                endDate: undefined,
                expectedOutput: '',
            });
        }
    }, [open, entry, output, isEditing, form]);

    function onSubmit(values: OutputFormValues) {
        const payload = {
            office_id: Number(values.officeId),
            start_date: toIsoDate(values.startDate),
            end_date: toIsoDate(values.endDate),
            expected_output: values.expectedOutput?.trim() || null,
        };

        setLoadingState('saving');

        const url = isEditing
            ? update({ aipOutput: output!.id }).url
            : store({ aipEntry: entry.id }).url;

        router.visit(url, {
            method: isEditing ? 'patch' : 'post',
            data: payload,
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setLoadingState('saved');
                // Close the dialog after a short delay so the user sees the saved state
                setTimeout(() => onOpenChange(false), 500);
            },
            onError: (errors) => {
                setLoadingState('idle');
                console.error(errors);
            },
        });
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[40rem]">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? 'Edit Output' : 'Add New Output'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? 'Update the office, schedule, and description for this expected output.'
                                : 'Create a new expected output for this entry.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-5"
                    >
                        <Controller
                            name="expectedOutput"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Expected Output</FieldLabel>
                                    <Textarea
                                        {...field}
                                        placeholder="Describe the expected output"
                                        className="min-h-[100px]"
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
                            name="officeId"
                            control={form.control}
                            render={({ fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>
                                        Implementing Office / Department /
                                        Location
                                    </FieldLabel>
                                    <TableSelectButton
                                        invalid={fieldState.invalid}
                                        hook={officeHook}
                                        displayValue={(item) =>
                                            item?.acronym ?? undefined
                                        }
                                        placeholder="Select office"
                                        onClear={() =>
                                            form.setValue('officeId', '', {
                                                shouldValidate: true,
                                            })
                                        }
                                    />
                                    {fieldState.invalid && (
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
                                    )}
                                </Field>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-5">
                            <Controller
                                name="startDate"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>Starting Date</FieldLabel>
                                        <DatePicker
                                            year={new Date().getFullYear()}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            invalid={fieldState.invalid}
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
                                name="endDate"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>Completion Date</FieldLabel>
                                        <DatePicker
                                            year={new Date().getFullYear()}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            invalid={fieldState.invalid}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Badge
                                variant={
                                    loadingState === 'saving'
                                        ? 'secondary'
                                        : 'ghost'
                                }
                            >
                                {loadingState === 'saving' && (
                                    <>
                                        <Spinner /> Saving…
                                    </>
                                )}
                                {loadingState === 'saved' && (
                                    <>
                                        <Check /> Saved
                                    </>
                                )}
                                {loadingState === 'idle' && 'Ready'}
                            </Badge>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => onOpenChange(false)}
                                    disabled={loadingState === 'saving'}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loadingState === 'saving'}
                                >
                                    {isEditing ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <TableSelect<Office>
                data={offices ?? []}
                columns={officeColumns}
                open={officeHook.open}
                onOpenChange={officeHook.setOpen}
                onRowSelect={(row) => {
                    form.setValue('officeId', String(row.id), {
                        shouldValidate: true,
                    });
                }}
                value={officeHook.value}
                valueKey="id"
                className="sm:max-w-[30rem]"
            />
        </>
    );
}
