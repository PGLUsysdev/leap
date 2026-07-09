import { useEffect, useState } from "react";
import type { LguLevel } from "@/types";
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
    initialData: LguLevel | null;
}

const formSchema = z.object({
    code: z
        .string()
        .trim()
        .length(1, { message: "Code must be exactly 1 character" })
        .regex(/^\d$/, { message: "Code must be a number" }),
    name: z
        .string()
        .trim()
        .min(1, { message: "Level is required" })
        .max(50, { message: "Level must not exceed 50 characters" }),
});

export default function FormDialog({ open, setOpen, initialData }: FormDialogProps) {
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
        if (isEditing) {
            router.patch(`/lgu-levels/${initialData.id}`, data, {
                preserveScroll: true,
                preserveState: true,
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
            router.post("/lgu-levels", data, {
                preserveScroll: true,
                preserveState: true,
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
        <>
            <FormDialogShell
                open={open}
                onOpenChange={setOpen}
                title={isEditing ? "Edit Lgu Level" : "Add New Lgu Level"}
                description={
                    isEditing
                        ? "Modify the details of the existing Lgu level below."
                        : "Fill in the information to create a new LGU level record."
                }
                isLoading={isLoading}
                formId="lgu-level-form"
                onCancel={() => setOpen(false)}
                submitLabel={isEditing ? "Save Changes" : "Create Level"}
                submittingLabel={isEditing ? "Saving Changes" : "Creating Level"}
                className="sm:max-w-sm"
            >
                <div className="flex min-h-0">
                    <ScrollArea className="w-full">
                        <form id="lgu-level-form" onSubmit={form.handleSubmit(onSubmit)}>
                            <FieldGroup>
                                <Controller
                                    name="code"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name} className="gap-1">
                                                    Code
                                                    {/*<span className="text-red-500">
                                                    *
                                                </span>*/}
                                                </FieldLabel>

                                                <Input
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={fieldState.invalid}
                                                    placeholder="Enter code..."
                                                    autoComplete="off"
                                                    maxLength={1}
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
                                                    {/*<span className="text-red-500">
                                                    *
                                                </span>*/}
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
