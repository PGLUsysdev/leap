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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { User } from '@/types/global';

const formSchema = z.object({
    status: z.enum(['pending', 'active', 'inactive']),
});

type FormValues = z.infer<typeof formSchema>;

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: User | null;
}

export default function FormDialog({
    open,
    onOpenChange,
    data,
}: FormDialogProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            status: 'pending',
        },
    });

    // Sync form with selected user data
    useEffect(() => {
        if (data) {
            form.reset({
                status: data.status as FormValues['status'],
            });
        }
    }, [data, form]);

    function onSubmit(values: FormValues) {
        console.log(values);

        if (!data) return;

        // We use backticks (``) to build the URL string with the user's ID
        router.patch(`/users/${data.id}/status`, values, {
            preserveState: true,
            preserveScroll: true,
            // onStart: () => setIsLoading(true),
            // onFinish: () => setIsLoading(false),
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User Status</DialogTitle>
                    <DialogDescription>
                        Update the account status for{' '}
                        <strong>{data?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="user-status-form"
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="py-6"
                >
                    <Controller
                        name="status"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>
                                    Account Status
                                </FieldLabel>
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger
                                        id={field.name}
                                        aria-invalid={fieldState.invalid}
                                    >
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">
                                            Pending
                                        </SelectItem>
                                        <SelectItem value="active">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="inactive">
                                            Inactive
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                )}
                            </Field>
                        )}
                    />
                </form>

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
                        form="user-status-form"
                        disabled={form.formState.isSubmitting}
                    >
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
