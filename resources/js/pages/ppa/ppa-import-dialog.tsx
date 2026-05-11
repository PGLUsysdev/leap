import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { ChevronRight, Home, Info, Download } from 'lucide-react';
import columns from './columns/import-columns';
import type { Ppa, PaginatedResponse, Filter } from '@/types/global';
import { index, previousYear } from '@/routes/ppa';

interface PpaImportDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onClose: () => void;
    dialogPpaTree: PaginatedResponse<Ppa> | [];
    dialogCurrent: Ppa[];
    filters: Filter;
}

export default function PpaImportDialog({
    isOpen,
    onOpenChange,
    filters,
    dialogPpaTree,
    dialogCurrent,
    onClose,
}: PpaImportDialogProps) {
    const [selectedItems, setSelectedItems] = useState<Map<number, Ppa>>(
        new Map(),
    );
    const [loading, setLoading] = useState(false);

    const existingPpaIds: number[] = [];
    const existingIdsSet = useMemo(
        () => new Set(existingPpaIds),
        [existingPpaIds],
    );

    useEffect(() => {
        if (isOpen) {
            router.reload({ only: ['dialogPpaTree'] });
        }

        if (!isOpen) {
            const {
                dialog_id,
                dialog_page,
                dialog_search,
                is_dialog_open,
                dialog_mode,
                ...mainFilters
            } = filters;

            router.visit(index({ query: mainFilters }), {
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
                // --- UNSELECT LOGIC (Downward) ---
                const idsToRemove = new Set<number>([ppa.id]);

                // Recursive helper to find any selected item that is a child/grandchild
                const findDescendantsInMap = (parentId: number) => {
                    next.forEach((item, id) => {
                        if (item.parent_id === parentId) {
                            idsToRemove.add(id);
                            findDescendantsInMap(id); // Recurse to find grandchildren
                        }
                    });
                };

                findDescendantsInMap(ppa.id);
                idsToRemove.forEach((id) => next.delete(id));
            } else {
                // --- SELECT LOGIC (Upward) ---
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

            if (isChecked) {
                // --- SELECT ALL ---
                ppas.forEach((ppa) => {
                    next.set(ppa.id, ppa);
                    // Upward selection
                    if (dialogCurrent && dialogCurrent.length > 0) {
                        dialogCurrent.forEach((ancestor) => {
                            if (!existingIdsSet.has(ancestor.id)) {
                                next.set(ancestor.id, ancestor);
                            }
                        });
                    }
                });
            } else {
                // --- UNSELECT ALL (Downward) ---
                const idsToRemove = new Set<number>();

                const findDescendantsInMap = (parentId: number) => {
                    next.forEach((item, id) => {
                        if (item.parent_id === parentId) {
                            idsToRemove.add(id);
                            findDescendantsInMap(id);
                        }
                    });
                };

                ppas.forEach((ppa) => {
                    idsToRemove.add(ppa.id);
                    findDescendantsInMap(ppa.id);
                });

                idsToRemove.forEach((id) => next.delete(id));
            }

            return next;
        });
    };

    const handleClose = () => {
        onClose();
        setSelectedItems(new Map());
    };

    const handleImport = async () => {
        const ids = Array.from(selectedItems.keys());

        if (ids.length === 0) return;

        setLoading(true);

        router.post(
            '/ppa/import-from-previous-year',
            { ppa_ids: ids },
            {
                onStart: () => setLoading(true),
                onSuccess: () => {
                    handleClose();
                    // router.reload();
                },
                onFinish: () => setLoading(false),
            },
        );
    };

    const displayData = useMemo(() => {
        if (!dialogPpaTree || Array.isArray(dialogPpaTree)) return [];

        return dialogPpaTree.data.map((ppa) => ({
            ...ppa,
            _isSelected: selectedItems.has(ppa.id),
            _isAdded: existingIdsSet.has(ppa.id),
        }));
    }, [dialogPpaTree, selectedItems, existingIdsSet]);

    const handleShowChildren = (ppa: Ppa) => {
        router.get(
            'ppa',
            {
                ...filters,
                dialog_mode: 'import',
                dialog_id: ppa.id,
                dialog_page: 1,
            },
            {
                preserveState: true,
                only: ['dialogPpaTree', 'dialogCurrent', 'filters'],
            },
        );
    };

    function navigateToBreadcrumb(id: number | null) {
        router.get(
            'ppa',
            {
                ...filters,
                dialog_mode: 'import',
                dialog_id: id,
                dialog_page: 1,
            },
            {
                preserveState: true,
                only: ['dialogPpaTree', 'dialogCurrent', 'filters'],
            },
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[95vh] flex-col sm:max-w-[85%]">
                <DialogHeader>
                    <DialogTitle>Import from Previous Year</DialogTitle>
                    <DialogDescription>
                        Select PPAs from last year to import into the current
                        master list. Selections are preserved across folders.
                    </DialogDescription>
                </DialogHeader>

                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2 text-sm">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => navigateToBreadcrumb(null)}
                    >
                        <Home className="mr-1 h-4 w-4" /> Root
                    </Button>

                    {dialogCurrent &&
                        [...dialogCurrent].reverse().map((item) => (
                            <div
                                key={item.id}
                                className="flex min-w-0 items-center gap-2"
                            >
                                <ChevronRight className="h-4 w-4 shrink-0 opacity-30" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        navigateToBreadcrumb(item.id)
                                    }
                                    className={`block h-7 flex-1 truncate px-2`}
                                >
                                    {item.name}
                                </Button>
                            </div>
                        ))}
                </div>

                <div className="flex min-h-0">
                    <ScrollArea className="w-full pr-3">
                        {dialogPpaTree && (
                            <DataTable
                                key={`import-table-${filters?.dialog_id}`}
                                columns={columns}
                                data={displayData}
                                paginationObj={dialogPpaTree}
                                withSearch
                                searchKey="dialog_search"
                                pageKey="dialog_page"
                                filters={filters}
                                negativeHeight={24}
                                onlyKeys={[
                                    'dialogPpaTree',
                                    'dialogCurrent',
                                    'filters',
                                ]}
                                meta={{
                                    selectedIds: new Set(selectedItems.keys()),
                                    existingIds: existingIdsSet,
                                    onToggle: handleToggle,
                                    onToggleAll: handleToggleAll,
                                }}
                                onShowChildren={handleShowChildren}
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
                                className="gap-2"
                            >
                                {loading && <Spinner />}
                                <Download />
                                Import Selected
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
