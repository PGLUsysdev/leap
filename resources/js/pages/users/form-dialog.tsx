import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { router } from "@inertiajs/react";

import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormDialogShell } from "@/components/form-dialog-shell";
import { CommandSelect } from "@/components/command-select";
import type { Office, Position, Role, User } from "@/types";

const formSchema = z.object({
    status: z.enum(["pending", "active", "inactive"]),
    role_id: z.string().optional(),
    office_id: z.string().optional(),
    position_id: z.string().optional(),
    step: z
        .string()
        .optional()
        .refine(
            (val) => !val || (Number(val) >= 1 && Number(val) <= 8),
            "Step must be between 1 and 8",
        ),
});

type FormValues = z.infer<typeof formSchema>;

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: User | null;
    roles: Role[];
    offices: Office[];
    positions: Position[];
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
    positions,
    editOfficeAll,
    editOfficeOwn,
    editRoleAll,
    editRoleOwn,
    userOfficeId,
}: FormDialogProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            status: "pending",
            role_id: "",
            office_id: "",
            position_id: "",
            step: "",
        },
    });

    // Sync form with selected user data
    useEffect(() => {
        if (data) {
            form.reset({
                status: data.status as FormValues["status"],
                role_id: String(data.role?.id ?? ""),
                office_id: String(data.office_id ?? ""),
                position_id: data.position_id ? String(data.position_id) : "",
                step: data.step ? String(data.step) : "",
            });
        } else {
            form.reset({
                status: "pending",
                role_id: "",
                office_id: "",
                position_id: "",
                step: "",
            });
        }
    }, [data, form]);

    const watchedOfficeId = form.watch("office_id");

    const officePositions = watchedOfficeId
        ? positions.filter((p) => p.office_id === Number(watchedOfficeId))
        : positions;

    function canEditOffice() {
        if (editOfficeAll) return true;
        if (editOfficeOwn && data && data.office_id === userOfficeId) return true;
        return false;
    }

    function canEditRole() {
        if (editRoleAll) return true;
        if (editRoleOwn && data && data.office_id === userOfficeId) return true;
        return false;
    }

    function handleSubmit(values: FormValues) {
        if (!data) return;

        const payload = {
            status: values.status,
            role_id: values.role_id ? Number(values.role_id) : null,
            office_id: values.office_id ? Number(values.office_id) : null,
            position_id: values.position_id ? Number(values.position_id) : null,
            step: values.step ? Number(values.step) : null,
        };

        router.patch(`/users/${data.id}`, payload, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
            },
        });
    }

    return (
        <FormDialogShell
            open={open}
            onOpenChange={onOpenChange}
            title="Edit User"
            description={
                <>
                    Update account details for <strong>{data?.name}</strong>.
                </>
            }
            formId="user-form"
            submitLabel="Save Changes"
            submittingLabel="Saving..."
            isLoading={form.formState.isSubmitting}
            onCancel={() => onOpenChange(false)}
            className="sm:max-w-sm"
        >
            <div className="flex min-h-0 flex-1">
                <ScrollArea className="w-full pr-4">
                    <form
                        id="user-form"
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4 py-1"
                    >
                        <Controller
                            name="status"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Account Status</FieldLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger
                                            id={field.name}
                                            aria-invalid={fieldState.invalid}
                                        >
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        <Controller
                            name="role_id"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        disabled={!canEditRole()}
                                    >
                                        <SelectTrigger
                                            id={field.name}
                                            aria-invalid={fieldState.invalid}
                                        >
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem key={role.id} value={String(role.id)}>
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        <Controller
                            name="office_id"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Department / Office</FieldLabel>
                                    <CommandSelect<Office>
                                        value={field.value || null}
                                        onChange={(value) =>
                                            field.onChange(value ? String(value) : "")
                                        }
                                        options={offices.filter((o) => o.parent_id === null)}
                                        getOptionValue={(office) => String(office.id)}
                                        getOptionSearchText={(office) =>
                                            `${office.name} ${office.acronym ?? ""}`
                                        }
                                        renderTrigger={(office) => (
                                            <span className="truncate">
                                                {office.name}
                                                {office.acronym ? ` (${office.acronym})` : ""}
                                            </span>
                                        )}
                                        renderOption={(office) => (
                                            <div className="grid w-full grid-cols-[auto_1fr] gap-3">
                                                <span className="font-medium">
                                                    {office.acronym || "—"}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {office.name}
                                                </span>
                                            </div>
                                        )}
                                        placeholder="Select office"
                                        searchPlaceholder="Search offices..."
                                        heading="Offices"
                                        showClear={false}
                                        disabled={true}
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        <Controller
                            name="position_id"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Assigned Position</FieldLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger
                                            id={field.name}
                                            aria-invalid={fieldState.invalid}
                                        >
                                            <SelectValue placeholder="Select position" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">None</SelectItem>
                                            {officePositions
                                                .filter(
                                                    (p) =>
                                                        p.status !== "occupied" ||
                                                        p.id === data?.position_id,
                                                )
                                                .map((position) => (
                                                    <SelectItem
                                                        key={position.id}
                                                        value={String(position.id)}
                                                    >
                                                        {position.item_number}
                                                        {position.ios
                                                            ? ` — ${position.ios.class} (SG ${position.ios.salary_grade})`
                                                            : ""}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        <Controller
                            name="step"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Step</FieldLabel>
                                    <Input
                                        id={field.name}
                                        {...field}
                                        type="number"
                                        min={1}
                                        max={8}
                                        placeholder="1 – 8"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />
                    </form>
                </ScrollArea>
            </div>
        </FormDialogShell>
    );
}
