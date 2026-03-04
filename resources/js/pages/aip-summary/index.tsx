import { useState, useMemo, useCallback } from 'react';

import {
    Library,
    FileDown,
    FileSpreadsheet,
    FileText,
    Search,
} from 'lucide-react';

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
import DeleteDialog from '@/pages/aip-summary/delete-dialog';
import AipEntryFormDialog from '@/pages/aip-summary/aip-entry-form-dialog';
import { useAipColumns } from '@/pages/aip-summary/table/columns';
import { exportToPrint } from '@/pages/aip-summary/utils/export-utils';

import ExportToPdfDialog from '@/pages/aip-summary/utils/export';

import { FiscalYear, Ppa } from '@/pages/types/types';
import { type BreadcrumbItem } from '@/types';

interface AipSummaryTableProp {
    fiscalYear: FiscalYear;
    aipEntries: Ppa[];
    masterPpas: Ppa[];
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
}: AipSummaryTableProp) {
    console.log(fiscalYear);
    console.log(aipEntries);
    // console.log(masterPpas);

    const [searchValue, setSearchValue] = useState('');
    const [selectorState, setSelectorState] = useState({
        isOpen: false,
        data: [] as Ppa[],
        title: '',
        description: '',
    });
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
    const [isExportOpen, setIsExportOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Annual Investment Programs', href: '/aip' },
        { title: `AIP Summary FY ${fiscalYear.year}`, href: '#' },
    ];

    const selectedEntry = useMemo(() => {
        // console.log(selectedEntryId);
        // console.log(!selectedEntryId);

        if (!selectedEntryId) return null;

        // console.log(selectedEntryId);

        // return findEntryInTree(aipEntries, selectedEntryId);
        // console.log(findPpaInTree(aipEntries, selectedEntryId));

        return findPpaInTree(aipEntries, selectedEntryId);
    }, [aipEntries, selectedEntryId]);

    // console.log(selectedEntry);

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
        // console.log(entry.id);
        setSelectedEntryId(entry.id);
        setIsEditOpen(true);
    }, []);

    const handleOpenDeleteDialog = useCallback((entry) => {
        setSelectedEntryId(entry.id);
        setIsDeleteAlertOpen(true);
    }, []);

    const columns = useAipColumns({
        onAddEntry: handleAddEntry,
        onEdit: handleEdit,
        onDelete: handleOpenDeleteDialog,
        masterPpas,
    });

    const handleExportExcel = () => {
        exportToExcel(aipEntries, fiscalYear);
    };

    const handleExportPDF = () => {
        exportToPrint({ aipEntries, fiscalYear });

        // import { Ppmp, PpmpCategory, ChartOfAccount } from '@/pages/types/types';
    };

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

                    <ScrollArea className="h-[calc(100vh-9rem)] rounded-md border">
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
            />

            {/*alert dialog*/}
            <DeleteDialog
                isDeleteAlertOpen={isDeleteAlertOpen}
                setIsDeleteAlertOpen={setIsDeleteAlertOpen}
                selectedEntry={selectedEntry}
                setSelectedEntryId={setSelectedEntryId}
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
