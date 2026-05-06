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
    onClose: () => void;
    existingPpaIds: number[];
    dialogPpaTree: PaginatedResponse<Ppa> | []; // Rename prevYearPpa
    dialogCurrent: Ppa[];
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
    // const [previousYearPpas, setPreviousYearPpas] =
    //     useState<PaginatedResponse<Ppa> | null>(null);
    // const [libCurrent, setLibCurrent] = useState<any[]>([]);
    // const [dialogFilters, setDialogFilters] = useState<Filter>({
    //     lib_id: undefined,
    //     lib_search: undefined,
    //     lib_boundary_id: undefined,
    //     lib_page: 1,
    // });

    const existingPpaIds: number[] = [];

    const existingIdsSet = useMemo(
        () => new Set(existingPpaIds),
        [existingPpaIds],
    );

    // const fetchPreviousYearPpas = useCallback(async () => {
    //     try {
    //         // Clean up the filters to remove undefined values
    //         const cleanFilters = Object.fromEntries(
    //             Object.entries(dialogFilters).filter(
    //                 ([_, value]) =>
    //                     value !== undefined &&
    //                     value !== 'undefined' &&
    //                     value !== '',
    //             ),
    //         );

    //         const queryString = new URLSearchParams(
    //             cleanFilters as any,
    //         ).toString();
    //         const response = await fetch(`/ppa/previous-year?${queryString}`);

    //         if (!response.ok) {
    //             const errorText = await response.text();
    //             console.error('API Error:', response.status, errorText);
    //             throw new Error(`HTTP ${response.status}: ${errorText}`);
    //         }

    //         const data = await response.json();

    //         if (data.error) {
    //             throw new Error(data.error);
    //         }

    //         setPreviousYearPpas(data.previousYearPpas);
    //         setLibCurrent(data.libCurrent || []);
    //     } catch (error) {
    //         console.error('Error fetching previous year PPAs:', error);
    //         // Set empty state to prevent infinite loading
    //         setPreviousYearPpas(null);
    //         setLibCurrent([]);
    //     }
    // }, [dialogFilters]);

    const openPreviousYearModal = async () => {
        // const response = await fetch('/ppa/previous-year');
        // const response = await fetch(previousYear().url);
        // const data = await response.json();

        // setPreviousYearPpas(data.prevYearPpa);
        // setOpen(true);

        // router.visit(previousYear().url, {
        //     preserveState: true,
        // });

        router.reload({ only: ['dialogPpaTree'] });
    };

    useEffect(() => {
        if (isOpen) {
            openPreviousYearModal();
        }
        if (!isOpen) {
            const {
                dialog_id,
                dialog_page,
                dialog_search,
                is_dialog_open,
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
            if (next.has(ppa.id)) next.delete(ppa.id);
            else next.set(ppa.id, ppa);
            return next;
        });
    };

    // const handleNavigate = (id: number | null) => {
    //     setDialogFilters((prev) => ({
    //         ...prev,
    //         lib_id: id || undefined,
    //         lib_page: 1,
    //         lib_boundary_id: prev.lib_boundary_id, // Always preserve the lock
    //     }));
    // };

    const handleClose = () => {
        onClose();

        // setDialogFilters({
        //     lib_id: undefined,
        //     lib_search: undefined,
        //     lib_boundary_id: undefined,
        //     lib_page: 1,
        // });

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
                },
                onFinish: () => setLoading(false),
            },
        );
    };

    const displayData = useMemo(() => {
        if (!dialogPpaTree || Array.isArray(dialogPpaTree)) return [];

        return dialogPpaTree.data.map((ppa) => ({
            ...ppa,
            // We inject the state directly into the object
            // This ensures the DataTable's useEffect detects a change
            _isSelected: selectedItems.has(ppa.id),
            _isAdded: existingIdsSet.has(ppa.id),
        }));
    }, [selectedItems, existingIdsSet]);
    // }, [previousYearPpas, selectedItems, existingIdsSet]);

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
            { ...filters, dialog_id: id, dialog_page: 1 },
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
                                    className={`block h-7 max-w-100 truncate px-2`}
                                >
                                    {item.name}
                                </Button>
                            </div>
                        ))}
                </div>

                <div className="flex min-h-0">
                    <ScrollArea className="w-full pr-3">
                        {dialogPpaTree && (
                            // !Array.isArray(previousYearPpas) && (
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
                                    // onNavigate: handleNavigate,
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
