import { useEffect, useState } from "react";
import type { Sector } from "@/types";
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
    initialData: Sector | null;
}

const formSchema = z.object({
    code: z
        .string()
        .trim()
        .min(1, { message: "Code is required" })
        .max(4, { message: "Code must be at most 4 characters" })
        .regex(/^\d+$/, { message: "Code must contain only numbers" }),
    name: z
        .string()
        .trim()
        .min(1, { message: "Title is required" })
        .max(50, { message: "Title must be at most 50 characters" }),
});

export default function FormDialog({ open, setOpen, initialData }: FormDialogProps) {
    console.log(usePage().props.errors);

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
        // If Laravel sends back->withErrors(['message' => '...'])
        if (errors.message) {
            setErrorMessage(errors.message);
            setShowError(true);

            /* CRITICAL: Clear the error from Inertia state
                   so it doesn't pop up again if you navigate back.
                */
            // router.patch(
            //     route('sectors.index'),
            //     {},
            //     {
            //         preserveState: true,
            //         preserveScroll: true,
            //         onSuccess: () => {
            //             // This clears the 'message' prop from the page
            //         },
            //     },
            // );
        }
    }, [errors]);

    function onSubmit(data: z.infer<typeof formSchema>) {
        if (isEditing) {
            router.patch(`/sectors/${initialData.id}`, data, {
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
            router.post("/sectors", data, {
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
        <>
            <FormDialogShell
                open={open}
                onOpenChange={setOpen}
                title={isEditing ? "Edit Funding Source" : "Add New Funding Source"}
                description={
                    isEditing
                        ? "Modify the details of the existing funding source below."
                        : "Fill in the information to create a new funding record."
                }
                isLoading={isLoading}
                formId="funding-source-form"
                onCancel={() => setOpen(false)}
                submitLabel={isEditing ? "Save Changes" : "Create Source"}
                submittingLabel={isEditing ? "Saving Changes" : "Creating Source"}
                className="sm:max-w-sm"
            >
                <div className="flex min-h-0">
                    <ScrollArea className="w-full">
                        <form id="funding-source-form" onSubmit={form.handleSubmit(onSubmit)}>
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
                                                    placeholder="e.g. 1000"
                                                    maxLength={4}
                                                    onChange={(e) => {
                                                        // Regex to remove any non-numeric characters
                                                        const value = e.target.value.replace(
                                                            /\D/g,
                                                            "",
                                                        );
                                                        field.onChange(value);
                                                    }}
                                                    aria-invalid={fieldState.invalid}
                                                    autoComplete="off"
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
                                                    placeholder="Enter sector name..."
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
