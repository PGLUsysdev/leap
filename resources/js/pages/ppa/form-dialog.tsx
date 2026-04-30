import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Office, Ppa, AuthData } from '@/types/global';
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
    // FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    // FieldSeparator,
    FieldSet,
    // FieldTitle,
} from '@/components/ui/field';
import { ScrollArea } from '@/components/ui/scroll-area';
import { router } from '@inertiajs/react';

const formSchema = z.object({
    office_id: z.string().min(1, 'Implementing office is required'),
    name: z.string().min(1, 'Name is required'),
    code_suffix: z.string().optional(),
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
    auth: AuthData;
}

export default function PpaFormDialog({
    isOpen,
    onOpenChange,
    mode,
    targetType,
    parentPpa,
    editPpa,
    offices,
    auth,
}: PpaFormDialogProps) {
    const isEditing = mode === 'edit';
    const isAddingChild = mode === 'add' && !!parentPpa;
    const [openOfficeCommand, setOpenOfficeCommand] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isErrorAlertOpen, setIsErrorAlertOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const userOfficeId = auth.user.office_id;
    const isOfficeAutoSelected = mode === 'add' && !parentPpa && !!userOfficeId;

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
                // office_id: parentPpa?.office_id?.toString() || '',
                office_id:
                    parentPpa?.office_id?.toString() ||
                    userOfficeId?.toString() ||
                    '',
                name: '',
                code_suffix: '',
                type: targetType,
                is_active: true,
            });
        }
    }, [
        isOpen,
        isEditing,
        editPpa,
        parentPpa,
        mode,
        targetType,
        form,
        userOfficeId,
    ]);

    const getCodePreview = () => {
        // For add mode, show type-specific auto-generated placeholder
        if (!isEditing) {
            // Determine placeholder based on type
            let suffix: string;
            switch (targetType) {
                case 'Program':
                    suffix = 'XXX'; // 3 digits
                    break;
                case 'Project':
                    suffix = 'XX'; // 2 digits
                    break;
                case 'Activity':
                    suffix = 'XX'; // 2 digits
                    break;
                case 'Sub-Activity':
                    suffix = 'X'; // 1 digit, dynamic
                    break;
                default:
                    suffix = 'XXX';
            }

            if (isAddingChild && parentPpa?.full_code) {
                return `${parentPpa.full_code}-${suffix}`;
            }

            const officeFullCode = offices.find(
                (o) => o.id === selectedOfficeId,
            )?.full_code;
            return `${officeFullCode || '0000-000-0-00-000'}-${suffix}`;
        }

        // For edit mode, show the actual suffix
        const suffix = codeSuffix || '000';

        if (editPpa?.full_code && editPpa.type !== 'Program') {
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
        // console.log(values);

        const payload: Record<string, any> = {
            ...values,
            office_id: Number(values.office_id),
        };

        if (isEditing && editPpa) {
            router.patch(`/ppas/${editPpa.id}`, payload, {
                preserveState: false,
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
                only: ['ppaTree'],
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
                    className="flex max-h-[90vh] flex-col sm:max-w-2xl"
                    onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
                    onPointerDownOutside={(e) =>
                        isSubmitting && e.preventDefault()
                    }
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

                    <div className="flex min-h-0">
                        <ScrollArea className="w-full">
                            <form
                                id="ppa-form"
                                onSubmit={form.handleSubmit(onSubmit)}
                            >
                                <FieldGroup>
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
                                                        Implementing Office
                                                        <span className="text-destructive">
                                                            *
                                                        </span>
                                                    </FieldLabel>

                                                    <Button
                                                        id={field.name}
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
                                                        disabled={
                                                            isEditing ||
                                                            isAddingChild ||
                                                            isOfficeAutoSelected
                                                        }
                                                    >
                                                        {field.value ? (
                                                            <span className="truncate">
                                                                {
                                                                    offices.find(
                                                                        (o) =>
                                                                            o.id.toString() ===
                                                                            field.value,
                                                                    )?.name
                                                                }
                                                            </span>
                                                        ) : (
                                                            'Select implementing office...'
                                                        )}

                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>

                                                    {/* final command dialog */}
                                                    <CommandDialog
                                                        open={openOfficeCommand}
                                                        onOpenChange={
                                                            setOpenOfficeCommand
                                                        }
                                                        className="flex max-h-[90vh] flex-col"
                                                    >
                                                        <Command>
                                                            <CommandInput placeholder="Search office name..." />

                                                            <CommandList className="max-h-none flex-1">
                                                                <CommandEmpty>
                                                                    No office
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

                                    {/* final text input controller - only for add mode */}
                                    {!isEditing && (
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
                                                            <span className="text-xs text-muted-foreground">
                                                                (Auto-generated,
                                                                read-only)
                                                            </span>
                                                        </FieldLabel>

                                                        <Input
                                                            {...field}
                                                            id={field.name}
                                                            aria-invalid={
                                                                fieldState.invalid
                                                            }
                                                            placeholder="Auto-generated"
                                                            maxLength={10}
                                                            autoComplete="off"
                                                            disabled
                                                            className="bg-muted"
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
                                    )}

                                    <div className="rounded bg-card p-4">
                                        {/* final checkbox controller */}
                                        <Controller
                                            name="is_active"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
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
