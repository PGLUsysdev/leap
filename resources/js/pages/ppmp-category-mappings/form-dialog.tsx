import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { TableSelect } from "@/components/base-ui-components/table-select";
import { Button } from "@/components/base-ui-components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/base-ui-components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/base-ui-components/ui/field";
import type { ChartOfAccount, PpmpCategory } from "@/types";
import categoryCols from "./columns/category-cols";
import coaCols from "../ppmp-category/columns/coa-cols";

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: PpmpCategory[];
    chartOfAccounts: ChartOfAccount[];
}

const formSchema = z.object({
    ppmp_category_id: z.number({ message: "Category is required" }),
    chart_of_account_id: z.number({ message: "Chart of Account is required" }),
});

export default function FormDialog({ open, onOpenChange, categories, chartOfAccounts }: FormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [openCategorySelect, setOpenCategorySelect] = useState(false);
    const [openCoaSelect, setOpenCoaSelect] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            ppmp_category_id: undefined as unknown as number,
            chart_of_account_id: undefined as unknown as number,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                ppmp_category_id: undefined as unknown as number,
                chart_of_account_id: undefined as unknown as number,
            });
        }
    }, [open, form]);

    function onSubmit(data: z.infer<typeof formSchema>) {
        router.post("/ppmp-category-mappings", data, {
            preserveScroll: true,
            preserveState: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => onOpenChange(false),
            onFinish: () => setIsLoading(false),
        });
    }

    const selectedCategory = categories.find((c) => c.id === form.watch("ppmp_category_id"));
    const selectedCoa = chartOfAccounts.find((c) => c.id === form.watch("chart_of_account_id"));

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-2xl">
                    <DialogHeader className="flex-none">
                        <DialogTitle>Add Category–COA Mapping</DialogTitle>
                        <DialogDescription>
                            Link a PPMP Category to a Chart of Account. Each pair must be unique.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        id="mapping-form"
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="flex flex-col gap-4 py-2"
                    >
                        <Controller
                            name="ppmp_category_id"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Category *</FieldLabel>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setOpenCategorySelect(true)}
                                        className="w-full justify-between"
                                        aria-invalid={fieldState.invalid}
                                    >
                                        <span className="truncate">
                                            {selectedCategory ? selectedCategory.name : "Select category"}
                                        </span>
                                        <span className="text-muted-foreground">↕</span>
                                    </Button>
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />

                        <Controller
                            name="chart_of_account_id"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Chart of Account *</FieldLabel>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setOpenCoaSelect(true)}
                                        className="w-full justify-between"
                                        aria-invalid={fieldState.invalid}
                                    >
                                        <span className="truncate">
                                            {selectedCoa
                                                ? `${selectedCoa.path} — ${selectedCoa.account_title}`
                                                : "Select chart of account"}
                                        </span>
                                        <span className="text-muted-foreground">↕</span>
                                    </Button>
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                    </form>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" form="mapping-form" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Mapping"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <TableSelect
                columns={categoryCols}
                data={categories}
                open={openCategorySelect}
                onOpenChange={setOpenCategorySelect}
                onRowSelect={(row) => {
                    form.setValue("ppmp_category_id", row.id, { shouldValidate: true, shouldDirty: true });
                    setOpenCategorySelect(false);
                }}
                title="Select Category"
                description="Choose a PPMP category to link."
                className="sm:max-w-2xl"
            />

            <TableSelect
                columns={coaCols}
                data={chartOfAccounts}
                open={openCoaSelect}
                onOpenChange={setOpenCoaSelect}
                onRowSelect={(row) => {
                    form.setValue("chart_of_account_id", row.id, { shouldValidate: true, shouldDirty: true });
                    setOpenCoaSelect(false);
                }}
                title="Select Chart of Account"
                description="Choose a chart of account (MOOE/CO) to link."
                className="sm:max-w-3xl"
            />
        </>
    );
}
