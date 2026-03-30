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
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { DataTable } from '@/pages/aip-summary/ppa-import-table/data-table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { getPpaColumns } from '@/pages/aip-summary/ppa-import-table/columns';
import type { RowSelectionState } from '@tanstack/react-table';
import type { Ppa } from '@/types/global';

interface PpaSelectorDialogProps {
    isOpen: boolean;
    onClose: () => void;
    data: Ppa[]; // <--- Dynamic Data
    title: string; // <--- Dynamic Title
    description: string; // <--- Dynamic Desc
    fiscalYearId: number;
    existingPpaIds: number[];
}

export default function PpaSelectorDialog({
    isOpen,
    onClose,
    data,
    title,
    description,
    fiscalYearId,
    existingPpaIds = [],
}: PpaSelectorDialogProps) {
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setRowSelection({});
            setGlobalFilter('');
        }
    }, [isOpen]);

    // Create a Set for faster lookups in the column definitions
    const existingIdsSet = useMemo(
        () => new Set(existingPpaIds),
        [existingPpaIds],
    );

    // Pass the existing IDs Set to the columns
    const columns = useMemo(
        () =>
            getPpaColumns({
                setRowSelection,
                existingPpaIds: existingIdsSet,
            }),
        [setRowSelection, existingIdsSet],
    );

    const handleImport = () => {
        // Filter out items already in the AIP (just in case)
        const selectedIds = Object.keys(rowSelection).filter(
            (id) => !existingIdsSet.has(Number(id)),
        );

        if (selectedIds.length === 0) return;

        router.post(
            `/aip/${fiscalYearId}/import`,
            { ppa_ids: selectedIds },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => {
                    setLoading(true);
                },
                onSuccess: () => {
                    // Success logic: Close and reset
                    onClose();
                    setRowSelection({});
                },
                onError: (errors) => {
                    // Optional: Handle validation errors or toast notifications here
                    console.error('Import failed:', errors);
                },
                onFinish: () => {
                    // This runs regardless of success or error
                    setLoading(false);
                },
            },
        );
    };

    // Calculate actual new items selected (excluding already added ones that might be visually checked)
    const newSelectedCount = Object.keys(rowSelection).filter(
        (id) => !existingIdsSet.has(Number(id)),
    ).length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[80%]"
                onPointerDownOutside={(e) => {
                    if (loading) e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    if (loading) e.preventDefault();
                }}
            >
                <DialogHeader className="">
                    <DialogTitle>{title}</DialogTitle>

                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div>
                    <div className="relative">
                        <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search library..."
                            value={globalFilter ?? ''}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="bg-muted/50 pl-9"
                        />
                    </div>
                </div>

                {/* <div className="flex-1 overflow-y-auto px-6 py-2"> */}
                <div className="flex min-h-0 flex-1">
                    <ScrollArea className="w-full flex-1 rounded border pr-3">
                        <DataTable
                            columns={columns}
                            data={data}
                            rowSelection={rowSelection}
                            setRowSelection={setRowSelection}
                            globalFilter={globalFilter}
                            setGlobalFilter={setGlobalFilter}
                            getSubRows={(row) => row.children}
                        />
                    </ScrollArea>
                </div>

                <DialogFooter className="sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                        {newSelectedCount} new item(s) selected
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
                            disabled={newSelectedCount === 0 || loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-1">
                                    <Spinner />
                                    Importing...
                                </span>
                            ) : (
                                'Import Selected'
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
