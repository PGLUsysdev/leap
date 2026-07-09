import { router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import { DataTable } from '@/components/data-table';
import { DeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import type { CcTypology, CcStrategicPriority, CcSubSector } from '@/types';
import createColumns from './columns/cc-typology-cols';
import FormDialog from './form-dialog';

interface CcTypologyPageProps {
    ccTypologies: CcTypology[];
    strategicPriorities: CcStrategicPriority[];
    subSectors: CcSubSector[];
    can: {
        add: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export default function CcTypologyPage({
    ccTypologies,
    strategicPriorities,
    subSectors,
    can,
}: CcTypologyPageProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTypology, setEditingTypology] = useState<CcTypology | null>(
        null,
    );

    const [deletingTypology, setDeletingTypology] = useState<CcTypology | null>(
        null,
    );
    const [isDeleting, setIsDeleting] = useState(false);

    const handleCreate = useCallback(() => {
        setEditingTypology(null);
        setDialogOpen(true);
    }, []);

    const handleEdit = useCallback((typology: CcTypology) => {
        setEditingTypology(typology);
        setDialogOpen(true);
    }, []);

    const handleDelete = useCallback((typology: CcTypology) => {
        setDeletingTypology(typology);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deletingTypology) return;
        setIsDeleting(true);
        router.delete(`/cc-typology/${deletingTypology.id}`, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setDeletingTypology(null),
            onFinish: () => setIsDeleting(false),
        });
    }, [deletingTypology]);

    const handleDeleteCancel = useCallback(() => {
        setDeletingTypology(null);
    }, []);

    const handleClose = useCallback(() => {
        setDialogOpen(false);
        setEditingTypology(null);
    }, []);

    const columns = createColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        can,
    });

    return (
        <>
            <div className="pt-4">
                <DataTable
                    columns={columns}
                    data={ccTypologies}
                    withSearch
                    negativeHeight={7}
                >
                    {can?.add && (
                        <Button onClick={handleCreate}>
                            Create CC Typology
                        </Button>
                    )}
                </DataTable>
            </div>

            <FormDialog
                open={dialogOpen}
                setOpen={handleClose}
                initialData={editingTypology}
                strategicPriorities={strategicPriorities}
                subSectors={subSectors}
            />

            <DeleteDialog
                isOpen={!!deletingTypology}
                onOpenChange={(open) => !open && setDeletingTypology(null)}
                title="Delete CC Typology"
                description={
                    deletingTypology ? (
                        <>
                            Are you sure you want to delete{' '}
                            <strong>{deletingTypology.code}</strong>? This
                            action cannot be undone.
                        </>
                    ) : null
                }
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                isLoading={isDeleting}
            />
        </>
    );
}

CcTypologyPage.layout = {
    breadcrumbs: [{ title: 'CC Typology', href: '#' }],
};
