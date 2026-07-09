import { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import type { PpmpCategory, ChartOfAccount } from "@/types";
import { Button } from "@/components/ui/button";
import FormDialog from "@/pages/ppmp-category/form-dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { router } from "@inertiajs/react";
import { DataTable } from "@/components/data-table";
import columns from "./columns/columns";

const breadcrumbs: BreadcrumbItem[] = [{ title: "PPMP Category", href: "#" }];

interface PpmpCategoryPageProps {
    ppmpCategories: PpmpCategory[];
    chartOfAccounts: ChartOfAccount[];
    can?: {
        add: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export default function PpmpCategoryPage({
    ppmpCategories,
    chartOfAccounts,
    can,
}: PpmpCategoryPageProps) {
    console.log(chartOfAccounts);
    console.log(ppmpCategories);

    const categoriesWithAccounts = ppmpCategories.map((category) => ({
        ...category,
        chart_of_accounts:
            category.chart_of_account_ppmp_categories
                ?.map((pivot) =>
                    chartOfAccounts.find((coa) => coa.id === pivot.chart_of_account_id),
                )
                .filter((coa): coa is ChartOfAccount => coa !== undefined) || [],
    }));

    console.log(categoriesWithAccounts);

    // ---

    const [open, setOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<PpmpCategory | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isForceDeleteDialogOpen, setIsForceDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    function handleAdd() {
        setSelectedCategory(null);
        setOpen(true);
    }

    function handleDialogOpenChange(isOpen: boolean) {
        setOpen(isOpen);
        if (!isOpen) setSelectedCategory(null);
    }

    function handleEdit(category: PpmpCategory) {
        console.log(category);

        setSelectedCategory(category);
        setOpen(true);
    }

    function handleDeleteDialogOpen(category: PpmpCategory) {
        setSelectedCategory(category);
        setIsDeleteDialogOpen(true);
    }

    function handleDelete() {
        router.delete(`/ppmp-categories/${selectedCategory?.id}`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setSelectedCategory(null);
            },
            onError: (errors) => {
                if (errors.force_delete) {
                    setIsDeleteDialogOpen(false);
                    setIsForceDeleteDialogOpen(true);
                }
            },
            onFinish: () => setIsLoading(false),
        });
    }

    function handleForceDelete() {
        router.delete(`/ppmp-categories/${selectedCategory?.id}?force=1`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setIsForceDeleteDialogOpen(false);
                setSelectedCategory(null);
            },
            onFinish: () => setIsLoading(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="pt-4">
                <DataTable
                    columns={columns(can?.edit ?? false, can?.delete ?? false)}
                    data={categoriesWithAccounts}
                    withSearch={true}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                    negativeHeight={7}
                >
                    {can?.add && (
                        <div className="flex justify-end">
                            <Button onClick={handleAdd}>Add PPMP Category</Button>
                        </div>
                    )}
                </DataTable>
            </div>

            <FormDialog
                open={open}
                setOpen={handleDialogOpenChange}
                initialData={selectedCategory}
                chartOfAccounts={chartOfAccounts}
            />

            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete PPMP Category?"
                description={
                    <>
                        Are you sure you want to remove{" "}
                        <span className="font-bold text-foreground">
                            "{selectedCategory?.name}"
                        </span>
                        ?
                    </>
                }
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedCategory(null);
                }}
                isLoading={isLoading}
            />

            <DeleteDialog
                isOpen={isForceDeleteDialogOpen}
                onOpenChange={setIsForceDeleteDialogOpen}
                title="Delete PPMP Category?"
                description={
                    <>
                        This category has dependent PPMP price list items. Continuing will delete
                        all price list items associated with this category. This action cannot be
                        undone.
                    </>
                }
                confirmText="Continue"
                onConfirm={handleForceDelete}
                onCancel={() => {
                    setIsForceDeleteDialogOpen(false);
                    setSelectedCategory(null);
                }}
                isLoading={isLoading}
            />
        </AppLayout>
    );
}
