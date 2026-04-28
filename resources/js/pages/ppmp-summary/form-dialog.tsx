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
import type { FundingSource } from '@/types/global';
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
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { router } from '@inertiajs/react';

interface PpmpSummaryFormDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    initialData: FundingSource | null;
}

const formSchema = z.object({
    fund_type: z.string().trim().min(1, { message: 'Fund type is required' }),
    code: z.string().trim().min(1, { message: 'Code is required' }),
    title: z.string().trim().min(1, { message: 'Title is required' }),
    description: z.string().trim().nullable(),
});

export default function FormDialog({
    open,
    setOpen,
    initialData,
}: PpmpSummaryFormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fund_type: '',
            code: '',
            title: '',
            description: '',
        },
    });

    useEffect(() => {
        if (open) {
            form.reset(
                initialData ?? {
                    fund_type: '',
                    code: '',
                    title: '',
                    description: '',
                },
            );
        }
    }, [initialData, open, form]);

    function onSubmit(data: z.infer<typeof formSchema>) {
        if (isEditing) {
            router.patch(`/ppmp-summaries/${initialData.id}`, data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => setOpen(false),
                onFinish: () => setIsLoading(false),
            });
        } else {
            router.post('/ppmp-summaries', data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => setOpen(false),
                onFinish: () => setIsLoading(false),
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
                            ? 'Edit PPMP Summary'
                            : 'Add New PPMP Summary'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Modify the details of the existing PPMP summary below.'
                            : 'Fill in the information to create a new PPMP summary record.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 pt-2">
                    <ScrollArea className="w-full flex-1 pr-3">
                        <form
                            id="ppmp-summary-form"
                            onSubmit={form.handleSubmit(onSubmit)}
                        >
                            <FieldGroup className="pb-4">
                                <Controller
                                    name="fund_type"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="ppmp-summary-form-fund-type">
                                                Fund Type
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </FieldLabel>

                                            <Input
                                                {...field}
                                                id="ppmp-summary-form-fund-type"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="Fund type..."
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
                                            <FieldLabel htmlFor="ppmp-summary-form-code">
                                                Code
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </FieldLabel>

                                            <Input
                                                {...field}
                                                id="ppmp-summary-form-code"
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

                                <Controller
                                    name="title"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="ppmp-summary-form-title">
                                                Title
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </FieldLabel>

                                            <Textarea
                                                {...field}
                                                id="ppmp-summary-form-title"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="Title..."
                                                autoComplete="off"
                                                className="min-h-15"
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
                                    name="description"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldLabel htmlFor="ppmp-summary-form-description">
                                                Description
                                            </FieldLabel>

                                            <Textarea
                                                {...field}
                                                value={field.value ?? ''}
                                                id="ppmp-summary-form-description"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                placeholder="Description..."
                                                autoComplete="off"
                                                className="min-h-15"
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
                        form="ppmp-summary-form"
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
                                Creating Summary
                            </span>
                        ) : (
                            'Create Summary'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
