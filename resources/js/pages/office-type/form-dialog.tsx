import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import type { OfficeType } from '@/types/global';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { router } from '@inertiajs/react';

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
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
                onSuccess: () => setOpen(false),
            });
        } else {
            router.post('/office-types', data, {
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
                onSuccess: () => setOpen(false),
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="flex max-h-[90vh] flex-col gap-0 overflow-hidden"
                onPointerDownOutside={(e) => isLoading && e.preventDefault()}
                onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Office Type' : 'Add New Office Type'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Modify the details of the existing office type below.'
                            : 'Fill in the information to create a new office type.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 pt-2">
                    <ScrollArea className="w-full flex-1 pr-3">
                        <form
                            id="office-type-form"
                            onSubmit={form.handleSubmit(onSubmit)}
                        >
                            <FieldGroup className="pb-4">
                                <Controller
                                    name="name"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor={field.name}>
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
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="code"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor={field.name}>
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
                                        </Field>
                                    )}
                                />
                            </FieldGroup>
                        </form>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <DialogClose asChild disabled={isLoading}>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>

                    <Button
                        type="submit"
                        form="office-type-form"
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
                                Creating Source
                            </span>
                        ) : (
                            'Create Source'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
