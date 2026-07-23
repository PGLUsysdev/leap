import { zodResolver } from '@hookform/resolvers/zod';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import { AlertErrorDialog } from '@/components/alert-error-dialog';
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
import type { Sector } from '@/types';

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: Sector | null;
}

const formSchema = z.object({
    code: z
        .string()
        .trim()
        .min(1, { message: 'Code is required' })
        .max(4, { message: 'Code must be at most 4 characters' })
        .regex(/^\d+$/, { message: 'Code must contain only numbers' }),
    name: z
        .string()
        .trim()
        .min(1, { message: 'Title is required' })
        .max(50, { message: 'Title must be at most 50 characters' }),
});

export default function FormDialog({
    open,
    onOpenChange,
    initialData,
}: FormDialogProps) {
    const [submitting, setSubmitting] = useState(false);
    const isEditing = !!initialData;

    const { errors } = usePage().props;
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: '',
            name: '',
        },
    });

    useEffect(() => {
        if (open) {
            form.reset(
                initialData ?? {
                    code: '',
                    name: '',
                },
            );
        }
    }, [initialData, open, form]);

    useEffect(() => {
        if ((errors as any).message) {
            setErrorMessage((errors as any).message as string);
            setShowError(true);
        }
    }, [errors]);

    function onSubmit(data: z.infer<typeof formSchema>) {
        setSubmitting(true);

        const options = {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setSubmitting(false);
                onOpenChange(false);
            },
            onError: (errs: any) => {
                setSubmitting(false);
                Object.keys(errs).forEach((key) => {
                    form.setError(key as any, {
                        type: 'server',
                        message: errs[key],
                    });
                });
            },
            onFinish: () => setSubmitting(false),
        };

        if (isEditing) {
            router.patch(`/sectors/${initialData.id}`, data, options);
        } else {
            router.post('/sectors', data, options);
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? 'Edit Sector' : 'Add New Sector'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? 'Modify the details of the existing sector below.'
                                : 'Fill in the information to create a new sector.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex min-h-0">
                        <ScrollArea className="w-full">
                            <form
                                id="sector-form"
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="flex flex-col gap-4 py-1"
                            >
                                <Controller
                                    name="code"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldContent>
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    Code{' '}
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
                                                    placeholder="e.g. 1000"
                                                    autoComplete="off"
                                                    maxLength={4}
                                                    onChange={(e) => {
                                                        const value =
                                                            e.target.value.replace(
                                                                /\D/g,
                                                                '',
                                                            );
                                                        field.onChange(value);
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

                                <Controller
                                    name="name"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldContent>
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    Title{' '}
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
                                                    placeholder="Enter sector name..."
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
                            form="sector-form"
                            disabled={submitting}
                        >
                            {submitting
                                ? isEditing
                                    ? 'Saving Changes'
                                    : 'Creating Sector'
                                : isEditing
                                  ? 'Save Changes'
                                  : 'Create Sector'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertErrorDialog
                open={showError}
                onOpenChange={setShowError}
                error={errorMessage}
            />
        </>
    );
}
