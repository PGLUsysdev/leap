import { useState } from 'react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type {
    Ppa,
    Office,
    SharedData,
    PaginatedResponse,
} from '@/types/global';
import PpaFormDialog from '@/pages/ppa/form-dialog';
import PpaMoveDialog from '@/pages/ppa/move-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { router, usePage } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import columns from './table/columns';
import { index } from '@/routes/ppa';

const NEXT_TYPE_MAP: Record<Ppa['type'], Ppa['type']> = {
    Program: 'Project',
    Project: 'Activity',
    Activity: 'Sub-Activity',
    'Sub-Activity': 'Sub-Activity', // Should never be used as button will be hidden
};

export default function PpaPage({
    ppaTree,
    offices,
    current,
    filters,
}: {
    ppaTree: PaginatedResponse<Ppa>;
    offices: Office[];
    current: Ppa | null;
    filters: { search?: string; id?: string | number };
}) {
    console.log(ppaTree);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'PPA Master Library',
            href: null,
        },
        {
            title: 'All Programs',
            href: current ? index().url : null,
        },
        {
            title: current
                ? (current.ancestor?.ancestor?.name ??
                      current.ancestor?.name ??
                      current.name) + ' Projects'
                : null,
            href: current?.ancestor
                ? index({
                      query: {
                          id:
                              current.ancestor.ancestor?.id ??
                              current.ancestor.id,
                      },
                  }).url
                : null,
        },
        {
            title: current
                ? (current.type === 'Project'
                      ? current.name
                      : (current.ancestor?.name ?? current.name)) +
                  ' Activities'
                : null,
            href: current?.ancestor
                ? index({ query: { id: current.ancestor?.id } }).url
                : null,
        },
        {
            title: current
                ? current.type === 'Activity'
                    ? current.name + ' Subactivities'
                    : null
                : null,
            href: null,
        },
    ].filter((_, index) => {
        if (index === 0) return true;
        if (index === 1) return true;
        if (index === 2 && current) return true;
        if (index === 3 && current?.ancestor) return true;
        if (index === 4 && current?.ancestor?.ancestor) return true;

        return false;
    });

    const { auth } = usePage<SharedData>().props;

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

    // Move Dialog States
    const [movePpa, setMovePpa] = useState<Ppa | null>(null);
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

    // Handlers
    function handleAddChild(parent: Ppa, childType: Ppa['type']) {
        setFormMode('add');
        setTargetType(childType);
        setParentPpa(parent);
        setEditPpa(null);
        setIsFormOpen(true);
    }

    function handleDialogOpenChange(isOpen: boolean) {
        setIsFormOpen(isOpen);
        if (!isOpen) {
            setParentPpa(null);
            setEditPpa(null);
        }
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
            preserveState: false,
            preserveScroll: true,
            onStart: () => setIsDeleting(true),
            onSuccess: () => setDeletePpa(null),
            onFinish: () => setIsDeleting(false),
        });
    }

    function handleReorder(activeId: string, overId: string) {
        router.post(
            '/ppas/reorder',
            {
                active_id: activeId,
                over_id: overId,
            },
            {
                preserveState: false,
                preserveScroll: true,
            },
        );
    }

    function handleMoveOpen(ppa: Ppa) {
        setMovePpa(ppa);
        setIsMoveDialogOpen(true);
    }

    function handleShowChildren(ppa: Ppa) {
        const url = 'ppa';
        const data = { id: ppa.id };
        const options = {};

        router.get(url, data, options);
    }

    const nextType = current ? NEXT_TYPE_MAP[current.type] : 'Program';

    function handleAddNew() {
        setFormMode('add');
        setEditPpa(null);

        if (!current) {
            // We are at the very top - create root Program
            setTargetType('Program');
            setParentPpa(null);
        } else {
            // We are viewing children of current - create child of next type under current
            setTargetType(nextType);
            setParentPpa(current);
        }

        setIsFormOpen(true);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col gap-4 p-4">
                <DataTable
                    columns={columns}
                    data={ppaTree.data}
                    withSearch={true}
                    onAdd={handleAddChild}
                    onEdit={handleEdit}
                    onDelete={handleDeleteOpen}
                    onReorder={handleReorder}
                    onMove={handleMoveOpen}
                    onShowChildren={handleShowChildren}
                    paginationObj={ppaTree}
                    negativeHeight={11}
                    filters={filters}
                >
                    <div className="flex items-center gap-2">
                        {current?.type !== 'Sub-Activity' && (
                            <Button onClick={handleAddNew}>
                                New {nextType}
                            </Button>
                        )}
                    </div>
                </DataTable>
            </div>

            <PpaFormDialog
                isOpen={isFormOpen}
                onOpenChange={handleDialogOpenChange}
                mode={formMode}
                targetType={targetType}
                parentPpa={parentPpa}
                editPpa={editPpa}
                offices={offices}
                auth={auth}
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

            <PpaMoveDialog
                isOpen={isMoveDialogOpen}
                onOpenChange={setIsMoveDialogOpen}
                ppaToMove={movePpa}
                ppaTree={ppaTree.data || []}
            />
        </AppLayout>
    );
}
