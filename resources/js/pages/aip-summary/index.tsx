import { useState, useCallback } from 'react';
import { Library, FileDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import PpaSelectorDialog from '@/pages/aip-summary/ppa-selector-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import AipEntryFormDialog from '@/pages/aip-summary/aip-entry-form-dialog';
import ExportToPdfDialog from '@/pages/aip-summary/export-to-pdf-dialog';
import { exportToExcel } from '@/pages/aip-summary/export-to-excel';
import type {
    FiscalYear,
    Ppa,
    FundingSource,
    Office,
    FlattenedPpa,
    SharedData,
    Filter,
    PaginatedResponse,
} from '@/types/global';
import { type BreadcrumbItem } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import columns from './columns/columns';
import ExportSummaryToPdfDialog from '@/pages/aip-summary/export-summary-to-pdf-dialog';

interface AipSummaryTableProps {
    fiscalYear: FiscalYear;
    aipEntries: Ppa[];
    fundingSources: FundingSource[];
    offices: Office[];
    filters: Filter;
    dialogPpaTree?: PaginatedResponse<Ppa>;
    dialogCurrent?: Ppa[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Annual Investment Programs', href: '/aip' },
];

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

export default function AipSummaryTable({
    fiscalYear,
    aipEntries,
    fundingSources,
    offices,
    filters,
    dialogPpaTree,
    dialogCurrent,
}: AipSummaryTableProps) {
    console.log({
        fiscalYear,
        aipEntries,
        fundingSources,
        offices,
        filters,
        dialogPpaTree,
        dialogCurrent,
    });

    // console.log(usePage().props);

    const { auth } = usePage<SharedData>().props;

    const [selectedEntry, setSelectedEntry] = useState<Ppa | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    const [isSummaryExportOpen, setIsSummaryExportOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const updatedBreadcrumbs = [
        ...breadcrumbs,
        { title: `AIP Summary FY ${fiscalYear.year}`, href: '#' },
    ];

    const expandPpaByFundingSource = (ppas: Ppa[], depth = 0): any[] => {
        return ppas.flatMap((ppa): FlattenedPpa[] => {
            const expandedChildren = ppa.children
                ? expandPpaByFundingSource(ppa.children, depth + 1)
                : [];

            const activeAip = ppa.aip_entries?.[0] || null;
            const sources = activeAip?.ppa_funding_sources || [];

            if (sources.length === 0) {
                return [
                    {
                        ...ppa,
                        current_fs: null,
                        aip_entry: activeAip,
                        children: expandedChildren,
                        isFirstInGroup: true,
                        isLastInGroup: true,
                        groupSize: 1,
                        depth,
                    },
                ];
            }

            return sources.map((fs, index) => {
                return {
                    ...ppa,
                    current_fs: fs,
                    aip_entry: activeAip,
                    children: expandedChildren,
                    isFirstInGroup: index === 0,
                    isLastInGroup: index === sources.length - 1,
                    groupSize: sources.length,
                    depth,
                };
            });
        });
    };

    const customGetSubRows = useCallback((row: any) => {
        return row.isLastInGroup ? row.children : [];
    }, []);

    // Custom Filter logic specific to the PPA Flat-Tree
    const customGlobalFilterFn = useCallback(
        (row: any, columnId: string, filterValue: any) => {
            const searchStr = String(filterValue).toLowerCase();

            // Standard check
            const cellValue = row.getValue(columnId);
            if (
                cellValue != null &&
                String(cellValue).toLowerCase().includes(searchStr)
            ) {
                return true;
            }

            // Deep child check for PPA preservation
            const original = row.original as any;
            if (original.children && original.children.length > 0) {
                const childrenText = JSON.stringify(
                    original.children,
                ).toLowerCase();
                if (childrenText.includes(searchStr)) {
                    return true;
                }
            }
            return false;
        },
        [],
    );

    const handleImportLibrary = () => {
        router.get(
            window.location.pathname,
            {
                ...filters,
                dialog_id: null,
                dialog_boundary_id: null,
                dialog_page: 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['dialogPpaTree', 'dialogCurrent', 'filters'],
                onSuccess: () => {
                    setIsSelectorOpen(true);
                },
            },
        );
    };

    const handleAddEntry = useCallback(
        (entry: Ppa) => {
            router.get(
                window.location.pathname,
                {
                    ...filters,
                    dialog_id: entry.id,
                    dialog_boundary_id: entry.id,
                    dialog_page: 1,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['dialogPpaTree', 'dialogCurrent', 'filters'],
                    onSuccess: () => {
                        setIsSelectorOpen(true);
                    },
                },
            );
        },
        [filters],
    );

    const handleEditDialogOpen = (data: Ppa) => {
        setSelectedEntry(data);
        setIsEditDialogOpen(true);
    };

    function handleDeleteDialogOpen(data: Ppa) {
        setSelectedEntry(data);
        setIsDeleteDialogOpen(true);
    }

    function handleDelete() {
        const entryId = selectedEntry?.aip_entries?.[0]?.id;

        router.delete(`/aip-entries/${entryId}`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setSelectedEntry(null);
            },
            onFinish: () => setIsLoading(false),
            onError: (error) => console.error('error', error),
        });
    }

    function handlePrintPreview() {
        setIsExportOpen(true);
    }

    async function handleExportToExcel() {
        const officeName = auth.user.office?.name || '';

        await exportToExcel({
            aipEntries,
            fiscalYear,
            officeName,
        });
    }

    return (
        <AppLayout breadcrumbs={updatedBreadcrumbs}>
            <div className="flex flex-col gap-4 p-4">
                <DataTable
                    columns={columns}
                    data={expandPpaByFundingSource(aipEntries)}
                    withSearch={true}
                    withRowSpan={true}
                    onAdd={handleAddEntry}
                    onEdit={handleEditDialogOpen}
                    onDelete={handleDeleteDialogOpen}
                    withFooter={true}
                    getSubRows={customGetSubRows}
                    globalFilterFn={customGlobalFilterFn}
                >
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <FileDown className="mr-2 h-4 w-4" /> Export
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="end"
                                className="w-max min-w-max"
                            >
                                <DropdownMenuItem onClick={handlePrintPreview}>
                                    <div className="flex items-center">
                                        <FileText className="mr-2 h-4 w-4" />

                                        <span className="whitespace-nowrap">
                                            Print Preview
                                        </span>
                                    </div>
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={handleExportToExcel}>
                                    <div className="flex items-center">
                                        <FileDown className="mr-2 h-4 w-4" />

                                        <span className="whitespace-nowrap">
                                            Export to Excel
                                        </span>
                                    </div>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={() => setIsSummaryExportOpen(true)}
                                >
                                    <div className="flex items-center">
                                        <FileText className="mr-2 h-4 w-4" />

                                        <span className="whitespace-nowrap">
                                            Export Summary (Totals)
                                        </span>
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button onClick={handleImportLibrary}>
                            <Library className="mr-2 h-4 w-4" /> Import from
                            Library
                        </Button>
                    </div>
                </DataTable>
            </div>

            <PpaSelectorDialog
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                dialogPpaTree={dialogPpaTree}
                dialogCurrent={dialogCurrent}
                filters={filters}
                fiscalYearId={fiscalYear.id}
                existingPpaIds={Array.from(existingPpaIds(aipEntries))}
            />

            <AipEntryFormDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                data={selectedEntry}
                fiscalYear={fiscalYear}
                fundingSources={fundingSources}
                offices={offices}
                auth={auth}
            />

            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Remove from AIP Summary?"
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <span className="font-bold text-foreground">
                            "{selectedEntry?.name}"
                        </span>
                        ?
                        {selectedEntry?.children &&
                            selectedEntry.children.length > 0 && (
                                <span className="mt-2 block font-semibold text-destructive italic">
                                    Warning: This will also remove all nested
                                    sub-projects and activities including all
                                    their PPMPS.
                                </span>
                            )}
                    </>
                }
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedEntry(null);
                }}
                isLoading={isLoading}
            />

            <ExportToPdfDialog
                open={isExportOpen}
                onOpenChange={setIsExportOpen}
                aipEntries={aipEntries}
                fiscalYear={fiscalYear}
                auth={auth}
            />

            <ExportSummaryToPdfDialog
                open={isSummaryExportOpen}
                onOpenChange={setIsSummaryExportOpen}
                aipEntries={aipEntries}
                fiscalYear={fiscalYear}
            />
        </AppLayout>
    );
}
