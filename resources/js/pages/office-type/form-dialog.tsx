import { useEffect, useState } from 'react';
import type { OfficeType } from '@/types/global';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldContent,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { router } from '@inertiajs/react';
import { FormDialogShell } from '@/components/form-dialog-shell';


interface FormDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    initialData: OfficeType | null;
}

const formSchema = z.object({
    code: z
        .string()
        .trim()
        .min(1, { message: 'Code is required' })
        .max(2, { message: 'Code must not exceed 2 characters' }),
    name: z
        .string()
        .trim()
        .min(1, { message: 'Type is required' })
        .max(20, { message: 'Type must not exceed 20 characters' }),
});

export default function FormDialog({
    open,
    setOpen,
    initialData,
}: FormDialogProps) {
    console.log(initialData);

    const [isLoading, setIsLoading] = useState(false);

    const isEditing = !!initialData;

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

    function onSubmit(data: z.infer<typeof formSchema>) {
        console.log(data);

        if (isEditing) {
            router.patch(`/office-types/${initialData.id}`, data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => setOpen(false),
                onFinish: () => setIsLoading(false),
            });
        } else {
            router.post('/office-types', data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => setOpen(false),
                onFinish: () => setIsLoading(false),
            });
        }
    }

    return (
        <FormDialogShell
            open={open}
            onOpenChange={setOpen}
            title={isEditing ? 'Edit Office Type' : 'Add New Office Type'}
            description={
                isEditing
                    ? 'Modify the details of the existing office type below.'
                    : 'Fill in the information to create a new office type.'
            }
            isLoading={isLoading}
            formId="office-type-form"
            onCancel={() => setOpen(false)}
            submitLabel={isEditing ? 'Save Changes' : 'Create Type'}
            submittingLabel={isEditing ? 'Saving Changes' : 'Creating Type'}
            className="sm:max-w-sm"
        >
            <div className="flex min-h-0">
                <ScrollArea className="w-full">
                    <form
                        id="office-type-form"
                        onSubmit={form.handleSubmit(onSubmit)}
                    >
                        <FieldGroup className="pb-4">
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
                                                Title
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
                                                placeholder="Title..."
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
                                                placeholder="Code..."
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
                        </FieldGroup>
                    </form>
                </ScrollArea>
            </div>
        </FormDialogShell>
    );
}
