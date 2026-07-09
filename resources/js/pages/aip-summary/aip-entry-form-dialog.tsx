import { useEffect, useState, useMemo, useRef } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Plus, Trash2, ListPlus, FileText } from "lucide-react";
import { router } from "@inertiajs/react";
import { Form } from "@/components/ui/form";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { FormDialogShell } from "@/components/form-dialog-shell";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { CommandSelect } from "@/components/command-select";
import type {
    FiscalYear,
    Ppa,
    FundingSource,
    Office,
    AuthData,
    ChartOfAccount,
    PriceList,
    PpmpCategory,
} from "@/types";
import { index } from "@/routes/aip/summary/ppmp";
import PpmpFormDialog from "@/pages/ppmp/form-dialog";
import { index as psBreakdownIndex } from "@/routes/ps-breakdown";
import PreviewPdfDialog from "@/pages/ps-breakdown/pdf-preview-dialog";

interface AipEntryFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: Ppa | null;
    fiscalYear: FiscalYear;
    fundingSources: FundingSource[];
    offices: Office[];
    auth: AuthData;
    supplementalAipId?: number | null;
    canShowSummaryAll?: boolean; // NEW
    selectedOfficeId?: string;
    ccTypologies: {
        id: number;
        code: string;
        description: string;
        strategic_priority_id: number;
        sub_sector_id: number | null;
        strategic_priority?: { id: number; code: number; name: string };
        sub_sector?: { id: number; code: number; name: string } | null;
    }[];
    chartOfAccounts: ChartOfAccount[];
    priceLists: PriceList[];
    ppmpCategories: PpmpCategory[];
    ppmpCoaTotals: Record<number, Record<number, number>>;
    psCoaAutoTotals: Record<string, number>;
    onPpmpItemAdded?: () => void;
    psPoolPpaId?: number | null;
}

const amountSchema = z.string();

const formSchema = z.object({
    office_id: z.string().min(1, "Office is required"),
    expected_output: z.string().min(1, "Required"),
    start_date: z.string().min(1, "Required"),
    end_date: z.string().min(1, "Required"),
    ppa_funding_sources: z.array(
        z.object({
            id: z.number().optional(),
            funding_source_id: z.string().min(1, "Required"),
            ps_amount: amountSchema,
            mooe_amount: amountSchema,
            fe_amount: amountSchema,
            co_amount: amountSchema,
            ccet_adaptation: amountSchema,
            ccet_mitigation: amountSchema,
            cc_typology_id: z.number().optional().nullable(),
        }),
    ),
});

type FormValues = z.infer<typeof formSchema>;

const calculateRowTotal = (row: any) => {
    return (
        parseFloat(row.ps_amount || "0") +
        parseFloat(row.mooe_amount || "0") +
        parseFloat(row.fe_amount || "0") +
        parseFloat(row.co_amount || "0")
    );
};

export default function AipEntryFormDialog({
    open,
    onOpenChange,
    data,
    fiscalYear,
    fundingSources,
    ccTypologies,
    offices,
    auth,
    supplementalAipId = null,
    canShowSummaryAll,
    selectedOfficeId,
    chartOfAccounts,
    priceLists,
    ppmpCategories,
    ppmpCoaTotals = {},
    psCoaAutoTotals = {},
    onPpmpItemAdded,
    psPoolPpaId,
}: AipEntryFormDialogProps) {
    const userOfficeId = auth?.user?.office_id;
    const [isLoading, setIsLoading] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [removeSourceIndex, setRemoveSourceIndex] = useState<number | null>(null);

    const [ppmpDialogOpen, setPpmpDialogOpen] = useState(false);
    const [ppmpExpenseClass, setPpmpExpenseClass] = useState<"MOOE" | "CO">("MOOE");
    const [ppmpSourceIndex, setPpmpSourceIndex] = useState<number>(0);
    const [previewOpen, setPreviewOpen] = useState(false);

    const baselineSourceIds = useRef<Set<number>>(new Set());
    const baselineCaptured = useRef(false);
    const removedNewSourceIds = useRef<Set<number>>(new Set());

    const canEditFunding = data?.can?.editFundingSources ?? false;
    const canEdit = data?.can?.edit ?? false;
    const canViewPpmp = data?.can?.viewPpmp ?? false;
    const canViewPsBreakdown = data?.can?.viewPsBreakdown ?? false;

    const entry =
        data?.aip_entries?.find((e) => e.supplemental_aip_id === (supplementalAipId || null)) ||
        data?.aip_entries?.[0] ||
        null;
    const isEdit = !!(entry && entry.supplemental_aip_id === (supplementalAipId || null));

    const isPsPool = data?.id === psPoolPpaId;

    const filteredOffices = useMemo(() => {
        if (!userOfficeId) return offices;

        const userOffice = offices.find((o) => o.id === userOfficeId);
        if (!userOffice) return offices;

        const userOfficeChildren = offices.filter((o) => o.parent_id === userOfficeId);
        return [userOffice, ...userOfficeChildren];
    }, [offices, userOfficeId]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            office_id: "",
            expected_output: "",
            start_date: "",
            end_date: "",
            ppa_funding_sources: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "ppa_funding_sources",
    });

    const watchedSources = useWatch({
        control: form.control,
        name: "ppa_funding_sources",
    });

    const sectionTotals = useMemo(() => {
        const sum = (key: "ps_amount" | "mooe_amount" | "fe_amount" | "co_amount") =>
            (watchedSources || [])
                .reduce((s, src: any) => s + parseFloat(src?.[key] || "0"), 0)
                .toFixed(2);

        const sumCoaAmount = (coaId: number) => {
            const result = (watchedSources || [])
                .reduce((s, src: any) => {
                    if (!src.id) return s;
                    console.log(
                        `src.id=${src.id}, coaId=${coaId}, lookup=${ppmpCoaTotals[src.id]?.[coaId]}`,
                    );
                    return s + (ppmpCoaTotals[src.id]?.[coaId] ?? 0);
                }, 0)
                .toFixed(2);
            console.log(`sumCoaAmount(${coaId}) = ${result}`);
            return result;
        };

        const buildSection = (expenseClass: "PS" | "MOOE" | "FE" | "CO", total: string) => {
            const coas =
                expenseClass === "FE"
                    ? []
                    : chartOfAccounts
                          .filter((coa) => coa.expense_class === expenseClass)
                          .map((coa) => ({
                              account_number: coa.account_number,
                              account_title: coa.account_title,
                              amount:
                                  expenseClass === "PS" && isPsPool
                                      ? (psCoaAutoTotals[coa.account_number] ?? 0).toFixed(2)
                                      : expenseClass === "PS" && !isPsPool
                                        ? "0.00"
                                        : sumCoaAmount(coa.id),
                          }));

            // For PS, recompute total from computed COA amounts
            if (expenseClass === "PS") {
                const computedTotal = coas
                    .reduce((sum, coa) => sum + parseFloat(coa.amount), 0)
                    .toFixed(2);
                return { total: computedTotal, coas };
            }

            return { total, coas };
        };

        return {
            ps: buildSection("PS", sum("ps_amount")),
            mooe: buildSection("MOOE", sum("mooe_amount")),
            fe: buildSection("FE", sum("fe_amount")),
            co: buildSection("CO", sum("co_amount")),
        };
    }, [watchedSources, chartOfAccounts, ppmpCoaTotals, psCoaAutoTotals, isPsPool]);

    console.log("ppmpCoaTotals prop:", ppmpCoaTotals);
    console.log("sectionTotals:", sectionTotals);

    const watchedAll = useWatch({ control: form.control });
    const [savedHash, setSavedHash] = useState<string>("");
    const isDirty = JSON.stringify(watchedAll) !== savedHash;

    const getSaveWorthyFields = (values: FormValues) => ({
        office_id: values.office_id,
        expected_output: values.expected_output,
        start_date: values.start_date,
        end_date: values.end_date,
        ppa_funding_sources: (values.ppa_funding_sources || []).map((s) => ({
            ccet_adaptation: s.ccet_adaptation,
            ccet_mitigation: s.ccet_mitigation,
            cc_typology_id: s.cc_typology_id,
        })),
    });

    const [saveWorthyHash, setSaveWorthyHash] = useState<string>("");
    const hasSaveWorthyChanges = JSON.stringify(getSaveWorthyFields(watchedAll)) !== saveWorthyHash;

    const selectedSourceIds = useMemo(() => {
        return (watchedSources || [])
            .map((s) => s?.funding_source_id)
            .filter((id) => id !== "" && id !== undefined);
    }, [watchedSources]);

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && isDirty) {
            setShowCloseConfirm(true);
            return;
        }
        onOpenChange(newOpen);
    };

    const cleanupNewSources = async () => {
        if (!isEdit || !canEditFunding || !entry) return;

        const toDelete = [...new Set([...removedNewSourceIds.current])];

        if (toDelete.length === 0) return;

        await Promise.all(
            toDelete.map((id) =>
                fetch(`/aip-entries/${entry.id}/ppa-funding-sources/${id}`, {
                    method: "DELETE",
                    headers: {
                        "X-CSRF-TOKEN":
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute("content") || "",
                        "Content-Type": "application/json",
                    },
                }).catch(() => {}),
            ),
        );
    };

    const handleConfirmClose = async () => {
        await cleanupNewSources();
        setShowCloseConfirm(false);
        onOpenChange(false);
        router.reload({ preserveScroll: true });
    };

    const handleCancelClose = () => {
        setShowCloseConfirm(false);
    };

    const cleanupAndClose = async () => {
        await cleanupNewSources();
        onOpenChange(false);
        router.reload({ preserveScroll: true });
    };

    function handleRemoveSource(index: number) {
        const source = watchedSources?.[index];
        if (source?.id) {
            setRemoveSourceIndex(index);
        } else {
            remove(index);
        }
    }

    function confirmRemoveSource() {
        if (removeSourceIndex !== null) {
            const source = watchedSources?.[removeSourceIndex];
            if (source?.id && !baselineSourceIds.current.has(source.id)) {
                removedNewSourceIds.current.add(source.id);
            }
            remove(removeSourceIndex);
            setRemoveSourceIndex(null);
        }
    }

    const handleQuickAddPpmp = (index: number, expenseClass: "MOOE" | "CO") => {
        if (!canEdit || !canViewPpmp) return;
        setPpmpSourceIndex(index);
        setPpmpExpenseClass(expenseClass);
        setPpmpDialogOpen(true);
    };

    const handleGoToPpmp = (ppaFundingSourceId: number | undefined, choice: "MOOE" | "CO") => {
        if (!entry || !canViewPpmp) return;

        const query: Record<string, any> = {
            choice: choice,
            ppa_funding_source_id: ppaFundingSourceId,
        };

        // Forward the selected office for super admins
        if (canShowSummaryAll && selectedOfficeId) {
            query.selected_office_id = selectedOfficeId;
        }

        router.visit(
            index(
                {
                    fiscalYear: fiscalYear.id,
                    aipEntry: entry.id,
                },
                { query }, // ✅ use the built object here
            ),
        );
    };

    const handleAddFundingSource = (fs: FundingSource) => {
        // Compute PS total from position-based COA amounts when this PPA is the pool
        const rawPsTotal = isPsPool
            ? Object.values(psCoaAutoTotals)
                  .reduce((sum, val) => sum + (val ?? 0), 0)
                  .toFixed(2)
            : "0.00";

        if (!entry?.id) {
            append({
                funding_source_id: fs.id.toString(),
                ps_amount: rawPsTotal,
                mooe_amount: "0.00",
                fe_amount: "0.00",
                co_amount: "0.00",
                ccet_adaptation: "0.00",
                ccet_mitigation: "0.00",
                cc_typology_id: null,
            });
            return;
        }

        router.post(
            `/aip-entries/${entry.id}/ppa-funding-sources`,
            {
                funding_source_id: fs.id,
                ps_amount: rawPsTotal,
                mooe_amount: "0.00",
                fe_amount: "0.00",
                co_amount: "0.00",
                ccet_adaptation: "0.00",
                ccet_mitigation: "0.00",
                cc_typology_id: null,
                supplemental_aip_id: supplementalAipId,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    function onSubmit(values: FormValues) {
        const payload = {
            ...values,
            ppa_id: data?.id,
            fiscal_year_id: fiscalYear.id,
            supplemental_aip_id: supplementalAipId,
        };

        const options = {
            preserveState: true,
            preserveScroll: true,
            onStart: () => {
                setIsLoading(true);
                form.clearErrors();
            },
            onSuccess: () => {
                setSavedHash(JSON.stringify(form.getValues()));
                setSaveWorthyHash(JSON.stringify(getSaveWorthyFields(form.getValues())));
            },
            onFinish: () => setIsLoading(false),
        };

        if (isEdit && entry) {
            router.put(`/aip-entries/${entry.id}`, payload, options);
        } else {
            router.post(`/aip-entries`, payload, options);
        }
    }

    useEffect(() => {
        if (open && data) {
            const currentEntry =
                data.aip_entries?.find(
                    (e) => e.supplemental_aip_id === (supplementalAipId || null),
                ) ||
                data.aip_entries?.[0] ||
                null;

            const currentSources =
                currentEntry && currentEntry.supplemental_aip_id === (supplementalAipId || null)
                    ? currentEntry.ppa_funding_sources || []
                    : [];

            if (!baselineCaptured.current) {
                baselineSourceIds.current = new Set(
                    currentSources.filter((fs: any) => fs.id != null).map((fs: any) => fs.id),
                );
                baselineCaptured.current = true;
            }

            form.reset({
                office_id: data.office_id?.toString() || "",
                expected_output: currentEntry?.expected_output || "",
                start_date: currentEntry?.start_date || "",
                end_date: currentEntry?.end_date || "",
                ppa_funding_sources:
                    currentSources.map((fs) => ({
                        id: fs.id,
                        funding_source_id: fs.funding_source_id.toString(),
                        ps_amount: fs.ps_amount,
                        mooe_amount: fs.mooe_amount,
                        fe_amount: fs.fe_amount,
                        co_amount: fs.co_amount,
                        ccet_adaptation: fs.ccet_adaptation,
                        ccet_mitigation: fs.ccet_mitigation,
                        cc_typology_id: (fs as any).cc_typology_id ?? null,
                    })) || [],
            });
            setSavedHash(JSON.stringify(form.getValues()));
            setSaveWorthyHash(JSON.stringify(getSaveWorthyFields(form.getValues())));
        } else if (!open) {
            baselineCaptured.current = false;
            baselineSourceIds.current = new Set();
            removedNewSourceIds.current = new Set();
        }
    }, [data, open, form, supplementalAipId]);

    const handleGoToPsBreakdown = (sourceIndex: number) => {
        if (!entry) return;
        const sourceId = watchedSources?.[sourceIndex]?.id;

        const query: Record<string, any> = {};
        if (sourceId) query.ppa_funding_source_id = sourceId;
        if (canShowSummaryAll && selectedOfficeId) query.selected_office_id = selectedOfficeId;

        router.visit(
            psBreakdownIndex({ fiscalYear: fiscalYear.id, aipEntry: entry.id }, { query }),
        );
    };

    return (
        <>
            <FormDialogShell
                open={open}
                onOpenChange={handleOpenChange}
                title={isEdit ? "Edit PPA" : "Add to AIP Summary"}
                description={
                    <>
                        Manage implementation details and budget allocation for
                        <span className="mx-1 font-semibold text-foreground italic">
                            "{data?.name}"
                        </span>
                        for the Fiscal Year {fiscalYear.year}.
                    </>
                }
                isLoading={isLoading}
                formId="aip-form"
                onCancel={cleanupAndClose}
                submitDisabled={!canEdit || !hasSaveWorthyChanges}
                submitLabel={isEdit ? "Save Changes" : "Add Entry"}
                submittingLabel="Saving..."
                className="sm:max-w-[80%]"
                extraFooter={
                    <div className="flex flex-1 items-center gap-2 self-center text-left">
                        {isDirty ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                Unsaved changes
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Saved
                            </span>
                        )}
                    </div>
                }
            >
                <div className="flex min-h-0">
                    <ScrollArea className="w-full">
                        <Form {...form}>
                            <form
                                id="aip-form"
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="flex flex-1 flex-col overflow-hidden"
                            >
                                <div className="space-y-4 px-4">
                                    <div className="grid grid-cols-5 gap-6">
                                        <Field className="col-span-1">
                                            <FieldContent>
                                                <FieldLabel>AIP Reference Code</FieldLabel>

                                                <Input
                                                    value={data?.full_code}
                                                    readOnly
                                                    disabled
                                                    placeholder="AUTO-GENERATED"
                                                />
                                            </FieldContent>
                                        </Field>

                                        <Field className="col-span-2">
                                            <FieldContent>
                                                <FieldLabel>PPA Title</FieldLabel>

                                                <Input value={data?.name || ""} readOnly disabled />
                                            </FieldContent>
                                        </Field>

                                        <div className="col-span-2">
                                            <Controller
                                                name="office_id"
                                                control={form.control}
                                                render={({ field, fieldState }) => (
                                                    <Field data-invalid={fieldState.invalid}>
                                                        <FieldContent>
                                                            <FieldLabel htmlFor={field.name}>
                                                                Office
                                                            </FieldLabel>

                                                            <CommandSelect
                                                                disabled={!canEdit}
                                                                options={filteredOffices}
                                                                value={field.value}
                                                                onChange={(val) =>
                                                                    field.onChange(String(val))
                                                                }
                                                                showClear={false}
                                                                placeholder="Select implementing office..."
                                                                searchPlaceholder="Type to search..."
                                                                getOptionValue={(office) =>
                                                                    String(office.id)
                                                                }
                                                                getOptionSearchText={(office) =>
                                                                    `${office.acronym} ${office.name}`
                                                                }
                                                                renderTrigger={(office) => (
                                                                    <span className="truncate">
                                                                        {office.name}
                                                                    </span>
                                                                )}
                                                                renderOption={(office) => (
                                                                    <div className="grid w-full grid-cols-[80px_1fr] items-center gap-4 py-1 text-sm">
                                                                        <span className="font-bold text-muted-foreground uppercase">
                                                                            {office.acronym || "-"}
                                                                        </span>
                                                                        <span className="truncate">
                                                                            {office.name || "-"}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            />

                                                            <FieldError
                                                                errors={[fieldState.error]}
                                                            />
                                                        </FieldContent>
                                                    </Field>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Implementation Details */}
                                    <div className="grid grid-cols-5 gap-6">
                                        <div className="col-span-3">
                                            <Controller
                                                name="expected_output"
                                                control={form.control}
                                                render={({ field, fieldState }) => (
                                                    <Field data-invalid={fieldState.invalid}>
                                                        <FieldContent>
                                                            <FieldLabel>Expected Output</FieldLabel>

                                                            <Textarea
                                                                {...field}
                                                                className="min-h-25"
                                                                disabled={!canEdit}
                                                            />

                                                            <FieldError
                                                                errors={[fieldState.error]}
                                                            />
                                                        </FieldContent>
                                                    </Field>
                                                )}
                                            />
                                        </div>

                                        <div className="col-span-2 space-y-4">
                                            {["start_date", "end_date"].map((key) => (
                                                <Controller
                                                    key={key}
                                                    name={key as any}
                                                    control={form.control}
                                                    render={({ field }) => (
                                                        <Field>
                                                            <FieldContent>
                                                                <FieldLabel className="capitalize">
                                                                    {key.replace("_", " ")}
                                                                </FieldLabel>

                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            className="w-full justify-start text-left"
                                                                            disabled={!canEdit}
                                                                        >
                                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                                            {field.value
                                                                                ? format(
                                                                                      parseISO(
                                                                                          field.value,
                                                                                      ),
                                                                                      "PPP",
                                                                                  )
                                                                                : "Select date"}
                                                                        </Button>
                                                                    </PopoverTrigger>

                                                                    <PopoverContent className="w-auto p-0">
                                                                        <Calendar
                                                                            mode="single"
                                                                            selected={
                                                                                field.value
                                                                                    ? parseISO(
                                                                                          field.value,
                                                                                      )
                                                                                    : undefined
                                                                            }
                                                                            onSelect={(d) =>
                                                                                field.onChange(
                                                                                    d
                                                                                        ? format(
                                                                                              d,
                                                                                              "yyyy-MM-dd",
                                                                                          )
                                                                                        : "",
                                                                                )
                                                                            }
                                                                        />
                                                                    </PopoverContent>
                                                                </Popover>
                                                            </FieldContent>
                                                        </Field>
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Funding Table */}
                                    <Field>
                                        <FieldContent>
                                            <div className="flex items-end justify-between">
                                                <FieldLabel>Funding Distribution</FieldLabel>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => setPreviewOpen(true)}
                                                >
                                                    <FileText className="mr-1 h-4 w-4" />
                                                    Preview LBP Form No. 2
                                                </Button>
                                            </div>
                                            <div className="rounded-md border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-45">
                                                                Funding Source
                                                            </TableHead>
                                                            <TableHead className="text-right">
                                                                PS
                                                            </TableHead>
                                                            <TableHead className="pr-9 text-right">
                                                                MOOE
                                                            </TableHead>
                                                            <TableHead className="text-right">
                                                                FE
                                                            </TableHead>
                                                            <TableHead className="pr-9 text-right">
                                                                CO
                                                            </TableHead>
                                                            <TableHead className="text-right">
                                                                Total
                                                            </TableHead>
                                                            <TableHead className="w-0 text-right">
                                                                Adaptation
                                                            </TableHead>
                                                            <TableHead className="w-0 text-right">
                                                                Mitigation
                                                            </TableHead>
                                                            <TableHead className="w-0 text-left">
                                                                CC Typology Code
                                                            </TableHead>
                                                            <TableHead className="w-0"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>

                                                    <TableBody>
                                                        {fields.length === 0 ? (
                                                            <TableRow>
                                                                <TableCell
                                                                    colSpan={10} // Matches number of columns: Funding Source, PS, MOOE, FE, CO, Total, Adaptation, Mitigation, CC Typology Code, Actions
                                                                    className="h-13 text-center text-muted-foreground"
                                                                >
                                                                    No funding sources added yet.
                                                                    Click "Add Fund Source" to
                                                                    begin.
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            fields.map((field, index) => (
                                                                <TableRow key={field.id}>
                                                                    <TableCell>
                                                                        <input
                                                                            type="hidden"
                                                                            {...form.register(
                                                                                `ppa_funding_sources.${index}.funding_source_id`,
                                                                            )}
                                                                        />
                                                                        <div className="flex h-9 w-full items-center rounded-md border border-transparent bg-muted/30 px-3 py-1 text-sm font-medium text-foreground">
                                                                            {fundingSources.find(
                                                                                (fs) =>
                                                                                    fs.id.toString() ===
                                                                                    watchedSources?.[
                                                                                        index
                                                                                    ]
                                                                                        ?.funding_source_id,
                                                                            )?.code || "---"}
                                                                        </div>
                                                                    </TableCell>

                                                                    {/* PS Amount */}
                                                                    <TableCell className="text-right">
                                                                        {parseFloat(
                                                                            String(
                                                                                watchedSources?.[
                                                                                    index
                                                                                ]?.ps_amount || "0",
                                                                            ),
                                                                        ).toLocaleString(
                                                                            undefined,
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                                maximumFractionDigits: 2,
                                                                            },
                                                                        )}
                                                                    </TableCell>

                                                                    {/* MOOE Amount with Button */}
                                                                    <TableCell className="text-right">
                                                                        <div className="flex items-center justify-end gap-1">
                                                                            <span>
                                                                                {parseFloat(
                                                                                    String(
                                                                                        watchedSources?.[
                                                                                            index
                                                                                        ]
                                                                                            ?.mooe_amount ||
                                                                                            "0",
                                                                                    ),
                                                                                ).toLocaleString(
                                                                                    undefined,
                                                                                    {
                                                                                        minimumFractionDigits: 2,
                                                                                        maximumFractionDigits: 2,
                                                                                    },
                                                                                )}
                                                                            </span>
                                                                            <Button
                                                                                type="button"
                                                                                size="icon"
                                                                                variant="ghost"
                                                                                className="h-6 w-6"
                                                                                onClick={() =>
                                                                                    handleQuickAddPpmp(
                                                                                        index,
                                                                                        "MOOE",
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    !canEdit ||
                                                                                    !canViewPpmp ||
                                                                                    !watchedSources?.[
                                                                                        index
                                                                                    ]
                                                                                        ?.funding_source_id ||
                                                                                    !watchedSources?.[
                                                                                        index
                                                                                    ]?.id
                                                                                }
                                                                            >
                                                                                <ListPlus className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    </TableCell>

                                                                    {/* FE Amount */}
                                                                    <TableCell className="text-right">
                                                                        {parseFloat(
                                                                            String(
                                                                                watchedSources?.[
                                                                                    index
                                                                                ]?.fe_amount || "0",
                                                                            ),
                                                                        ).toLocaleString(
                                                                            undefined,
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                                maximumFractionDigits: 2,
                                                                            },
                                                                        )}
                                                                    </TableCell>

                                                                    {/* CO Amount with Button */}
                                                                    <TableCell className="text-right">
                                                                        <div className="flex items-center justify-end gap-1">
                                                                            <span>
                                                                                {parseFloat(
                                                                                    String(
                                                                                        watchedSources?.[
                                                                                            index
                                                                                        ]
                                                                                            ?.co_amount ||
                                                                                            "0",
                                                                                    ),
                                                                                ).toLocaleString(
                                                                                    undefined,
                                                                                    {
                                                                                        minimumFractionDigits: 2,
                                                                                        maximumFractionDigits: 2,
                                                                                    },
                                                                                )}
                                                                            </span>
                                                                            <Button
                                                                                type="button"
                                                                                size="icon"
                                                                                variant="ghost"
                                                                                className="h-6 w-6"
                                                                                onClick={() =>
                                                                                    handleQuickAddPpmp(
                                                                                        index,
                                                                                        "CO",
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    !canEdit ||
                                                                                    !canViewPpmp ||
                                                                                    !watchedSources?.[
                                                                                        index
                                                                                    ]
                                                                                        ?.funding_source_id ||
                                                                                    !watchedSources?.[
                                                                                        index
                                                                                    ]?.id
                                                                                }
                                                                            >
                                                                                <ListPlus className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    </TableCell>

                                                                    {/* Total */}
                                                                    <TableCell className="text-right font-bold">
                                                                        {calculateRowTotal(
                                                                            watchedSources?.[
                                                                                index
                                                                            ] || {},
                                                                        ).toLocaleString(
                                                                            undefined,
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                                maximumFractionDigits: 2,
                                                                            },
                                                                        )}
                                                                    </TableCell>

                                                                    {[
                                                                        "ccet_adaptation",
                                                                        "ccet_mitigation",
                                                                    ].map((amt) => (
                                                                        <TableCell
                                                                            key={amt}
                                                                            className="text-right"
                                                                        >
                                                                            <Controller
                                                                                control={
                                                                                    form.control
                                                                                }
                                                                                name={
                                                                                    `ppa_funding_sources.${index}.${amt}` as any
                                                                                }
                                                                                render={({
                                                                                    field,
                                                                                }) => (
                                                                                    <Input
                                                                                        type="number"
                                                                                        step="0.01"
                                                                                        className="h-8 w-28 text-right"
                                                                                        value={
                                                                                            field.value as string
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            field.onChange(
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            )
                                                                                        }
                                                                                        disabled={
                                                                                            !canEditFunding
                                                                                        }
                                                                                    />
                                                                                )}
                                                                            />
                                                                        </TableCell>
                                                                    ))}

                                                                    <TableCell className="text-left">
                                                                        <Controller
                                                                            control={form.control}
                                                                            name={
                                                                                `ppa_funding_sources.${index}.cc_typology_id` as any
                                                                            }
                                                                            render={({ field }) => (
                                                                                <CommandSelect<{
                                                                                    id: number;
                                                                                    code: string;
                                                                                    description: string;
                                                                                    strategic_priority_id: number;
                                                                                    sub_sector_id:
                                                                                        | number
                                                                                        | null;
                                                                                    strategic_priority?: {
                                                                                        id: number;
                                                                                        code: number;
                                                                                        name: string;
                                                                                    };
                                                                                    sub_sector?: {
                                                                                        id: number;
                                                                                        code: number;
                                                                                        name: string;
                                                                                    } | null;
                                                                                }>
                                                                                    value={
                                                                                        field.value as
                                                                                            | number
                                                                                            | null
                                                                                    }
                                                                                    onChange={(
                                                                                        val,
                                                                                    ) =>
                                                                                        field.onChange(
                                                                                            val,
                                                                                        )
                                                                                    }
                                                                                    options={
                                                                                        ccTypologies ||
                                                                                        []
                                                                                    }
                                                                                    getOptionValue={(
                                                                                        t,
                                                                                    ) => t.id}
                                                                                    getOptionSearchText={(
                                                                                        t,
                                                                                    ) =>
                                                                                        `${t.strategic_priority?.name ?? ""} ${t.strategic_priority?.code ?? ""} ${t.sub_sector?.name ?? ""} ${t.sub_sector?.code ?? ""} ${t.code} ${t.description}`
                                                                                    }
                                                                                    renderTrigger={(
                                                                                        t,
                                                                                    ) => (
                                                                                        <span className="truncate">
                                                                                            {t.code}
                                                                                        </span>
                                                                                    )}
                                                                                    renderOption={(
                                                                                        t,
                                                                                    ) => (
                                                                                        <div className="grid w-full grid-cols-12 gap-2 text-sm">
                                                                                            <span className="col-span-2 font-medium whitespace-normal text-foreground">
                                                                                                {t
                                                                                                    .strategic_priority
                                                                                                    ?.code ??
                                                                                                    "-"}
                                                                                                .{" "}
                                                                                                {t
                                                                                                    .strategic_priority
                                                                                                    ?.name ??
                                                                                                    "-"}
                                                                                            </span>
                                                                                            <span className="col-span-2 whitespace-normal text-muted-foreground">
                                                                                                {t.sub_sector
                                                                                                    ? `${t.sub_sector.code}. ${t.sub_sector.name}`
                                                                                                    : "—"}
                                                                                            </span>
                                                                                            <span className="col-span-2 font-medium whitespace-normal">
                                                                                                {
                                                                                                    t.code
                                                                                                }
                                                                                            </span>
                                                                                            <span className="col-span-6 whitespace-normal text-muted-foreground">
                                                                                                {
                                                                                                    t.description
                                                                                                }
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                    placeholder="Typology..."
                                                                                    searchPlaceholder="Search typology..."
                                                                                    heading="CC Typologies"
                                                                                    dialogClassName="sm:max-w-[900px]"
                                                                                    showClear={
                                                                                        false
                                                                                    }
                                                                                    disabled={
                                                                                        !canEditFunding
                                                                                    }
                                                                                />
                                                                            )}
                                                                        />
                                                                    </TableCell>

                                                                    <TableCell>
                                                                        <div className="flex gap-1">
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger
                                                                                    asChild
                                                                                >
                                                                                    <Button
                                                                                        variant="outline"
                                                                                        size="icon"
                                                                                        title="Manage PPMP Items"
                                                                                        disabled={
                                                                                            !canViewPpmp ||
                                                                                            !watchedSources?.[
                                                                                                index
                                                                                            ]
                                                                                                ?.funding_source_id ||
                                                                                            !watchedSources?.[
                                                                                                index
                                                                                            ]?.id
                                                                                        }
                                                                                    >
                                                                                        <ListPlus />
                                                                                    </Button>
                                                                                </DropdownMenuTrigger>

                                                                                <DropdownMenuContent
                                                                                    align="end"
                                                                                    className="w-auto min-w-max"
                                                                                >
                                                                                    <DropdownMenuLabel className="whitespace-nowrap">
                                                                                        Project
                                                                                        Procurement
                                                                                    </DropdownMenuLabel>

                                                                                    <DropdownMenuSeparator />

                                                                                    <DropdownMenuItem
                                                                                        onClick={() =>
                                                                                            handleGoToPpmp(
                                                                                                watchedSources[
                                                                                                    index
                                                                                                ]
                                                                                                    .id,
                                                                                                "MOOE",
                                                                                            )
                                                                                        }
                                                                                        className="whitespace-nowrap"
                                                                                    >
                                                                                        Manage MOOE
                                                                                    </DropdownMenuItem>

                                                                                    <DropdownMenuItem
                                                                                        onClick={() =>
                                                                                            handleGoToPpmp(
                                                                                                watchedSources[
                                                                                                    index
                                                                                                ]
                                                                                                    .id,
                                                                                                "CO",
                                                                                            )
                                                                                        }
                                                                                        className="whitespace-nowrap"
                                                                                    >
                                                                                        Manage
                                                                                        Capital
                                                                                        Outlay
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>

                                                                            <Button
                                                                                type="button"
                                                                                size="icon"
                                                                                variant="outline"
                                                                                title={
                                                                                    !canViewPsBreakdown
                                                                                        ? "You don't have permission to view PS Breakdown"
                                                                                        : "PS Breakdown"
                                                                                }
                                                                                disabled={
                                                                                    !canViewPsBreakdown ||
                                                                                    !watchedSources?.[
                                                                                        index
                                                                                    ]?.id ||
                                                                                    !isPsPool
                                                                                }
                                                                                onClick={() =>
                                                                                    handleGoToPsBreakdown(
                                                                                        index,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <FileText />
                                                                            </Button>

                                                                            <Button
                                                                                type="button"
                                                                                size="icon"
                                                                                variant="destructive"
                                                                                onClick={() =>
                                                                                    handleRemoveSource(
                                                                                        index,
                                                                                    )
                                                                                }
                                                                                title="Remove Funding Source"
                                                                                disabled={
                                                                                    !canEditFunding
                                                                                }
                                                                            >
                                                                                <Trash2 />
                                                                            </Button>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        )}
                                                    </TableBody>
                                                </Table>

                                                <ScrollBar orientation="horizontal" />
                                            </div>

                                            <div className="pt-1">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={!canEditFunding}
                                                            className="w-43"
                                                        >
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Add Fund Source
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-50"
                                                    >
                                                        <DropdownMenuLabel>
                                                            Select Source to Add
                                                        </DropdownMenuLabel>
                                                        <DropdownMenuSeparator />

                                                        {fundingSources.filter(
                                                            (fs) =>
                                                                !selectedSourceIds.includes(
                                                                    fs.id.toString(),
                                                                ),
                                                        ).length === 0 ? (
                                                            <div className="p-2 text-center text-sm text-muted-foreground">
                                                                All sources added
                                                            </div>
                                                        ) : (
                                                            fundingSources
                                                                .filter(
                                                                    (fs) =>
                                                                        !selectedSourceIds.includes(
                                                                            fs.id.toString(),
                                                                        ),
                                                                )
                                                                .map((fs) => (
                                                                    <DropdownMenuItem
                                                                        key={fs.id}
                                                                        className="cursor-pointer font-medium"
                                                                        onClick={() =>
                                                                            handleAddFundingSource(
                                                                                fs,
                                                                            )
                                                                        }
                                                                    >
                                                                        {fs.code}
                                                                    </DropdownMenuItem>
                                                                ))
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </FieldContent>
                                    </Field>
                                </div>
                            </form>
                        </Form>
                    </ScrollArea>
                </div>
            </FormDialogShell>

            {ppmpDialogOpen && watchedSources?.[ppmpSourceIndex] && (
                <PpmpFormDialog
                    open={ppmpDialogOpen}
                    onOpenChange={setPpmpDialogOpen}
                    chartOfAccounts={chartOfAccounts}
                    priceLists={priceLists}
                    ppmpCategories={ppmpCategories}
                    selectedEntry={null}
                    fundingSources={fundingSources}
                    selectedExpenseClass={ppmpExpenseClass}
                    selectedFundingSourceId={parseInt(
                        watchedSources[ppmpSourceIndex]?.funding_source_id,
                    )}
                    ppaFundingSourceId={watchedSources[ppmpSourceIndex]?.id}
                    mode="quick-add"
                    onItemAdded={onPpmpItemAdded}
                    existingPpmps={(() => {
                        if (!data) return undefined;
                        const fsId = watchedSources[ppmpSourceIndex]?.id;
                        if (!fsId) return undefined;
                        for (const ae of data.aip_entries ?? []) {
                            for (const fs of ae.ppa_funding_sources ?? []) {
                                if (fs.id === fsId) {
                                    return (fs as any).ppmps ?? [];
                                }
                            }
                        }
                        return undefined;
                    })()}
                />
            )}

            <Dialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Unsaved Changes</DialogTitle>

                        <DialogDescription>
                            You have unsaved changes to funding sources or other fields. Are you
                            sure you want to close? All unsaved data will be lost.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={handleCancelClose}>
                            Cancel
                        </Button>

                        <Button variant="destructive" onClick={handleConfirmClose}>
                            Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={removeSourceIndex !== null}
                onOpenChange={(open) => !open && setRemoveSourceIndex(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Funding Source?</AlertDialogTitle>

                        <AlertDialogDescription>
                            Removing this funding source will also delete all associated PPMP items.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <Button variant="outline" onClick={() => setRemoveSourceIndex(null)}>
                            Cancel
                        </Button>

                        <Button variant="destructive" onClick={confirmRemoveSource}>
                            Remove
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <PreviewPdfDialog
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                sections={sectionTotals}
            />
        </>
    );
}
