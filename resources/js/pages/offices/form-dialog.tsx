import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/ui/dialog';
import type { Office } from '@/types/global';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import {
    Field,
    FieldError,
    FieldLabel,
    FieldGroup,
    FieldContent,
    FieldSet,
    FieldLegend,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import type { Sector, LguLevel, OfficeType } from '@/types/global';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: Office | null;
    parentOffice: Office | null;
    sectors: Sector[];
    lguLevels: LguLevel[];
    officeTypes: OfficeType[];
    offices: Office[];
}

const formSchema = z.object({
    parent_id: z.string().optional(),
    sector_id: z.string().min(1, 'Sector is required'),
    lgu_level_id: z.string().min(1, 'LGU Level is required'),
    office_type_id: z.string().min(1, 'Office Type is required'),
    code: z.string().min(1).max(3, 'Suffix must be 1-3 characters'),
    name: z.string().min(1, 'Office name is required').max(100),
    acronym: z
        .string()
        .max(20, 'Acronym must be 20 characters or less')
        .optional(),
    is_lee: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function FormDialog({
    open,
    onOpenChange,
    initialData,
    parentOffice,
    sectors,
    lguLevels,
    officeTypes,
    offices,
}: FormDialogProps) {
    // console.log({
    //     initialData,
    // });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditing = !!initialData;
    const isAddingChild = !isEditing && !!parentOffice;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            parent_id: 'none',
            sector_id: '',
            lgu_level_id: '',
            office_type_id: '',
            code: '',
            name: '',
            acronym: '',
            is_lee: false,
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                const rawCode = initialData.code
                    ? String(parseInt(initialData.code, 10))
                    : '';

                form.reset({
                    parent_id: String(initialData.parent_id || 'none'),
                    sector_id: String(initialData.sector_id || ''),
                    lgu_level_id: String(initialData.lgu_level_id || ''),
                    office_type_id: String(initialData.office_type_id || ''),
                    code: rawCode,
                    name: initialData.name || '',
                    acronym: initialData.acronym || '',
                    is_lee: Boolean(initialData.is_lee || false),
                });
            } else if (parentOffice) {
                const rawCode = parentOffice.code
                    ? String(parseInt(parentOffice.code, 10))
                    : '';

                form.reset({
                    parent_id: String(parentOffice.id),
                    sector_id: String(parentOffice.sector_id || ''),
                    lgu_level_id: String(parentOffice.lgu_level_id || ''),
                    office_type_id: String(parentOffice.office_type_id || ''),
                    code: rawCode,
                    name: '',
                    acronym: '',
                    is_lee: false,
                });
            } else {
                form.reset({
                    parent_id: 'none',
                    sector_id: '',
                    lgu_level_id: '',
                    office_type_id: '',
                    code: '',
                    name: '',
                    acronym: '',
                    is_lee: false,
                });
            }
        }
    }, [initialData, parentOffice, open, form]);

    function onSubmit(data: FormValues) {
        const paddedCode = data.code.padStart(3, '0');
        const payload = {
            ...data,
            code: paddedCode,
            parent_id: data.parent_id === 'none' ? null : data.parent_id,
        };

        if (isEditing) {
            router.patch(`/offices/${initialData.id}`, payload, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => {
                    setIsLoading(true);
                    setError(null);
                },
                onFinish: () => setIsLoading(false),
                onSuccess: () => onOpenChange(false),
                onError: (errors) => {
                    setError(Object.values(errors).join('. '));
                },
            });
        } else {
            router.post('/offices', payload, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => {
                    setIsLoading(true);
                    setError(null);
                },
                onFinish: () => setIsLoading(false),
                onSuccess: () => onOpenChange(false),
                onError: (errors) => {
                    setError(Object.values(errors).join('. '));
                },
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                onPointerDownOutside={(e) => isLoading && e.preventDefault()}
                onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
                className="flex max-h-[90vh] flex-col overflow-hidden"
            >
                <DialogHeader>
                    <DialogTitle>
                        {isEditing
                            ? isEditing && initialData?.parent_id
                                ? 'Edit Sub Unit'
                                : 'Edit Office'
                            : isAddingChild
                              ? 'Create New Sub Unit'
                              : 'Create New Office'}
                    </DialogTitle>

                    <DialogDescription>
                        {isEditing
                            ? isEditing && initialData?.parent_id
                                ? 'Modify the details of the existing sub unit below.'
                                : 'Modify the details of the existing office below.'
                            : isAddingChild
                              ? 'Fill in the information to create a new sub unit record.'
                              : 'Fill in the information to create a new office record.'}
                    </DialogDescription>

                    {error && (
                        <div className="mt-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}
                </DialogHeader>

                <div className="flex min-h-0 flex-1">
                    <ScrollArea className="w-full flex-1 pr-3">
                        <form
                            id="office-form"
                            onSubmit={form.handleSubmit(onSubmit)}
                        >
                            <FieldGroup>
                                <div className="rounded-lg bg-muted p-3 text-center">
                                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Generated Account Code
                                    </span>

                                    <div className="font-mono text-xl font-bold text-primary">
                                        {(() => {
                                            const sectorId =
                                                form.watch('sector_id');
                                            const lguLevelId =
                                                form.watch('lgu_level_id');
                                            const officeTypeId =
                                                form.watch('office_type_id');
                                            const suffixRaw =
                                                form.watch('code');

                                            const selectedSector = sectors.find(
                                                (s) =>
                                                    String(s.id) === sectorId,
                                            );
                                            const selectedLguLevel =
                                                lguLevels.find(
                                                    (l) =>
                                                        String(l.id) ===
                                                        lguLevelId,
                                                );
                                            const selectedOfficeType =
                                                officeTypes.find(
                                                    (ot) =>
                                                        String(ot.id) ===
                                                        officeTypeId,
                                                );

                                            const sectorCode =
                                                selectedSector?.code || '0000';
                                            const lguLevelCode =
                                                selectedLguLevel?.code || '0';
                                            const officeTypeCode =
                                                selectedOfficeType?.code ||
                                                '00';
                                            // Pad suffix to 3 digits for preview
                                            const suffixCode = suffixRaw?.trim()
                                                ? suffixRaw.padStart(3, '0')
                                                : '000';

                                            return `${sectorCode}-${lguLevelCode}-${officeTypeCode}-${suffixCode}`;
                                        })()}
                                    </div>
                                </div>

                                {!(
                                    !isAddingChild &&
                                    (!isEditing || !initialData?.parent_id)
                                ) && (
                                    <Controller
                                        name="parent_id"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldContent>
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                        className="gap-1"
                                                    >
                                                        Parent Office
                                                        {/* <span className="text-red-500">
                                                            *
                                                        </span> */}
                                                    </FieldLabel>

                                                    <Select
                                                        name={field.name}
                                                        value={field.value}
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        disabled={
                                                            isAddingChild ||
                                                            (isEditing &&
                                                                initialData?.parent_id)
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            id={field.name}
                                                            className="w-full"
                                                        >
                                                            <SelectValue placeholder="Select parent office (optional)" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">
                                                                No parent
                                                            </SelectItem>
                                                            {offices
                                                                .filter(
                                                                    (office) =>
                                                                        // Prevent selecting self when editing
                                                                        !initialData ||
                                                                        office.id !==
                                                                            initialData.id,
                                                                )
                                                                .map(
                                                                    (
                                                                        office,
                                                                    ) => (
                                                                        <SelectItem
                                                                            key={
                                                                                office.id
                                                                            }
                                                                            value={String(
                                                                                office.id,
                                                                            )}
                                                                        >
                                                                            {
                                                                                office.name
                                                                            }
                                                                        </SelectItem>
                                                                    ),
                                                                )}
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
                                )}

                                {/* final select controller */}
                                <Controller
                                    name="sector_id"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            orientation="responsive"
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldContent>
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                    className="gap-1"
                                                >
                                                    Sector
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </FieldLabel>

                                                <Select
                                                    name={field.name}
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    disabled={
                                                        isAddingChild ||
                                                        (isEditing &&
                                                            initialData?.parent_id)
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id={field.name}
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                        className="w-full"
                                                    >
                                                        <SelectValue placeholder="Select Sector" />
                                                    </SelectTrigger>

                                                    <SelectContent position="item-aligned">
                                                        {sectors.map((item) => (
                                                            <SelectItem
                                                                key={item.id}
                                                                value={String(
                                                                    item.id,
                                                                )}
                                                            >
                                                                {item.code} -{' '}
                                                                {item.name}
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

                                <div className="grid grid-cols-2 gap-6">
                                    {/* final select controller */}
                                    <Controller
                                        name="lgu_level_id"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                orientation="responsive"
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldContent>
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                        className="gap-1"
                                                    >
                                                        LGU Level
                                                        <span className="text-red-500">
                                                            *
                                                        </span>
                                                    </FieldLabel>

                                                    <Select
                                                        name={field.name}
                                                        value={field.value}
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        disabled={
                                                            isAddingChild ||
                                                            (isEditing &&
                                                                initialData?.parent_id)
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            id={field.name}
                                                            aria-invalid={
                                                                fieldState.invalid
                                                            }
                                                            className="w-full"
                                                        >
                                                            <SelectValue placeholder="Select Level" />
                                                        </SelectTrigger>

                                                        <SelectContent position="item-aligned">
                                                            {lguLevels.map(
                                                                (item) => (
                                                                    <SelectItem
                                                                        key={
                                                                            item.id
                                                                        }
                                                                        value={String(
                                                                            item.id,
                                                                        )}
                                                                    >
                                                                        {
                                                                            item.name
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
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

                                    {/* final select controller */}
                                    <Controller
                                        name="office_type_id"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                orientation="responsive"
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldContent>
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                        className="gap-1"
                                                    >
                                                        Office Type
                                                        <span className="text-red-500">
                                                            *
                                                        </span>
                                                    </FieldLabel>

                                                    <Select
                                                        name={field.name}
                                                        value={field.value}
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        disabled={
                                                            isAddingChild ||
                                                            (isEditing &&
                                                                initialData?.parent_id)
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            id={field.name}
                                                            aria-invalid={
                                                                fieldState.invalid
                                                            }
                                                            className="w-full"
                                                        >
                                                            <SelectValue placeholder="Select Type" />
                                                        </SelectTrigger>

                                                        <SelectContent position="item-aligned">
                                                            {officeTypes.map(
                                                                (item) => (
                                                                    <SelectItem
                                                                        key={
                                                                            item.id
                                                                        }
                                                                        value={String(
                                                                            item.id,
                                                                        )}
                                                                    >
                                                                        {
                                                                            item.code
                                                                        }{' '}
                                                                        -{' '}
                                                                        {
                                                                            item.name
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
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
                                </div>

                                <div className="grid grid-cols-4 gap-6">
                                    <div className="col-span-1">
                                        {/* final text input controller */}
                                        <Controller
                                            name="code"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <FieldContent>
                                                        <FieldLabel
                                                            htmlFor={field.name}
                                                            className="gap-1"
                                                        >
                                                            Suffix
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
                                                            placeholder="001"
                                                            autoComplete="off"
                                                            disabled={
                                                                isAddingChild ||
                                                                (isEditing &&
                                                                    initialData?.parent_id)
                                                            }
                                                            // maxLength={3}
                                                            onChange={(e) => {
                                                                const raw =
                                                                    e.target
                                                                        .value;
                                                                const digits =
                                                                    raw.replace(
                                                                        /\D/g,
                                                                        '',
                                                                    );
                                                                const truncated =
                                                                    digits.slice(
                                                                        0,
                                                                        3,
                                                                    );
                                                                field.onChange(
                                                                    truncated,
                                                                );
                                                            }}
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
                                    </div>

                                    <div className="col-span-3">
                                        {/* final text input controller */}
                                        <Controller
                                            name="name"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field
                                                    data-invalid={
                                                        fieldState.invalid
                                                    }
                                                >
                                                    <FieldContent>
                                                        <FieldLabel
                                                            htmlFor={field.name}
                                                            className="gap-1"
                                                        >
                                                            {isAddingChild ||
                                                            (isEditing &&
                                                                initialData?.parent_id)
                                                                ? 'Sub Unit Name'
                                                                : 'Office Name'}
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
                                                            placeholder="sample. Office of the Provincial Governor"
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
                                    </div>
                                </div>

                                {/* final text input controller */}
                                <Controller
                                    name="acronym"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldContent>
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                    className="gap-1"
                                                >
                                                    Acronym
                                                    {/* <span className="text-destructive">
                                                        *
                                                    </span> */}
                                                </FieldLabel>

                                                <Input
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    placeholder="sample. OPG"
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

                                <div className="rounded bg-card p-4">
                                    {/* final checkbox controller */}
                                    <Controller
                                        name="is_lee"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <FieldSet>
                                                <FieldContent>
                                                    <FieldLegend variant="label">
                                                        Local Economic
                                                        Enterprise (LEE)
                                                    </FieldLegend>

                                                    <FieldGroup>
                                                        <Field
                                                            orientation="horizontal"
                                                            data-invalid={
                                                                fieldState.invalid
                                                            }
                                                        >
                                                            <Checkbox
                                                                id="is_lee"
                                                                checked={
                                                                    field.value
                                                                }
                                                                onCheckedChange={
                                                                    field.onChange
                                                                }
                                                            />

                                                            <FieldLabel
                                                                htmlFor={
                                                                    field.name
                                                                }
                                                                className="font-normal"
                                                            >
                                                                {field.value
                                                                    ? 'True'
                                                                    : 'False'}
                                                            </FieldLabel>
                                                        </Field>
                                                    </FieldGroup>

                                                    {fieldState.invalid && (
                                                        <FieldError
                                                            errors={[
                                                                fieldState.error,
                                                            ]}
                                                        />
                                                    )}
                                                </FieldContent>
                                            </FieldSet>
                                        )}
                                    />
                                </div>
                            </FieldGroup>
                        </form>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isLoading}>
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button
                        type="submit"
                        form="office-form"
                        disabled={isLoading}
                    >
                        {isEditing ? (
                            isLoading ? (
                                <span className="flex items-center gap-1">
                                    <Spinner />
                                    Saving Changes
                                </span>
                            ) : (
                                'Save Changes'
                            )
                        ) : isLoading ? (
                            <span className="flex items-center gap-1">
                                <Spinner />
                                {isAddingChild
                                    ? 'Creating Sub Unit'
                                    : 'Creating Office'}
                            </span>
                        ) : isAddingChild ? (
                            'Create Sub Unit'
                        ) : (
                            'Create Office'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
