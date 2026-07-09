import { useEffect, useState } from "react";
import type { CcStrategicPriority } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Field, FieldError, FieldGroup, FieldLabel, FieldContent } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { router } from "@inertiajs/react";
import { FormDialogShell } from "@/components/form-dialog-shell";

interface FormDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    initialData: CcStrategicPriority | null;
}

const formSchema = z.object({
    code: z
        .string()
        .min(1, "Code is required")
        .regex(/^\d$/, "Must be exactly 1 digit")
        .refine((val) => val !== "0", {
            message: "Code cannot be 0",
        }),
    name: z.string().min(1, "Name is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function FormDialog({ open, setOpen, initialData }: FormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: "",
            name: "",
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    code: String(initialData.code),
                    name: initialData.name,
                });
            } else {
                form.reset({
                    code: "",
                    name: "",
                });
            }
        }
    }, [open, initialData, form]);

    function onSubmit(data: FormValues) {
        const payload = {
            code: Number(data.code),
            name: data.name,
        };

        if (isEditing) {
            router.patch(`/cc-strategic-priority/${initialData.id}`, payload, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => setOpen(false),
                onError: (errors) => {
                    Object.keys(errors).forEach((key) => {
                        form.setError(key as any, {
                            type: "server",
                            message: errors[key],
                        });
                    });
                },
                onFinish: () => setIsLoading(false),
            });
        } else {
            router.post("/cc-strategic-priority", payload, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => setOpen(false),
                onError: (errors) => {
                    Object.keys(errors).forEach((key) => {
                        form.setError(key as any, {
                            type: "server",
                            message: errors[key],
                        });
                    });
                },
                onFinish: () => setIsLoading(false),
            });
        }
    }

    return (
        <FormDialogShell
            open={open}
            onOpenChange={setOpen}
            title={isEditing ? "Edit CC Strategic Priority" : "Create CC Strategic Priority"}
            description={
                isEditing
                    ? "Modify the details of the existing strategic priority below."
                    : "Fill in the information to create a new strategic priority."
            }
            isLoading={isLoading}
            formId="cc-strategic-priority-form"
            onCancel={() => setOpen(false)}
            submitLabel={isEditing ? "Save Changes" : "Create"}
            submittingLabel={isEditing ? "Saving..." : "Creating..."}
            className="sm:max-w-md"
        >
            <div className="flex min-h-0">
                <ScrollArea className="w-full">
                    <form id="cc-strategic-priority-form" onSubmit={form.handleSubmit(onSubmit)}>
                        <FieldGroup>
                            <Controller
                                name="code"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name} className="gap-1">
                                                Code
                                            </FieldLabel>

                                            <Input
                                                {...field}
                                                id={field.name}
                                                aria-invalid={fieldState.invalid}
                                                placeholder="1"
                                                autoComplete="off"
                                                onChange={(e) => {
                                                    const digits = e.target.value
                                                        .replace(/\D/g, "")
                                                        .slice(0, 1);
                                                    field.onChange(digits);
                                                }}
                                            />

                                            {fieldState.invalid && (
                                                <FieldError errors={[fieldState.error]} />
                                            )}
                                        </FieldContent>
                                    </Field>
                                )}
                            />

                            <Controller
                                name="name"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name} className="gap-1">
                                                Name
                                            </FieldLabel>

                                            <Input
                                                {...field}
                                                id={field.name}
                                                aria-invalid={fieldState.invalid}
                                                placeholder="Enter name"
                                                autoComplete="off"
                                            />

                                            {fieldState.invalid && (
                                                <FieldError errors={[fieldState.error]} />
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
