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
import columns from './ppa-import-table/columns';
import type { Ppa, PaginatedResponse, Filter } from '@/types/global';
interface PpaSelectorDialogProps {
    isOpen: boolean;
    onClose: () => void;
    masterPpas: PaginatedResponse<Ppa> | [];
    libCurrent: any[];
    fiscalYearId: number;
    existingPpaIds: number[];
    filters: Filter;
}

export default function PpaSelectorDialog({
    isOpen,
    onClose,
    masterPpas,
    libCurrent = [],
    fiscalYearId,
    existingPpaIds = [],
    filters,
}: PpaSelectorDialogProps) {
    const [selectedItems, setSelectedItems] = useState<Map<number, Ppa>>(
        new Map(),
    );
    const [loading, setLoading] = useState(false);

    const existingIdsSet = useMemo(
        () => new Set(existingPpaIds),
        [existingPpaIds],
    );

    const handleToggle = (ppa: Ppa) => {
        setSelectedItems((prev) => {
            const next = new Map(prev);
            if (next.has(ppa.id)) next.delete(ppa.id);
            else next.set(ppa.id, ppa);
            return next;
        });
    };

    const handleNavigate = (id: number | null) => {
        router.get(
            window.location.pathname,
            {
                ...filters,
                lib_id: id,
                lib_page: 1,
                lib_boundary_id: filters.lib_boundary_id, // Always preserve the lock
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['masterPpas', 'libCurrent', 'filters'],
            },
        );
    };

    const handleClose = () => {
        onClose();
        // Scrub the URL of library parameters
        router.get(
            window.location.pathname,
            {
                ...filters,
                lib_id: undefined,
                lib_boundary_id: undefined,
                lib_page: undefined,
                lib_search: undefined,
            },
            {
                preserveState: true,
                only: ['masterPpas', 'libCurrent', 'filters'],
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
        if (Array.isArray(masterPpas)) return [];

        return masterPpas.data.map((ppa) => ({
            ...ppa,
            // We inject the state directly into the object
            // This ensures the DataTable's useEffect detects a change
            _isSelected: selectedItems.has(ppa.id),
            _isAdded: existingIdsSet.has(ppa.id),
        }));
    }, [masterPpas, selectedItems, existingIdsSet]);

    const handleToggleAll = (ppas: Ppa[], isChecked: boolean) => {
        setSelectedItems((prev) => {
            const next = new Map(prev);
            ppas.forEach((ppa) => {
                if (isChecked) {
                    next.set(ppa.id, ppa);
                } else {
                    next.delete(ppa.id);
                }
            });
            return next;
        });
    };

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

                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2 text-sm">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-2 ${filters.lib_boundary_id ? 'cursor-not-allowed opacity-50' : ''}`}
                        onClick={() => handleNavigate(null)}
                        // DISABLE ROOT IF BOUNDARY EXISTS
                        disabled={!!filters.lib_boundary_id}
                    >
                        <Home className="mr-1 h-4 w-4" /> Root
                    </Button>

                    {libCurrent.map((item) => {
                        /**
                         * DISABLE LOGIC:
                         * If a boundary is set, we find its position in the breadcrumb path.
                         * Anything "before" the boundary is an ancestor and should be disabled.
                         */
                        const boundaryId = Number(filters.lib_boundary_id);
                        const isAncestor =
                            boundaryId &&
                            item.id !== boundaryId &&
                            libCurrent.findIndex((i) => i.id === boundaryId) >
                                libCurrent.findIndex((i) => i.id === item.id);

                        return (
                            <div
                                key={item.id}
                                className="flex items-center gap-2"
                            >
                                <ChevronRight className="h-4 w-4 opacity-30" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-7 px-2 ${isAncestor ? 'cursor-not-allowed opacity-50' : ''}`}
                                    onClick={() => handleNavigate(item.id)}
                                    // DISABLE IF IT'S AN ANCESTOR
                                    disabled={
                                        !!isAncestor ||
                                        item.id === filters.lib_id
                                    }
                                >
                                    <span className="max-w-90 truncate">
                                        {item.name}
                                    </span>
                                </Button>
                            </div>
                        );
                    })}
                </div>

                <div className="flex min-h-0">
                    <ScrollArea className="w-full pr-3">
                        {!Array.isArray(masterPpas) && (
                            <DataTable
                                key={`lib-table-${filters?.lib_id}`}
                                columns={columns}
                                // data={masterPpas.data}
                                data={displayData}
                                paginationObj={masterPpas}
                                withSearch
                                searchKey="lib_search"
                                pageKey="lib_page"
                                negativeHeight={24}
                                filters={filters}
                                onlyKeys={[
                                    'masterPpas',
                                    'libCurrent',
                                    'filters',
                                ]}
                                // DYNAMIC STATE PASSED HERE
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
