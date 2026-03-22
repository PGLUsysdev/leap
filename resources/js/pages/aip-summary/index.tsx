import { useState, useMemo, useCallback } from 'react';

import { Library, FileDown, FileText, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import AppLayout from '@/layouts/app-layout';
import DataTable from '@/pages/aip-summary/table/data-table';
import PpaSelectorDialog from '@/pages/aip-summary/ppa-selector-dialog';
// import DeleteDialog from '@/pages/aip-summary/delete-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import AipEntryFormDialog from '@/pages/aip-summary/aip-entry-form-dialog';
import { useAipColumns } from '@/pages/aip-summary/table/columns';
import ExportToPdfDialog from '@/pages/aip-summary/export-to-pdf-dialog';
import type { FiscalYear, Ppa, FundingSource } from '@/types/global';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';

interface AipSummaryTableProp {
    fiscalYear: FiscalYear;
    aipEntries: Ppa[];
    masterPpas: Ppa[];
    fundingSources: FundingSource[];
}

const existingPpaIds = (aipEntries: Ppa[]) => {
    const ppaIds: Set<number> = new Set();

    const parentEntries = [...aipEntries];

    while (parentEntries.length > 0) {
        const entry = parentEntries.pop();

        if (!entry) continue;

        ppaIds.add(entry.id);

        if (entry?.children && entry.children.length > 0) {
            parentEntries.push(...entry.children);
        }

        if (!(parentEntries.length > 0)) break;
    }

    return ppaIds;
};

const findPpaInTree = (ppas: Ppa[], targetId: number) => {
    const ppasList = [...ppas];

    while (ppasList.length > 0) {
        const item = ppasList.pop();

        if (!item) continue;

        if (item.id === targetId) return item;

        if (item.children && item.children.length > 0) {
            ppasList.push(...item.children);
        }

        if (ppasList.length === 0) break;
    }

    return null;
};

// const findEntryInTree = (nodes: Ppa[], targetId: number) => {
//     for (const node of nodes) {
//         if (node.id === targetId) return node;

//         if (node.children && node.children.length > 0) {
//             const found = findEntryInTree(node.children, targetId);
//             if (found) return found;
//         }
//     }

//     return null;
// };

export default function AipSummaryTable({
    fiscalYear,
    aipEntries,
    masterPpas,
    fundingSources,
}: AipSummaryTableProp) {
    // console.log(aipEntries);
    // console.log(fundingSources);

    const [searchValue, setSearchValue] = useState('');
    const [selectorState, setSelectorState] = useState({
        isOpen: false,
        data: [] as Ppa[],
        title: '',
        description: '',
    });
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    // const [selectedEntry, setSelectedEntry] = useState<Ppa | null>(null);
    const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    console.log(selectedEntryId);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Annual Investment Programs', href: '/aip' },
        { title: `AIP Summary FY ${fiscalYear.year}`, href: '#' },
    ];

    const selectedEntry = useMemo(() => {
        if (!selectedEntryId) return null;
        return findPpaInTree(aipEntries, selectedEntryId);
    }, [aipEntries, selectedEntryId]);

    const handleImportLibrary = () => {
        setSelectorState({
            isOpen: true,
            data: masterPpas,
            title: 'Import from Library',
            description:
                'Select Programs, Projects, and Activities to import. Items already in the AIP are disabled.',
        });
    };

    const handleAddEntry = (entry: Ppa) => {
        const masterNode = findPpaInTree(masterPpas, entry.aip_entry.ppa_id);

        if (!masterNode) {
            console.warn('Master PPA not found');
            return;
        }

        setSelectorState({
            isOpen: true,
            data: masterNode.children || [],
            title: `Add Sub-entries to: ${masterNode.title}`,
            description: `Select items to add under ${masterNode.type} ${masterNode.full_code}`,
        });
    };

    const handleEdit = useCallback((entry) => {
        setSelectedEntryId(entry.id);
        setIsEditOpen(true);
    }, []);

    const handleOpenDeleteDialog = useCallback((entry) => {
        setSelectedEntryId(entry.id);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleDelete = () => {
        router.delete(`/aip-entries/${selectedEntry?.aip_entry?.id}`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onFinish: () => {
                setIsLoading(false);
                setSelectedEntryId(null);
            },
            onSuccess: () => setIsDeleteDialogOpen(false),
        });
    };

    const columns = useAipColumns({
        onAddEntry: handleAddEntry,
        onEdit: handleEdit,
        onDelete: handleOpenDeleteDialog,
        masterPpas,
    });

    // const handleDelete = () => {
    //     if (!selectedEntry) return;

    //     router.delete(`/aip-entries/${selectedEntry.aip_entry.id}`, {
    //         preserveScroll: true,
    //         onFinish: () => {
    //             setIsDeleteDialogOpen(false);
    //             setSelectedEntry(null);
    //         },
    //     });
    // };

    // const handleExportExcel = () => {
    //     exportToExcel(aipEntries, fiscalYear);
    // };

    // const handleExportPDF = () => {
    //     exportToPrint({ aipEntries, fiscalYear });

    //     // import { Ppmp, PpmpCategory, ChartOfAccount } from '@/types/global';
    // };

    function handlePrintPreview() {
        setIsExportOpen(true);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full px-4 pb-4">
                <div className="w-full">
                    <div className="flex items-center justify-between py-4">
                        <div className="relative">
                            <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search projects or activities..."
                                value={searchValue}
                                onChange={(event) =>
                                    setSearchValue(event.target.value)
                                }
                                className="max-w-sm pl-8"
                            />
                        </div>

                        <div className="ml-auto flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <FileDown className="mr-2 h-4 w-4" />{' '}
                                        Export
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {/*<DropdownMenuItem
                                        onClick={handleExportExcel}
                                    >
                                        <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />{' '}
                                        Excel (.xlsx)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleExportPDF}>
                                        <FileText className="mr-2 h-4 w-4 text-red-600" />{' '}
                                        PDF (.pdf)
                                    </DropdownMenuItem>*/}
                                    <DropdownMenuItem
                                        onClick={handlePrintPreview}
                                    >
                                        <div className="flex items-center">
                                            <FileText className="mr-2 h-4 w-4" />
                                            <span>Print Preview</span>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button onClick={handleImportLibrary}>
                                <Library className="mr-2 h-4 w-4" /> Import from
                                Library
                            </Button>
                        </div>
                    </div>

                    <ScrollArea className="h-[calc(100vh-8rem)] rounded-md border">
                        <DataTable
                            data={aipEntries}
                            columns={columns}
                            searchKey="title"
                            searchValue={searchValue}
                            onSearchChange={setSearchValue}
                            getSubRows={(row) => row.children}
                        />

                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            </div>

            <PpaSelectorDialog
                isOpen={selectorState.isOpen}
                onClose={() =>
                    setSelectorState((prev) => ({ ...prev, isOpen: false }))
                }
                data={selectorState.data}
                title={selectorState.title}
                description={selectorState.description}
                fiscalYearId={fiscalYear.id}
                existingPpaIds={Array.from(existingPpaIds(aipEntries))}
            />

            <AipEntryFormDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                data={selectedEntry}
                fiscalYear={fiscalYear}
                fundingSources={fundingSources}
            />

            {/*alert dialog*/}
            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Remove from AIP Summary?"
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <span className="font-bold text-foreground">
                            "{selectedEntry?.title}"
                        </span>
                        ?
                        {selectedEntry?.children &&
                            selectedEntry.children.length > 0 && (
                                <span className="mt-2 block font-semibold text-destructive italic">
                                    Warning: This will also remove all nested
                                    sub-projects and activities.
                                </span>
                            )}
                    </>
                }
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedEntryId(null);
                }}
                isLoading={isLoading}
            />

            <ExportToPdfDialog
                open={isExportOpen}
                onOpenChange={setIsExportOpen}
                aipEntries={aipEntries}
                fiscalYear={fiscalYear}
            />
        </AppLayout>
    );
}
