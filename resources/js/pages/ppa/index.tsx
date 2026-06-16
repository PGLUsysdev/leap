import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';

// Layouts & UI Components
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { DeleteDialog } from '@/components/delete-dialog';
import { AlertErrorDialog } from '@/components/alert-error-dialog';
import { CommandSelect } from '@/components/command-select';

// Page-Specific Components
import PpaFormDialog from '@/pages/ppa/form-dialog';
import PpaMoveDialog from '@/pages/ppa/move-dialog';
import PpaImportDialog from '@/pages/ppa/ppa-import-dialog';
import columns from './columns/columns';

// Routes & API
import { index, reorder } from '@/routes/ppa';
import { destroy } from '@/routes/ppas';

// Types
import { type BreadcrumbItem } from '@/types';
import type {
    Ppa,
    Office,
    SharedData,
    PaginatedResponse,
    Filter,
} from '@/types/global';

const NEXT_TYPE_MAP: Record<Ppa['type'], Ppa['type']> = {
    Program: 'Project',
    Project: 'Activity',
    Activity: 'Sub-Activity',
    'Sub-Activity': 'Sub-Activity',
};

interface PpaPageProps {
    offices: Office[];
    ppaTree: PaginatedResponse<Ppa>;
    current: Ppa[];
    filters: Filter;
    dialogPpaTree: PaginatedResponse<Ppa>;
    dialogCurrent: Ppa[];
    can?: {
        add: boolean;
        import: boolean;
    };
    showAllOffices?: boolean;
    selectedOfficeId?: number;
    parentOffices?: Office[];
}

export default function PpaPage({
    offices,
    ppaTree,
    current,
    filters,
    dialogPpaTree,
    dialogCurrent,
    can,
    showAllOffices,
    selectedOfficeId,
    parentOffices,
}: PpaPageProps) {
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

    // breadcrumbs
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

        router.visit(destroy(deletePpa.id), {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsDeleting(true),
            onSuccess: () => {
                setDeletePpa(null);
                setErrorMessage(null);
            },
            onError: (errors) => {
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
        router.visit(
            reorder({
                query: {
                    active_id: activeId,
                    over_id: overId,
                },
            }),
            {
                preserveState: false,
                preserveScroll: true,
            },
        );
    }

    function handleMoveOpen(ppa: Ppa) {
        router.visit(
            index({
                query: {
                    ...filters,
                    dialog_mode: 'move',
                    dialog_id: filters.id,
                    dialog_page: 1,
                },
            }),
            {
                preserveState: true,
                only: ['dialogPpaTree', 'dialogCurrent', 'filters'],
                onSuccess: () => {
                    setMovePpa(ppa);
                    setIsMoveDialogOpen(true);
                },
            },
        );
    }

    function handleImportOpen() {
        router.visit(
            index({
                query: {
                    ...filters,
                    dialog_mode: 'import',
                    dialog_page: 1,
                },
            }),
            {
                preserveState: true,
                only: ['dialogPpaTree', 'dialogCurrent', 'filters'],
                onSuccess: () => {
                    setIsImportDialogOpen(true);
                },
            },
        );
    }

    function handleOfficeChange(officeId: string | number | null) {
        router.visit(
            index({
                query: {
                    selected_office_id: officeId?.toString() ?? '',
                },
            }),
            {},
        );
    }

    function handleShowChildren(ppa: Ppa) {
        router.visit(
            index({
                query: {
                    id: ppa.id,
                    selected_office_id: filters.selected_office_id,
                },
            }),
            {},
        );
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
            <div className="pt-4">
                <DataTable
                    columns={columns(ppaTree.data)}
                    data={ppaTree.data}
                    withSearch={true}
                    onAdd={handleAddChild}
                    onEdit={handleEdit}
                    onDelete={handleDeleteOpen}
                    onReorder={handleReorder}
                    onMove={handleMoveOpen}
                    onShowChildren={handleShowChildren}
                    paginationObj={ppaTree}
                    negativeHeight={10.7}
                    filters={filters}
                    onlyKeys={['ppaTree', 'filters', 'current']}
                    searchKey="search"
                    pageKey="page"
                >
                    <div className="flex items-center gap-2">
                        {showAllOffices && parentOffices && (
                            <div className="w-[220px]">
                                <CommandSelect<Office>
                                    value={selectedOfficeId ?? null}
                                    onChange={handleOfficeChange}
                                    options={parentOffices}
                                    getOptionValue={(office) => office.id}
                                    getOptionSearchText={(office) =>
                                        `${office.acronym ?? ''} ${office.name}`
                                    }
                                    renderTrigger={(office) => (
                                        <span className="truncate">
                                            {office.acronym || office.name}
                                        </span>
                                    )}
                                    renderOption={(office) => (
                                        <div className="grid w-full grid-cols-12 gap-2 text-sm">
                                            <span className="col-span-3 font-medium">
                                                {office.acronym ?? '-'}
                                            </span>
                                            <span className="col-span-9 whitespace-normal text-muted-foreground">
                                                {office.name}
                                            </span>
                                        </div>
                                    )}
                                    placeholder="Select LGU Office..."
                                    searchPlaceholder="Search office..."
                                    heading="Parent Offices"
                                    showClear={false}
                                />
                            </div>
                        )}

                        {can?.import && (
                            <Button
                                variant="outline"
                                onClick={() => handleImportOpen()}
                            >
                                Import from Last Year
                            </Button>
                        )}
                        {can?.add &&
                            (current.length === 0 ||
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
                selectedOfficeId={selectedOfficeId}
            />

            <PpaMoveDialog
                isOpen={isMoveDialogOpen}
                onOpenChange={setIsMoveDialogOpen}
                ppaToMove={movePpa}
                dialogPpaTree={dialogPpaTree}
                dialogCurrent={dialogCurrent}
                filters={filters}
            />

            <PpaImportDialog
                isOpen={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                filters={filters}
                dialogPpaTree={dialogPpaTree}
                dialogCurrent={dialogCurrent}
                onClose={() => setIsImportDialogOpen(false)}
                selectedOfficeId={selectedOfficeId}
            />

            <DeleteDialog
                isOpen={!!deletePpa}
                onOpenChange={(open) => !open && setDeletePpa(null)}
                title="Delete PPA?"
                description={
                    <span className="grid gap-2">
                        {/* Fixed: span is valid inside <p> */}
                        <span>
                            Are you sure you want to remove{' '}
                            <span className="font-bold text-foreground">
                                "{deletePpa?.name}"
                            </span>
                            ?
                        </span>
                        <span className="text-destructive">
                            This will also delete all Sub-PPAs.
                        </span>
                    </span>
                }
                onConfirm={handleDelete}
                onCancel={() => setDeletePpa(null)}
                isLoading={isDeleting}
            />

            <AlertErrorDialog
                open={isErrorOpen}
                onOpenChange={setIsErrorOpen}
                error={errorMessage}
            />
        </AppLayout>
    );
}
