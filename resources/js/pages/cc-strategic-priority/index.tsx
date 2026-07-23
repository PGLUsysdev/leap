import { router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import { AlertErrorDialog } from '@/components/alert-error-dialog';
import DataTable from '@/components/base-ui-components/data-table';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
import { DeleteDialog } from '@/components/delete-dialog';
import type { CcStrategicPriority } from '@/types';
import columns from './columns/cc-strategic-priority-cols';
import FormDialog from './form-dialog-base';

interface CcStrategicPriorityPageProps {
    strategicPriorities: CcStrategicPriority[];
    can: {
        add: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export default function CcStrategicPriorityPage({
    strategicPriorities,
    can,
}: CcStrategicPriorityPageProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPriority, setEditingPriority] =
        useState<CcStrategicPriority | null>(null);

    const [deletingPriority, setDeletingPriority] =
        useState<CcStrategicPriority | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleCreate = useCallback(() => {
        setEditingPriority(null);
        setDialogOpen(true);
    }, []);

    const handleEdit = useCallback((priority: CcStrategicPriority) => {
        setEditingPriority(priority);
        setDialogOpen(true);
    }, []);

    const handleClose = useCallback(() => {
        setDialogOpen(false);
        setEditingPriority(null);
    }, []);

    const handleDeleteRequest = useCallback((priority: CcStrategicPriority) => {
        setDeletingPriority(priority);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deletingPriority) {
return;
}

        setIsDeleting(true);
        router.delete(`/cc-strategic-priority/${deletingPriority.id}`, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => setDeletingPriority(null),
            onError: (errors) => {
                if (errors.message) {
                    setDeleteError(errors.message as string);
                }
            },
            onFinish: () => setIsDeleting(false),
        });
    }, [deletingPriority]);

    const handleDeleteCancel = useCallback(() => {
        setDeletingPriority(null);
    }, []);

    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <DataTable
                    columns={columns}
                    data={strategicPriorities}
                    meta={{
                        onEdit: handleEdit,
                        onDelete: handleDeleteRequest,
                        can,
                    }}
                >
                    {can?.add && (
                        <Button onClick={handleCreate}>
                            Create CC Strategic Priority
                        </Button>
                    )}
                </DataTable>

                <ScrollBar orientation="vertical" />
            </ScrollArea>

            <FormDialog
                open={dialogOpen}
                onOpenChange={handleClose}
                initialData={editingPriority}
            />

            <AlertErrorDialog
                open={!!deleteError}
                onOpenChange={() => setDeleteError(null)}
                error={deleteError}
            />

            <DeleteDialog
                isOpen={!!deletingPriority}
                onOpenChange={(open) => !open && setDeletingPriority(null)}
                title="Delete CC Strategic Priority"
                description={
                    deletingPriority ? (
                        <>
                            Are you sure you want to delete{' '}
                            <strong>{deletingPriority.name}</strong>? This
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

CcStrategicPriorityPage.layout = {
    breadcrumbs: [{ title: 'CC Strategic Priorities', href: '#' }],
};
