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
} from '@/types/global';
import { type BreadcrumbItem } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import columns from './table/columns';
import ExportSummaryToPdfDialog from '@/pages/aip-summary/export-summary-to-pdf-dialog';

interface AipSummaryTableProp {
    fiscalYear: FiscalYear;
    aipEntries: Ppa[];
    fundingSources: FundingSource[];
    offices: Office[];
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

export default function AipSummaryTable({
    fiscalYear,
    aipEntries,
    fundingSources,
    offices,
    masterPpas = [],
}: AipSummaryTableProp) {
    console.log(aipEntries);
    const { auth } = usePage<SharedData>().props;

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<Ppa | null>(null);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectorState, setSelectorState] = useState({
        isOpen: false,
        data: [] as Ppa[],
        title: '',
        description: '',
    });
    const [isSummaryExportOpen, setIsSummaryExportOpen] = useState(false);

    console.log(selectedEntry);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Annual Investment Programs', href: '/aip' },
        { title: `AIP Summary FY ${fiscalYear.year}`, href: '#' },
    ];

    const handleImportLibrary = () => {
        setSelectorState({
            isOpen: true,
            data: masterPpas,
            title: 'Import from Library',
            description:
                'Select Programs, Projects, and Activities to import into this Fiscal Year.',
        });
    };

    const handleAddEntry = useCallback(
        (entry: Ppa) => {
            const masterNode = findPpaInTree(masterPpas, entry.id);

            if (!masterNode) {
                console.warn('This PPA does not exist in the Master Library');
                return;
            }

            setSelectorState({
                isOpen: true,
                data: masterNode.children || [],
                title: `Add Sub-entries to: ${masterNode.name}`,
                description: `Select items to add under ${masterNode.type} ${masterNode.full_code}`,
            });
        },
        [masterPpas],
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

    // const expandPpaByFundingSource = (ppas: Ppa[], depth = 0): any[] => {
    //     return ppas.flatMap((ppa): FlattenedPpa[] => {
    //         // 1. Recursively process children, incrementing depth for the next level
    //         const expandedChildren = ppa.children
    //             ? expandPpaByFundingSource(ppa.children, depth + 1)
    //             : [];

    //         const sources = ppa.ppa_funding_sources || [];

    //         // 2. If no funding sources, return the PPA once with its children
    //         if (sources.length === 0) {
    //             return [
    //                 {
    //                     ...ppa,
    //                     current_fs: null,
    //                     children: expandedChildren,
    //                     isFirstInGroup: true,
    //                     isLastInGroup: true,
    //                     groupSize: 1,
    //                     depth, // <--- Added depth
    //                 },
    //             ];
    //         }

    //         // 3. Duplicate PPA for each funding source
    //         return sources.map((fs, index) => {
    //             const isLast = index === sources.length - 1;

    //             return {
    //                 ...ppa,
    //                 current_fs: fs,
    //                 // Only the last duplicate retains the children array
    //                 children: isLast ? expandedChildren : [],
    //                 isFirstInGroup: index === 0,
    //                 isLastInGroup: isLast,
    //                 groupSize: sources.length,
    //                 depth, // <--- Added depth
    //             };
    //         });
    //     });
    // };

    const expandPpaByFundingSource = (ppas: Ppa[], depth = 0): any[] => {
        return ppas.flatMap((ppa): FlattenedPpa[] => {
            // 1. Recursively process children
            const expandedChildren = ppa.children
                ? expandPpaByFundingSource(ppa.children, depth + 1)
                : [];

            // 2. NEW SCHEMA NAVIGATION:
            // Find the AIP Entry for this year, then get its funding sources.
            // We assume 'aip_entries' is pre-filtered by your Laravel controller.
            const activeAip = ppa.aip_entries?.[0] || null;
            const sources = activeAip?.ppa_funding_sources || [];

            // 3. If no funding sources or no AIP entry, return the PPA once with its children
            if (sources.length === 0) {
                return [
                    {
                        ...ppa,
                        current_fs: null,
                        aip_entry: activeAip, // Helpful for the frontend to see dates/outputs
                        children: expandedChildren,
                        isFirstInGroup: true,
                        isLastInGroup: true,
                        groupSize: 1,
                        depth,
                    },
                ];
            }

            // 4. Duplicate PPA for each funding source found in the AIP Entry
            return sources.map((fs, index) => {
                const isLast = index === sources.length - 1;

                return {
                    ...ppa,
                    current_fs: fs,
                    aip_entry: activeAip,
                    // Only the last row in the duplicate group carries the nested children
                    children: isLast ? expandedChildren : [],
                    isFirstInGroup: index === 0,
                    isLastInGroup: isLast,
                    groupSize: sources.length,
                    depth,
                };
            });
        });
    };

    console.log(expandPpaByFundingSource(aipEntries));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
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
                                className="w-max min-w-[max-content]"
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
                                    sub-projects and activities.
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
