import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Office, Ppa } from '@/types/global';
import { Spinner } from '@/components/ui/spinner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldSet,
    FieldTitle,
} from '@/components/ui/field';
import { Controller, useForm } from 'react-hook-form';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
    office_id: z.string().min(1, 'Implementing office is required'),
    name: z.string().min(1, 'Name is required'),
    code_suffix: z
        .string()
        .min(1, 'Suffix is required')
        .max(3, 'Suffix must be 3 digits (e.g., 001)')
        .regex(/^\d+$/, 'Suffix must be numeric'),
    type: z.enum(['Program', 'Project', 'Activity', 'Sub-Activity']),
    is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface PpaFormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'add' | 'edit';
    targetType: Ppa['type'];
    parentPpa: Ppa | null;
    editPpa: Ppa | null;
    offices: Office[];
}

export default function PpaFormDialog({
    isOpen,
    onOpenChange,
    mode,
    targetType,
    parentPpa,
    editPpa,
    offices,
}: PpaFormDialogProps) {
    const isEditing = mode === 'edit';
    const isAddingChild = mode === 'add' && !!parentPpa;
    const [openOfficeCommand, setOpenOfficeCommand] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isErrorAlertOpen, setIsErrorAlertOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            office_id: '',
            name: '',
            code_suffix: '',
            type: 'Program',
            is_active: true,
        },
    });

    const selectedOfficeId = Number(form.watch('office_id'));
    const codeSuffix = form.watch('code_suffix');

    useEffect(() => {
        if (!isOpen) return;

        if (isEditing && editPpa) {
            form.reset({
                office_id: editPpa.office_id.toString(),
                name: editPpa.name,
                code_suffix: editPpa.code_suffix,
                type: editPpa.type,
                is_active: !!editPpa.is_active,
            });
        } else if (mode === 'add') {
            form.reset({
                office_id: parentPpa?.office_id?.toString() || '',
                name: '',
                code_suffix: '',
                type: targetType,
                is_active: true,
            });
        }
    }, [isOpen, isEditing, editPpa, parentPpa, mode, targetType, form]);

    const getCodePreview = () => {
        const suffix = codeSuffix || '000';

        if (isAddingChild && parentPpa?.full_code) {
            return `${parentPpa.full_code}-${suffix}`;
        }

        if (isEditing && editPpa?.full_code && editPpa.type !== 'Program') {
            const baseCode = editPpa.full_code
                .split('-')
                .slice(0, -1)
                .join('-');
            return `${baseCode}-${suffix}`;
        }

        const officeFullCode = offices.find(
            (o) => o.id === selectedOfficeId,
        )?.full_code;
        return `${officeFullCode || '0000-000-0-00-000'}-${suffix}`;
    };

    function onSubmit(values: FormValues) {
        console.log(values);

        const payload: Record<string, any> = {
            ...values,
            office_id: Number(values.office_id),
        };

        if (isEditing && editPpa) {
            router.patch(`/ppas/${editPpa.id}`, payload, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsSubmitting(true),
                onSuccess: () => {
                    form.reset();
                    onOpenChange(false);
                },
                onFinish: () => setIsSubmitting(false),
            });
        } else {
            if (isAddingChild && parentPpa) {
                payload.parent_id = parentPpa.id;
            }
            router.post('/ppas', payload, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsSubmitting(true),
                onSuccess: () => {
                    form.reset();
                    onOpenChange(false);
                },
                onError: (errors) => {
                    console.error(errors);

                    if (errors.code_suffix) {
                        setErrorMessage(errors.code_suffix);
                        setIsErrorAlertOpen(true);
                    } else if (Object.keys(errors).length > 0) {
                        setErrorMessage(
                            'An error occurred while saving. Please check your inputs.',
                        );
                        setIsErrorAlertOpen(true);
                    }

                    Object.keys(errors).forEach((key) => {
                        form.setError(key as keyof FormValues, {
                            type: 'server',
                            message: errors[key],
                        });
                    });
                },
                onFinish: () => setIsSubmitting(false),
            });
        }
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent
                    onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
                    onPointerDownOutside={(e) =>
                        isSubmitting && e.preventDefault()
                    }
                    className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl"
                >
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing
                                ? `Edit ${targetType}`
                                : `Add ${targetType}`}
                        </DialogTitle>

                        <DialogDescription>
                            {isAddingChild
                                ? `Creating under: ${parentPpa?.name}`
                                : isEditing
                                  ? `Modify the details of this ${targetType.toLowerCase()}.`
                                  : `Create a new root level ${targetType.toLowerCase()}.`}
                        </DialogDescription>
                    </DialogHeader>

                    {/* <div className="flex flex-col gap-5"> */}
                    <div className="flex min-h-0 flex-1">
                        <ScrollArea className="w-full flex-1 pr-3">
                            <div className="flex flex-col gap-5">
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-2 flex flex-col gap-1 rounded-lg bg-card p-3">
                                        <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                            AIP Reference Code Preview
                                        </div>

                                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xl font-semibold">
                                            {getCodePreview()}
                                        </code>
                                    </div>

                                    <div className="col-span-1 rounded-lg bg-card p-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                                Entry Type
                                            </span>

                                            <span className="w-fit rounded border bg-background px-2 py-1 text-sm font-bold text-primary shadow-sm">
                                                {targetType}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <form
                                    id="ppa-form"
                                    onSubmit={form.handleSubmit(onSubmit)}
                                >
                                    <FieldGroup>
                                        {/* final textarea */}
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
                                                            PPA Description
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        </FieldLabel>

                                                        <Textarea
                                                            {...field}
                                                            id={field.name}
                                                            aria-invalid={
                                                                fieldState.invalid
                                                            }
                                                            placeholder={`Enter the name of the ${targetType.toLowerCase()}...`}
                                                            className="min-h-25 resize-none"
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

                                        <Controller
                                            name="office_id"
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
                                                            <span>
                                                                Implementing
                                                                Office
                                                            </span>
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        </FieldLabel>

                                                        {isEditing ||
                                                        isAddingChild ? (
                                                            <div className="flex w-full items-center gap-3 rounded-lg border bg-muted/40 p-3 shadow-sm ring-1 ring-black/5 ring-inset">
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background shadow-sm">
                                                                    <span className="text-lg">
                                                                        🏢
                                                                    </span>
                                                                </div>

                                                                <div className="flex min-w-0 flex-col">
                                                                    <span className="truncate text-sm font-semibold">
                                                                        {offices.find(
                                                                            (
                                                                                o,
                                                                            ) =>
                                                                                o.id.toString() ===
                                                                                field.value,
                                                                        )
                                                                            ?.name ||
                                                                            'Loading...'}
                                                                    </span>

                                                                    <span className="text-[10px] text-muted-foreground uppercase italic">
                                                                        {isEditing
                                                                            ? 'Locked during edit'
                                                                            : 'Inherited from parent (Locked)'}
                                                                    </span>
                                                                </div>

                                                                <input
                                                                    type="hidden"
                                                                    {...field}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* final button for command dialog */}
                                                                <Button
                                                                    id={
                                                                        field.name
                                                                    }
                                                                    type="button"
                                                                    variant="outline"
                                                                    aria-invalid={
                                                                        fieldState.invalid
                                                                    }
                                                                    className={cn(
                                                                        'justify-between',
                                                                        !field.value &&
                                                                            'text-muted-foreground',
                                                                    )}
                                                                    onClick={() =>
                                                                        setOpenOfficeCommand(
                                                                            true,
                                                                        )
                                                                    }
                                                                >
                                                                    {field.value ? (
                                                                        <span className="truncate">
                                                                            {
                                                                                offices.find(
                                                                                    (
                                                                                        o,
                                                                                    ) =>
                                                                                        o.id.toString() ===
                                                                                        field.value,
                                                                                )
                                                                                    ?.name
                                                                            }
                                                                        </span>
                                                                    ) : (
                                                                        'Select implementing office...'
                                                                    )}

                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                </Button>

                                                                {/* final command dialog */}
                                                                <CommandDialog
                                                                    open={
                                                                        openOfficeCommand
                                                                    }
                                                                    onOpenChange={
                                                                        setOpenOfficeCommand
                                                                    }
                                                                    className="flex max-h-[90vh] flex-col"
                                                                >
                                                                    <Command>
                                                                        <CommandInput placeholder="Search office name..." />

                                                                        <CommandList className="max-h-none flex-1">
                                                                            <CommandEmpty>
                                                                                No
                                                                                office
                                                                                found.
                                                                            </CommandEmpty>

                                                                            <CommandGroup heading="Offices">
                                                                                {offices.map(
                                                                                    (
                                                                                        office,
                                                                                    ) => (
                                                                                        <CommandItem
                                                                                            key={
                                                                                                office.id
                                                                                            }
                                                                                            value={`${office.acronym} ${office.name}`}
                                                                                            data-checked={
                                                                                                field.value ===
                                                                                                office.id.toString()
                                                                                            }
                                                                                            onSelect={() => {
                                                                                                // form.setValue(
                                                                                                //     'office_id',
                                                                                                //     office.id.toString(),
                                                                                                // );
                                                                                                field.onChange(
                                                                                                    office.id.toString(),
                                                                                                );

                                                                                                setOpenOfficeCommand(
                                                                                                    false,
                                                                                                );
                                                                                            }}
                                                                                            className="items-start gap-4 py-2"
                                                                                        >
                                                                                            <div className="grid w-full grid-cols-4 gap-4">
                                                                                                <span className="col-span-1">
                                                                                                    {office.acronym ??
                                                                                                        '-'}
                                                                                                </span>

                                                                                                <span className="col-span-3 whitespace-normal">
                                                                                                    {
                                                                                                        office.name
                                                                                                    }
                                                                                                </span>
                                                                                            </div>
                                                                                        </CommandItem>
                                                                                    ),
                                                                                )}
                                                                            </CommandGroup>
                                                                        </CommandList>
                                                                    </Command>
                                                                </CommandDialog>
                                                            </>
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

                                        {/* final text input controller */}
                                        <Controller
                                            name="code_suffix"
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
                                                            Code Suffix
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        </FieldLabel>

                                                        <Input
                                                            {...field}
                                                            id={field.name}
                                                            aria-invalid={
                                                                fieldState.invalid
                                                            }
                                                            placeholder="sample. 001"
                                                            maxLength={3}
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

                                        {/* final checkbox controller */}
                                        <div className="rounded bg-card p-4">
                                            <Controller
                                                name="is_active"
                                                control={form.control}
                                                render={({
                                                    field,
                                                    fieldState,
                                                }) => (
                                                    <FieldSet>
                                                        <FieldContent>
                                                            <FieldLegend variant="label">
                                                                Status
                                                            </FieldLegend>

                                                            <FieldGroup>
                                                                <Field
                                                                    orientation="horizontal"
                                                                    data-invalid={
                                                                        fieldState.invalid
                                                                    }
                                                                >
                                                                    <Checkbox
                                                                        id={
                                                                            field.name
                                                                        }
                                                                        aria-invalid={
                                                                            fieldState.invalid
                                                                        }
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
                                                                        Active
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

                                        {/* Hidden field to ensure type is always submitted */}
                                        <input
                                            {...form.register('type')}
                                            type="hidden"
                                        />
                                    </FieldGroup>
                                </form>
                            </div>
                        </ScrollArea>
                    </div>

                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            form="ppa-form"
                            disabled={isSubmitting}
                        >
                            <div className="flex items-center gap-1">
                                {isSubmitting && <Spinner />}

                                {isEditing ? 'Save Changes' : 'Create PPA'}
                            </div>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={isErrorAlertOpen}
                onOpenChange={setIsErrorAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Duplicate Entry Detected
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            {errorMessage}
                        </AlertDialogDescription>

                        <div className="mt-2 text-sm text-muted-foreground">
                            The AIP Reference Code combination (Office + Type +
                            Suffix) must be unique. Please change the suffix and
                            try again.
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={() => setIsErrorAlertOpen(false)}
                        >
                            Got it
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
