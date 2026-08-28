import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/base-ui-components/ui/button";
import { Checkbox } from "@/components/base-ui-components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/base-ui-components/ui/dialog";
import {
    Field,
    FieldError,
    FieldLabel,
    FieldContent,
} from "@/components/base-ui-components/ui/field";
import { Input } from "@/components/base-ui-components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/base-ui-components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/base-ui-components/ui/select";
import { Textarea } from "@/components/base-ui-components/ui/textarea";
import type { ChartOfAccount } from "@/types";

type ChartOfAccountWithPath = ChartOfAccount & { path: string | null };

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: ChartOfAccountWithPath | null;
    chartOfAccounts: ChartOfAccountWithPath[];
}

const formSchema = z.object({
    account_group: z.string().regex(/^[0-9]$/, "Account Group is required (1 digit)"),
    major_group: z.string().regex(/^\d{2}$/, "Major Group is required (2 digits)"),
    sub_major_group: z.string().regex(/^\d{2}$/, "Sub-Major Group is required (2 digits)"),
    gl_account: z.string().regex(/^\d{2}$/, "General Ledger is required (2 digits)"),
    contra_account: z
        .string()
        .trim()
        .regex(/^\d?$/, "Contra must be 1 digit")
        .optional()
        .or(z.literal("")),
    account_title: z.string().trim().min(1, "Account title is required"),
    account_type: z
        .enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"])
        .nullable()
        .optional()
        .or(z.literal("")),
    expense_class: z.enum(["PS", "MOOE", "FE", "CO"]).nullable().optional().or(z.literal("")),
    account_series: z.string().trim().nullable().or(z.literal("")),
    is_postable: z.boolean(),
    is_active: z.boolean(),
    normal_balance: z.enum(["DEBIT", "CREDIT"]).nullable().optional().or(z.literal("")),
    description: z.string().trim().nullable().or(z.literal("")),
});

export default function FormDialog({
    open,
    onOpenChange,
    initialData,
    chartOfAccounts,
}: FormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    const isEditing = !!initialData;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            account_group: "",
            major_group: "",
            sub_major_group: "",
            gl_account: "",
            contra_account: "",
            account_title: "",
            account_type: "ASSET",
            expense_class: "MOOE",
            account_series: "",
            is_postable: true,
            is_active: true,
            normal_balance: "DEBIT",
            description: "",
        },
    });

    const watchedAg = form.watch("account_group");
    const watchedMag = form.watch("major_group");
    const watchedSmag = form.watch("sub_major_group");
    const watchedGl = form.watch("gl_account");
    const watchedContra = form.watch("contra_account");

    const getLevel = (c: ChartOfAccountWithPath) => {
        if (c.level != null) return Number(c.level);
        if (!c.path) return null;
        return c.path.split("-").filter(Boolean).length;
    };

    const findTitle = (path: string) =>
        chartOfAccounts.find((c) => c.path === path)?.account_title ?? null;

    // AG options with title fallback
    const agOptions = (() => {
        const fromData = chartOfAccounts
            .filter((c) => getLevel(c) === 1 && c.path)
            .map((c) => ({
                value: c.path!.split("-")[0],
                label: c.path!.split("-")[0],
                title: c.account_title,
                path: c.path!,
            }))
            .filter((o) => o.value);
        const map = new Map<
            string,
            { value: string; label: string; title: string | null; path: string }
        >();
        for (const o of fromData) if (!map.has(o.value)) map.set(o.value, o);
        const distinct = Array.from(map.values()).sort((a, b) => a.value.localeCompare(b.value));
        if (distinct.length) return distinct;
        return ["1", "2", "3", "4", "5"].map((v) => ({
            value: v,
            label: v,
            title: null as string | null,
            path: v,
        }));
    })();

    const magOptions = (() => {
        if (!watchedAg) return [];
        const prefix = `${watchedAg}-`;
        const optsMap = new Map<
            string,
            { value: string; label: string; title: string | null; path: string }
        >();
        for (const c of chartOfAccounts.filter(
            (c) => getLevel(c) === 2 && c.path?.startsWith(prefix),
        )) {
            const v = c.path!.split("-")[1];
            if (!v || optsMap.has(v)) continue;
            optsMap.set(v, {
                value: v,
                label: `${v} — ${c.account_title}`,
                title: c.account_title,
                path: c.path!,
            });
        }
        let opts = Array.from(optsMap.values()).sort((a, b) => a.value.localeCompare(b.value));
        if (opts.length === 0) {
            const allMap = new Map<
                string,
                { value: string; label: string; title: string | null; path: string }
            >();
            for (const c of chartOfAccounts.filter((c) => getLevel(c) === 2 && c.path)) {
                const v = c.path!.split("-")[1];
                if (!v || allMap.has(v)) continue;
                allMap.set(v, {
                    value: v,
                    label: `${v} — ${c.account_title}`,
                    title: c.account_title,
                    path: c.path!,
                });
            }
            opts = Array.from(allMap.values()).sort((a, b) => a.value.localeCompare(b.value));
        }
        return opts;
    })();

    const smagOptions = (() => {
        if (!watchedAg || !watchedMag) return [];
        const prefix = `${watchedAg}-${watchedMag}-`;
        const optsMap = new Map<
            string,
            { value: string; label: string; title: string | null; path: string }
        >();
        for (const c of chartOfAccounts.filter(
            (c) => getLevel(c) === 3 && c.path?.startsWith(prefix),
        )) {
            const v = c.path!.split("-")[2];
            if (!v || optsMap.has(v)) continue;
            optsMap.set(v, {
                value: v,
                label: `${v} — ${c.account_title}`,
                title: c.account_title,
                path: c.path!,
            });
        }
        let opts = Array.from(optsMap.values()).sort((a, b) => a.value.localeCompare(b.value));
        if (opts.length === 0) {
            const allMap = new Map<
                string,
                { value: string; label: string; title: string | null; path: string }
            >();
            for (const c of chartOfAccounts.filter((c) => getLevel(c) === 3 && c.path)) {
                const v = c.path!.split("-")[2];
                if (!v || allMap.has(v)) continue;
                allMap.set(v, {
                    value: v,
                    label: `${v} — ${c.account_title}`,
                    title: c.account_title,
                    path: c.path!,
                });
            }
            opts = Array.from(allMap.values())
                .sort((a, b) => a.value.localeCompare(b.value))
                .slice(0, 20);
        }
        return opts;
    })();

    const previewPath =
        watchedAg && watchedMag && watchedSmag && watchedGl && watchedContra
            ? `${watchedAg}-${watchedMag}-${watchedSmag}-${watchedGl}${watchedContra}`
            : null;

    const previewLastSegment = watchedGl && watchedContra ? `${watchedGl}${watchedContra}` : null;

    useEffect(() => {
        if (open) {
            if (initialData?.path) {
                const parts = initialData.path.split("-");
                const last = parts[3] ?? initialData.account_number ?? "";
                form.reset({
                    account_group: parts[0] ?? "",
                    major_group: parts[1] ?? "",
                    sub_major_group: parts[2] ?? "",
                    gl_account: last.slice(0, 2) ?? "",
                    contra_account: last.slice(2, 3) ?? "",
                    account_title: initialData?.account_title ?? "",
                    account_type: (initialData?.account_type as any) ?? "ASSET",
                    expense_class: (initialData?.expense_class as any) ?? "MOOE",
                    account_series: initialData?.account_series ?? "",
                    is_postable: initialData?.is_postable ?? true,
                    is_active: initialData?.is_active ?? true,
                    normal_balance: (initialData?.normal_balance as any) ?? "DEBIT",
                    description: initialData?.description ?? "",
                });
            } else if (
                initialData?.account_number &&
                /^\d-\d{2}-\d{2}-\d{3}$/.test(initialData.account_number)
            ) {
                const parts = initialData.account_number.split("-");
                const last = parts[3] ?? "";
                form.reset({
                    account_group: parts[0] ?? "",
                    major_group: parts[1] ?? "",
                    sub_major_group: parts[2] ?? "",
                    gl_account: last.slice(0, 2) ?? "",
                    contra_account: last.slice(2, 3) ?? "",
                    account_title: initialData?.account_title ?? "",
                    account_type: (initialData?.account_type as any) ?? "ASSET",
                    expense_class: (initialData?.expense_class as any) ?? "MOOE",
                    account_series: initialData?.account_series ?? "",
                    is_postable: initialData?.is_postable ?? true,
                    is_active: initialData?.is_active ?? true,
                    normal_balance: (initialData?.normal_balance as any) ?? "DEBIT",
                    description: initialData?.description ?? "",
                });
            } else {
                const last = (initialData?.account_number ?? "").replace(/\D/g, "").slice(0, 3);
                form.reset({
                    account_group: "",
                    major_group: "",
                    sub_major_group: "",
                    gl_account: last.slice(0, 2) ?? "",
                    contra_account: last.slice(2, 3) ?? "",
                    account_title: initialData?.account_title ?? "",
                    account_type: (initialData?.account_type as any) ?? "ASSET",
                    expense_class: (initialData?.expense_class as any) ?? "MOOE",
                    account_series: initialData?.account_series ?? "",
                    is_postable: initialData?.is_postable ?? true,
                    is_active: initialData?.is_active ?? true,
                    normal_balance: (initialData?.normal_balance as any) ?? "DEBIT",
                    description: initialData?.description ?? "",
                });
            }
        }
    }, [initialData, open, form]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        const contra =
            values.contra_account && values.contra_account !== "" ? values.contra_account : "0";
        const lastSegment = `${values.gl_account}${contra}`;
        const fullPath = `${values.account_group}-${values.major_group}-${values.sub_major_group}-${lastSegment}`;
        const parentPath = `${values.account_group}-${values.major_group}-${values.sub_major_group}`;
        const parent = chartOfAccounts.find((c) => c.path === parentPath);

        const data = {
            account_number: lastSegment,
            path: fullPath,
            parent_id: parent?.id ?? null,
            level: 4,
            account_title: values.account_title,
            account_type:
                !values.account_type || values.account_type === "" ? null : values.account_type,
            expense_class:
                !values.expense_class || values.expense_class === "" ? null : values.expense_class,
            account_series: values.account_series === "" ? null : values.account_series,
            is_postable: values.is_postable,
            is_active: values.is_active,
            normal_balance:
                !values.normal_balance || values.normal_balance === ""
                    ? null
                    : values.normal_balance,
            description: values.description === "" ? null : values.description,
        };

        if (isEditing) {
            router.patch(`/chart-of-accounts/${initialData.id}`, data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                },
                onError: (errors: any) => {
                    const messages = Object.values(errors).flat();
                    const combinedMessage =
                        messages.length > 0 ? messages.join(" ") : "An unexpected error occurred.";

                    setAlertMessage(combinedMessage);
                    setAlertOpen(true);

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
            router.post("/chart-of-accounts", data, {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                },
                onError: (errors: any) => {
                    const messages = Object.values(errors).flat();
                    const combinedMessage =
                        messages.length > 0 ? messages.join(" ") : "An unexpected error occurred.";

                    setAlertMessage(combinedMessage);
                    setAlertOpen(true);

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
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-[620px]">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? "Edit Chart of Account" : "Add New Chart of Account"}
                        </DialogTitle>
                        <DialogDescription>
                            Modify or create chart of account details.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex min-h-0">
                        <ScrollArea className="w-full pr-3">
                            <form
                                id="chart-of-account-form"
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="flex flex-col gap-4 py-1"
                            >
                                <div className="rounded-xl border bg-muted/40 p-3">
                                    <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        Code Preview
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-baseline gap-1 font-mono text-xl leading-none slashed-zero tabular-nums">
                                        <span
                                            className={
                                                watchedAg
                                                    ? "text-foreground"
                                                    : "text-muted-foreground/60"
                                            }
                                        >
                                            {watchedAg || "0"}
                                        </span>
                                        <span className="text-muted-foreground/60">-</span>
                                        <span
                                            className={
                                                watchedMag
                                                    ? "text-foreground"
                                                    : "text-muted-foreground/60"
                                            }
                                        >
                                            {watchedMag || "00"}
                                        </span>
                                        <span className="text-muted-foreground/60">-</span>
                                        <span
                                            className={
                                                watchedSmag
                                                    ? "text-foreground"
                                                    : "text-muted-foreground/60"
                                            }
                                        >
                                            {watchedSmag || "00"}
                                        </span>
                                        <span className="text-muted-foreground/60">-</span>
                                        <span
                                            className={
                                                watchedGl
                                                    ? "text-foreground"
                                                    : "text-muted-foreground/60"
                                            }
                                        >
                                            {watchedGl || "00"}
                                            {watchedContra || "0"}
                                        </span>
                                    </div>
                                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs leading-none text-muted-foreground">
                                        <span>
                                            <span className="font-mono text-foreground">0</span>{" "}
                                            Account Group
                                        </span>
                                        <span>
                                            <span className="font-mono text-foreground">00</span>{" "}
                                            Major Account Group
                                        </span>
                                        <span>
                                            <span className="font-mono text-foreground">00</span>{" "}
                                            Sub-Major Account Group
                                        </span>
                                        <span>
                                            <span className="font-mono text-foreground">00</span>{" "}
                                            General Ledger
                                        </span>
                                        <span>
                                            <span className="font-mono text-foreground">0</span>{" "}
                                            Contra
                                        </span>
                                    </div>
                                    {previewPath && (
                                        <div className="mt-2 text-xs">
                                            Full:{" "}
                                            <span className="font-mono font-medium text-foreground">
                                                {previewPath}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <Controller
                                        name="account_group"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldContent>
                                                    <FieldLabel className="gap-1">
                                                        Account Group{" "}
                                                        <span className="text-red-500">*</span>
                                                    </FieldLabel>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={(v) => {
                                                            field.onChange(v ?? "");
                                                            form.setValue("major_group", "");
                                                            form.setValue("sub_major_group", "");
                                                        }}
                                                    >
                                                        <SelectTrigger
                                                            className="w-full"
                                                            aria-invalid={fieldState.invalid}
                                                        >
                                                            <SelectValue placeholder="0" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {agOptions.map((o) => (
                                                                <SelectItem
                                                                    key={o.value}
                                                                    value={o.value}
                                                                >
                                                                    <span className="font-mono">
                                                                        {o.value}
                                                                    </span>
                                                                    {o.title ? (
                                                                        <span className="text-muted-foreground">
                                                                            {" "}
                                                                            — {o.title}
                                                                        </span>
                                                                    ) : null}
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
                                        name="major_group"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldContent>
                                                    <FieldLabel className="gap-1">
                                                        Major Account Group{" "}
                                                        <span className="text-red-500">*</span>
                                                    </FieldLabel>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={(v) => {
                                                            field.onChange(v ?? "");
                                                            form.setValue("sub_major_group", "");
                                                        }}
                                                        disabled={!watchedAg}
                                                    >
                                                        <SelectTrigger
                                                            className="w-full"
                                                            aria-invalid={fieldState.invalid}
                                                            disabled={!watchedAg}
                                                        >
                                                            <SelectValue placeholder="00" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {magOptions.length ? (
                                                                magOptions.map((o) => (
                                                                    <SelectItem
                                                                        key={o.value}
                                                                        value={o.value}
                                                                    >
                                                                        <span className="font-mono">
                                                                            {o.value}
                                                                        </span>
                                                                        <span className="text-muted-foreground">
                                                                            {" "}
                                                                            — {o.title ?? o.path}
                                                                        </span>
                                                                    </SelectItem>
                                                                ))
                                                            ) : (
                                                                <div className="p-2 text-xs text-muted-foreground">
                                                                    No majors for AG {watchedAg}
                                                                </div>
                                                            )}
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
                                        name="sub_major_group"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldContent>
                                                    <FieldLabel className="gap-1">
                                                        Sub-Major Account Group{" "}
                                                        <span className="text-red-500">*</span>
                                                    </FieldLabel>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={(v) =>
                                                            field.onChange(v ?? "")
                                                        }
                                                        disabled={!watchedMag}
                                                    >
                                                        <SelectTrigger
                                                            className="w-full"
                                                            aria-invalid={fieldState.invalid}
                                                            disabled={!watchedMag}
                                                        >
                                                            <SelectValue placeholder="00" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {smagOptions.length ? (
                                                                smagOptions.map((o) => (
                                                                    <SelectItem
                                                                        key={o.value}
                                                                        value={o.value}
                                                                    >
                                                                        <span className="font-mono">
                                                                            {o.value}
                                                                        </span>
                                                                        <span className="text-muted-foreground">
                                                                            {" "}
                                                                            — {o.title ?? o.path}
                                                                        </span>
                                                                    </SelectItem>
                                                                ))
                                                            ) : (
                                                                <div className="p-2 text-xs text-muted-foreground">
                                                                    No sub-majors for {watchedAg}-
                                                                    {watchedMag}
                                                                </div>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    {fieldState.invalid && (
                                                        <FieldError errors={[fieldState.error]} />
                                                    )}
                                                </FieldContent>
                                            </Field>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Controller
                                        name="gl_account"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldContent>
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                        className="gap-1"
                                                    >
                                                        General Ledger{" "}
                                                        <span className="text-red-500">*</span>
                                                    </FieldLabel>
                                                    <Input
                                                        id={field.name}
                                                        value={field.value}
                                                        onChange={(e) => {
                                                            const v = e.target.value
                                                                .replace(/\D/g, "")
                                                                .slice(0, 2);
                                                            field.onChange(v);
                                                        }}
                                                        aria-invalid={fieldState.invalid}
                                                        placeholder="01"
                                                        autoComplete="off"
                                                        maxLength={2}
                                                        disabled={!watchedSmag}
                                                    />
                                                    {fieldState.invalid && (
                                                        <FieldError errors={[fieldState.error]} />
                                                    )}
                                                </FieldContent>
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        name="contra_account"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldContent>
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                        className="gap-1"
                                                    >
                                                        Contra
                                                    </FieldLabel>
                                                    <Input
                                                        id={field.name}
                                                        value={field.value}
                                                        onChange={(e) => {
                                                            const v = e.target.value
                                                                .replace(/\D/g, "")
                                                                .slice(0, 1);
                                                            field.onChange(v);
                                                        }}
                                                        aria-invalid={fieldState.invalid}
                                                        placeholder="0 (default)"
                                                        autoComplete="off"
                                                        maxLength={1}
                                                        disabled={!watchedSmag || !watchedGl}
                                                    />
                                                    {fieldState.invalid && (
                                                        <FieldError errors={[fieldState.error]} />
                                                    )}
                                                    <p className="text-xs text-muted-foreground">
                                                        Defaults to 0 if empty
                                                    </p>
                                                </FieldContent>
                                            </Field>
                                        )}
                                    />
                                </div>

                                <Controller
                                    name="account_title"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name} className="gap-1">
                                                    Account Title{" "}
                                                    <span className="text-red-500">*</span>
                                                </FieldLabel>

                                                <Input
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={fieldState.invalid}
                                                    placeholder="e.g., Office Supplies"
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
                                    name="account_type"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                            className="opacity-60"
                                        >
                                            <FieldContent>
                                                <FieldLabel className="gap-1">
                                                    Account Type
                                                </FieldLabel>

                                                <Select
                                                    value={field.value ?? ""}
                                                    onValueChange={field.onChange}
                                                    disabled
                                                >
                                                    <SelectTrigger
                                                        className="w-full"
                                                        aria-invalid={fieldState.invalid}
                                                        disabled
                                                    >
                                                        <SelectValue placeholder="—" />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        {[
                                                            "ASSET",
                                                            "LIABILITY",
                                                            "EQUITY",
                                                            "REVENUE",
                                                            "EXPENSE",
                                                        ].map((v) => (
                                                            <SelectItem key={v} value={v}>
                                                                {v}
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
                                    name="expense_class"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                            className="opacity-60"
                                        >
                                            <FieldContent>
                                                <FieldLabel className="gap-1">
                                                    Expense Class
                                                </FieldLabel>

                                                <Select
                                                    value={field.value ?? ""}
                                                    onValueChange={field.onChange}
                                                    disabled
                                                >
                                                    <SelectTrigger
                                                        className="w-full"
                                                        aria-invalid={fieldState.invalid}
                                                        disabled
                                                    >
                                                        <SelectValue placeholder="—" />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        {["PS", "MOOE", "FE", "CO"].map((v) => (
                                                            <SelectItem key={v} value={v}>
                                                                {v}
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
                                    name="account_series"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                            className="opacity-60"
                                        >
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name}>
                                                    Account Series
                                                </FieldLabel>

                                                <Input
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={fieldState.invalid}
                                                    value={field.value ?? ""}
                                                    autoComplete="off"
                                                    disabled
                                                    placeholder="—"
                                                />

                                                {fieldState.invalid && (
                                                    <FieldError errors={[fieldState.error]} />
                                                )}
                                            </FieldContent>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="normal_balance"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                            className="opacity-60"
                                        >
                                            <FieldContent>
                                                <FieldLabel className="gap-1">
                                                    Normal Balance
                                                </FieldLabel>

                                                <Select
                                                    value={field.value ?? ""}
                                                    onValueChange={field.onChange}
                                                    disabled
                                                >
                                                    <SelectTrigger
                                                        className="w-full"
                                                        aria-invalid={fieldState.invalid}
                                                        disabled
                                                    >
                                                        <SelectValue placeholder="—" />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        <SelectItem value="DEBIT">DEBIT</SelectItem>

                                                        <SelectItem value="CREDIT">
                                                            CREDIT
                                                        </SelectItem>
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
                                    name="description"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                            className="opacity-60"
                                        >
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name}>
                                                    Description
                                                </FieldLabel>

                                                <Textarea
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={fieldState.invalid}
                                                    value={field.value ?? ""}
                                                    autoComplete="off"
                                                    className="min-h-15"
                                                    disabled
                                                    placeholder="—"
                                                />

                                                {fieldState.invalid && (
                                                    <FieldError errors={[fieldState.error]} />
                                                )}
                                            </FieldContent>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="is_postable"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Field orientation="horizontal">
                                            <Checkbox
                                                id={field.name}
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />

                                            <FieldLabel htmlFor={field.name}>
                                                Is Postable
                                            </FieldLabel>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="is_active"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Field orientation="horizontal">
                                            <Checkbox
                                                id={field.name}
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />

                                            <FieldLabel htmlFor={field.name}>Is Active</FieldLabel>
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
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" form="chart-of-account-form" disabled={isLoading}>
                            {isLoading
                                ? isEditing
                                    ? "Saving..."
                                    : "Creating..."
                                : isEditing
                                  ? "Save Changes"
                                  : "Create Account"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Error</DialogTitle>
                        <DialogDescription>{alertMessage}</DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAlertOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
