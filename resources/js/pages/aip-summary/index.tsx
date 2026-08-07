import { router, usePage } from '@inertiajs/react';
// import { Library, FileDown, FileText, Plus } from 'lucide-react';
import { Library } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
// import { DataTable } from '@/components/data-table';
import DataTable from '@/components/base-ui-components/data-table';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
// import { DeleteDialog } from '@/components/delete-dialog';
// import {
//     AlertDialog,
//     AlertDialogContent,
//     AlertDialogDescription,
//     AlertDialogFooter,
//     AlertDialogHeader,
//     AlertDialogTitle,
// } from '@/components/ui/alert-dialog';
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import AipEntryFormDialog from '@/pages/aip-summary/aip-entry-form-dialog';
import AipEntryFormDialog from '@/pages/aip-summary/aip-entry-form-dialog';
// import ExportSummaryToPdfDialog from '@/pages/aip-summary/export-summary-to-pdf-dialog';
// import { exportToExcel } from '@/pages/aip-summary/export-to-excel';
// import ExportToPdfDialog from '@/pages/aip-summary/export-to-pdf-dialog';
import PpaSelectorDialog from '@/pages/aip-summary/ppa-selector-dialog';
import type {
    FiscalYear,
    Ppa,
    FundingSource,
    Office,
    // FlattenedPpa,
    // SharedData,
    SharedData,
    Filter,
    PaginatedResponse,
    ChartOfAccount,
    PriceList,
    PpmpCategory,
    AipEntry,
    PpaFundingSource,
} from '@/types';
// import columns from './columns/columns';
import newColumns from './columns/new-columns';

interface AipSummaryTableProps {
    fiscalYear: FiscalYear;
    aipEntries: Ppa[];
    can: {
        export: boolean;
        import: boolean;
        createSaip: boolean;
        setPsPool: boolean;
        showSummaryAll?: boolean;
    };
    fundingSources: FundingSource[];
    ccTypologies: {
        id: number;
        code: string;
        description: string;
        strategic_priority_id: number;
        sub_sector_id: number | null;
        strategic_priority?: { id: number; code: number; name: string };
        sub_sector?: { id: number; code: number; name: string } | null;
    }[];
    offices: Office[];
    filters: Filter;
    dialogPpaTree?: PaginatedResponse<Ppa>;
    dialogCurrent?: Ppa[];
    supplementalAips?: any[];
    currentScope?: {
        scope: string;
        supplemental_aip_id: number | null;
    };
    chartOfAccounts: ChartOfAccount[];
    priceLists: PriceList[];
    ppmpCategories: PpmpCategory[];
    ppmpCoaTotals: Record<number, Record<number, number>>;
    psCoaAutoTotals: Record<string, number>;
    psPoolPpaId?: number | null;
    newAipEntries: AipEntry[];
}

// const existingPpaIds = (aipEntries: Ppa[]) => {
//     const ppaIds: Set<number> = new Set();

//     const parentEntries = [...aipEntries];

//     while (parentEntries.length > 0) {
//         const entry = parentEntries.pop();

//         if (!entry) {
//             continue;
//         }

//         ppaIds.add(entry.id);

//         if (entry?.children && entry.children.length > 0) {
//             parentEntries.push(...entry.children);
//         }

//         if (!(parentEntries.length > 0)) {
//             break;
//         }
//     }

//     return ppaIds;
// };

type NumberedAipEntry = AipEntry & { number: string };

function toLetters(n: number): string {
    let s = '';

    while (n > 0) {
        n--;
        s = String.fromCharCode(65 + (n % 26)) + s;
        n = Math.floor(n / 26);
    }

    return s;
}

function sortFlatLikeTree(entries: AipEntry[]): NumberedAipEntry[] {
    const byParent = new Map<number | null, AipEntry[]>();
    const seen = new Set<number>();

    for (const entry of entries) {
        if (seen.has(entry.ppa_id)) {
            throw new Error(`Duplicate ppa_id found: ${entry.ppa_id}`);
        }

        seen.add(entry.ppa_id);

        const parentId = entry.ppa?.parent_id ?? null;

        if (!byParent.has(parentId)) {
            byParent.set(parentId, []);
        }

        byParent.get(parentId)!.push(entry);
    }

    const sortSiblings = (list: AipEntry[]) =>
        list.sort(
            (a, b) => (a.ppa?.sort_order ?? 0) - (b.ppa?.sort_order ?? 0),
        );

    const counters: number[] = [];
    const result: NumberedAipEntry[] = [];
    const stack: { entry: AipEntry; depth: number }[] = [
        ...sortSiblings(byParent.get(null) ?? []),
    ]
        .reverse()
        .map((entry) => ({ entry, depth: 0 }));

    while (stack.length) {
        const { entry, depth } = stack.pop()!;

        counters[depth] = (counters[depth] ?? 0) + 1;
        counters.length = depth + 1;

        const number =
            (depth === 0
                ? toLetters(counters[0])
                : counters.slice(1, depth + 1).join('.')) + '.';

        result.push({ ...entry, number });

        const kids = sortSiblings(byParent.get(entry.ppa_id) ?? []);

        for (let i = kids.length - 1; i >= 0; i--) {
            stack.push({ entry: kids[i], depth: depth + 1 });
        }
    }

    return result;
}

type FundingSourceRow = NumberedAipEntry & {
    current_fs: PpaFundingSource | null;
};

function expandByFundingSource(
    entries: NumberedAipEntry[],
): FundingSourceRow[] {
    return entries.flatMap((entry): FundingSourceRow[] => {
        const sources = entry.ppa_funding_sources ?? [];

        if (sources.length === 0) {
            return [{ ...entry, id: entry.id, current_fs: null }];
        }

        return sources.map((fs): FundingSourceRow => ({
            ...entry,
            id: entry.id,
            current_fs: fs,
        }));
    });
}

export default function AipSummaryTable({
    // fiscalYear,
    // aipEntries,
    // can,
    // fundingSources,
    // ccTypologies,
    // offices,
    // filters,
    // dialogPpaTree,
    // dialogCurrent,
    // supplementalAips = [],
    // currentScope = { scope: 'original', supplemental_aip_id: null },
    // chartOfAccounts,
    // priceLists,
    // ppmpCategories,
    // ppmpCoaTotals,
    // psCoaAutoTotals = {},
    // psPoolPpaId = null,
    fiscalYear,
    can,
    filters,
    dialogPpaTree,
    dialogCurrent,
    fundingSources,
    ccTypologies,
    offices,
    chartOfAccounts,
    priceLists,
    ppmpCategories,
    ppmpCoaTotals,
    psCoaAutoTotals,
    psPoolPpaId,
    newAipEntries,
}: AipSummaryTableProps) {
    console.log(newAipEntries);

    // const json = JSON.stringify(newAipEntries);
    // const bytes = new Blob([json]).size;

    // console.log(`Payload size: ${bytes} bytes`);
    // console.log(`Payload size: ${(bytes / 1024).toFixed(2)} KB`);
    // console.log(`Payload size: ${(bytes / 1024 / 1024).toFixed(2)} MB`);

    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    const existingPpaIds = useMemo(
        () => Array.from(new Set(newAipEntries.map((e) => e.ppa_id))),
        [newAipEntries],
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
        (entry: NumberedAipEntry) => {
            router.get(
                window.location.pathname,
                {
                    ...filters,
                    dialog_id: entry.ppa_id,
                    dialog_boundary_id: entry.ppa_id,
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

    // const { auth } = usePage<SharedData>().props;
    const { auth } = usePage<SharedData>().props;

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<Ppa | null>(null);

    const handleEditDialogOpen = useCallback(
        (entry: NumberedAipEntry) => {
            if (!entry.ppa) {
                return;
            }

            const ppa: Ppa = {
                ...entry.ppa,
                aip_entries:
                    entry.ppa.aip_entries && entry.ppa.aip_entries.length > 0
                        ? entry.ppa.aip_entries
                        : [entry],
            };

            setSelectedEntry(ppa);
            setIsEditDialogOpen(true);
        },
        [],
    );

    // const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
    // const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // const selectedEntry = useMemo(() => {
    //     const findInTree = (entries: Ppa[], id: number): Ppa | null => {
    //         for (const entry of entries) {
    //             if (entry.id === id) {
    //                 return entry;
    //             }

    //             if (entry.children) {
    //                 const found = findInTree(entry.children, id);

    //                 if (found) {
    //                     return found;
    //                 }
    //             }
    //         }

    //         return null;
    //     };

    //     return selectedEntryId ? findInTree(aipEntries, selectedEntryId) : null;
    // }, [aipEntries, selectedEntryId]);
    // const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    // const [isSummaryExportOpen, setIsSummaryExportOpen] = useState(false);
    // const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    // const [isExportOpen, setIsExportOpen] = useState(false);
    // const [isLoading, setIsLoading] = useState(false);
    // const [isCreateSaipDialogOpen, setIsCreateSaipDialogOpen] = useState(false);
    // const [isDeleteSaipDialogOpen, setIsDeleteSaipDialogOpen] = useState(false);

    // const currentSaip =
    //     currentScope?.scope === 'supplemental' &&
    //     currentScope.supplemental_aip_id
    //         ? supplementalAips.find(
    //               (s: any) => s.id === currentScope.supplemental_aip_id,
    //           )
    //         : null;
    // const canDeleteSaip = currentSaip?.can?.deleteSaip ?? false;

    // const expandPpaByFundingSource = (ppas: Ppa[], depth = 0): any[] => {
    //     return ppas.flatMap((ppa): FlattenedPpa[] => {
    //         const expandedChildren = ppa.children
    //             ? expandPpaByFundingSource(ppa.children, depth + 1)
    //             : [];

    //         const activeAips = ppa.aip_entries || [];
    //         let sources = activeAips.flatMap(
    //             (aip) => aip.ppa_funding_sources || [],
    //         );

    //         if (currentScope?.scope === 'combined') {
    //             // Group sources by funding_source_id
    //             const grouped = new Map<number, typeof sources>();
    //             sources.forEach((src) => {
    //                 const list = grouped.get(src.funding_source_id) || [];
    //                 list.push(src);
    //                 grouped.set(src.funding_source_id, list);
    //             });

    //             // Merge groups
    //             sources = Array.from(grouped.entries()).map(([fsId, list]) => {
    //                 const base = { ...list[0] };
    //                 let ps = 0,
    //                     mooe = 0,
    //                     co = 0,
    //                     fe = 0,
    //                     ccet_ad = 0,
    //                     ccet_mit = 0;
    //                 list.forEach((item) => {
    //                     ps += parseFloat(item.ps_amount || '0');
    //                     mooe += parseFloat(item.mooe_amount || '0');
    //                     co += parseFloat(item.co_amount || '0');
    //                     fe += parseFloat(item.fe_amount || '0');
    //                     ccet_ad += parseFloat(item.ccet_adaptation || '0');
    //                     ccet_mit += parseFloat(item.ccet_mitigation || '0');
    //                 });
    //                 base.ps_amount = ps.toString();
    //                 base.mooe_amount = mooe.toString();
    //                 base.co_amount = co.toString();
    //                 base.fe_amount = fe.toString();
    //                 base.ccet_adaptation = ccet_ad.toString();
    //                 base.ccet_mitigation = ccet_mit.toString();
    //                 // Point to the latest SAIP entry so non-numeric fields
    //                 // (office, dates, expected output) resolve correctly
    //                 const entryIds = [
    //                     ...new Set(list.map((s) => s.aip_entry_id)),
    //                 ];
    //                 const latestEntry = entryIds
    //                     .map((id) => activeAips.find((a) => a.id === id))
    //                     .filter(Boolean)
    //                     .sort(
    //                         (a: any, b: any) =>
    //                             (b.supplemental_aip_id ?? -1) -
    //                             (a.supplemental_aip_id ?? -1),
    //                     )[0];

    //                 if (latestEntry) {
    //                     base.aip_entry_id = latestEntry.id;
    //                 }

    //                 return base;
    //             });
    //         }

    //         if (sources.length === 0) {
    //             const latestAip = [...activeAips].sort(
    //                 (a: any, b: any) =>
    //                     (b.supplemental_aip_id ?? -1) -
    //                     (a.supplemental_aip_id ?? -1),
    //             )[0];

    //             return [
    //                 {
    //                     ...ppa,
    //                     current_fs: null,
    //                     aip_entry: latestAip || null,
    //                     children: expandedChildren,
    //                     isFirstInGroup: true,
    //                     isLastInGroup: true,
    //                     groupSize: 1,
    //                     depth,
    //                 },
    //             ];
    //         }

    //         return sources.map((fs, index) => {
    //             const parentAip =
    //                 activeAips.find((aip) => aip.id === fs.aip_entry_id) ||
    //                 null;

    //             return {
    //                 ...ppa,
    //                 current_fs: fs,
    //                 aip_entry: parentAip,
    //                 children: expandedChildren,
    //                 isFirstInGroup: index === 0,
    //                 isLastInGroup: index === sources.length - 1,
    //                 groupSize: sources.length,
    //                 depth,
    //             };
    //         });
    //     });
    // };

    // const customGetSubRows = useCallback((row: any) => {
    //     return row.isLastInGroup ? row.children : [];
    // }, []);

    // Custom Filter logic specific to the PPA Flat-Tree
    // const customGlobalFilterFn = useCallback(
    //     (row: any, columnId: string, filterValue: any) => {
    //         const searchStr = String(filterValue).toLowerCase();

    //         // Standard check
    //         const cellValue = row.getValue(columnId);

    //         if (
    //             cellValue != null &&
    //             String(cellValue).toLowerCase().includes(searchStr)
    //         ) {
    //             return true;
    //         }

    //         // Deep child check for PPA preservation
    //         const original = row.original as any;

    //         if (original.children && original.children.length > 0) {
    //             const childrenText = JSON.stringify(
    //                 original.children,
    //             ).toLowerCase();

    //             if (childrenText.includes(searchStr)) {
    //                 return true;
    //             }
    //         }

    //         return false;
    //     },
    //     [],
    // );

    // const handleScopeChange = (newScope: string, newSaipId?: number | null) => {
    //     router.get(
    //         window.location.pathname,
    //         {
    //             ...filters,
    //             scope: newScope,
    //             supplemental_aip_id: newSaipId || undefined,
    //         },
    //         {
    //             preserveState: true,
    //             preserveScroll: true,
    //         },
    //     );
    // };

    // const handleCreateSaip = () => {
    //     setIsCreateSaipDialogOpen(true);
    // };

    // const handleCreateSaipConfirm = () => {
    //     setIsLoading(true);
    //     router.post(
    //         '/supplemental-aips',
    //         {
    //             fiscal_year_id: fiscalYear.id,
    //         },
    //         {
    //             preserveScroll: true,
    //             onFinish: () => {
    //                 setIsLoading(false);
    //                 setIsCreateSaipDialogOpen(false);
    //             },
    //         },
    //     );
    // };

    // const handleSetAsPsPool = useCallback((ppa: Ppa) => {
    //     router.post(
    //         `/ppas/${ppa.id}/set-as-ps-pool`,

    //         {},
    //         {
    //             preserveState: true,
    //             preserveScroll: true,
    //         },
    //     );
    // }, []);

    // const handleDeleteSaip = () => {
    //     setIsDeleteSaipDialogOpen(true);
    // };

    // const handleDeleteSaipConfirm = () => {
    //     if (!currentScope.supplemental_aip_id) {
    //         return;
    //     }

    //     setIsLoading(true);
    //     router.delete(
    //         `/supplemental-aips/${currentScope.supplemental_aip_id}`,
    //         {
    //             preserveScroll: true,
    //             onSuccess: () => {
    //                 handleScopeChange('original');
    //             },
    //             onFinish: () => {
    //                 setIsLoading(false);
    //                 setIsDeleteSaipDialogOpen(false);
    //             },
    //         },
    //     );
    // };

    // const handleImportLibrary = () => {
    //     router.get(
    //         window.location.pathname,
    //         {
    //             ...filters,
    //             scope: currentScope.scope,
    //             supplemental_aip_id:
    //                 currentScope.supplemental_aip_id || undefined,
    //             dialog_id: null,
    //             dialog_boundary_id: null,
    //             dialog_page: 1,
    //         },
    //         {
    //             preserveState: true,
    //             preserveScroll: true,
    //             only: ['dialogPpaTree', 'dialogCurrent', 'filters'],
    //             onSuccess: () => {
    //                 setIsSelectorOpen(true);
    //             },
    //         },
    //     );
    // };

    // const handleAddEntry = useCallback(
    //     (entry: Ppa) => {
    //         router.get(
    //             window.location.pathname,
    //             {
    //                 ...filters,
    //                 scope: currentScope.scope,
    //                 supplemental_aip_id:
    //                     currentScope.supplemental_aip_id || undefined,
    //                 dialog_id: entry.id,
    //                 dialog_boundary_id: entry.id,
    //                 dialog_page: 1,
    //             },
    //             {
    //                 preserveState: true,
    //                 preserveScroll: true,
    //                 only: ['dialogPpaTree', 'dialogCurrent', 'filters'],
    //                 onSuccess: () => {
    //                     setIsSelectorOpen(true);
    //                 },
    //             },
    //         );
    //     },
    //     [filters, currentScope],
    // );

    // const handleEditDialogOpen = (data: Ppa) => {
    //     setSelectedEntryId(data.id);
    //     setIsEditDialogOpen(true);
    // };

    // function handleDeleteDialogOpen(data: Ppa) {
    //     setSelectedEntryId(data.id);
    //     setIsDeleteDialogOpen(true);
    // }

    // const handlePpmpItemAdded = () => {
    //     router.visit(window.location.href, {
    //         only: ['aipEntries'],
    //         preserveState: true,
    //         preserveScroll: true,
    //     });
    // };

    // function handleDelete() {
    //     const entryId = selectedEntry?.aip_entries?.[0]?.id;

    //     router.delete(`/aip-entries/${entryId}`, {
    //         preserveState: true,
    //         preserveScroll: true,
    //         onStart: () => setIsLoading(true),
    //         onSuccess: () => {
    //             setIsDeleteDialogOpen(false);
    //             setSelectedEntryId(null);
    //         },
    //         onFinish: () => setIsLoading(false),
    //         onError: (error) => console.error('error', error),
    //     });
    // }

    // function handlePrintPreview() {
    //     setIsExportOpen(true);
    // }

    // async function handleExportToExcel() {
    //     const officeName = auth.user.office?.name || '';

    //     await exportToExcel({
    //         aipEntries,
    //         fiscalYear,
    //         officeName,
    //         currentScope,
    //     });
    // }

    // const activeTabValue =
    //     currentScope.scope === 'supplemental'
    //         ? `saip-${currentScope.supplemental_aip_id}`
    //         : currentScope.scope;

    return (
        <>
            {/* <div className="flex flex-col gap-4 pt-4"> */}

            {/* <DataTable
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
                    negativeHeight={9.98}
                    meta={{
                        readOnly: currentScope.scope === 'combined',
                        canSetPsPool: can?.setPsPool ?? false,
                        psPoolPpaId,
                        onSetAsPsPool: handleSetAsPsPool,
                    }}
                >
                    <div className="flex gap-2">
                        {can.export && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <FileDown className="mr-2 h-4 w-4" />{' '}
                                        Export
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    className="w-max min-w-max"
                                >
                                    <DropdownMenuItem
                                        onClick={handlePrintPreview}
                                    >
                                        <div className="flex items-center">
                                            <FileText className="mr-2 h-4 w-4" />

                                            <span className="whitespace-nowrap">
                                                Print Preview
                                            </span>
                                        </div>
                                    </DropdownMenuItem> */}

            {/*<DropdownMenuItem
                                        onClick={handleExportToExcel}
                                    >
                                        <div className="flex items-center">
                                            <FileDown className="mr-2 h-4 w-4" />

                                            <span className="whitespace-nowrap">
                                                Export to Excel
                                            </span>
                                        </div>
                                    </DropdownMenuItem>*/}

            {/*<DropdownMenuItem
                                        onClick={() =>
                                            setIsSummaryExportOpen(true)
                                        }
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
                        )}

                        {can.import && currentScope.scope !== 'combined' && (
                            <Button onClick={handleImportLibrary}>
                                <Library className="mr-2 h-4 w-4" /> Import from
                                Library
                            </Button>
                        )}
                    </div>
                </DataTable>
            </div>*/}

            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                {/*<div className="flex flex-col px-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <Tabs
                        value={activeTabValue}
                        onValueChange={(val) => {
                            if (val === 'original' || val === 'combined') {
                                handleScopeChange(val);
                            } else if (val.startsWith('saip-')) {
                                const id = parseInt(val.split('-')[1]);
                                handleScopeChange('supplemental', id);
                            }
                        }}
                        // className="w-auto"
                    >
                        <TabsList
                        // className="flex h-auto flex-wrap bg-muted p-1"
                        >
                            <TabsTrigger
                                value="original"
                                // className="px-4 py-2"
                            >
                                Original Plan
                            </TabsTrigger>

                            {supplementalAips.map((saip) => (
                                <TabsTrigger
                                    key={saip.id}
                                    value={`saip-${saip.id}`}
                                    disabled={!saip?.can?.viewSaip}
                                >
                                    {saip.name}
                                </TabsTrigger>
                            ))}

                            <TabsTrigger
                                value="combined"
                                // className="px-4 py-2"
                            >
                                Combined View
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-2">
                        {currentScope.scope === 'supplemental' &&
                            canDeleteSaip && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDeleteSaip}
                                >
                                    Delete Plan
                                </Button>
                            )}

                        {can.createSaip && (
                            <Button
                                variant="outline"
                                // size="sm"
                                onClick={handleCreateSaip}
                            >
                                <Plus
                                // className="mr-1 h-4 w-4"
                                />
                                Create Supplemental AIP
                            </Button>
                        )}
                    </div>
                </div>*/}

                <DataTable
                    // columns={columns}
                    columns={newColumns}
                    // data={expandPpaByFundingSource(aipEntries)}
                    data={expandByFundingSource(
                        sortFlatLikeTree(newAipEntries),
                    )}
                    showFooter={true}
                    withRowSpan={true}
                    // withColgroup={true}
                    // withSearch={true}

                    // onAdd={handleAddEntry}
                    // onEdit={handleEditDialogOpen}
                    // onDelete={handleDeleteDialogOpen}
                    // getSubRows={customGetSubRows}
                    // globalFilterFn={customGlobalFilterFn}

                    // meta={{
                    //     onAdd: handleAddEntry,
                    //     onEdit: handleEditDialogOpen,
                    //     onDelete: handleDeleteDialogOpen,
                    //     readOnly: currentScope.scope === 'combined',
                    //     canSetPsPool: can?.setPsPool ?? false,
                    //     psPoolPpaId,
                    //     onSetAsPsPool: handleSetAsPsPool,
                    // }}

                    meta={{
                        onAdd: handleAddEntry,
                        onEdit: handleEditDialogOpen,
                    }}

                    className="pr-3"
                >
                    {/*<div className="flex gap-2">
                        {can.export && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <FileDown className="mr-2 h-4 w-4" />{' '}
                                        Export
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    className="w-max min-w-max"
                                >
                                    <DropdownMenuItem
                                        onClick={handlePrintPreview}
                                    >
                                        <div className="flex items-center">
                                            <FileText className="mr-2 h-4 w-4" />

                                            <span className="whitespace-nowrap">
                                                Print Preview
                                            </span>
                                        </div>
                                    </DropdownMenuItem>*/}

                    {/*<DropdownMenuItem
                                        onClick={handleExportToExcel}
                                    >
                                        <div className="flex items-center">
                                            <FileDown className="mr-2 h-4 w-4" />

                                            <span className="whitespace-nowrap">
                                                Export to Excel
                                            </span>
                                        </div>
                                    </DropdownMenuItem>*/}

                    {/*<DropdownMenuItem
                                        onClick={() =>
                                            setIsSummaryExportOpen(true)
                                        }
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
                        )}*/}

                    {/*{can.import && currentScope.scope !== 'combined' && (
                            <Button onClick={handleImportLibrary}>
                                <Library className="mr-2 h-4 w-4" /> Import from
                                Library
                            </Button>
                        )}*/}
                    {can.import && (
                        <Button onClick={handleImportLibrary}>
                            <Library className="mr-2 h-4 w-4" /> Import from
                            Library
                        </Button>
                    )}
                    {/*</div>*/}
                </DataTable>

                <ScrollBar orientation="vertical" />
            </ScrollArea>

            <PpaSelectorDialog
                open={isSelectorOpen}
                onOpenChange={setIsSelectorOpen}
                dialogPpaTree={dialogPpaTree}
                dialogCurrent={dialogCurrent}
                filters={filters}
                fiscalYearId={fiscalYear.id}
                existingPpaIds={existingPpaIds}
                supplementalAipId={null}
            />

            <AipEntryFormDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                data={selectedEntry}
                fiscalYear={fiscalYear}
                fundingSources={fundingSources}
                ccTypologies={ccTypologies}
                offices={offices}
                auth={auth as any}
                supplementalAipId={null}
                canShowSummaryAll={can?.showSummaryAll ?? false}
                selectedOfficeId={filters?.selected_office_id ?? undefined}
                chartOfAccounts={chartOfAccounts}
                priceLists={priceLists}
                ppmpCategories={ppmpCategories}
                ppmpCoaTotals={ppmpCoaTotals}
                psCoaAutoTotals={psCoaAutoTotals}
                psPoolPpaId={psPoolPpaId}
            />

            {/* <AipEntryFormDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                data={selectedEntry}
                fiscalYear={fiscalYear}
                fundingSources={fundingSources}
                ccTypologies={ccTypologies}
                offices={offices}
                auth={auth}
                supplementalAipId={currentScope.supplemental_aip_id}
                canShowSummaryAll={can?.showSummaryAll ?? false}
                selectedOfficeId={filters?.selected_office_id ?? undefined}
                chartOfAccounts={chartOfAccounts}
                priceLists={priceLists}
                ppmpCategories={ppmpCategories}
                ppmpCoaTotals={ppmpCoaTotals}
                psCoaAutoTotals={psCoaAutoTotals}
                psPoolPpaId={psPoolPpaId}
                onPpmpItemAdded={handlePpmpItemAdded}
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
                                    sub-PPAs and activities including all their
                                    PPMPs.
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
                auth={auth}
                currentScope={currentScope}
            />

            <ExportSummaryToPdfDialog
                open={isSummaryExportOpen}
                onOpenChange={setIsSummaryExportOpen}
                aipEntries={aipEntries}
                fiscalYear={fiscalYear}
            />

            <AlertDialog
                open={isCreateSaipDialogOpen}
                onOpenChange={setIsCreateSaipDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Create Supplemental AIP?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to create a new Supplemental
                            Annual Investment Program (SAIP) for this office and
                            fiscal year?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateSaipDialogOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateSaipConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating...' : 'Create'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={isDeleteSaipDialogOpen}
                onOpenChange={setIsDeleteSaipDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">
                            Delete Supplemental AIP?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this Supplemental AIP
                            and all of its associated PPAs, funding allocations,
                            and Supplemental PPMP items. This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteSaipDialogOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSaipConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Deleting...' : 'Delete'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog> */}
        </>
    );
}

AipSummaryTable.layout = {
    breadcrumbs: [
        { title: 'Annual Investment Programs', href: '/aip' },
        { title: 'AIP Summary', href: '#' },
    ],
};
