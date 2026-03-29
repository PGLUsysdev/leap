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
import type { PpmpCategory } from '@/types/global';
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
    initialData: PpmpCategory | null;
}

const formSchema = z.object({
    name: z.string().trim().min(1, { message: 'Name is required' }),
});

export default function FormDialog({
    open,
    setOpen,
    initialData,
}: FormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const isEditing = !!initialData;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
        },
    });

    useEffect(() => {
        if (open) {
            form.reset(
                initialData ?? {
                    name: '',
                },
            );
        }
    }, [initialData, open, form]);

    function onSubmit(data: z.infer<typeof formSchema>) {
        if (isEditing) {
            router.patch(`/ppmp-categories/${initialData.id}`, data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
                onSuccess: () => setOpen(false),
            });
        } else {
            router.post('/ppmp-categories', data, {
                preserveScroll: true,
                preserveState: true,
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
                        {isEditing
                            ? 'Edit PPMP Category'
                            : 'Add New PPMP Category'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Modify the details of the existing PPMP category below.'
                            : 'Fill in the information to create a new PPMP category record.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 pt-2">
                    <ScrollArea className="w-full flex-1 pr-3">
                        <form
                            id="ppmp-category-form"
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
                                            <FieldLabel htmlFor="ppmp-category-form-name">
                                                Name
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </FieldLabel>

                                            <Input
                                                {...field}
                                                id="ppmp-category-form-name"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="Category name..."
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
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        form="ppmp-category-form"
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
                                Creating Category
                            </span>
                        ) : (
                            'Create Category'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
