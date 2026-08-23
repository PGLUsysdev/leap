import { router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";

// Layouts & UI Components
import { AlertErrorDialog } from "@/components/alert-error-dialog";
import DataTable from "@/components/base-ui-components/data-table";
import { ScrollArea, ScrollBar } from "@/components/base-ui-components/ui/scroll-area";
import { CommandSelect } from "@/components/command-select";
// import { DataTable } from '@/components/data-table';
import { DeleteDialog } from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";

// Page-Specific Components
import PpaFormDialog from "@/pages/ppa/form-dialog";
import PpaMoveDialog from "@/pages/ppa/move-dialog";
import PpaImportDialog from "@/pages/ppa/ppa-import-dialog";

// Routes & API
import { index, reorder } from "@/routes/ppa";
import { destroy } from "@/routes/ppas";

// Types
// import { type BreadcrumbItem } from "@/types";
import type { Ppa, Office, SharedData, PaginatedResponse, Filter } from "@/types";
import columns from "./columns/columns";

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
    ppaTypes: Ppa["type"][];
    ppaTypePadding: Record<string, number>;
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
    ppaTypes = [],
    ppaTypePadding = {},
}: PpaPageProps) {
    const { data, ...paginationData } = ppaTree;

    const page = usePage<SharedData>();
    const { auth } = usePage<SharedData>().props;
    const activeFiscalYear = (page.props as any).activeFiscalYear;

    const rootType = ppaTypes[0] || "Program";

    // Form Dialog States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<"add" | "edit">("add");
    const [targetType, setTargetType] = useState<Ppa["type"]>(rootType);

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

    const nextTypeMap = useMemo(() => {
        const map: Record<string, string | null> = {};

        for (let i = 0; i < ppaTypes.length; i++) {
            map[ppaTypes[i]] = ppaTypes[i + 1] || null;
        }

        return map;
    }, [ppaTypes]);

    const getNextType = (currentType: Ppa["type"]): Ppa["type"] | null => {
        return nextTypeMap[currentType] as Ppa["type"] | null;
    };

    const nextType = current.length > 0 ? (getNextType(current[0].type) ?? rootType) : rootType;

    const canAddNext = current.length === 0 || getNextType(current[0].type) !== null;

    // Handlers
    function handleAddChild(parent: Ppa) {
        const childType = getNextType(parent.type) ?? rootType;
        setFormMode("add");
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
        setFormMode("edit");
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
                    setErrorMessage("An unexpected error occurred while deleting.");
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
                    dialog_mode: "move",
                    dialog_id: filters.id,
                    dialog_page: 1,
                },
            }),
            {
                preserveState: true,
                only: ["dialogPpaTree", "dialogCurrent", "filters"],
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
                    dialog_mode: "import",
                    dialog_page: 1,
                },
            }),
            {
                preserveState: true,
                only: ["dialogPpaTree", "dialogCurrent", "filters"],
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
                    selected_office_id: officeId?.toString() ?? "",
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

    function handleAddNew() {
        setFormMode("add");
        setEditPpa(null);

        if (current.length === 0) {
            // We are at the very top - create root type
            setTargetType(rootType);
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
                    columns={columns}
                    data={data}
                    paginationData={paginationData}
                    meta={{
                        onAdd: handleAddChild,
                        onEdit: handleEdit,
                        onDelete: handleDeleteOpen,
                        onReorder: handleReorder,
                        onMove: handleMoveOpen,
                        onShowChildren: handleShowChildren,
                        ppaTypes: ppaTypes,
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
                                        `${office.acronym ?? ""} ${office.name}`
                                    }
                                    renderTrigger={(office) => (
                                        <span className="truncate">
                                            {office.acronym || office.name}
                                        </span>
                                    )}
                                    renderOption={(office) => (
                                        <div className="grid w-full grid-cols-12 gap-2 text-sm">
                                            <span className="col-span-3 font-medium">
                                                {office.acronym ?? "-"}
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
                            <Button variant="outline" onClick={() => handleImportOpen()}>
                                Import from Last Year
                            </Button>
                        )}
                        {can?.add && canAddNext && (
                            <Button onClick={handleAddNew}>New {nextType}</Button>
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
                ppaTypePadding={ppaTypePadding}
            />

            <PpaMoveDialog
                isOpen={isMoveDialogOpen}
                onOpenChange={setIsMoveDialogOpen}
                ppaToMove={movePpa}
                dialogPpaTree={dialogPpaTree}
                dialogCurrent={dialogCurrent}
                filters={filters}
                ppaTypes={ppaTypes}
            />

            <PpaImportDialog
                isOpen={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                filters={filters}
                dialogPpaTree={dialogPpaTree}
                dialogCurrent={dialogCurrent}
                selectedOfficeId={selectedOfficeId}
                ppaTypes={ppaTypes}
            />

            <DeleteDialog
                isOpen={!!deletePpa}
                onOpenChange={(open) => !open && setDeletePpa(null)}
                title="Delete PPA?"
                description={
                    <span className="grid gap-2">
                        <span>
                            Are you sure you want to remove{" "}
                            <span className="font-bold text-foreground">"{deletePpa?.name}"</span>?
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

PpaPage.layout = (props: PpaPageProps) => {
    const items = [{ title: "PPA Master Library", href: index().url }];

    const ancestors = [...(props.current || [])].reverse();
    const ppaTypes = props.ppaTypes || [];

    const getNextType = (currentType: string): string | null => {
        const idx = ppaTypes.indexOf(currentType);
        if (idx !== -1 && idx + 1 < ppaTypes.length) {
            return ppaTypes[idx + 1];
        }
        return null;
    };

    ancestors.forEach((ppa, i) => {
        const isLast = i === ancestors.length - 1;
        const childType = getNextType(ppa.type);

        items.push({
            title: isLast && childType ? `${ppa.name}'s ${childType}s` : ppa.name,
            href: index({
                query: {
                    id: ppa.id,
                    selected_office_id: props.filters?.selected_office_id,
                },
            }).url,
        });
    });

    return { breadcrumbs: items };
};
