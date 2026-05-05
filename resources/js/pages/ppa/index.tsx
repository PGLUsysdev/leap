import { useState } from 'react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type {
    Ppa,
    Office,
    SharedData,
    PaginatedResponse,
    Filter,
} from '@/types/global';
import PpaFormDialog from '@/pages/ppa/form-dialog';
import PpaMoveDialog from '@/pages/ppa/move-dialog';
import PpaImportDialog from '@/pages/ppa/ppa-import-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { router, usePage } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import columns from './table/columns';
import { index } from '@/routes/ppa';
import { AlertErrorDialog } from '@/components/alert-error-dialog';

const NEXT_TYPE_MAP: Record<Ppa['type'], Ppa['type']> = {
    Program: 'Project',
    Project: 'Activity',
    Activity: 'Sub-Activity',
    'Sub-Activity': 'Sub-Activity', // Should never be used as button will be hidden
};

interface PpaPageProps {
    ppaTree: PaginatedResponse<Ppa>;
    offices: Office[];
    current: Ppa[];
    filters: Filter;
    movePpaTree: PaginatedResponse<Ppa>;
    moveCurrent: Ppa[];
}

export default function PpaPage({
    ppaTree,
    offices,
    current,
    filters,
    movePpaTree,
    moveCurrent,
}: PpaPageProps) {
    console.log(ppaTree);
    // console.log(movePpaTree);
    // console.log(moveCurrent);
    // console.log(current);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'PPA Master Library',
            href: index().url,
        },
    ];

    const dynamicItems =
        current?.toReversed().map((item) => ({
            title: item.name,
            href: index({
                query: {
                    id: item.id,
                },
            }).url,
        })) || [];

    const finalBreadcrumbs = [...breadcrumbs, ...dynamicItems];

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

    // Import Dialog States
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

    const [isErrorOpen, setIsErrorOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
            preserveState: true, // Changed to true so we can see the error dialog
            preserveScroll: true,
            onStart: () => setIsDeleting(true),
            onSuccess: () => {
                setDeletePpa(null);
                setErrorMessage(null);
            },
            onError: (errors) => {
                // Check if the backend sent an 'error' key
                if (errors.error) {
                    setErrorMessage(errors.error);
                    setIsErrorOpen(true);
                } else {
                    setErrorMessage(
                        'An unexpected error occurred while deleting.',
                    );
                    setIsErrorOpen(true);
                }
            },
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
        const currentBackgroundId = filters.id;

        // router.reload({
        //     only: ['movePpaTree', 'moveCurrent'],
        //     onSuccess: () => {
        //         setMovePpa(ppa);
        //         setIsMoveDialogOpen(true);
        //     },
        // });

        router.get(
            'ppa',
            {
                ...filters, // Preserve background search/page
                move_id: currentBackgroundId, // Default modal to the current background folder
                move_page: 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['movePpaTree', 'moveCurrent'], // Lazy load modal data
                onSuccess: () => {
                    setMovePpa(ppa); // The item we are moving
                    setIsMoveDialogOpen(true); // Open the modal
                },
            },
        );
    }

    function handleShowChildren(ppa: Ppa) {
        const url = 'ppa';
        const data = { id: ppa.id };
        const options = {};

        router.get(url, data, options);
    }

    const nextType =
        current.length > 0 ? NEXT_TYPE_MAP[current[0].type] : 'Program';

    function handleAddNew() {
        setFormMode('add');
        setEditPpa(null);

        if (current.length === 0) {
            // We are at the very top - create root Program
            setTargetType('Program');
            setParentPpa(null);
        } else {
            // We are viewing children of current - create child of next type under current
            setTargetType(nextType);
            setParentPpa(current[0]);
        }

        setIsFormOpen(true);
    }

    return (
        <AppLayout breadcrumbs={finalBreadcrumbs}>
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
                    onlyKeys={['ppaTree', 'filters', 'current']}
                    searchKey="search"
                    pageKey="page"
                >
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsImportDialogOpen(true)}
                        >
                            Import from Last Year
                        </Button>
                        {(current.length === 0 ||
                            current[0].type !== 'Sub-Activity') && (
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
                movePpaTree={movePpaTree}
                moveCurrent={moveCurrent}
                filters={filters}
            />

            <AlertErrorDialog
                open={isErrorOpen}
                onOpenChange={setIsErrorOpen}
                error={errorMessage}
            />

            <PpaImportDialog
                isOpen={isImportDialogOpen}
                onClose={() => setIsImportDialogOpen(false)}
                existingPpaIds={[]} // TODO: Get existing PPA IDs from backend
            />
        </AppLayout>
    );
}
