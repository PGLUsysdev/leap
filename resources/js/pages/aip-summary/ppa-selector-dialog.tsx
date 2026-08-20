import { router } from '@inertiajs/react';
import { ChevronRight, Home, Info } from 'lucide-react';
import { useState, useMemo } from 'react';
import DataTable from '@/components/base-ui-components/data-table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/base-ui-components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { Ppa, PaginatedResponse, Filter } from '@/types';
import columns from './columns/import-columns';

interface PpaSelectorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dialogPpaTree?: PaginatedResponse<Ppa>;
    dialogCurrent?: Ppa[];
    fiscalYearId: number;
    existingPpaIds: number[];
    filters: Filter;
    supplementalAipId?: number | null;
    ppaTypes: string[];
}

export default function PpaSelectorDialog({
    open,
    onOpenChange,
    dialogPpaTree,
    dialogCurrent = [],
    filters,
    fiscalYearId,
    existingPpaIds = [],
    supplementalAipId = null,
    ppaTypes,
}: PpaSelectorDialogProps) {
    const [selectedItems, setSelectedItems] = useState<Map<number, Ppa>>(
        new Map(),
    );
    const [loading, setLoading] = useState(false);

    const existingIdsSet = useMemo(
        () => new Set(existingPpaIds),
        [existingPpaIds],
    );

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setSelectedItems(new Map());
        }

        onOpenChange(isOpen);
    };

    const handleToggle = (ppa: Ppa) => {
        setSelectedItems((prev) => {
            const next = new Map(prev);

            if (next.has(ppa.id)) {
                // --- DOWNWARD UNSELECT (Recursive) ---
                const idsToRemove = new Set<number>([ppa.id]);
                const findDescendants = (parentId: number) => {
                    next.forEach((item, id) => {
                        if (item.parent_id === parentId) {
                            idsToRemove.add(id);
                            findDescendants(id);
                        }
                    });
                };
                findDescendants(ppa.id);
                idsToRemove.forEach((id) => next.delete(id));
            } else {
                // --- UPWARD SELECT (Recursive) ---
                next.set(ppa.id, ppa);

                if (dialogCurrent && dialogCurrent.length > 0) {
                    dialogCurrent.forEach((ancestor) => {
                        if (!existingIdsSet.has(ancestor.id)) {
                            next.set(ancestor.id, ancestor);
                        }
                    });
                }
            }

            return next;
        });
    };

    const handleToggleAll = (ppas: Ppa[], isChecked: boolean) => {
        setSelectedItems((prev) => {
            const next = new Map(prev);
            ppas.forEach((ppa) => {
                if (isChecked) {
                    next.set(ppa.id, ppa);

                    // Add ancestors for each
                    if (dialogCurrent) {
                        dialogCurrent.forEach((anc) => {
                            if (!existingIdsSet.has(anc.id)) {
                                next.set(anc.id, anc);
                            }
                        });
                    }
                } else {
                    // Downward unselect recursion
                    const idsToRemove = new Set<number>([ppa.id]);
                    const findDescendants = (parentId: number) => {
                        next.forEach((item, id) => {
                            if (item.parent_id === parentId) {
                                idsToRemove.add(id);
                                findDescendants(id);
                            }
                        });
                    };
                    findDescendants(ppa.id);
                    idsToRemove.forEach((id) => next.delete(id));
                }
            });

            return next;
        });
    };

    const handleNavigate = (id: number | null) => {
        router.get(
            window.location.pathname,
            {
                ...filters,
                dialog_id: id,
                dialog_page: 1,
                dialog_boundary_id: filters.dialog_boundary_id,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['dialogPpaTree', 'dialogCurrent', 'filters'],
            },
        );
    };

    const handleImport = () => {
        const ids = Array.from(selectedItems.keys());
        router.post(
            `/aip/${fiscalYearId}/import`,
            {
                ppa_ids: ids,
                supplemental_aip_id: supplementalAipId,
            },
            {
                onStart: () => setLoading(true),
                onSuccess: () => {
                    setSelectedItems(new Map());
                    handleOpenChange(false);
                },
                onFinish: () => setLoading(false),
            },
        );
    };

    const paginationData = useMemo(() => {
        if (!dialogPpaTree || Array.isArray(dialogPpaTree)) {
            return undefined;
        }

        const { data, ...rest } = dialogPpaTree;

        return rest;
    }, [dialogPpaTree]);

    const displayData = useMemo(() => {
        if (Array.isArray(dialogPpaTree) || !dialogPpaTree) {
            return [];
        }

        return dialogPpaTree.data.map((ppa) => ({
            ...ppa,
            _isSelected: selectedItems.has(ppa.id),
            _isAdded: existingIdsSet.has(ppa.id),
        }));
    }, [dialogPpaTree, selectedItems, existingIdsSet]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[95vh] flex-col gap-0 p-0 py-4 sm:max-w-[85%] [&>*:not(:nth-last-child(-n+3))]:pb-4">
                <div className="px-4">
                    <DialogHeader>
                        <DialogTitle>Library Navigator</DialogTitle>
                        <DialogDescription className="sr-only">
                            Select items to import. Selections are preserved
                            across folders.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* breadcrumbs */}
                <div className="px-4">
                    <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2 text-sm">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2 ${filters.dialog_boundary_id ? 'cursor-not-allowed opacity-50' : ''}`}
                            onClick={() => handleNavigate(null)}
                            disabled={!!filters.dialog_boundary_id}
                        >
                            <Home className="mr-1 h-4 w-4" /> Root
                        </Button>

                        {dialogCurrent.map((item) => {
                            const boundaryId = Number(
                                filters.dialog_boundary_id,
                            );
                            const isAncestor =
                                boundaryId &&
                                item.id !== boundaryId &&
                                dialogCurrent.findIndex(
                                    (i) => i.id === boundaryId,
                                ) >
                                    dialogCurrent.findIndex(
                                        (i) => i.id === item.id,
                                    );

                            return (
                                <div
                                    key={item.id}
                                    className="flex min-w-0 items-center gap-2"
                                >
                                    <ChevronRight className="h-4 w-4 opacity-30" />

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`block h-7 flex-1 truncate px-2 ${isAncestor ? 'cursor-not-allowed opacity-50' : ''}`}
                                        onClick={() => handleNavigate(item.id)}
                                        disabled={
                                            !!isAncestor ||
                                            item.id.toString() ===
                                                filters.dialog_id
                                        }
                                    >
                                        {item.name}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {!Array.isArray(dialogPpaTree) && (
                    <DataTable
                        key={`lib-table-${filters?.dialog_id}`}
                        columns={columns}
                        data={displayData}
                        paginationData={paginationData}
                        searchParamName="dialog_search"
                        pageParamName="dialog_page"
                        only={['dialogPpaTree', 'dialogCurrent', 'filters']}
                        meta={{
                            selectedIds: new Set(selectedItems.keys()),
                            existingIds: existingIdsSet,
                            onToggle: handleToggle,
                            onNavigate: handleNavigate,
                            onToggleAll: handleToggleAll,
                            ppaTypes: ppaTypes,
                        }}
                        className="h-1000"
                    />
                )}

                <div className="px-4">
                    <DialogFooter>
                        <div className="flex w-full justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Info className="h-4 w-4" />
                                {selectedItems.size} items selected
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => handleOpenChange(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    onClick={handleImport}
                                    disabled={
                                        loading || selectedItems.size === 0
                                    }
                                >
                                    {loading && <Spinner />}
                                    Import Selected
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
