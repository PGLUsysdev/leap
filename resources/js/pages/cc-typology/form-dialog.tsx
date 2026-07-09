import { useEffect, useMemo, useState } from "react";
import type { CcTypology, CcStrategicPriority, CcSubSector } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Field, FieldError, FieldGroup, FieldLabel, FieldContent } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { router } from "@inertiajs/react";
import { FormDialogShell } from "@/components/form-dialog-shell";
import { AlertErrorDialog } from "@/components/alert-error-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface FormDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    initialData: CcTypology | null;
    strategicPriorities: CcStrategicPriority[];
    subSectors: CcSubSector[];
}

function createFormSchema(subSectors: CcSubSector[]) {
    return z
        .object({
            strategic_priority_id: z.string().min(1, "Strategic priority is required"),
            sub_sector_id: z.string(),
            response_type: z.enum(["A", "M"], {
                message: "Response type is required",
            }),
            category_code: z.enum(["1", "2", "3", "4"], {
                message: "Category is required",
            }),
            item_num: z
                .string()
                .min(1, "Item number is required")
                .regex(/^\d+$/, "Must be a number")
                .refine((val) => parseInt(val, 10) > 0, {
                    message: "Item number must be greater than 0",
                }),
            description: z.string().trim().min(1, "Description is required"),
            is_nccap_activity: z.boolean(),
        })
        .superRefine((data, ctx) => {
            if (data.strategic_priority_id) {
                const prioritySubSectors = subSectors.filter(
                    (ss) => String(ss.strategic_priority_id) === data.strategic_priority_id,
                );
                if (
                    prioritySubSectors.length > 0 &&
                    (!data.sub_sector_id ||
                        data.sub_sector_id === "none" ||
                        data.sub_sector_id === "")
                ) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Sub sector is required",
                        path: ["sub_sector_id"],
                    });
                }
            }
        });
}

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

const responseTypeOptions = [
    { value: "A" as const, label: "Adaptation" },
    { value: "M" as const, label: "Mitigation" },
];

const categoryOptions = [
    { value: "1" as const, label: "Policy Development and Governance" },
    { value: "2" as const, label: "Research, Development and Extension" },
    { value: "3" as const, label: "Knowledge Sharing and Capacity Building" },
    { value: "4" as const, label: "Service Delivery" },
];

export default function FormDialog({
    open,
    setOpen,
    initialData,
    strategicPriorities = [],
    subSectors = [],
}: FormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const isEditing = !!initialData;

    const formSchema = useMemo(() => createFormSchema(subSectors), [subSectors]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            strategic_priority_id: "",
            sub_sector_id: "none",
            response_type: undefined,
            category_code: undefined,
            item_num: "",
            description: "",
            is_nccap_activity: false,
        },
    });

    useEffect(() => {
        if (open) {
            setFormError(null);
            if (initialData) {
                form.reset({
                    strategic_priority_id: String(initialData.strategic_priority_id),
                    sub_sector_id: initialData.sub_sector_id
                        ? String(initialData.sub_sector_id)
                        : "none",
                    response_type: initialData.response_type as "A" | "M",
                    category_code: initialData.category_code as "1" | "2" | "3" | "4",
                    item_num: String(initialData.item_num),
                    description: initialData.description,
                    is_nccap_activity: initialData.is_nccap_activity,
                });
            } else {
                form.reset({
                    strategic_priority_id: "",
                    sub_sector_id: "none",
                    response_type: undefined,
                    category_code: undefined,
                    item_num: "",
                    description: "",
                    is_nccap_activity: false,
                });
            }
        }
    }, [open, initialData, form]);

    const watchedStrategicPriority = form.watch("strategic_priority_id");
    const watchedResponseType = form.watch("response_type");
    const watchedCategoryCode = form.watch("category_code");
    const watchedItemNum = form.watch("item_num");

    const selectedPriority = strategicPriorities.find(
        (sp) => String(sp.id) === watchedStrategicPriority,
    );

    const selectedSubSector = subSectors.find(
        (ss) => String(ss.id) === form.watch("sub_sector_id"),
    );

    const filteredSubSectors = subSectors.filter(
        (ss) => String(ss.strategic_priority_id) === watchedStrategicPriority,
    );

    const subSectorCodeForDisplay = useMemo(() => {
        if (!watchedStrategicPriority) {
            return "_";
        }
        if (selectedSubSector?.code) {
            return selectedSubSector.code;
        }
        if (filteredSubSectors.length === 0) {
            return "1";
        }
        return "_";
    }, [watchedStrategicPriority, selectedSubSector, filteredSubSectors]);

    const paddedItemNum = watchedItemNum?.trim() ? watchedItemNum.padStart(2, "0") : "";

    const generatedCode = `${watchedResponseType || "_"}${selectedPriority?.code ?? "_"}${subSectorCodeForDisplay}${watchedCategoryCode || "_"}-${paddedItemNum || "__"}`;

    function onSubmit(data: FormValues) {
        const payload = {
            ...data,
            sub_sector_id: data.sub_sector_id === "none" ? null : data.sub_sector_id,
            item_num: Number(data.item_num),
        };

        function handleError(errors: Record<string, string>) {
            if (errors.message) {
                setFormError(errors.message as string);
                return;
            }
            Object.keys(errors).forEach((key) => {
                form.setError(key as any, {
                    type: "server",
                    message: errors[key],
                });
            });
        }

        if (isEditing) {
            router.patch(`/cc-typology/${initialData.id}`, payload, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => setOpen(false),
                onError: handleError,
                onFinish: () => setIsLoading(false),
            });
        } else {
            router.post("/cc-typology", payload, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => setOpen(false),
                onError: handleError,
                onFinish: () => setIsLoading(false),
            });
        }
    }

    return (
        <>
            <AlertErrorDialog
                open={!!formError}
                onOpenChange={() => setFormError(null)}
                error={formError}
            />

            <FormDialogShell
                open={open}
                onOpenChange={setOpen}
                title={isEditing ? "Edit CC Typology" : "Create CC Typology"}
                description={
                    isEditing
                        ? "Modify the details of the existing typology below."
                        : "Fill in the information to create a new climate change typology record."
                }
                isLoading={isLoading}
                formId="cc-typology-form"
                onCancel={() => setOpen(false)}
                submitLabel={isEditing ? "Save Changes" : "Create Typology"}
                submittingLabel={isEditing ? "Saving..." : "Creating..."}
                className="sm:max-w-lg"
            >
                <div className="flex min-h-0">
                    <ScrollArea className="w-full">
                        <form id="cc-typology-form" onSubmit={form.handleSubmit(onSubmit)}>
                            <FieldGroup>
                                <div className="rounded-lg bg-muted p-3 text-center">
                                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Generated Code
                                    </span>
                                    <div className="font-mono text-xl font-bold tracking-widest text-primary">
                                        {generatedCode}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Sub sector defaults to <span className="font-mono">1</span>{" "}
                                        when set to None
                                    </p>
                                </div>

                                <Controller
                                    name="response_type"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name} className="gap-1">
                                                    Response Type
                                                </FieldLabel>

                                                <Select
                                                    name={field.name}
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger
                                                        id={field.name}
                                                        aria-invalid={fieldState.invalid}
                                                        className="w-full"
                                                    >
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {responseTypeOptions.map((opt) => (
                                                            <SelectItem
                                                                key={opt.value}
                                                                value={opt.value}
                                                            >
                                                                {opt.value} - {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                {fieldState.invalid && (
                                                    <FieldError errors={[fieldState.error]} />
                                                )}
                                            </FieldContent>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="strategic_priority_id"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name} className="gap-1">
                                                    Strategic Priority
                                                </FieldLabel>

                                                <Select
                                                    name={field.name}
                                                    value={field.value}
                                                    onValueChange={(value) => {
                                                        field.onChange(value);

                                                        const prioritySubs = subSectors.filter(
                                                            (ss) =>
                                                                String(ss.strategic_priority_id) ===
                                                                value,
                                                        );

                                                        if (prioritySubs.length === 0) {
                                                            form.setValue("sub_sector_id", "none");
                                                        } else {
                                                            form.setValue("sub_sector_id", "");
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger
                                                        id={field.name}
                                                        aria-invalid={fieldState.invalid}
                                                        className="w-full"
                                                    >
                                                        <SelectValue placeholder="Select priority" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {strategicPriorities.map((sp) => (
                                                            <SelectItem
                                                                key={sp.id}
                                                                value={String(sp.id)}
                                                            >
                                                                {sp.code} - {sp.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                {fieldState.invalid && (
                                                    <FieldError errors={[fieldState.error]} />
                                                )}
                                            </FieldContent>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="sub_sector_id"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name} className="gap-1">
                                                    Sub Sector
                                                </FieldLabel>

                                                <Select
                                                    name={field.name}
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    disabled={
                                                        !watchedStrategicPriority ||
                                                        filteredSubSectors.length === 0
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id={field.name}
                                                        aria-invalid={fieldState.invalid}
                                                        className="w-full"
                                                    >
                                                        {!watchedStrategicPriority ? (
                                                            <SelectValue placeholder="Select priority first" />
                                                        ) : filteredSubSectors.length === 0 ? (
                                                            <span className="text-muted-foreground">
                                                                None
                                                            </span>
                                                        ) : (
                                                            <SelectValue placeholder="Select sub sector" />
                                                        )}
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {filteredSubSectors.length === 0 ? (
                                                            <SelectItem value="none">
                                                                None
                                                            </SelectItem>
                                                        ) : (
                                                            filteredSubSectors.map((ss) => (
                                                                <SelectItem
                                                                    key={ss.id}
                                                                    value={String(ss.id)}
                                                                >
                                                                    {ss.code} - {ss.name}
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>

                                                {(!watchedStrategicPriority ||
                                                    filteredSubSectors.length === 0) && (
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        Defaults to{" "}
                                                        <span className="font-mono">1</span> when
                                                        set to None
                                                    </p>
                                                )}

                                                {fieldState.invalid && (
                                                    <FieldError errors={[fieldState.error]} />
                                                )}
                                            </FieldContent>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="category_code"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name} className="gap-1">
                                                    Category
                                                </FieldLabel>

                                                <Select
                                                    name={field.name}
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger
                                                        id={field.name}
                                                        aria-invalid={fieldState.invalid}
                                                        className="w-full"
                                                    >
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {categoryOptions.map((opt) => (
                                                            <SelectItem
                                                                key={opt.value}
                                                                value={opt.value}
                                                            >
                                                                {opt.value} - {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                {fieldState.invalid && (
                                                    <FieldError errors={[fieldState.error]} />
                                                )}
                                            </FieldContent>
                                        </Field>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Controller
                                        name="item_num"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldContent>
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                        className="gap-1"
                                                    >
                                                        Item No.
                                                    </FieldLabel>

                                                    <Input
                                                        {...field}
                                                        id={field.name}
                                                        aria-invalid={fieldState.invalid}
                                                        placeholder="01"
                                                        autoComplete="off"
                                                        onChange={(e) => {
                                                            const raw = e.target.value;
                                                            const digits = raw
                                                                .replace(/\D/g, "")
                                                                .slice(0, 2);
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

                                    <div className="flex items-end pb-4">
                                        <Controller
                                            name="is_nccap_activity"
                                            control={form.control}
                                            render={({ field }) => (
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={field.name}
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                        className="font-normal"
                                                    >
                                                        NCCAP Activity
                                                    </FieldLabel>
                                                </div>
                                            )}
                                        />
                                    </div>
                                </div>

                                <Controller
                                    name="description"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name} className="gap-1">
                                                    Description
                                                </FieldLabel>

                                                <Textarea
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={fieldState.invalid}
                                                    placeholder="Enter description..."
                                                    autoComplete="off"
                                                    rows={3}
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
        </>
    );
}
