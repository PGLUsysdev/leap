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
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
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
    sectors: Sector[];
    lguLevels: LguLevel[];
    officeTypes: OfficeType[];
}

const formSchema = z.object({
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
    sectors,
    lguLevels,
    officeTypes,
}: FormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const isEditing = !!initialData;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
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
                    sector_id: String(initialData.sector_id || ''),
                    lgu_level_id: String(initialData.lgu_level_id || ''),
                    office_type_id: String(initialData.office_type_id || ''),
                    code: rawCode,
                    name: initialData.name || '',
                    acronym: initialData.acronym || '',
                    is_lee: Boolean(initialData.is_lee || false),
                });
            } else {
                form.reset({
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
    }, [initialData, open, form]);

    function onSubmit(data: FormValues) {
        const paddedCode = data.code.padStart(3, '0');
        const payload = { ...data, code: paddedCode };

        if (isEditing) {
            router.patch(`/offices/${initialData.id}`, payload, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
                onSuccess: () => onOpenChange(false),
            });
        } else {
            router.post('/offices', data, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
                onSuccess: () => onOpenChange(false),
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                onPointerDownOutside={(e) => isLoading && e.preventDefault()}
                onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
                className="flex max-h-[90vh] flex-col gap-0 overflow-hidden"
            >
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Office' : 'Create New Office'}
                    </DialogTitle>

                    <DialogDescription>
                        {isEditing
                            ? 'Modify the details of the existing office below.'
                            : 'Fill in the information to create a new office record.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 py-4">
                    <ScrollArea className="w-full flex-1 pr-3">
                        <form
                            id="office-form"
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
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
                                        const suffixRaw = form.watch('code');

                                        const selectedSector = sectors.find(
                                            (s) => String(s.id) === sectorId,
                                        );
                                        const selectedLguLevel = lguLevels.find(
                                            (l) => String(l.id) === lguLevelId,
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
                                            selectedOfficeType?.code || '00';
                                        // Pad suffix to 3 digits for preview
                                        const suffixCode = suffixRaw?.trim()
                                            ? suffixRaw.padStart(3, '0')
                                            : '000';

                                        return `${sectorCode}-${lguLevelCode}-${officeTypeCode}-${suffixCode}`;
                                    })()}
                                </div>
                            </div>

                            <Controller
                                name="sector_id"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="office-form-sector">
                                            Sector
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Sector" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sectors.map((item) => (
                                                    <SelectItem
                                                        key={item.id}
                                                        value={String(item.id)}
                                                    >
                                                        {item.code} -{' '}
                                                        {item.name}
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

                            <div className="grid grid-cols-2 gap-6">
                                <Controller
                                    name="lgu_level_id"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="office-form-lgu-level">
                                                LGU Level
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Level" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {lguLevels.map((item) => (
                                                        <SelectItem
                                                            key={item.id}
                                                            value={String(
                                                                item.id,
                                                            )}
                                                        >
                                                            {item.name}
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
                                    name="office_type_id"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="office-form-office-type">
                                                Office Type
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {officeTypes.map((item) => (
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
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-4 gap-6">
                                <div className="col-span-3">
                                    <Controller
                                        name="name"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldLabel htmlFor="office-form-name">
                                                    Office Name
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </FieldLabel>
                                                <Input
                                                    {...field}
                                                    id="office-form-name"
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    placeholder="Office of the Mayor"
                                                    autoComplete="off"
                                                />
                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </Field>
                                        )}
                                    />
                                </div>

                                <div className="col-span-1">
                                    <Controller
                                        name="code"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                            >
                                                <FieldLabel htmlFor="office-form-code">
                                                    Suffix
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </FieldLabel>
                                                <Input
                                                    {...field}
                                                    id="office-form-code"
                                                    aria-invalid={
                                                        fieldState.invalid
                                                    }
                                                    placeholder="001"
                                                    autoComplete="off"
                                                    onChange={(e) => {
                                                        // Allow only digits, max 3 chars
                                                        const raw =
                                                            e.target.value;
                                                        const digits =
                                                            raw.replace(
                                                                /\D/g,
                                                                '',
                                                            );
                                                        const truncated =
                                                            digits.slice(0, 3);
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
                                            </Field>
                                        )}
                                    />
                                </div>
                            </div>

                            <Controller
                                name="acronym"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="office-form-acronym">
                                            Acronym
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id="office-form-acronym"
                                            aria-invalid={fieldState.invalid}
                                            placeholder="PTO"
                                            autoComplete="off"
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
                                name="is_lee"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <div className="flex flex-col gap-1">
                                            <FieldLabel htmlFor="is_lee">
                                                Local Economic Enterprise (LEE)
                                            </FieldLabel>
                                            <label htmlFor="is_lee">
                                                <div className="flex items-center gap-2 rounded-md border p-2">
                                                    <Checkbox
                                                        id="is_lee"
                                                        checked={field.value}
                                                        onCheckedChange={
                                                            field.onChange
                                                        }
                                                    />
                                                    <span>
                                                        {field.value
                                                            ? 'True'
                                                            : 'False'}
                                                    </span>
                                                </div>
                                            </label>
                                        </div>
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
                                Creating Office
                            </span>
                        ) : (
                            'Create Office'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
