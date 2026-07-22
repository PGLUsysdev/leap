import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';

// Layouts & UI Components
import { AlertErrorDialog } from '@/components/alert-error-dialog';
import DataTable from '@/components/base-ui-components/data-table';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
import { CommandSelect } from '@/components/command-select';
// import { DataTable } from '@/components/data-table';
import { DeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';

// Page-Specific Components
import PpaFormDialog from '@/pages/ppa/form-dialog';
import PpaMoveDialog from '@/pages/ppa/move-dialog';
import PpaImportDialog from '@/pages/ppa/ppa-import-dialog';

// Routes & API
import { index, reorder } from '@/routes/ppa';
import { destroy } from '@/routes/ppas';

// Types
// import { type BreadcrumbItem } from "@/types";
import type {
    Ppa,
    Office,
    SharedData,
    PaginatedResponse,
    Filter,
} from '@/types';
import columns from './columns/columns';

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
    const { data, ...paginationData } = ppaTree;

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
        if (!deletePpa) {
            return;
        }

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
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <DataTable
                    columns={columns(data)}
                    data={data}
                    paginationData={paginationData}
                    meta={{
                        onAdd: handleAddChild,
                        onEdit: handleEdit,
                        onDelete: handleDeleteOpen,
                        onReorder: handleReorder,
                        onMove: handleMoveOpen,
                        onShowChildren: handleShowChildren,
                    }}
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

                <ScrollBar orientation="vertical" />
            </ScrollArea>

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
        </>
    );
}

// PpaPage.layout = {
//     breadcrumbs: [
//         // shows all programs
//         {
//             title: 'PPA Master Library',
//             href: index().url,
//         },

//         // shows all project of selected program
//         {
//             title: "[program name]'s Projects",
//             href: index().url, // put in id of program
//         },

//         // shows all activities of selected project
//         {
//             title: "[activity name]'s Activities",
//             href: index().url, // put in id of project
//         },

//         // shows all subactivities of selected activity
//         {
//             title: "[activity name]'s Subactivities",
//             href: index().url, // put in id of activity
//         },
//     ],
// };

PpaPage.layout = (props: PpaPageProps) => {
    // current = [currentPpa, parent, grandparent, ...] (deepest first)
    // reversed = [grandparent, parent, currentPpa] (root first)
    const ancestors = [...props.current].reverse();

    return {
        breadcrumbs: [
            // Root — shows all programs
            { title: 'PPA Master Library', href: index().url },

            // Program level — shows all projects of selected program
            ...(ancestors[0]
                ? [
                      {
                          title: `${ancestors[0].name}'s Projects`,
                          href: index({
                              query: {
                                  id: ancestors[0].id,
                                  selected_office_id:
                                      props.filters?.selected_office_id,
                              },
                          }).url,
                      },
                  ]
                : []),

            // Project level — shows all activities of selected project
            ...(ancestors[1]
                ? [
                      {
                          title: `${ancestors[1].name}'s Activities`,
                          href: index({
                              query: {
                                  id: ancestors[1].id,
                                  selected_office_id:
                                      props.filters?.selected_office_id,
                              },
                          }).url,
                      },
                  ]
                : []),

            // Activity level — shows all subactivities of selected activity
            ...(ancestors[2]
                ? [
                      {
                          title: `${ancestors[2].name}'s Subactivities`,
                          href: index({
                              query: {
                                  id: ancestors[2].id,
                                  selected_office_id:
                                      props.filters?.selected_office_id,
                              },
                          }).url,
                      },
                  ]
                : []),
        ],
    };
};

// example: /ppa?id=1&page=1

// PpaPage.layout = (props: PpaPageProps) => {
//     const items: BreadcrumbItem[] = [
//         { title: 'PPA Master Library', href: index().url },
//     ];

//     // props.current = [current, parent, grandparent, root] — deepest first
//     const ancestors = [...props.current].reverse(); // root → ... → current

//     ancestors.forEach((ppa, i) => {
//         const childType = NEXT_TYPE_MAP[ppa.type]; // Program→Project, Project→Activity, etc.
//         const isLast = i === ancestors.length - 1;

//         items.push({
//             title: isLast ? `${ppa.name}'s ${childType}s` : ppa.name,
//             href: index({
//                 query: {
//                     id: ppa.id,
//                     selected_office_id: props.filters?.selected_office_id,
//                 },
//             }).url,
//         });
//     });

//     return { breadcrumbs: items };
// };
