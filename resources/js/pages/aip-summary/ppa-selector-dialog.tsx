import { useState, useMemo, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { ChevronRight, Home, Info } from 'lucide-react';
import columns from './columns/import-columns';
import type { Ppa, PaginatedResponse, Filter } from '@/types/global';

interface PpaSelectorDialogProps {
    isOpen: boolean;
    onClose: () => void;
    dialogPpaTree: PaginatedResponse<Ppa> | [];
    dialogCurrent: Ppa[];
    fiscalYearId: number;
    existingPpaIds: number[];
    filters: Filter;
}

export default function PpaSelectorDialog({
    isOpen,
    onClose,
    dialogPpaTree,
    dialogCurrent = [],
    filters,
    fiscalYearId,
    existingPpaIds = [],
}: PpaSelectorDialogProps) {
    const [selectedItems, setSelectedItems] = useState<Map<number, Ppa>>(
        new Map(),
    );
    const [loading, setLoading] = useState(false);

    const existingIdsSet = useMemo(
        () => new Set(existingPpaIds),
        [existingPpaIds],
    );

    useEffect(() => {
        // Only run cleanup when the dialog is CLOSED
        if (!isOpen) {
            setSelectedItems(new Map()); // Reset local selection

            const {
                dialog_id,
                dialog_page,
                dialog_search,
                dialog_boundary_id,
                ...mainFilters
            } = filters;

            // Navigate back to the clean URL
            router.visit(window.location.pathname, {
                data: mainFilters,
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }
    }, [isOpen]);

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
                            if (!existingIdsSet.has(anc.id))
                                next.set(anc.id, anc);
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
            { ppa_ids: ids },
            {
                onStart: () => setLoading(true),
                onSuccess: () => {
                    setSelectedItems(new Map());
                    onClose();
                },
                onFinish: () => setLoading(false),
            },
        );
    };

    const displayData = useMemo(() => {
        if (Array.isArray(dialogPpaTree) || !dialogPpaTree) return [];

        return dialogPpaTree.data.map((ppa) => ({
            ...ppa,
            // We inject the state directly into the object
            // This ensures the DataTable's useEffect detects a change
            _isSelected: selectedItems.has(ppa.id),
            _isAdded: existingIdsSet.has(ppa.id),
        }));
    }, [dialogPpaTree, selectedItems, existingIdsSet]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="flex max-h-[95vh] flex-col sm:max-w-[85%]">
                <DialogHeader>
                    <DialogTitle>Library Navigator</DialogTitle>
                    <DialogDescription className="sr-only">
                        Select items to import. Selections are preserved across
                        folders.
                    </DialogDescription>
                </DialogHeader>

                {/* breadcrumbs */}
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
                        const boundaryId = Number(filters.dialog_boundary_id);
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
                                        item.id === filters.dialog_id
                                    }
                                >
                                    {item.name}
                                </Button>
                            </div>
                        );
                    })}
                </div>

                <div className="flex min-h-0">
                    <ScrollArea className="w-full pr-3">
                        {!Array.isArray(dialogPpaTree) && (
                            <DataTable
                                key={`lib-table-${filters?.dialog_id}`}
                                columns={columns}
                                data={displayData}
                                paginationObj={dialogPpaTree}
                                withSearch
                                searchKey="dialog_search"
                                pageKey="dialog_page"
                                negativeHeight={24}
                                filters={filters}
                                onlyKeys={[
                                    'dialogPpaTree',
                                    'dialogCurrent',
                                    'filters',
                                ]}
                                meta={{
                                    selectedIds: new Set(selectedItems.keys()),
                                    existingIds: existingIdsSet,
                                    onToggle: handleToggle,
                                    onNavigate: handleNavigate,
                                    onToggleAll: handleToggleAll,
                                }}
                            />
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <div className="flex w-full justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Info className="h-4 w-4" />
                            {selectedItems.size} items selected
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </Button>

                            <Button
                                onClick={handleImport}
                                disabled={loading || selectedItems.size === 0}
                            >
                                {loading && <Spinner className="mr-2" />}
                                Import Selected
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
