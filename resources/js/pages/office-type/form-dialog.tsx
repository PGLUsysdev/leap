import { useEffect, useState } from "react";
import type { OfficeType } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Field, FieldError, FieldGroup, FieldLabel, FieldContent } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { router, usePage } from "@inertiajs/react";
import { FormDialogShell } from "@/components/form-dialog-shell";
import { AlertErrorDialog } from "@/components/alert-error-dialog";

interface FormDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    initialData: OfficeType | null;
}

const formSchema = z.object({
    code: z
        .string()
        .trim()
        .min(1, { message: "Code is required" })
        .max(2, { message: "Code must not exceed 2 characters" })
        .regex(/^\d+$/, { message: "Code must contain only numbers" }),
    name: z
        .string()
        .trim()
        .min(1, { message: "Type is required" })
        .max(50, { message: "Type must not exceed 50 characters" }),
});

export default function FormDialog({ open, setOpen, initialData }: FormDialogProps) {
    console.log(initialData);

    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;

    const { errors } = usePage().props;
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: "",
            name: "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset(
                initialData ?? {
                    code: "",
                    name: "",
                },
            );
        }
    }, [initialData, open, form]);

    useEffect(() => {
        if (errors.message) {
            setErrorMessage(errors.message as string);
            setShowError(true);
        }
    }, [errors]);

    function onSubmit(data: z.infer<typeof formSchema>) {
        console.log(data);

        if (isEditing) {
            router.patch(`/office-types/${initialData.id}`, data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => setOpen(false),
                onError: (errors: any) => {
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
            router.post("/office-types", data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => setOpen(false),
                onError: (errors: any) => {
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
        <>
            <FormDialogShell
                open={open}
                onOpenChange={setOpen}
                title={isEditing ? "Edit Office Type" : "Add New Office Type"}
                description={
                    isEditing
                        ? "Modify the details of the existing office type below."
                        : "Fill in the information to create a new office type."
                }
                isLoading={isLoading}
                formId="office-type-form"
                onCancel={() => setOpen(false)}
                submitLabel={isEditing ? "Save Changes" : "Create Type"}
                submittingLabel={isEditing ? "Saving Changes" : "Creating Type"}
                className="sm:max-w-sm"
            >
                <div className="flex min-h-0">
                    <ScrollArea className="w-full">
                        <form id="office-type-form" onSubmit={form.handleSubmit(onSubmit)}>
                            <FieldGroup className="pb-4">
                                <Controller
                                    name="code"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name} className="gap-1">
                                                    Code
                                                    <span className="text-red-500">*</span>
                                                </FieldLabel>

                                                <Input
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={fieldState.invalid}
                                                    placeholder="Code..."
                                                    autoComplete="off"
                                                    maxLength={2}
                                                    onChange={(e) => {
                                                        // Regex to remove any non-numeric characters
                                                        const value = e.target.value.replace(
                                                            /\D/g,
                                                            "",
                                                        );
                                                        field.onChange(value);
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
                                                    Title
                                                    <span className="text-red-500">*</span>
                                                </FieldLabel>

                                                <Input
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={fieldState.invalid}
                                                    placeholder="Title..."
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

            <AlertErrorDialog open={showError} onOpenChange={setShowError} error={errorMessage} />
        </>
    );
}
