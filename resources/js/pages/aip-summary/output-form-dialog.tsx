// resources\js\pages\aip-summary\output-form-dialog.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "@inertiajs/react";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import * as z from "zod";
import { DatePicker } from "@/components/base-ui-components/date-picker";
import {
    MultiTableSelect,
    MultiTableSelectButton,
} from "@/components/base-ui-components/multi-table-select";
import { Badge } from "@/components/base-ui-components/ui/badge";
import { Button } from "@/components/base-ui-components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/base-ui-components/ui/dialog";
import { Spinner } from "@/components/base-ui-components/ui/spinner";
import { Textarea } from "@/components/base-ui-components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { store, update } from "@/routes/aip-outputs";
import type { AipEntry, AipOutput, Office } from "@/types";
import officeColumns from "./columns/office-columns";

interface OutputFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entry: AipEntry; // parent entry
    output?: AipOutput | null; // null for add, otherwise edit
    offices?: Office[];
}

const outputFormSchema = z.object({
    officeIds: z.array(z.string()).min(1, "Office is required"),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    expectedOutput: z.string().optional(),
});

type OutputFormValues = z.infer<typeof outputFormSchema>;

function toDate(isoDate: string | null | undefined) {
    return isoDate ? new Date(isoDate) : undefined;
}

function toIsoDate(date: Date | undefined) {
    return date ? date.toISOString().slice(0, 10) : null;
}

export default function OutputFormDialog({
    open,
    onOpenChange,
    entry,
    output,
    offices,
}: OutputFormDialogProps) {
    const isEditing = !!output;
    const [loadingState, setLoadingState] = useState<"idle" | "saving" | "saved">("idle");
    const [pickerOpen, setPickerOpen] = useState(false);

    const form = useForm<OutputFormValues>({
        resolver: zodResolver(outputFormSchema),
        defaultValues: {
            officeIds: [],
            startDate: undefined,
            endDate: undefined,
            expectedOutput: "",
        },
    });

    const watchOfficeIds = useWatch({ control: form.control, name: "officeIds" });

    // Display text in selection order, skipping ids missing from the office list
    const displayText = (watchOfficeIds ?? [])
        .map((id) => offices?.find((o) => String(o.id) === id)?.acronym)
        .filter(Boolean)
        .join(" / ");

    useEffect(() => {
        if (!open) return;

        if (isEditing && output) {
            form.reset({
                officeIds: output.offices?.map((o) => String(o.id)) ?? [],
                startDate: toDate(output.start_date),
                endDate: toDate(output.end_date),
                expectedOutput: output.expected_output ?? "",
            });
        } else {
            // New output: default to PPA's office
            const defaultOfficeIds =
                entry.ppa?.office_id != null ? [String(entry.ppa.office_id)] : [];
            form.reset({
                officeIds: defaultOfficeIds,
                startDate: undefined,
                endDate: undefined,
                expectedOutput: "",
            });
        }
    }, [open, entry, output, isEditing, form]);

    function onSubmit(values: OutputFormValues) {
        const payload = {
            office_ids: values.officeIds.map(Number),
            start_date: toIsoDate(values.startDate),
            end_date: toIsoDate(values.endDate),
            expected_output: values.expectedOutput?.trim() || null,
        };

        setLoadingState("saving");

        const url = isEditing
            ? update({ aipOutput: output!.id }).url
            : store({ aipEntry: entry.id }).url;

        router.visit(url, {
            method: isEditing ? "patch" : "post",
            data: payload,
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setLoadingState("saved");
                // Close the dialog after a short delay so the user sees the saved state
                setTimeout(() => onOpenChange(false), 500);
            },
            onError: (errors) => {
                setLoadingState("idle");
                console.error(errors);
            },
        });
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[40rem]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Output" : "Add New Output"}</DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? "Update the offices, schedule, and description for this expected output."
                                : "Create a new expected output for this entry."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <Controller
                            name="expectedOutput"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Expected Output</FieldLabel>
                                    <Textarea
                                        {...field}
                                        placeholder="Describe the expected output"
                                        className="min-h-[100px]"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        <Controller
                            name="officeIds"
                            control={form.control}
                            render={({ fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>
                                        Implementing Office / Department / Location
                                    </FieldLabel>
                                    <MultiTableSelectButton
                                        invalid={fieldState.invalid}
                                        displayText={displayText || undefined}
                                        placeholder="Select implementing offices"
                                        onOpen={() => setPickerOpen(true)}
                                        onClear={() =>
                                            form.setValue("officeIds", [], {
                                                shouldValidate: true,
                                            })
                                        }
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-5">
                            <Controller
                                name="startDate"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>Starting Date</FieldLabel>
                                        <DatePicker
                                            year={new Date().getFullYear()}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            invalid={fieldState.invalid}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                            <Controller
                                name="endDate"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>Completion Date</FieldLabel>
                                        <DatePicker
                                            year={new Date().getFullYear()}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            invalid={fieldState.invalid}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Badge variant={loadingState === "saving" ? "secondary" : "ghost"}>
                                {loadingState === "saving" && (
                                    <>
                                        <Spinner /> Saving…
                                    </>
                                )}
                                {loadingState === "saved" && (
                                    <>
                                        <Check /> Saved
                                    </>
                                )}
                                {loadingState === "idle" && "Ready"}
                            </Badge>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => onOpenChange(false)}
                                    disabled={loadingState === "saving"}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loadingState === "saving"}>
                                    {isEditing ? "Update" : "Create"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <MultiTableSelect<Office>
                data={offices ?? []}
                columns={officeColumns}
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                selectedValues={watchOfficeIds?.map(String) ?? []}
                valueKey="id"
                title="Implementing Offices"
                description="Select one or more offices for this output."
                className="sm:max-w-[30rem]"
                onConfirm={(selected) => {
                    form.setValue(
                        "officeIds",
                        selected.map((o) => String(o.id)),
                        { shouldValidate: true },
                    );
                }}
            />
        </>
    );
}
