import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { createColumnHelper } from '@tanstack/react-table';
import { ChevronsUpDown, Delete } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { TableSelect } from '@/components/base-ui-components/table-select';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    ButtonGroup,
    ButtonGroupSeparator,
} from '@/components/base-ui-components/ui/button-group';
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
import { CommandSelect } from '@/components/command-select';
import type { Ios, Office, PaginatedResponse, Position } from '@/types';

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
    iosList: PaginatedResponse<Ios>;
    userOfficeId?: number;
}

const columnHelper = createColumnHelper<Ios>();

const selectColumns = [
    columnHelper.accessor('class_id', {
        header: 'Class ID',
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('class', {
        header: 'Class',
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('salary_grade', {
        header: 'SG',
        cell: (info) => info.getValue(),
    }),
];

export default function FormDialog({
    open,
    onOpenChange,
    data,
    offices,
    iosList,
    userOfficeId,
}: FormDialogProps) {
    const [submitting, setSubmitting] = useState(false);
    const [openIosSelect, setOpenIosSelect] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            item_number: '',
            office_id: userOfficeId ? String(userOfficeId) : '',
            ios_id: '',
            employment_type: 'permanent',
            is_funded: 'true',
            status: 'vacant',
        },
    });

    const watchedIosId = useWatch({
        control: form.control,
        name: 'ios_id',
    });
    const watchedEmploymentType = useWatch({
        control: form.control,
        name: 'employment_type',
    });

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

    useEffect(() => {
        if (watchedEmploymentType === 'casual') {
            const laborerI = iosList.data.find(
                (ios) => ios.class === 'Laborer I',
            );

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

        if (data) {
            router.patch(`/position/${data.id}`, payload, options);
        } else {
            router.post('/position', payload, options);
        }
    }

    const isEditing = !!data;

    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Position' : 'Add New Position'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Modify the details of the existing position below.'
                            : 'Fill in the information to create a new position.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-1">
                    <ScrollArea className="w-full pr-3">
                        <form
                            id="position-form"
                            onSubmit={form.handleSubmit(handleSubmit)}
                            className="flex flex-col gap-4 py-1"
                        >
                            <Controller
                                name="item_number"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>
                                                Item Number
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id={field.name}
                                                placeholder="e.g. 001"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
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
                                name="office_id"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldContent>
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
                                                disabled
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
                                name="ios_id"
                                control={form.control}
                                render={({ field, fieldState }) => {
                                    const selectedIos = iosList.data.find(
                                        (ios) => String(ios.id) === field.value,
                                    );

                                    return (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldContent>
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    IOS Classification
                                                </FieldLabel>

                                                <ButtonGroup className="w-full">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="min-w-0 flex-1 justify-between text-left font-normal hover:text-current"
                                                        onClick={() =>
                                                            setOpenIosSelect(
                                                                true,
                                                            )
                                                        }
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                    >
                                                        <span className="truncate">
                                                            {selectedIos
                                                                ? `${selectedIos.class} (SG ${selectedIos.salary_grade})`
                                                                : 'Select IOS classification'}
                                                        </span>
                                                        <ChevronsUpDown />
                                                    </Button>
                                                    <ButtonGroupSeparator />
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        aria-label="clear selection"
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                        onClick={() =>
                                                            form.resetField(
                                                                'ios_id',
                                                                {
                                                                    defaultValue:
                                                                        '',
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <Delete />
                                                    </Button>
                                                </ButtonGroup>

                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </FieldContent>
                                        </Field>
                                    );
                                }}
                            />

                            <Controller
                                name="employment_type"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>
                                                Employment Type
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
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {employmentTypeOptions.map(
                                                        (opt) => (
                                                            <SelectItem
                                                                key={opt.value}
                                                                value={
                                                                    opt.value
                                                                }
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
                                        </FieldContent>
                                    </Field>
                                )}
                            />

                            <Controller
                                name="is_funded"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>
                                                Funded
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
                                        </FieldContent>
                                    </Field>
                                )}
                            />

                            <Controller
                                name="status"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>
                                                Status
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

                    <Button
                        type="submit"
                        form="position-form"
                        disabled={submitting}
                    >
                        {submitting
                            ? 'Saving...'
                            : isEditing
                              ? 'Save Changes'
                              : 'Add Position'}
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>

        <TableSelect<Ios>
            data={iosList.data}
            columns={selectColumns}
            open={openIosSelect}
            onOpenChange={setOpenIosSelect}
            paginationData={iosList}
            only={['iosList']}
            onRowSelect={(row) => {
                form.setValue('ios_id', String(row.id));
            }}
            value={form.watch('ios_id')}
            valueKey="id"
            title="Select IOS Classification"
            description="Search and select an IOS classification"
        />
        </>
    );
}
