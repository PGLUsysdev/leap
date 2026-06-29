import { useEffect, useMemo, useState } from 'react';
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
import type { Ios } from '@/types/global';
import iosCodes from './ios_codes.js';

const formSchema = z.object({
    occupational_service_code: z.string().min(1, 'Required'),
    occupational_group_code: z.string().min(1, 'Required'),
    class_id: z.string().min(1, 'Required'),
    class: z.string().min(1, 'Required'),
    salary_grade: z
        .string()
        .min(1, 'Required')
        .refine(
            (val) => !val || (Number(val) >= 1 && Number(val) <= 33),
            'Salary grade must be between 1 and 33',
        ),
});

type FormValues = z.infer<typeof formSchema>;

interface SalaryGradeOption {
    salary_grade: number;
    min_rate: string;
    max_rate: string;
}

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: Ios | null;
    salaryGrades: SalaryGradeOption[];
}

export default function FormDialog({
    open,
    onOpenChange,
    data,
    salaryGrades,
}: FormDialogProps) {
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            occupational_service_code: '',
            occupational_group_code: '',
            class_id: '',
            class: '',
            salary_grade: '',
        },
    });

    const selectedServiceCode = form.watch('occupational_service_code');

    const selectedService = useMemo(
        () =>
            iosCodes.find(
                (s) => s.occupational_service_code === selectedServiceCode,
            ),
        [selectedServiceCode],
    );

    useEffect(() => {
        if (data) {
            form.reset({
                occupational_service_code: data.occupational_service_code,
                occupational_group_code: data.occupational_group_code,
                class_id: data.class_id,
                class: data.class,
                salary_grade: String(data.salary_grade),
            });
        } else {
            form.reset({
                occupational_service_code: '',
                occupational_group_code: '',
                class_id: '',
                class: '',
                salary_grade: '',
            });
        }
    }, [data, form]);

    // Reset group code when service changes
    useEffect(() => {
        if (selectedService) {
            const currentGroup = form.getValues('occupational_group_code');
            const isValid = selectedService.groups.some(
                (g) => g.group_code === currentGroup,
            );
            if (!isValid) {
                form.setValue('occupational_group_code', '');
            }
        } else {
            form.setValue('occupational_group_code', '');
        }
    }, [selectedServiceCode, selectedService, form]);

    function handleSubmit(values: FormValues) {
        setSubmitting(true);

        const payload = {
            occupational_service_code: values.occupational_service_code,
            occupational_group_code: values.occupational_group_code,
            class_id: values.class_id,
            class: values.class,
            salary_grade: Number(values.salary_grade),
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

        if (data) {
            router.patch(`/ios/${data.id}`, payload, options);
        } else {
            router.post('/ios', payload, options);
        }
    }

    const isEditing = !!data;

    return (
        <FormDialogShell
            open={open}
            onOpenChange={onOpenChange}
            title={isEditing ? 'Edit IOS' : 'Add New IOS'}
            description={undefined}
            formId="ios-form"
            submitLabel={isEditing ? 'Save Changes' : 'Add IOS'}
            submittingLabel="Saving..."
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
                        id="ios-form"
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4 py-1"
                    >
                        <Controller
                            name="occupational_service_code"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Occupational Service
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
                                            <SelectValue placeholder="Select service" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {iosCodes.map((service) => (
                                                <SelectItem
                                                    key={
                                                        service.occupational_service_code
                                                    }
                                                    value={
                                                        service.occupational_service_code
                                                    }
                                                >
                                                    {
                                                        service.occupational_service_code
                                                    }{' '}
                                                    — {service.name}
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
                            name="occupational_group_code"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Occupational Group
                                    </FieldLabel>
                                    <Select
                                        name={field.name}
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        disabled={!selectedService}
                                    >
                                        <SelectTrigger
                                            id={field.name}
                                            aria-invalid={fieldState.invalid}
                                        >
                                            <SelectValue
                                                placeholder={
                                                    selectedService
                                                        ? 'Select group'
                                                        : 'Select a service first'
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedService?.groups.map(
                                                (group) => (
                                                    <SelectItem
                                                        key={group.group_code}
                                                        value={group.group_code}
                                                    >
                                                        {group.group_code} —{' '}
                                                        {group.group_name}
                                                    </SelectItem>
                                                ),
                                            )}
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
                            name="class_id"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Class ID
                                    </FieldLabel>
                                    <Input
                                        id={field.name}
                                        {...field}
                                        placeholder="e.g. ADA1"
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
                            name="class"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Class
                                    </FieldLabel>
                                    <Input
                                        id={field.name}
                                        {...field}
                                        placeholder="e.g. Administrative Aide I"
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
                            name="salary_grade"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Salary Grade
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
                                            <SelectValue placeholder="Select salary grade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {salaryGrades.map((sg) => (
                                                <SelectItem
                                                    key={sg.salary_grade}
                                                    value={String(
                                                        sg.salary_grade,
                                                    )}
                                                >
                                                    SG {sg.salary_grade} —{' '}
                                                    {new Intl.NumberFormat(
                                                        'en-PH',
                                                        {
                                                            style: 'currency',
                                                            currency: 'PHP',
                                                        },
                                                    ).format(
                                                        Number(sg.min_rate),
                                                    )}{' '}
                                                    –{' '}
                                                    {new Intl.NumberFormat(
                                                        'en-PH',
                                                        {
                                                            style: 'currency',
                                                            currency: 'PHP',
                                                        },
                                                    ).format(
                                                        Number(sg.max_rate),
                                                    )}
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
                </ScrollArea>
            </div>
        </FormDialogShell>
    );
}
