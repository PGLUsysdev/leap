import { router } from '@inertiajs/react';
import { ChevronRight, Home, Info, Download } from 'lucide-react';
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

interface PpaImportDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    dialogPpaTree: PaginatedResponse<Ppa> | [];
    dialogCurrent: Ppa[];
    filters: Filter;
    selectedOfficeId?: number | null;
}

export default function PpaImportDialog({
    isOpen,
    onOpenChange,
    filters,
    dialogPpaTree,
    dialogCurrent,
    selectedOfficeId,
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

    const handleOpenChange = (open: boolean) => {
        if (!open) {
setSelectedItems(new Map());
}

        onOpenChange(open);
    };

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

    const handleImport = async () => {
        const ids = Array.from(selectedItems.keys());

        if (ids.length === 0) {
return;
}

        setLoading(true);

        router.post(
            '/ppa/import-from-previous-year',
            {
                ppa_ids: ids,
                office_id: selectedOfficeId,
            },
            {
                onStart: () => setLoading(true),
                onSuccess: () => {
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
        if (!dialogPpaTree || Array.isArray(dialogPpaTree)) {
return [];
}

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
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[95vh] flex-col gap-0 p-0 py-4 sm:max-w-[85%] [&>*:not(:nth-last-child(-n+3))]:pb-4">
                <div className="px-4">
                    <DialogHeader>
                        <DialogTitle>Import from Previous Year</DialogTitle>
                        <DialogDescription>
                            Select PPAs from last year to import into the
                            current master list. Selections are preserved across
                            folders.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Breadcrumbs */}
                <div className="px-4">
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
                </div>

                <DataTable
                    key={`import-table-${filters?.dialog_id}`}
                    columns={columns}
                    data={displayData}
                    paginationData={paginationData}
                    className="h-1000"
                    searchParamName="dialog_search"
                    pageParamName="dialog_page"
                    only={['dialogPpaTree', 'dialogCurrent', 'filters']}
                    meta={{
                        selectedIds: new Set(selectedItems.keys()),
                        existingIds: existingIdsSet,
                        onToggle: handleToggle,
                        onToggleAll: handleToggleAll,
                        onShowChildren: handleShowChildren,
                    }}
                ></DataTable>

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
                                    className="gap-2"
                                >
                                    {loading && <Spinner />}
                                    <Download />
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
