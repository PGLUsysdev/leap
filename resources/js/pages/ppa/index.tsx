import { useState } from 'react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { Ppa, Office } from '@/types/global';
import PpaTablePage from '@/pages/ppa/ppa-masterlist-table/page';
import PpaFormDialog from '@/pages/ppa/form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { router } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'PPA Master Library', href: '#' },
];

export default function PpaPage({
    ppaTree,
    offices,
}: {
    ppaTree: Ppa[];
    offices: Office[];
}) {
    // Form Dialog States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
    const [targetType, setTargetType] = useState<Ppa['type']>('Program');

    // Explicitly separated states for "Parent" (Add) and "Self" (Edit)
    const [parentPpa, setParentPpa] = useState<Ppa | null>(null);
    const [editPpa, setEditPpa] = useState<Ppa | null>(null);

    // Delete Dialog States
    const [deletePpa, setDeletePpa] = useState<Ppa | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handlers
    function handleAddRoot() {
        setFormMode('add');
        setTargetType('Program');
        setParentPpa(null);
        setEditPpa(null);
        setIsFormOpen(true);
    }

    function handleAddChild(parent: Ppa, childType: Ppa['type']) {
        setFormMode('add');
        setTargetType(childType);
        setParentPpa(parent);
        setEditPpa(null);
        setIsFormOpen(true);
    }

    function handleEdit(item: Ppa) {
        setFormMode('edit');
        setTargetType(item.type);
        setEditPpa(item);
        setParentPpa(null);
        setIsFormOpen(true);
    }

    function handleDeleteOpen(item: Ppa) {
        setDeletePpa(item);
    }

    function handleDelete() {
        if (!deletePpa) return;

        router.delete(`/ppas/${deletePpa.id}`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsDeleting(true),
            onSuccess: () => setDeletePpa(null),
            onFinish: () => setIsDeleting(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col gap-4 p-4">
                <PpaTablePage
                    data={ppaTree}
                    onAdd={handleAddChild}
                    onEdit={handleEdit}
                    onDelete={handleDeleteOpen}
                >
                    <Button onClick={handleAddRoot}>New Program</Button>
                </PpaTablePage>
            </div>

            <PpaFormDialog
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                mode={formMode}
                targetType={targetType}
                parentPpa={parentPpa}
                editPpa={editPpa}
                offices={offices}
            />

            <DeleteDialog
                isOpen={!!deletePpa}
                onOpenChange={(open) => !open && setDeletePpa(null)}
                title="Delete PPA?"
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <span className="font-bold text-foreground">
                            "{deletePpa?.name}"
                        </span>
                        ?
                    </>
                }
                onConfirm={handleDelete}
                onCancel={() => setDeletePpa(null)}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
