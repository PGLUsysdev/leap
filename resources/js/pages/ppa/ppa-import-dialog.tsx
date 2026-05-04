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
import columns from './ppa-import-table/columns';
import type { Ppa, PaginatedResponse, Filter } from '@/types/global';

interface PpaImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    existingPpaIds: number[];
}

export default function PpaImportDialog({
    isOpen,
    onClose,
    existingPpaIds = [],
}: PpaImportDialogProps) {
    const [selectedItems, setSelectedItems] = useState<Map<number, Ppa>>(
        new Map(),
    );
    const [loading, setLoading] = useState(false);
    const [previousYearPpas, setPreviousYearPpas] =
        useState<PaginatedResponse<Ppa> | null>(null);
    const [libCurrent, setLibCurrent] = useState<any[]>([]);
    const [dialogFilters, setDialogFilters] = useState<Filter>({
        lib_id: undefined,
        lib_search: undefined,
        lib_boundary_id: undefined,
        lib_page: 1,
    });

    const existingIdsSet = useMemo(
        () => new Set(existingPpaIds),
        [existingPpaIds],
    );

    const fetchPreviousYearPpas = useCallback(async () => {
        try {
            // Clean up the filters to remove undefined values
            const cleanFilters = Object.fromEntries(
                Object.entries(dialogFilters).filter(
                    ([_, value]) =>
                        value !== undefined &&
                        value !== 'undefined' &&
                        value !== '',
                ),
            );

            const queryString = new URLSearchParams(
                cleanFilters as any,
            ).toString();
            const response = await fetch(`/ppa/previous-year?${queryString}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setPreviousYearPpas(data.previousYearPpas);
            setLibCurrent(data.libCurrent || []);
        } catch (error) {
            console.error('Error fetching previous year PPAs:', error);
            // Set empty state to prevent infinite loading
            setPreviousYearPpas(null);
            setLibCurrent([]);
        }
    }, [dialogFilters]);

    useEffect(() => {
        if (isOpen) {
            void fetchPreviousYearPpas();
        }
    }, [isOpen, dialogFilters, fetchPreviousYearPpas]);

    const handleToggle = (ppa: Ppa) => {
        setSelectedItems((prev) => {
            const next = new Map(prev);
            if (next.has(ppa.id)) next.delete(ppa.id);
            else next.set(ppa.id, ppa);
            return next;
        });
    };

    const handleNavigate = (id: number | null) => {
        setDialogFilters((prev) => ({
            ...prev,
            lib_id: id || undefined,
            lib_page: 1,
            lib_boundary_id: prev.lib_boundary_id, // Always preserve the lock
        }));
    };

    const handleClose = () => {
        onClose();
        setDialogFilters({
            lib_id: undefined,
            lib_search: undefined,
            lib_boundary_id: undefined,
            lib_page: 1,
        });
        setSelectedItems(new Map());
    };

    const handleImport = async () => {
        const ids = Array.from(selectedItems.keys());

        if (ids.length === 0) {
            console.warn('No items selected for import');
            return;
        }

        setLoading(true);

        // Use Laravel's Inertia router which handles CSRF automatically
        router.post(
            '/ppa/import-from-previous-year',
            { ppa_ids: ids },
            {
                onStart: () => setLoading(true),
                onSuccess: () => {
                    setSelectedItems(new Map());
                    handleClose();
                    router.reload(); // Refresh the main PPA list
                },
                onError: (errors) => {
                    console.error('Import failed:', errors);
                    // Could show user-friendly error message here
                },
                onFinish: () => setLoading(false),
            },
        );
    };

    const displayData = useMemo(() => {
        if (!previousYearPpas || Array.isArray(previousYearPpas)) return [];

        return previousYearPpas.data.map((ppa) => ({
            ...ppa,
            // We inject the state directly into the object
            // This ensures the DataTable's useEffect detects a change
            _isSelected: selectedItems.has(ppa.id),
            _isAdded: existingIdsSet.has(ppa.id),
        }));
    }, [previousYearPpas, selectedItems, existingIdsSet]);

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
                        className={`h-7 px-2 ${dialogFilters.lib_boundary_id ? 'cursor-not-allowed opacity-50' : ''}`}
                        onClick={() => handleNavigate(null)}
                        // DISABLE ROOT IF BOUNDARY EXISTS
                        disabled={!!dialogFilters.lib_boundary_id}
                    >
                        <Home className="mr-1 h-4 w-4" /> Root
                    </Button>

                    {libCurrent.map((item) => {
                        /**
                         * DISABLE LOGIC:
                         * If a boundary is set, we find its position in the breadcrumb path.
                         * Anything "before" the boundary is an ancestor and should be disabled.
                         */
                        const boundaryId = Number(
                            dialogFilters.lib_boundary_id,
                        );
                        const isAncestor =
                            boundaryId &&
                            item.id !== boundaryId &&
                            libCurrent.findIndex((i) => i.id === boundaryId) >
                                libCurrent.findIndex((i) => i.id === item.id);

                        return (
                            <div
                                key={item.id}
                                className="flex min-w-0 items-center gap-2" // Add min-w-0 here
                            >
                                <ChevronRight className="h-4 w-4 shrink-0 opacity-30" />{' '}
                                {/* Add shrink-0 */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`block h-7 max-w-[300px] truncate px-2 ${isAncestor ? 'cursor-not-allowed opacity-50' : ''}`} // Add truncate, block, and a max-width
                                    onClick={() => handleNavigate(item.id)}
                                    disabled={
                                        !!isAncestor ||
                                        item.id === dialogFilters.lib_id
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
                        {previousYearPpas &&
                            !Array.isArray(previousYearPpas) && (
                                <DataTable
                                    key={`import-table-${dialogFilters?.lib_id}`}
                                    columns={columns}
                                    data={displayData}
                                    paginationObj={previousYearPpas}
                                    withSearch
                                    searchKey="lib_search"
                                    pageKey="lib_page"
                                    negativeHeight={24}
                                    onlyKeys={[
                                        'previousYearPpas',
                                        'libCurrent',
                                        'filters',
                                    ]}
                                    // DYNAMIC STATE PASSED HERE
                                    meta={{
                                        selectedIds: new Set(
                                            selectedItems.keys(),
                                        ),
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
                                <Download className="mr-2 h-4 w-4" />
                                Import Selected
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
