import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { router } from '@inertiajs/react';

import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FormDialogShell } from '@/components/form-dialog-shell';
import type { Ios, Office, Position } from '@/types/global';

const formSchema = z.object({
    item_number: z.string().min(1, 'Item number is required'),
    office_id: z.string().min(1, 'Office is required'),
    ios_id: z.string().min(1, 'IOS is required'),
    employment_type: z.enum([
        'permanent',
        'casual',
        'contractual',
        'job_order',
    ]),
    is_funded: z.string().min(1),
    status: z.enum(['occupied', 'vacant', 'abolished']),
});

type FormValues = z.infer<typeof formSchema>;

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: Position | null;
    offices: Office[];
    iosList: Ios[];
}

export default function FormDialog({
    open,
    onOpenChange,
    data,
    offices,
    iosList,
}: FormDialogProps) {
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            item_number: '',
            office_id: '',
            ios_id: '',
            employment_type: 'permanent',
            is_funded: 'true',
            status: 'vacant',
        },
    });

    useEffect(() => {
        if (data) {
            form.reset({
                item_number: data.item_number,
                office_id: String(data.office_id),
                ios_id: String(data.ios_id),
                employment_type: data.employment_type,
                is_funded: data.is_funded ? 'true' : 'false',
                status: data.status,
            });
        } else {
            form.reset({
                item_number: '',
                office_id: '',
                ios_id: '',
                employment_type: 'permanent',
                is_funded: 'true',
                status: 'vacant',
            });
        }
    }, [data, form]);

    function handleSubmit(values: FormValues) {
        setSubmitting(true);

        const payload = {
            item_number: values.item_number,
            office_id: Number(values.office_id),
            ios_id: Number(values.ios_id),
            employment_type: values.employment_type,
            is_funded: values.is_funded === 'true',
            status: values.status,
        };

        const options = {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setSubmitting(false);
                onOpenChange(false);
                form.reset();
            },
            onError: () => {
                setSubmitting(false);
            },
        };

        if (isEditing && data) {
            router.patch(`/position/${data.id}`, payload, options);
        } else {
            router.post('/position', payload, options);
        }
    }

    const isEditing = !!data;

    return (
        <FormDialogShell
            open={open}
            onOpenChange={onOpenChange}
            title={isEditing ? 'Edit Position' : 'Add New Position'}
            description={undefined}
            formId="position-form"
            submitLabel={isEditing ? 'Save Changes' : 'Add Position'}
            submittingLabel={isEditing ? 'Saving...' : 'Adding...'}
            isLoading={submitting}
            onCancel={() => {
                onOpenChange(false);
                form.reset();
            }}
            className="sm:max-w-lg"
        >
            <div className="flex min-h-0 flex-1">
                <ScrollArea className="w-full pr-4">
                    <form
                        id="position-form"
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4 py-1"
                    >
                        <Controller
                            name="item_number"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Item Number
                                    </FieldLabel>
                                    <Input
                                        id={field.name}
                                        {...field}
                                        placeholder="e.g. 001"
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
                            name="office_id"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Office
                                    </FieldLabel>
                                    <Select
                                        name={field.name}
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger
                                            id={field.name}
                                            aria-invalid={fieldState.invalid}
                                        >
                                            <SelectValue placeholder="Select office" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {offices.map((office) => (
                                                <SelectItem
                                                    key={office.id}
                                                    value={String(office.id)}
                                                >
                                                    {office.acronym
                                                        ? `${office.acronym} — ${office.name}`
                                                        : office.name}
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
                            name="ios_id"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        IOS Classification
                                    </FieldLabel>
                                    <Select
                                        name={field.name}
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger
                                            id={field.name}
                                            aria-invalid={fieldState.invalid}
                                        >
                                            <SelectValue placeholder="Select IOS" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {iosList.map((ios) => (
                                                <SelectItem
                                                    key={ios.id}
                                                    value={String(ios.id)}
                                                >
                                                    {ios.class} (SG{' '}
                                                    {ios.salary_grade})
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
                            name="employment_type"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Employment Type
                                    </FieldLabel>
                                    <Select
                                        name={field.name}
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger
                                            id={field.name}
                                            aria-invalid={fieldState.invalid}
                                        >
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="permanent">
                                                Permanent
                                            </SelectItem>
                                            <SelectItem value="casual">
                                                Casual
                                            </SelectItem>
                                            <SelectItem value="contractual">
                                                Contractual
                                            </SelectItem>
                                            <SelectItem value="job_order">
                                                Job Order
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
                            name="is_funded"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Funded
                                    </FieldLabel>
                                    <Select
                                        name={field.name}
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger
                                            id={field.name}
                                            aria-invalid={fieldState.invalid}
                                        >
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="true">
                                                Yes
                                            </SelectItem>
                                            <SelectItem value="false">
                                                No
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
                            name="status"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Status
                                    </FieldLabel>
                                    <Select
                                        name={field.name}
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        disabled={!isEditing}
                                    >
                                        <SelectTrigger
                                            id={field.name}
                                            disabled={!isEditing}
                                            aria-invalid={fieldState.invalid}
                                        >
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="occupied">
                                                Occupied
                                            </SelectItem>
                                            <SelectItem value="vacant">
                                                Vacant
                                            </SelectItem>
                                            <SelectItem value="abolished">
                                                Abolished
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
                    </form>
                </ScrollArea>
            </div>
        </FormDialogShell>
    );
}
