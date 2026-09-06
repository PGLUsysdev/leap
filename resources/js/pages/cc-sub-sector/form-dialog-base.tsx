import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import type { CcStrategicPriority, CcSubSector } from '@/types';

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: CcSubSector | null;
    strategicPriorities: CcStrategicPriority[];
}

const formSchema = z.object({
    strategic_priority_id: z.string().min(1, 'Strategic priority is required'),
    code: z
        .string()
        .min(1, 'Code is required')
        .regex(/^\d$/, 'Must be exactly 1 digit')
        .refine((val) => val !== '0', {
            message: 'Code cannot be 0',
        }),
    name: z.string().min(1, 'Name is required'),
});

type FormValues = z.infer<typeof formSchema>;

export default function FormDialog({
    open,
    onOpenChange,
    initialData,
    strategicPriorities = [],
}: FormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            strategic_priority_id: '',
            code: '',
            name: '',
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    strategic_priority_id: String(
                        initialData.strategic_priority_id,
                    ),
                    code: String(initialData.code),
                    name: initialData.name,
                });
            } else {
                form.reset({
                    strategic_priority_id: '',
                    code: '',
                    name: '',
                });
            }
        }
    }, [open, initialData, form]);

    function onSubmit(data: FormValues) {
        const payload = {
            strategic_priority_id: Number(data.strategic_priority_id),
            code: Number(data.code),
            name: data.name,
        };

        if (isEditing) {
            router.patch(`/cc-sub-sector/${initialData.id}`, payload, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => onOpenChange(false),
                onError: (errors) => {
                    Object.keys(errors).forEach((key) => {
                        form.setError(key as any, {
                            type: 'server',
                            message: errors[key],
                        });
                    });
                },
                onFinish: () => setIsLoading(false),
            });
        } else {
            router.post('/cc-sub-sector', payload, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => onOpenChange(false),
                onError: (errors) => {
                    Object.keys(errors).forEach((key) => {
                        form.setError(key as any, {
                            type: 'server',
                            message: errors[key],
                        });
                    });
                },
                onFinish: () => setIsLoading(false),
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing
                            ? 'Edit CC Sub Sector'
                            : 'Create CC Sub Sector'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Modify the details of the existing sub sector below.'
                            : 'Fill in the information to create a new sub sector.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0">
                    <ScrollArea className="w-full pr-3">
                        <form
                            id="cc-sub-sector-form"
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="flex flex-col gap-4 py-1"
                        >
                            <Controller
                                name="strategic_priority_id"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldContent>
                                            <FieldLabel
                                                htmlFor={field.name}
                                                className="gap-1"
                                            >
                                                Strategic Priority
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
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </FieldContent>
                                    </Field>
                                )}
                            />

                            <Controller
                                name="code"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldContent>
                                            <FieldLabel
                                                htmlFor={field.name}
                                                className="gap-1"
                                            >
                                                Code
                                            </FieldLabel>

                                            <Input
                                                {...field}
                                                id={field.name}
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="1"
                                                autoComplete="off"
                                                onChange={(e) => {
                                                    const digits =
                                                        e.target.value
                                                            .replace(/\D/g, '')
                                                            .slice(0, 1);
                                                    field.onChange(digits);
                                                }}
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
                                name="name"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldContent>
                                            <FieldLabel
                                                htmlFor={field.name}
                                                className="gap-1"
                                            >
                                                Name
                                            </FieldLabel>

                                            <Input
                                                {...field}
                                                id={field.name}
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="Enter name"
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
                        form="cc-sub-sector-form"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? isEditing
                                ? 'Saving...'
                                : 'Creating...'
                            : isEditing
                              ? 'Save Changes'
                              : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
