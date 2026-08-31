import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/base-ui-components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/base-ui-components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/base-ui-components/ui/field";
import { Input } from "@/components/base-ui-components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/base-ui-components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/base-ui-components/ui/toggle-group";
import type { PpmpCategory } from "@/types";

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: PpmpCategory | null;
}

const formSchema = z.object({
    name: z.string().trim().min(1, { message: "Name is required" }).max(100),
    is_non_procurement: z.boolean(),
});

export default function FormDialog({ open, onOpenChange, initialData }: FormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

    const isEditing = !!initialData;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            is_non_procurement: false,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset(
                initialData
                    ? {
                          name: initialData.name,
                          is_non_procurement: initialData.is_non_procurement,
                      }
                    : {
                          name: "",
                          is_non_procurement: false,
                      },
            );
        }
    }, [initialData, open, form]);

    const hasUnsavedChanges = form.formState.isDirty;

    function handleOpenChange(isOpen: boolean) {
        if (!isOpen && hasUnsavedChanges) {
            setShowUnsavedDialog(true);
        } else {
            onOpenChange(isOpen);
        }
    }

    function handleUnsavedConfirm() {
        setShowUnsavedDialog(false);
        onOpenChange(false);
    }

    function handleUnsavedCancel() {
        setShowUnsavedDialog(false);
    }

    function onSubmit(data: z.infer<typeof formSchema>) {
        if (isEditing) {
            router.patch(`/ppmp-categories/${initialData.id}`, data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => {
                    onOpenChange(false);
                },
                onFinish: () => setIsLoading(false),
            });
        } else {
            router.post("/ppmp-categories", data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => onOpenChange(false),
                onFinish: () => setIsLoading(false),
            });
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-3xl">
                    <DialogHeader className="flex-none">
                        <DialogTitle>
                            {isEditing ? "Edit PPMP Category" : "Add New PPMP Category"}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? "Modify the details of the existing PPMP category below."
                                : "Fill in the information to create a new PPMP category record."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex min-h-0 flex-1">
                        <ScrollArea className="w-full pr-3">
                            <form
                                id="ppmp-category-form"
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="flex flex-col gap-4 py-1"
                            >
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <Controller
                                            name="name"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field data-invalid={fieldState.invalid}>
                                                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                                                    <Input
                                                        {...field}
                                                        id={field.name}
                                                        aria-invalid={fieldState.invalid}
                                                        placeholder="Category name..."
                                                        autoComplete="off"
                                                    />
                                                    {fieldState.invalid && (
                                                        <FieldError errors={[fieldState.error]} />
                                                    )}
                                                </Field>
                                            )}
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <Controller
                                            name="is_non_procurement"
                                            control={form.control}
                                            render={({ field, fieldState }) => (
                                                <Field data-invalid={fieldState.invalid}>
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                        className="font-normal"
                                                    >
                                                        Procurement Type
                                                    </FieldLabel>

                                                    <ToggleGroup
                                                        value={[
                                                            field.value ? "non_procurement" : "procurement",
                                                        ]}
                                                        onValueChange={(value) => {
                                                            if (value.length > 0) {
                                                                field.onChange(value[0] === "non_procurement");
                                                            }
                                                        }}
                                                        orientation="horizontal"
                                                    >
                                                        <ToggleGroupItem
                                                            value="procurement"
                                                            aria-label="Procurement"
                                                            className="flex-1 border"
                                                        >
                                                            Procurement
                                                        </ToggleGroupItem>

                                                        <ToggleGroupItem
                                                            value="non_procurement"
                                                            aria-label="Non-Procurement"
                                                            className="flex-1 border"
                                                        >
                                                            Non-Procurement
                                                        </ToggleGroupItem>
                                                    </ToggleGroup>
                                                </Field>
                                            )}
                                        />
                                    </div>
                                </div>
                            </form>

                            <ScrollBar orientation="vertical" />
                        </ScrollArea>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (initialData) {
                                    form.reset({
                                        name: initialData.name,
                                        is_non_procurement: initialData.is_non_procurement,
                                    });
                                } else {
                                    form.reset({
                                        name: "",
                                        is_non_procurement: false,
                                    });
                                }
                            }}
                        >
                            Reset
                        </Button>
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>
                            Close
                        </Button>
                        <Button type="submit" form="ppmp-category-form" disabled={isLoading}>
                            {isLoading
                                ? isEditing
                                    ? "Saving..."
                                    : "Creating..."
                                : isEditing
                                  ? "Save Changes"
                                  : "Create Category"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Unsaved Changes</DialogTitle>
                        <DialogDescription>
                            You have unsaved changes. Do you want to discard these changes?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleUnsavedCancel}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleUnsavedConfirm}>
                            Discard Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
