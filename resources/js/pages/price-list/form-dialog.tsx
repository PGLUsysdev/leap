import { useState, useEffect } from "react";
import { Field, FieldError, FieldLabel, FieldContent } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { ChartOfAccount, PpmpCategory, PriceList } from "@/types";
import { router } from "@inertiajs/react";
import { AlertErrorDialog } from "@/components/alert-error-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormDialogShell } from "@/components/form-dialog-shell";
import { CommandSelect } from "@/components/command-select";

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    chartOfAccounts: ChartOfAccount[];
    ppmpCategories: PpmpCategory[];
    selectedPriceList: PriceList | null;
}

const formSchema = z.object({
    expenseAccount: z.number().refine((val) => val !== undefined && val !== null && val !== 0, {
        message: "Expense account is required",
    }),
    category: z.number().refine((val) => val !== undefined && val !== null && val !== 0, {
        message: "Category is required",
    }),
    description: z.string().min(1, "Description is required."),
    unitOfMeasurement: z.string().min(1, "Unit of measurement is required."),
    price: z.string().min(1, "Price is required."),
});

export default function FormDialog({
    open,
    onOpenChange,
    chartOfAccounts,
    ppmpCategories,
    selectedPriceList,
}: FormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            expenseAccount: undefined as number | undefined,
            category: undefined as number | undefined,
            description: "",
            unitOfMeasurement: "",
            price: "",
        },
    });

    useEffect(() => {
        if (selectedPriceList) {
            form.reset({
                expenseAccount:
                    selectedPriceList.chart_of_account_ppmp_category?.chart_of_account_id,
                category: selectedPriceList.chart_of_account_ppmp_category?.ppmp_category_id,
                description: selectedPriceList.description,
                unitOfMeasurement: selectedPriceList.unit_of_measurement,
                price: selectedPriceList.price,
            });
        } else {
            form.reset({
                expenseAccount: undefined,
                category: undefined,
                description: "",
                unitOfMeasurement: "",
                price: "",
            });
        }
    }, [selectedPriceList, form]);

    function onSubmit(data: z.infer<typeof formSchema>) {
        if (selectedPriceList) {
            router.patch(`/price-lists/${selectedPriceList.id}`, data, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => onOpenChange(false),
                onError: (errors) => {
                    const errorMessage =
                        Object.values(errors).join(", ") || "An unknown error occurred";
                    console.error("Patch Validation Errors:", errors);
                    setError(errorMessage);
                    setIsErrorDialogOpen(true);
                },
                onFinish: () => setIsLoading(false),
            });
        } else {
            router.post("/price-lists", data, {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => onOpenChange(false),
                onError: (errors) => {
                    const errorMessage =
                        Object.values(errors).join(", ") || "An unknown error occurred";
                    console.error("Post Validation Errors:", errors);
                    setError(errorMessage);
                    setIsErrorDialogOpen(true);
                },
                onFinish: () => setIsLoading(false),
            });
        }
    }

    const { watch } = form;
    const selectedExpenseAccount = watch("expenseAccount");
    const selectedCategory = watch("category");

    const selectedCategoryData = ppmpCategories.find((cat) => cat.id === selectedCategory);

    const categoryExpenseAccountIds =
        selectedCategoryData?.chart_of_account_ppmp_categories
            ?.map((cac) => cac.chart_of_account?.id)
            .filter((id): id is number => id != null) || [];

    const filteredExpenseAccounts = selectedCategory
        ? chartOfAccounts.filter((coa) => categoryExpenseAccountIds.includes(coa.id))
        : chartOfAccounts;

    // const filteredCategories = selectedExpenseAccount
    //     ? ppmpCategories.filter((pc) => {
    //           return pc.chart_of_accounts?.some(
    //               (coa: any) => coa.id === selectedExpenseAccount,
    //           );
    //       })
    //     : ppmpCategories;
    const filteredCategories = selectedExpenseAccount
        ? ppmpCategories.filter((pc) => {
              return pc.chart_of_account_ppmp_categories?.some(
                  (cac) => cac.chart_of_account?.id === selectedExpenseAccount,
              );
          })
        : ppmpCategories;

    function handleReset() {
        form.reset({
            expenseAccount: undefined,
            category: undefined,
            description: "",
            unitOfMeasurement: "",
            price: "",
        });
    }

    useEffect(() => {
        if (!open) {
            form.reset({
                expenseAccount: undefined,
                category: undefined,
                description: "",
                unitOfMeasurement: "",
                price: "",
            });
        }
    }, [open, form]);

    return (
        <>
            <FormDialogShell
                open={open}
                onOpenChange={onOpenChange}
                title={selectedPriceList ? "Edit PPMP Item" : "Add PPMP Item"}
                description={
                    selectedPriceList
                        ? "Editing the item in the PPMP list"
                        : "Add a new item to the PPMP list"
                }
                isLoading={isLoading}
                formId="form-rhf-demo"
                onReset={handleReset}
                onCancel={() => onOpenChange(false)}
                submitLabel={selectedPriceList ? "Save Changes" : "Add Item"}
                submittingLabel={selectedPriceList ? "Saving Changes" : "Adding Item"}
            >
                <div className="flex min-h-0">
                    <ScrollArea className="w-full">
                        <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Controller
                                    name="expenseAccount"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            className="md:col-span-2"
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name}>
                                                    Expense Account
                                                </FieldLabel>

                                                <CommandSelect
                                                    value={field.value ?? null}
                                                    onChange={(val) =>
                                                        field.onChange(val ?? undefined)
                                                    }
                                                    options={filteredExpenseAccounts}
                                                    getOptionValue={(acc) => acc.id}
                                                    getOptionSearchText={(acc) =>
                                                        `${acc.account_number} ${acc.account_title}`
                                                    }
                                                    placeholder="Select expense account"
                                                    searchPlaceholder="Search account number or title..."
                                                    heading="Chart of Accounts"
                                                    showClear={false}
                                                    renderTrigger={(acc) => (
                                                        <span className="truncate">
                                                            <code className="mr-2 rounded bg-muted p-0.5 text-xs">
                                                                {acc.account_number}
                                                            </code>
                                                            {acc.account_title}
                                                        </span>
                                                    )}
                                                    renderOption={(acc) => (
                                                        <div>
                                                            <code className="mr-2 rounded bg-muted p-1 text-xs">
                                                                {acc.account_number}
                                                            </code>
                                                            {acc.account_title}
                                                        </div>
                                                    )}
                                                />

                                                {fieldState.invalid && (
                                                    <FieldError errors={[fieldState.error]} />
                                                )}
                                            </FieldContent>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    name="category"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            className="md:col-span-2"
                                            data-invalid={fieldState.invalid}
                                        >
                                            <FieldContent>
                                                <FieldLabel htmlFor="category-select">
                                                    Category
                                                </FieldLabel>

                                                <>
                                                    <CommandSelect
                                                        value={field.value ?? null}
                                                        onChange={(val) =>
                                                            field.onChange(val ?? undefined)
                                                        }
                                                        options={filteredCategories}
                                                        getOptionValue={(cat) => cat.id}
                                                        getOptionSearchText={(cat) => cat.name}
                                                        placeholder="Select category"
                                                        searchPlaceholder="Search category..."
                                                        heading="Categories"
                                                        showClear={false}
                                                        renderTrigger={(cat) => (
                                                            <span className="truncate">
                                                                {cat.name}
                                                            </span>
                                                        )}
                                                        renderOption={(cat) => cat.name}
                                                    />

                                                    {fieldState.invalid && (
                                                        <FieldError errors={[fieldState.error]} />
                                                    )}
                                                </>
                                            </FieldContent>
                                        </Field>
                                    )}
                                />

                                <div className="md:col-span-2">
                                    <Controller
                                        name="description"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldContent>
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                        className="gap-1"
                                                    >
                                                        Procurement Item
                                                    </FieldLabel>
                                                    <InputGroup>
                                                        <InputGroupTextarea
                                                            {...field}
                                                            id={field.name}
                                                            placeholder="Enter item description"
                                                            rows={3}
                                                            className="min-h-24 resize-none"
                                                            aria-invalid={fieldState.invalid}
                                                        />
                                                    </InputGroup>
                                                    {fieldState.invalid && (
                                                        <FieldError errors={[fieldState.error]} />
                                                    )}
                                                </FieldContent>
                                            </Field>
                                        )}
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <Controller
                                        name="unitOfMeasurement"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldContent>
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                        className="gap-1"
                                                    >
                                                        Unit of Measurement
                                                    </FieldLabel>
                                                    <Input
                                                        {...field}
                                                        id={field.name}
                                                        aria-invalid={fieldState.invalid}
                                                        placeholder="Enter unit of measurement"
                                                        autoComplete="off"
                                                    />
                                                    {fieldState.invalid && (
                                                        <FieldError errors={[fieldState.error]} />
                                                    )}
                                                </FieldContent>
                                            </Field>
                                        )}
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <Controller
                                        name="price"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldContent>
                                                    <FieldLabel
                                                        htmlFor={field.name}
                                                        className="gap-1"
                                                    >
                                                        Price
                                                    </FieldLabel>
                                                    <Input
                                                        {...field}
                                                        id={field.name}
                                                        type="number"
                                                        step="0.01"
                                                        aria-invalid={fieldState.invalid}
                                                        placeholder="0.00"
                                                        autoComplete="off"
                                                    />
                                                    {fieldState.invalid && (
                                                        <FieldError errors={[fieldState.error]} />
                                                    )}
                                                </FieldContent>
                                            </Field>
                                        )}
                                    />
                                </div>
                            </div>
                        </form>
                    </ScrollArea>
                </div>
            </FormDialogShell>

            <AlertErrorDialog
                open={isErrorDialogOpen}
                onOpenChange={setIsErrorDialogOpen}
                error={error}
            />
        </>
    );
}
