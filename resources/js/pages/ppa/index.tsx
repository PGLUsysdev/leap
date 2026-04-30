import { useState, useMemo } from 'react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { Ppa, Office, SharedData } from '@/types/global';
import PpaFormDialog from '@/pages/ppa/form-dialog';
import PpaMoveDialog from '@/pages/ppa/move-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { router, usePage } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import columns from './table/columns';
import { index } from '@/routes/ppa';
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from '@/components/ui/select';

const LEVEL_MAP = {
    program: 0,
    project: 1,
    activity: 2,
    'sub-activity': 3,
    all: 3,
};

const filterTreeByLevel = (
    data: Ppa[],
    maxLevel: number,
    currentLevel: number = 0,
): Ppa[] => {
    if (!Array.isArray(data)) return [];
    if (currentLevel > maxLevel) return [];

    return data.map((item) => ({
        ...item,
        children: item.children
            ? filterTreeByLevel(item.children, maxLevel, currentLevel + 1)
            : [],
    }));
};

export default function PpaPage({
    ppaTree,
    offices,
    current,
    filters,
}: {
    ppaTree: { data: Ppa[]; [key: string]: any };
    offices: Office[];
    current: Ppa | null;
    filters: { search?: string; id?: string | number };
}) {
    console.log(ppaTree);
    // console.log(offices);
    console.log(current);

    const breadcrumbs = [
        {
            title: 'PPA Master Library',
            href: null,
        },
        {
            title: 'Programs',
            href: current ? index().url : null,
        },
        {
            title: 'Projects',
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
            title: 'Activities',
            href: current?.ancestor
                ? index({ query: { id: current.ancestor?.id } }).url
                : null,
        },
        {
            title: 'Subactivities',
            href: null,
        },
    ].filter((item) => {
        if (item.title === 'PPA Master Library') return true;
        if (item.title === 'Programs') return true;
        if (item.title === 'Projects' && current) return true;
        if (item.title === 'Activities' && current?.ancestor) return true;
        if (item.title === 'Subactivities' && current?.ancestor?.ancestor)
            return true;

        return false;
    });

    console.log(breadcrumbs);

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

    // View Level Filter State
    const [viewLevel, setViewLevel] = useState<string>('all');

    // Filter tree based on view level
    const filteredPpaTree = useMemo(() => {
        const level = LEVEL_MAP[viewLevel as keyof typeof LEVEL_MAP];
        return filterTreeByLevel(ppaTree.data || [], level);
    }, [ppaTree, viewLevel]);

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

    console.log(ppaTree.data);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col gap-4 p-4">
                <DataTable
                    columns={columns}
                    // data={filteredPpaTree}
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
                        {/* <Select value={viewLevel} onValueChange={setViewLevel}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="View Level" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="program">
                                    Only Programs
                                </SelectItem>

                                <SelectItem value="project">
                                    With Projects
                                </SelectItem>

                                <SelectItem value="activity">
                                    With Activities
                                </SelectItem>

                                <SelectItem value="sub-activity">
                                    Full Hierarchy
                                </SelectItem>

                                <SelectItem value="all">Show All</SelectItem>
                            </SelectContent>
                        </Select> */}

                        <Button onClick={handleAddRoot}>New Program</Button>
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
