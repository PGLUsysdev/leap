import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';

import { CommandSelect } from '@/components/command-select';
import { FormDialogShell } from '@/components/form-dialog-shell';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Ios, Office, Position } from '@/types';

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
    userOfficeId?: number | null;
}

export default function FormDialog({
    open,
    onOpenChange,
    data,
    offices,
    iosList,
    userOfficeId,
}: FormDialogProps) {
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            item_number: '',
            office_id: data
                ? String(data.office_id)
                : userOfficeId
                  ? String(userOfficeId)
                  : '',
            ios_id: '',
            employment_type: 'permanent',
            is_funded: 'true',
            status: 'vacant',
        },
    });

    const watchedIosId = form.watch('ios_id');
    const watchedEmploymentType = form.watch('employment_type');

    const employmentTypeOptions = watchedIosId
        ? ([
              { value: 'permanent', label: 'Permanent' },
              { value: 'contractual', label: 'Contractual' },
              ...(watchedEmploymentType === 'casual'
                  ? [{ value: 'casual', label: 'Casual' }]
                  : []),
          ] as const)
        : ([
              { value: 'permanent', label: 'Permanent' },
              { value: 'casual', label: 'Casual' },
              { value: 'contractual', label: 'Contractual' },
              { value: 'job_order', label: 'Job Order' },
          ] as const);

    // When casual is selected, auto-set IOS to Laborer I
    useEffect(() => {
        if (watchedEmploymentType === 'casual') {
            const laborerI = iosList.find((ios) => ios.class === 'Laborer I');
            if (laborerI) {
                form.setValue('ios_id', String(laborerI.id));
            }
        }
    }, [watchedEmploymentType, iosList, form]);

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
                office_id: userOfficeId ? String(userOfficeId) : '',
                ios_id: '',
                employment_type: 'permanent',
                is_funded: 'true',
                status: 'vacant',
            });
        }
    }, [data, form, userOfficeId]);

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
                                    <CommandSelect<Office>
                                        value={field.value}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                        options={offices}
                                        getOptionValue={(office) =>
                                            String(office.id)
                                        }
                                        getOptionSearchText={(office) =>
                                            office.name
                                        }
                                        renderTrigger={(office) => (
                                            <span className="truncate">
                                                {office.acronym
                                                    ? `${office.acronym} — ${office.name}`
                                                    : office.name}
                                            </span>
                                        )}
                                        renderOption={(office) => (
                                            <span>
                                                {office.acronym
                                                    ? `${office.acronym} — ${office.name}`
                                                    : office.name}
                                            </span>
                                        )}
                                        placeholder="Select office"
                                        searchPlaceholder="Search offices..."
                                        heading="Offices"
                                        disabled={!data}
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
                            name="ios_id"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        IOS Classification
                                    </FieldLabel>
                                    <CommandSelect<Ios>
                                        value={field.value}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                        options={iosList}
                                        getOptionValue={(ios) => String(ios.id)}
                                        getOptionSearchText={(ios) => ios.class}
                                        renderTrigger={(ios) => (
                                            <span className="truncate">
                                                {ios.class} (SG{' '}
                                                {ios.salary_grade})
                                            </span>
                                        )}
                                        renderOption={(ios) => (
                                            <span>
                                                {ios.class} (SG{' '}
                                                {ios.salary_grade})
                                            </span>
                                        )}
                                        placeholder="Select IOS"
                                        searchPlaceholder="Search IOS classifications..."
                                        heading="IOS Classifications"
                                        onClear={() => field.onChange('')}
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
                                            {employmentTypeOptions.map(
                                                (opt) => (
                                                    <SelectItem
                                                        key={opt.value}
                                                        value={opt.value}
                                                    >
                                                        {opt.label}
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
