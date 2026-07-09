import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { router } from "@inertiajs/react";

import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormDialogShell } from "@/components/form-dialog-shell";
import type { Role } from "@/types";

const formSchema = z.object({
    name: z.string().min(1, "Role name is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: Role | null;
}

export default function FormDialog({ open, onOpenChange, data }: FormDialogProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
        },
    });

    useEffect(() => {
        if (data) {
            form.reset({ name: data.name });
        } else {
            form.reset({ name: "" });
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
            router.post("/roles", values, {
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
        <FormDialogShell
            open={open}
            onOpenChange={onOpenChange}
            title={data ? "Edit Role" : "Add Role"}
            description={
                data ? `Update the name for role "${data.name}".` : "Enter a name for the new role."
            }
            formId="role-form"
            submitLabel={data ? "Save Changes" : "Create Role"}
            submittingLabel="Saving..."
            isLoading={form.formState.isSubmitting}
            onCancel={() => onOpenChange(false)}
            className="sm:max-w-sm"
        >
            <div className="flex min-h-0 flex-1">
                <ScrollArea className="w-full pr-4">
                    <form
                        id="role-form"
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4 py-1"
                    >
                        <Controller
                            name="name"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Role Name</FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        aria-invalid={fieldState.invalid}
                                        placeholder="e.g. Encoder"
                                        autoComplete="off"
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
