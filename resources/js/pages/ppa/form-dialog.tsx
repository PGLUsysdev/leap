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
import { useForm } from 'react-hook-form';
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

// Zod Schema updated to match your exact Types (using 'name' instead of 'title')
const formSchema = z.object({
    office_id: z.string().min(1, 'Implementing office is required'),
    name: z.string().min(1, 'Name is required'),
    code_suffix: z
        .string()
        .min(1, 'Suffix is required')
        .max(3, 'Suffix must be 3 digits (e.g., 001)')
        .regex(/^\d+$/, 'Suffix must be numeric'),
    type: z.enum(['Program', 'Project', 'Activity', 'Sub-Activity']),
    // Removed .default(true) to fix the TypeScript / Resolver error
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
    // console.log({
    //     isOpen,
    //     onOpenChange,
    //     mode,
    //     targetType,
    //     parentPpa,
    //     editPpa,
    //     offices,
    // });

    const isEditing = mode === 'edit';
    const isAddingChild = mode === 'add' && !!parentPpa;

    const [openOfficeCommand, setOpenOfficeCommand] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Sync form with props when dialog opens
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

        // 1. Adding a child: Base code is parent's full code
        if (isAddingChild && parentPpa?.full_code) {
            return `${parentPpa.full_code}-${suffix}`;
        }

        // 2. Editing an item (not root): Remove its old suffix and append new one
        if (isEditing && editPpa?.full_code && editPpa.type !== 'Program') {
            const baseCode = editPpa.full_code
                .split('-')
                .slice(0, -1)
                .join('-');
            return `${baseCode}-${suffix}`;
        }

        // 3. Root Program: Use Office full_code
        const officeFullCode = offices.find(
            (o) => o.id === selectedOfficeId,
        )?.full_code;
        return `${officeFullCode || '0000-000-0-00-000'}-${suffix}`;
    };

    function onSubmit(values: FormValues) {
        console.log(values);

        // Coerce office_id to number to match your TS Type before sending to backend
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
                onFinish: () => setIsSubmitting(false),
            });
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-2xl"
                onPointerDownOutside={(e) => isSubmitting && e.preventDefault()}
                onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? `Edit ${targetType}` : `Add ${targetType}`}
                    </DialogTitle>
                    <DialogDescription>
                        {isAddingChild
                            ? `Creating under: ${parentPpa?.name}`
                            : isEditing
                              ? `Modify the details of this ${targetType.toLowerCase()}.`
                              : `Create a new root level ${targetType.toLowerCase()}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-4">
                    <div className="flex-3 rounded-lg bg-card p-3">
                        <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                            AIP Reference Code Preview
                        </div>
                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xl font-semibold">
                            {getCodePreview()}
                        </code>
                    </div>

                    <div className="flex-1 rounded-lg bg-card p-3">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                Entry Type
                            </span>
                            <span className="w-fit rounded border bg-background px-2 py-1 text-sm font-bold text-primary shadow-sm">
                                {targetType}
                            </span>
                        </div>
                    </div>
                </div>

                <Form {...form}>
                    <form
                        id="ppa-form"
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        {/* OFFICE SELECTION */}
                        <div className="col-span-1 md:col-span-2">
                            <FormField
                                control={form.control}
                                name="office_id"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                            Implementing Office
                                        </FormLabel>

                                        {isEditing || isAddingChild ? (
                                            // LOCKED STATE
                                            <div className="flex w-full items-center gap-3 rounded-lg border bg-muted/40 p-3 shadow-sm ring-1 ring-black/5 ring-inset">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background shadow-sm">
                                                    <span className="text-lg">
                                                        🏢
                                                    </span>
                                                </div>
                                                <div className="flex min-w-0 flex-col">
                                                    <span className="truncate text-sm font-semibold">
                                                        {offices.find(
                                                            (o) =>
                                                                o.id.toString() ===
                                                                field.value,
                                                        )?.name || 'Loading...'}
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
                                            // SELECTABLE STATE (New Program)
                                            <>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={
                                                        openOfficeCommand
                                                    }
                                                    className={cn(
                                                        'w-full justify-between px-3 text-left font-normal',
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

                                                <CommandDialog
                                                    open={openOfficeCommand}
                                                    onOpenChange={
                                                        setOpenOfficeCommand
                                                    }
                                                >
                                                    <Command>
                                                        <CommandInput placeholder="Search office name..." />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                No office found.
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
                                                                            value={
                                                                                office.name
                                                                            }
                                                                            onSelect={() => {
                                                                                form.setValue(
                                                                                    'office_id',
                                                                                    office.id.toString(),
                                                                                );
                                                                                setOpenOfficeCommand(
                                                                                    false,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <div className="flex w-full items-center justify-between">
                                                                                <span>
                                                                                    {
                                                                                        office.name
                                                                                    }
                                                                                </span>
                                                                                {field.value ===
                                                                                    office.id.toString() && (
                                                                                    <Check className="ml-2 h-4 w-4 opacity-100" />
                                                                                )}
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* CODE SUFFIX & ACTIVE STATUS */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="code_suffix"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Suffix (Sequence)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. 001"
                                                    {...field}
                                                    maxLength={3}
                                                    autoComplete="off"
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                3-digit code for the reference
                                                ID.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="md:col-span-3">
                                <FormField
                                    control={form.control}
                                    name="is_active"
                                    render={({ field }) => (
                                        <FormItem className="flex h-full flex-row items-start space-y-0 space-x-3 rounded-md border p-4 shadow-sm">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="cursor-pointer">
                                                    Active Entry
                                                </FormLabel>
                                                <FormDescription>
                                                    Only active PPAs can be
                                                    selected for annual budget
                                                    planning.
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* NAME FIELD */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Official Name / Title</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={`Enter the name of the ${targetType.toLowerCase()}...`}
                                            className="min-h-[100px] resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Hidden field to ensure type is always submitted */}
                        <input type="hidden" {...form.register('type')} />
                    </form>
                </Form>

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
    );
}
