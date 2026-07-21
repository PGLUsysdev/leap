import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/base-ui-components/ui/button';
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
    FieldLabel,
    FieldError,
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
import type { Ios } from '@/types';
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

    const selectedServiceCode = useWatch({
        control: form.control,
        name: 'occupational_service_code',
    });

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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit IOS' : 'Add New IOS'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Modify the details of the existing IOS record below.'
                            : 'Fill in the information to create a new IOS record.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-1">
                    <ScrollArea className="w-full pr-3">
                        <form
                            id="ios-form"
                            onSubmit={form.handleSubmit(handleSubmit)}
                            className="flex flex-col gap-4 py-1"
                        >
                            <Controller
                                name="occupational_service_code"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>
                                                Occupational Service
                                            </FieldLabel>

                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger
                                                    className="w-full"
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
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
                                        </FieldContent>
                                    </Field>
                                )}
                            />

                            <Controller
                                name="occupational_group_code"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>
                                                Occupational Group
                                            </FieldLabel>

                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger
                                                    className="w-full"
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    {selectedService ? (
                                                        <SelectValue placeholder="Select group" />
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            Select a service
                                                            first
                                                        </span>
                                                    )}
                                                </SelectTrigger>

                                                <SelectContent>
                                                    {selectedService?.groups.map(
                                                        (group) => (
                                                            <SelectItem
                                                                key={
                                                                    group.group_code
                                                                }
                                                                value={
                                                                    group.group_code
                                                                }
                                                            >
                                                                {
                                                                    group.group_code
                                                                }{' '}
                                                                —{' '}
                                                                {
                                                                    group.group_name
                                                                }
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
                                        </FieldContent>
                                    </Field>
                                )}
                            />

                            <Controller
                                name="class_id"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>
                                                Class ID
                                            </FieldLabel>

                                            <Input
                                                {...field}
                                                id={field.name}
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="e.g. ADA1"
                                                autoComplete="off"
                                            />

                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </FieldContent>
                                    </Field>
                                )}
                            />

                            <Controller
                                name="class"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>
                                                Class
                                            </FieldLabel>

                                            <Input
                                                {...field}
                                                id={field.name}
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="e.g. Administrative Aide I"
                                                autoComplete="off"
                                            />

                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </FieldContent>
                                    </Field>
                                )}
                            />

                            <Controller
                                name="salary_grade"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>
                                                Salary Grade
                                            </FieldLabel>

                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger
                                                    className="w-full"
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <SelectValue placeholder="Select salary grade" />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    {salaryGrades.map((sg) => (
                                                        <SelectItem
                                                            key={
                                                                sg.salary_grade
                                                            }
                                                            value={String(
                                                                sg.salary_grade,
                                                            )}
                                                        >
                                                            SG {sg.salary_grade}{' '}
                                                            —{' '}
                                                            {new Intl.NumberFormat(
                                                                'en-PH',
                                                                {
                                                                    style: 'currency',
                                                                    currency:
                                                                        'PHP',
                                                                },
                                                            ).format(
                                                                Number(
                                                                    sg.min_rate,
                                                                ),
                                                            )}{' '}
                                                            –{' '}
                                                            {new Intl.NumberFormat(
                                                                'en-PH',
                                                                {
                                                                    style: 'currency',
                                                                    currency:
                                                                        'PHP',
                                                                },
                                                            ).format(
                                                                Number(
                                                                    sg.max_rate,
                                                                ),
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
                                        </FieldContent>
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
                        onClick={() => {
                            onOpenChange(false);
                            form.reset();
                        }}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>

                    <Button type="submit" form="ios-form" disabled={submitting}>
                        {submitting
                            ? 'Saving...'
                            : isEditing
                              ? 'Save Changes'
                              : 'Add IOS'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
