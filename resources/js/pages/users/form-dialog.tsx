// resources/js/pages/users/form-dialog.tsx

import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Field,
    FieldLabel,
    FieldError,
    FieldContent,
} from '@/components/ui/field';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    TableSelect,
    TableSelectButton,
    useTableSelect,
} from '@/components/table-select';
import type { Office, Role, User } from '@/types';
import officeColumns from './columns/office-columns';

const formSchema = z.object({
    status: z.enum(['pending', 'active', 'inactive']),
    role_id: z.string().optional(),
    office_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: User | null;
    roles: Role[];
    offices: Office[];
    editOfficeAll: boolean;
    editOfficeOwn: boolean;
    editRoleAll: boolean;
    editRoleOwn: boolean;
    userOfficeId: number | null;
}

export default function FormDialog({
    open,
    onOpenChange,
    data,
    roles,
    offices,
    editOfficeAll,
    editOfficeOwn,
    editRoleAll,
    editRoleOwn,
    userOfficeId,
}: FormDialogProps) {
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            status: 'pending',
            role_id: '',
            office_id: '',
        },
    });

    // ── Office table-select plumbing ─────────────────────────────────
    // Only top-level offices are assignable (same filter as before).
    const selectableOffices = offices.filter((o) => o.parent_id === null);

    // Subscribe to the form value so re-renders fire on change.
    const officeId = form.watch('office_id');

    const officeSelect = useTableSelect<Office>({
        data: selectableOffices,
        value: officeId,
    });
    // ─────────────────────────────────────────────────────────────────

    // Sync form with selected user data
    useEffect(() => {
        if (data) {
            form.reset({
                status: data.status as FormValues['status'],
                role_id: String(data.role?.id ?? ''),
                office_id: String(data.office_id ?? ''),
            });
        } else {
            form.reset({
                status: 'pending',
                role_id: '',
                office_id: '',
            });
        }
    }, [data, form]);

    function canEditOffice() {
        if (editOfficeAll) {
            return true;
        }

        return false;
    }

    function canEditRole() {
        if (editRoleAll) {
            return true;
        }

        if (editRoleOwn && data && data.office_id === userOfficeId) {
            return true;
        }

        return false;
    }

    function handleSubmit(values: FormValues) {
        if (!data) {
            return;
        }

        setSubmitting(true);

        const payload = {
            status: values.status,
            role_id: values.role_id ? Number(values.role_id) : null,
            office_id: values.office_id ? Number(values.office_id) : null,
        };

        router.patch(`/users/${data.id}`, payload, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setSubmitting(false);
                onOpenChange(false);
                form.reset();
            },
            onError: () => {
                setSubmitting(false);
            },
        });
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update account details for{' '}
                            <strong>{data?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex min-h-0 flex-1">
                        <ScrollArea className="w-full">
                            <form
                                id="user-form"
                                onSubmit={form.handleSubmit(handleSubmit)}
                                className="flex w-full flex-col gap-4 py-1 pr-4"
                            >
                                {/* Status */}
                                <Controller
                                    name="status"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                            className="w-full"
                                        >
                                            <FieldContent className="w-full">
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    Account Status
                                                </FieldLabel>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id={field.name}
                                                        aria-invalid={
                                                            fieldState.invalid
                                                        }
                                                        className="w-full"
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

                                {/* Role */}
                                <Controller
                                    name="role_id"
                                    control={form.control}
                                    render={({ field, fieldState }) => {
                                        const selectedRole = roles.find(
                                            (r) => String(r.id) === field.value,
                                        );

                                        return (
                                            <Field
                                                data-invalid={
                                                    fieldState.invalid
                                                }
                                                className="w-full"
                                            >
                                                <FieldContent className="w-full">
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                    >
                                                        Role
                                                    </FieldLabel>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        disabled={
                                                            !canEditRole()
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            id={field.name}
                                                            aria-invalid={
                                                                fieldState.invalid
                                                            }
                                                            className="w-full"
                                                        >
                                                            <SelectValue placeholder="Select role">
                                                                {
                                                                    selectedRole?.name
                                                                }
                                                            </SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {roles.map(
                                                                (role) => (
                                                                    <SelectItem
                                                                        key={
                                                                            role.id
                                                                        }
                                                                        value={String(
                                                                            role.id,
                                                                        )}
                                                                    >
                                                                        {
                                                                            role.name
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    {fieldState.invalid && (
                                                        <FieldError
                                                            errors={[
                                                                fieldState.error,
                                                            ]}
                                                        />
                                                    )}
                                                </FieldContent>
                                            </Field>
                                        );
                                    }}
                                />

                                {/* Office */}
                                <Controller
                                    name="office_id"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                            className="w-full"
                                        >
                                            <FieldContent className="w-full">
                                                <FieldLabel>
                                                    Department / Office
                                                </FieldLabel>

                                                <TableSelectButton<Office>
                                                    hook={officeSelect}
                                                    valueKey="id"
                                                    placeholder="Select office"
                                                    disabled={!canEditOffice()}
                                                    invalid={fieldState.invalid}
                                                    displayValue={(office) =>
                                                        office
                                                            ? `${office.name}${
                                                                  office.acronym
                                                                      ? ` (${office.acronym})`
                                                                      : ''
                                                              }`
                                                            : undefined
                                                    }
                                                    onClear={() =>
                                                        field.onChange('')
                                                    }
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
                            form="user-form"
                            disabled={submitting}
                        >
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Office picker — sibling of <Dialog>, not nested */}
            <TableSelect<Office>
                data={selectableOffices}
                columns={officeColumns}
                open={officeSelect.open}
                onOpenChange={officeSelect.setOpen}
                onRowSelect={(office) => {
                    form.setValue('office_id', String(office.id), {
                        shouldDirty: true,
                        shouldValidate: true,
                    });
                }}
                value={officeId}
                valueKey="id"
                title="Select Office"
                description="Choose a department or office for this user."
            />
        </>
    );
}
