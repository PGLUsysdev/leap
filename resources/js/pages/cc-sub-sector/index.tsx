import { useState, useCallback } from "react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { DataTable } from "@/components/data-table";
import columns from "./columns/cc-sub-sector-cols";
import type { CcStrategicPriority, CcSubSector } from "@/types";
import { Button } from "@/components/ui/button";
import { router } from "@inertiajs/react";
import { DeleteDialog } from "@/components/delete-dialog";
import { AlertErrorDialog } from "@/components/alert-error-dialog";
import FormDialog from "./form-dialog";

const breadcrumbs: BreadcrumbItem[] = [{ title: "CC Sub Sectors", href: "#" }];

interface CcSubSectorPageProps {
    subSectors: CcSubSector[];
    strategicPriorities: CcStrategicPriority[];
    can: {
        add: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export default function CcSubSectorPage({
    subSectors,
    strategicPriorities,
    can,
}: CcSubSectorPageProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSubSector, setEditingSubSector] = useState<CcSubSector | null>(null);

    const [deletingSubSector, setDeletingSubSector] = useState<CcSubSector | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleCreate = useCallback(() => {
        setEditingSubSector(null);
        setDialogOpen(true);
    }, []);

    const handleEdit = useCallback((subSector: CcSubSector) => {
        setEditingSubSector(subSector);
        setDialogOpen(true);
    }, []);

    const handleClose = useCallback(() => {
        setDialogOpen(false);
        setEditingSubSector(null);
    }, []);

    const handleDeleteRequest = useCallback((subSector: CcSubSector) => {
        setDeletingSubSector(subSector);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deletingSubSector) return;
        setIsDeleting(true);
        router.delete(`/cc-sub-sector/${deletingSubSector.id}`, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setDeletingSubSector(null),
            onError: (errors) => {
                if (errors.message) {
                    setDeleteError(errors.message as string);
                }
            },
            onFinish: () => setIsDeleting(false),
        });
    }, [deletingSubSector]);

    const handleDeleteCancel = useCallback(() => {
        setDeletingSubSector(null);
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="pt-4">
                <DataTable
                    columns={columns}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                    data={subSectors}
                    withSearch
                    negativeHeight={7}
                    meta={{ can }}
                >
                    {can?.add && <Button onClick={handleCreate}>Create CC Sub Sector</Button>}
                </DataTable>
            </div>

            <FormDialog
                open={dialogOpen}
                setOpen={handleClose}
                initialData={editingSubSector}
                strategicPriorities={strategicPriorities}
            />

            <AlertErrorDialog
                open={!!deleteError}
                onOpenChange={() => setDeleteError(null)}
                error={deleteError}
            />

            <DeleteDialog
                isOpen={!!deletingSubSector}
                onOpenChange={(open) => !open && setDeletingSubSector(null)}
                title="Delete CC Sub Sector"
                description={
                    deletingSubSector ? (
                        <>
                            Are you sure you want to delete{" "}
                            <strong>{deletingSubSector.name}</strong>? This action cannot be undone.
                        </>
                    ) : null
                }
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
