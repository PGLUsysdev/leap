import { useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { FundingSource } from '@/pages/types/types';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { router } from '@inertiajs/react';

interface FormDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    initialData: FundingSource | null;
}

const formSchema = z.object({
    fund_type: z.string().trim().min(1, { message: 'Fund type is required' }),
    code: z.string().trim().min(1, { message: 'Code is required' }),
    title: z.string().trim().min(1, { message: 'Title is required' }),
    description: z.string().trim().nullable(),
    allow_typhoon: z.boolean(),
});

export default function FormDialog({
    open,
    setOpen,
    initialData,
}: FormDialogProps) {
    console.log(initialData);

    const isEditing = !!initialData;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fund_type: '',
            code: '',
            title: '',
            description: '',
            allow_typhoon: false,
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
                    allow_typhoon: false,
                },
            );
        }
    }, [initialData, open, form]);

    function onSubmit(data: z.infer<typeof formSchema>) {
        console.log('Submitting:', data);
        console.log(initialData);

        isEditing
            ? router.visit(`/funding-sources/${initialData.id}`, {
                  method: 'patch',
                  data,
              })
            : router.visit('/funding-sources', { method: 'post', data });

        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing
                            ? 'Edit Funding Source'
                            : 'Add New Funding Source'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Modify the details of the existing funding source below.'
                            : 'Fill in the information to create a new funding record.'}
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="funding-source-form"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <FieldGroup>
                        <Controller
                            name="fund_type"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="funding-source-form-fund-type">
                                        Fund Type
                                        <span className="text-red-500">*</span>
                                    </FieldLabel>

                                    <Input
                                        {...field}
                                        id="funding-source-form-fund-type"
                                        aria-invalid={fieldState.invalid}
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
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="funding-source-form-code">
                                        Code
                                        <span className="text-red-500">*</span>
                                    </FieldLabel>

                                    <Input
                                        {...field}
                                        id="funding-source-form-code"
                                        aria-invalid={fieldState.invalid}
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
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="funding-source-form-title">
                                        Title
                                        <span className="text-red-500">*</span>
                                    </FieldLabel>

                                    <Textarea
                                        {...field}
                                        id="funding-source-form-title"
                                        aria-invalid={fieldState.invalid}
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
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="funding-source-form-description">
                                        Description
                                    </FieldLabel>

                                    <Textarea
                                        {...field}
                                        value={field.value ?? ''}
                                        id="funding-source-form-description"
                                        aria-invalid={fieldState.invalid}
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

                        <Controller
                            name="allow_typhoon"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <div className="flex gap-2">
                                        <div>
                                            <Checkbox
                                                id="allow_typhoon"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </div>

                                        <FieldLabel htmlFor="allow_typhoon">
                                            Allow Typhoon
                                        </FieldLabel>
                                    </div>

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

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>

                    <Button type="submit" form="funding-source-form">
                        {isEditing ? 'Save Changes' : 'Create Source'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
