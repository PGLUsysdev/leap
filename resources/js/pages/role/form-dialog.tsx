import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { router } from '@inertiajs/react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { Role } from '@/types/global';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
    name: z.string().min(1, 'Role name is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: Role | null;
}

export default function FormDialog({
    open,
    onOpenChange,
    data,
}: FormDialogProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
        },
    });

    useEffect(() => {
        if (data) {
            form.reset({ name: data.name });
        } else {
            form.reset({ name: '' });
        }
    }, [data, form, open]);

    function onSubmit(values: FormValues) {
        if (data) {
            router.patch(`/roles/${data.id}`, values, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                },
            });
        } else {
            router.post('/roles', values, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                },
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{data ? 'Edit Role' : 'Add Role'}</DialogTitle>
                    <DialogDescription>
                        {data
                            ? `Update the name for role "${data.name}".`
                            : 'Enter a name for the new role.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0">
                    <ScrollArea className="w-full">
                        <form
                            id="role-form"
                            onSubmit={form.handleSubmit(onSubmit)}
                        >
                            <Controller
                                name="name"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Role Name
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id={field.name}
                                            aria-invalid={fieldState.invalid}
                                            placeholder="e.g. Encoder"
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
                        </form>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="role-form"
                        disabled={form.formState.isSubmitting}
                    >
                        {data ? 'Save Changes' : 'Create Role'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
