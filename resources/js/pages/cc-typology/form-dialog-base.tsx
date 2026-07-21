import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
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
import type { CcTypology, CcStrategicPriority, CcSubSector } from '@/types';

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: CcTypology | null;
    strategicPriorities: CcStrategicPriority[];
    subSectors: CcSubSector[];
}

function createFormSchema(subSectors: CcSubSector[]) {
    return z
        .object({
            strategic_priority_id: z
                .string()
                .min(1, 'Strategic priority is required'),
            sub_sector_id: z.string(),
            response_type: z.enum(['A', 'M'], {
                message: 'Response type is required',
            }),
            category_code: z.enum(['1', '2', '3', '4'], {
                message: 'Category is required',
            }),
            item_num: z
                .string()
                .min(1, 'Item number is required')
                .regex(/^\d+$/, 'Must be a number')
                .refine((val) => parseInt(val, 10) > 0, {
                    message: 'Item number must be greater than 0',
                }),
            description: z.string().trim().min(1, 'Description is required'),
            is_nccap_activity: z.boolean(),
        })
        .superRefine((data, ctx) => {
            if (data.strategic_priority_id) {
                const prioritySubSectors = subSectors.filter(
                    (ss) =>
                        String(ss.strategic_priority_id) ===
                        data.strategic_priority_id,
                );

                if (
                    prioritySubSectors.length > 0 &&
                    (!data.sub_sector_id ||
                        data.sub_sector_id === 'none' ||
                        data.sub_sector_id === '')
                ) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Sub sector is required',
                        path: ['sub_sector_id'],
                    });
                }
            }
        });
}

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

const responseTypeOptions = [
    { value: 'A' as const, label: 'Adaptation' },
    { value: 'M' as const, label: 'Mitigation' },
];

const categoryOptions = [
    { value: '1' as const, label: 'Policy Development and Governance' },
    { value: '2' as const, label: 'Research, Development and Extension' },
    { value: '3' as const, label: 'Knowledge Sharing and Capacity Building' },
    { value: '4' as const, label: 'Service Delivery' },
];

export default function FormDialog({
    open,
    onOpenChange,
    initialData,
    strategicPriorities = [],
    subSectors = [],
}: FormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const isEditing = !!initialData;

    function handleOpenChange(isOpen: boolean) {
        if (isOpen) {
            setFormError(null);
        }

        onOpenChange(isOpen);
    }

    const formSchema = useMemo(
        () => createFormSchema(subSectors),
        [subSectors],
    );

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            strategic_priority_id: '',
            sub_sector_id: 'none',
            response_type: undefined,
            category_code: undefined,
            item_num: '',
            description: '',
            is_nccap_activity: false,
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    strategic_priority_id: String(
                        initialData.strategic_priority_id,
                    ),
                    sub_sector_id: initialData.sub_sector_id
                        ? String(initialData.sub_sector_id)
                        : 'none',
                    response_type: initialData.response_type as 'A' | 'M',
                    category_code: initialData.category_code as
                        '1' | '2' | '3' | '4',
                    item_num: String(initialData.item_num),
                    description: initialData.description,
                    is_nccap_activity: initialData.is_nccap_activity,
                });
            } else {
                form.reset({
                    strategic_priority_id: '',
                    sub_sector_id: 'none',
                    response_type: undefined,
                    category_code: undefined,
                    item_num: '',
                    description: '',
                    is_nccap_activity: false,
                });
            }
        }
    }, [open, initialData, form]);

    const watchedStrategicPriority = useWatch({
        control: form.control,
        name: 'strategic_priority_id',
    });
    const watchedSubSectorId = useWatch({
        control: form.control,
        name: 'sub_sector_id',
    });
    const watchedResponseType = useWatch({
        control: form.control,
        name: 'response_type',
    });
    const watchedCategoryCode = useWatch({
        control: form.control,
        name: 'category_code',
    });
    const watchedItemNum = useWatch({
        control: form.control,
        name: 'item_num',
    });

    const selectedPriority = strategicPriorities.find(
        (sp) => String(sp.id) === watchedStrategicPriority,
    );

    const selectedSubSector = subSectors.find(
        (ss) => String(ss.id) === watchedSubSectorId,
    );

    const filteredSubSectors = subSectors.filter(
        (ss) => String(ss.strategic_priority_id) === watchedStrategicPriority,
    );

    const subSectorCodeForDisplay = useMemo(() => {
        if (!watchedStrategicPriority) {
            return '_';
        }

        if (selectedSubSector?.code) {
            return selectedSubSector.code;
        }

        if (filteredSubSectors.length === 0) {
            return '1';
        }

        return '_';
    }, [watchedStrategicPriority, selectedSubSector, filteredSubSectors]);

    const paddedItemNum = watchedItemNum?.trim()
        ? watchedItemNum.padStart(2, '0')
        : '';

    const generatedCode = `${watchedResponseType || '_'}${selectedPriority?.code ?? '_'}${subSectorCodeForDisplay}${watchedCategoryCode || '_'}-${paddedItemNum || '__'}`;

    function onSubmit(data: FormValues) {
        const payload = {
            ...data,
            sub_sector_id:
                data.sub_sector_id === 'none' ? null : data.sub_sector_id,
            item_num: Number(data.item_num),
        };

        function handleError(errors: Record<string, string>) {
            if (errors.message) {
                setFormError(errors.message as string);

                return;
            }

            Object.keys(errors).forEach((key) => {
                form.setError(key as any, {
                    type: 'server',
                    message: errors[key],
                });
            });
        }

        if (isEditing) {
            router.patch(`/cc-typology/${initialData.id}`, payload, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => onOpenChange(false),
                onError: handleError,
                onFinish: () => setIsLoading(false),
            });
        } else {
            router.post('/cc-typology', payload, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => onOpenChange(false),
                onError: handleError,
                onFinish: () => setIsLoading(false),
            });
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing
                                ? 'Edit CC Typology'
                                : 'Create CC Typology'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? 'Modify the details of the existing typology below.'
                                : 'Fill in the information to create a new climate change typology record.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex min-h-0">
                        <ScrollArea className="w-full pr-3">
                            <form
                                id="cc-typology-form"
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="flex flex-col gap-4 py-1"
                            >
                                <div className="rounded-lg bg-muted p-3 text-center">
                                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Generated Code
                                    </span>
                                    <div className="font-mono text-xl font-bold tracking-widest text-primary">
                                        {generatedCode}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Sub sector defaults to{' '}
                                        <span className="font-mono">1</span>{' '}
                                        when set to None
                                    </p>
                                </div>

                                <Controller
                                    name="response_type"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldContent>
                                                <FieldLabel className="gap-1">
                                                    Response Type
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
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        {responseTypeOptions.map(
                                                            (opt) => (
                                                                <SelectItem
                                                                    key={
                                                                        opt.value
                                                                    }
                                                                    value={
                                                                        opt.value
                                                                    }
                                                                >
                                                                    {opt.value}{' '}
                                                                    -{' '}
                                                                    {opt.label}
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

                                <Controller
                                    name="strategic_priority_id"
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
                                                    Strategic Priority
                                                </FieldLabel>

                                                <Select
                                                    value={field.value}
                                                    onValueChange={(value) => {
                                                        field.onChange(value);

                                                        const prioritySubs =
                                                            subSectors.filter(
                                                                (ss) =>
                                                                    String(
                                                                        ss.strategic_priority_id,
                                                                    ) === value,
                                                            );

                                                        if (
                                                            prioritySubs.length ===
                                                            0
                                                        ) {
                                                            form.setValue(
                                                                'sub_sector_id',
                                                                'none',
                                                            );
                                                        } else {
                                                            form.setValue(
                                                                'sub_sector_id',
                                                                '',
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger
                                                        className="w-full"
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                    >
                                                        <SelectValue placeholder="Select priority" />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        {strategicPriorities.map(
                                                            (sp) => (
                                                                <SelectItem
                                                                    key={sp.id}
                                                                    value={String(
                                                                        sp.id,
                                                                    )}
                                                                >
                                                                    {sp.code} -{' '}
                                                                    {sp.name}
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

                                <Controller
                                    name="sub_sector_id"
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
                                                    Sub Sector
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
                                                        {!watchedStrategicPriority ? (
                                                            <SelectValue placeholder="Select priority first" />
                                                        ) : filteredSubSectors.length ===
                                                          0 ? (
                                                            <span className="text-muted-foreground">
                                                                None
                                                            </span>
                                                        ) : (
                                                            <SelectValue placeholder="Select sub sector" />
                                                        )}
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        {filteredSubSectors.length ===
                                                        0 ? (
                                                            <SelectItem value="none">
                                                                None
                                                            </SelectItem>
                                                        ) : (
                                                            filteredSubSectors.map(
                                                                (ss) => (
                                                                    <SelectItem
                                                                        key={
                                                                            ss.id
                                                                        }
                                                                        value={String(
                                                                            ss.id,
                                                                        )}
                                                                    >
                                                                        {
                                                                            ss.code
                                                                        }{' '}
                                                                        -{' '}
                                                                        {
                                                                            ss.name
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>

                                                {(!watchedStrategicPriority ||
                                                    filteredSubSectors.length ===
                                                        0) && (
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        Defaults to{' '}
                                                        <span className="font-mono">
                                                            1
                                                        </span>{' '}
                                                        when set to None
                                                    </p>
                                                )}

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
                                    name="category_code"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldContent>
                                                <FieldLabel className="gap-1">
                                                    Category
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
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        {categoryOptions.map(
                                                            (opt) => (
                                                                <SelectItem
                                                                    key={
                                                                        opt.value
                                                                    }
                                                                    value={
                                                                        opt.value
                                                                    }
                                                                >
                                                                    {opt.value}{' '}
                                                                    -{' '}
                                                                    {opt.label}
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

                                <div className="grid grid-cols-2 gap-4">
                                    <Controller
                                        name="item_num"
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
                                                        Item No.
                                                    </FieldLabel>

                                                    <Input
                                                        {...field}
                                                        id={field.name}
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                        placeholder="01"
                                                        autoComplete="off"
                                                        onChange={(e) => {
                                                            const raw =
                                                                e.target.value;
                                                            const digits = raw
                                                                .replace(
                                                                    /\D/g,
                                                                    '',
                                                                )
                                                                .slice(0, 2);
                                                            field.onChange(
                                                                digits,
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

                                    <div className="flex items-end pb-4">
                                        <Controller
                                            name="is_nccap_activity"
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

                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                        className="font-normal"
                                                    >
                                                        NCCAP Activity
                                                    </FieldLabel>
                                                </Field>
                                            )}
                                        />
                                    </div>
                                </div>

                                <Controller
                                    name="description"
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
                                                    Description
                                                </FieldLabel>

                                                <Textarea
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    placeholder="Enter description..."
                                                    autoComplete="off"
                                                    rows={3}
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
                            form="cc-typology-form"
                            disabled={isLoading}
                        >
                            {isLoading
                                ? isEditing
                                    ? 'Saving...'
                                    : 'Creating...'
                                : isEditing
                                  ? 'Save Changes'
                                  : 'Create Typology'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!formError} onOpenChange={() => setFormError(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Error</DialogTitle>
                        <DialogDescription>{formError}</DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setFormError(null)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
