import { Check, Filter } from 'lucide-react';
import { useMemo, useState } from 'react';
import DataTable from '@/components/base-ui-components/data-table';
import { Badge } from '@/components/base-ui-components/ui/badge';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/base-ui-components/ui/dropdown-menu';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
import { Spinner } from '@/components/base-ui-components/ui/spinner';
import FormDialog from '@/pages/ppmp/form-dialog';
import { index, summary } from '@/routes/aip';
import type {
    AipEntry,
    ChartOfAccount,
    FiscalYear,
    PpaFundingSource,
    PpmpCategory,
    PriceList,
    Ppmp,
    PaginatedResponse,
    // FundingSource,
    // SharedData,
} from '@/types';
import ppmpColumns from './columns/ppmp-columns';
// import { router, usePage } from '@inertiajs/react';
// import { Decimal } from 'decimal.js';
// import { Loader2 } from 'lucide-react';
// import { DeleteDialog } from '@/components/delete-dialog';
// import {
//     AlertDialog,
//     AlertDialogAction,
//     AlertDialogContent,
//     AlertDialogDescription,
//     AlertDialogFooter,
//     AlertDialogHeader,
//     AlertDialogTitle,
// } from '@/components/ui/alert-dialog';
// import { Button } from '@/components/ui/button';
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuGroup,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import ExpenseAccountSummaryDialog from '@/pages/ppmp/expense-account-summary-dialog';
// import NewPpmpFormDialog from '@/pages/ppmp/new-ppmp-form-dialog';
// import {
//     exportToExcel,
//     exportToPDF,
//     exportToPrint,
// } from '@/pages/ppmp/utils/export';
// import columns from './columns/columns';

interface PpmpPageProps {
    aipEntry: AipEntry;
    categories: PaginatedResponse<PpmpCategory>;
    chartOfAccounts: PaginatedResponse<ChartOfAccount>;
    fiscalYear: FiscalYear;
    ppaFundingSource: PpaFundingSource;
    ppmpItems: Ppmp[];
    priceLists: PaginatedResponse<PriceList>;

    // fiscalYear: FiscalYear;
    // allAipEntries?: AipEntry[];
    // fundingSources: FundingSource[];
    // currentTab: string;
    // initialChoice: 'MOOE' | 'CO';
    // initialPpaFundingSourceId: number;
    // can?: {
    //     addPriceList: boolean;
    //     viewSupplemental: boolean;
    //     export: boolean;
    //     generateSummary: boolean;
    //     showSummaryAll?: boolean;
    // };
    // selectedOfficeId?: string;
    // fundingSourceId: number;
    // fundingSource: FundingSource;
}

export default function PpmpPage({
    aipEntry,
    categories,
    chartOfAccounts,
    fiscalYear,
    ppaFundingSource,
    ppmpItems,
    priceLists,

    // fiscalYear,
    // allAipEntries = [],
    // ppmps,
    // fundingSources,
    // initialChoice,
    // initialPpaFundingSourceId,
    // currentTab,
    // can,
    // selectedOfficeId,
    // fundingSourceId,
    // isSupplemental = false,
}: PpmpPageProps) {
    // Counter so editing multiple cells at once keeps the indicator on
    const [savingCount, setSavingCount] = useState(0);
    const isSaving = savingCount > 0;
    const [openFormDialog, setOpenFormDialog] = useState(false);

    // View filter: show all items, or only MOOE/CO expense-class items
    const [expenseClassFilter, setExpenseClassFilter] = useState<
        'ALL' | 'MOOE' | 'CO'
    >('ALL');

    const filteredPpmpItems = useMemo(() => {
        if (expenseClassFilter === 'ALL') {
            return ppmpItems;
        }

        return ppmpItems.filter(
            (item) =>
                item.ppmp_price_list?.chart_of_account_ppmp_category
                    ?.chart_of_account?.expense_class === expenseClassFilter,
        );
    }, [ppmpItems, expenseClassFilter]);

    const filterLabel = {
        ALL: 'All items',
        MOOE: 'MOOE only',
        CO: 'CO only',
    }[expenseClassFilter];

    // const { auth } = usePage<SharedData>().props;

    // const buildQuery = (extra: Record<string, any> = {}) => {
    //     const query = { ...extra };

    //     if (can?.showSummaryAll && selectedOfficeId) {
    //         query.selected_office_id = selectedOfficeId;
    //     }

    //     return query;
    // };

    // const initialFsId = useMemo(() => {
    //     const bridge = aipEntry.ppa_funding_sources?.find(
    //         (pfs) => pfs.id === Number(initialPpaFundingSourceId),
    //     );

    //     return bridge?.funding_source_id || 0;
    // }, [aipEntry, initialPpaFundingSourceId]);

    // const [selectedFundingSourceId, setSelectedFundingSourceId] =
    //     useState(fundingSourceId);

    // const [open, setOpen] = useState(false);
    // const [openAlert, setOpenAlert] = useState(false);
    // const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    // const [selectedSource, setSelectedSource] = useState<Ppmp | null>(null);
    // const [isLoading, setIsLoading] = useState(false);
    // const [
    //     openExpenseAccountSummaryDialog,
    //     setOpenExpenseAccountSummaryDialog,
    // ] = useState(false);
    // const [openNewPpmpForm, setOpenNewPpmpForm] = useState(false);

    // const activeAipEntry = useMemo(() => {
    //     if (currentTab === 'original') {
    //         return allAipEntries.find((e) => !e.supplemental_aip_id);
    //     }

    //     if (currentTab.startsWith('supplemental_')) {
    //         const entryId = Number(currentTab.replace('supplemental_', ''));

    //         return allAipEntries.find((e) => e.id === entryId);
    //     }

    //     return null;
    // }, [currentTab, allAipEntries]);

    // const isActiveTab = useMemo(() => {
    //     return currentTab !== 'combined';
    // }, [currentTab]);

    // const activeFundingSources = useMemo(() => {
    //     if (currentTab === 'combined') {
    //         return fundingSources;
    //     }

    //     const currentEntry = activeAipEntry || aipEntry;
    //     const entryFsIds = new Set(
    //         currentEntry?.ppa_funding_sources?.map(
    //             (pfs) => pfs.funding_source_id,
    //         ) || [],
    //     );

    //     return fundingSources.filter((fs) => entryFsIds.has(fs.id));
    // }, [currentTab, activeAipEntry, aipEntry, fundingSources]);

    // const effectiveFsId = useMemo(() => {
    //     if (activeFundingSources.length === 0) {
    //         return selectedFundingSourceId;
    //     }

    //     return activeFundingSources.some(
    //         (fs) => fs.id === selectedFundingSourceId,
    //     )
    //         ? selectedFundingSourceId
    //         : activeFundingSources[0].id;
    // }, [activeFundingSources, selectedFundingSourceId]);

    // if (effectiveFsId !== selectedFundingSourceId) {
    //     setSelectedFundingSourceId(effectiveFsId);
    // }

    // const tabsList = useMemo(() => {
    //     const list: { value: string; label: string }[] = [];
    //     list.push({ value: 'original', label: 'Original' });
    //     allAipEntries.forEach((entry) => {
    //         if (
    //             entry.supplemental_aip_id &&
    //             (entry.ppa_funding_sources?.length ?? 0) > 0
    //         ) {
    //             const name = entry.supplemental_aip?.name || 'Supplemental';
    //             list.push({
    //                 value: `supplemental_${entry.id}`,
    //                 label: name.replace('AIP', 'PPMP'),
    //             });
    //         }
    //     });
    //     list.push({ value: 'combined', label: 'Combined' });

    //     return list;
    // }, [allAipEntries]);

    // const activePpmpItems = useMemo(() => {
    //     if (currentTab === 'combined') {
    //         return ppmps;
    //     }

    //     if (currentTab === 'original') {
    //         const origEntry = allAipEntries.find((e) => !e.supplemental_aip_id);

    //         if (!origEntry) {
    //             return [];
    //         }

    //         return ppmps.filter(
    //             (item) =>
    //                 item.ppa_funding_source?.aip_entry_id === origEntry.id,
    //         );
    //     }

    //     if (currentTab.startsWith('supplemental_')) {
    //         const entryId = Number(currentTab.replace('supplemental_', ''));

    //         return ppmps.filter(
    //             (item) => item.ppa_funding_source?.aip_entry_id === entryId,
    //         );
    //     }

    //     return [];
    // }, [currentTab, ppmps, allAipEntries]);

    // const filteredPpmpItems = useMemo(() => {
    //     const items = activePpmpItems.filter((ppmp) => {
    //         const matchesFunding =
    //             ppmp.ppa_funding_source?.funding_source_id ===
    //             selectedFundingSourceId;

    //         return matchesFunding;
    //     });

    //     if (currentTab === 'combined') {
    //         const grouped = new Map<number, Ppmp[]>();
    //         items.forEach((item) => {
    //             const key = item.ppmp_price_list_id;

    //             if (!key) {
    //                 return;
    //             }

    //             const list = grouped.get(key) || [];
    //             list.push(item);
    //             grouped.set(key, list);
    //         });

    //         return Array.from(grouped.values()).map((list) => {
    //             const base = { ...list[0] };
    //             const months = [
    //                 'jan',
    //                 'feb',
    //                 'mar',
    //                 'apr',
    //                 'may',
    //                 'jun',
    //                 'jul',
    //                 'aug',
    //                 'sep',
    //                 'oct',
    //                 'nov',
    //                 'dec',
    //             ];

    //             months.forEach((m) => {
    //                 const qtyKey = `${m}_qty`;
    //                 const amtKey = `${m}_amount`;

    //                 let totalQty = 0;
    //                 let totalAmt = new Decimal(0);

    //                 list.forEach((item) => {
    //                     totalQty += Number((item as any)[qtyKey] || 0);
    //                     totalAmt = totalAmt.plus(
    //                         new Decimal((item as any)[amtKey] || 0),
    //                     );
    //                 });

    //                 (base as any)[qtyKey] = totalQty;
    //                 (base as any)[amtKey] = totalAmt.toString();
    //             });

    //             base.isCombined = true;

    //             return base;
    //         });
    //     }

    //     return items;
    // }, [activePpmpItems, selectedFundingSourceId, currentTab]);

    // function handleDeleteDialogOpen(source: Ppmp) {
    //     setSelectedSource(source);
    //     setIsDeleteDialogOpen(true);
    // }

    // function handleDelete() {
    //     router.delete(`/ppmp/${selectedSource?.id}`, {
    //         preserveState: true,
    //         preserveScroll: true,
    //         onStart: () => setIsLoading(true),
    //         onSuccess: () => {
    //             setIsDeleteDialogOpen(false);
    //             setSelectedSource(null);
    //         },
    //         onFinish: () => setIsLoading(false),
    //     });
    // }

    // const selectedFundingSource = fundingSources.find((fs) => {
    //     return fs.id === selectedFundingSourceId;
    // });

    // const currentPpaFundingSourceId = useMemo(() => {
    //     // Look for the record in the pivot/bridge table
    //     const bridge = (activeAipEntry || aipEntry).ppa_funding_sources?.find(
    //         (pfs) => pfs.funding_source_id === selectedFundingSourceId,
    //     );

    //     return bridge?.id; // This is the primary key of ppa_funding_sources
    // }, [activeAipEntry, aipEntry, selectedFundingSourceId]);

    // const allPpmpItemsForFundingSource = useMemo(() => {
    //     if (!selectedFundingSourceId) {
    //         return [];
    //     }

    //     return activePpmpItems.filter(
    //         (ppmp) =>
    //             ppmp.ppa_funding_source?.funding_source_id ===
    //             selectedFundingSourceId,
    //     );
    // }, [activePpmpItems, selectedFundingSourceId]);

    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <div
                    // className="flex flex-wrap items-center justify-between gap-4"
                    className="flex flex-col gap-2 px-4 pt-4"
                >
                    <div className="flex w-full items-center justify-between">
                        <div>
                            <div className="text-sm">
                                {aipEntry?.ppa?.office?.acronym || 'N/A'}
                            </div>
                            <div className="text-sm">
                                {ppaFundingSource.funding_source?.code || 'N/A'}
                            </div>
                            <div className="text-sm">aip reference code</div>
                            <div className="text-sm">{aipEntry?.ppa?.name}</div>
                        </div>
                    </div>

                    {/* hide these for now */}
                    {/*{hasSupplementalEntries && (*/}
                    {/*<Tabs
                        value={currentTab}
                        onValueChange={(val: any) => {
                            const newEntry =
                                val === 'original'
                                    ? allAipEntries.find(
                                          (e) => !e.supplemental_aip_id,
                                      )
                                    : val.startsWith('supplemental_')
                                      ? allAipEntries.find(
                                            (e) =>
                                                e.id ===
                                                Number(
                                                    val.replace(
                                                        'supplemental_',
                                                        '',
                                                    ),
                                                ),
                                        )
                                      : null;

                            const newActiveSources =
                                val === 'combined'
                                    ? fundingSources
                                    : fundingSources.filter((fs) =>
                                          (
                                              newEntry || aipEntry
                                          )?.ppa_funding_sources?.some(
                                              (pfs) =>
                                                  pfs.funding_source_id ===
                                                  fs.id,
                                          ),
                                      );

                            const nextFsId = newActiveSources[0]?.id;
                            const bridgeId = (
                                newEntry || aipEntry
                            )?.ppa_funding_sources?.find(
                                (pfs) => pfs.funding_source_id === nextFsId,
                            )?.id;

                            const query: Record<string, any> = {
                                tab: val,
                                ppa_funding_source_id: bridgeId,
                            };

                            if (can?.showSummaryAll && selectedOfficeId) {
                                query.selected_office_id = selectedOfficeId;
                            }

                            router.get(window.location.pathname, query, {
                                preserveState: true,
                                preserveScroll: true,
                                replace: true,
                            });
                        }}
                        className="w-auto"
                    >
                        <TabsList
                            className="grid gap-1"
                            style={{
                                gridTemplateColumns: `repeat(${tabsList.length}, minmax(0, 1fr))`,
                            }}
                        >
                            {tabsList.map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    disabled={
                                        tab.value.startsWith('supplemental_') &&
                                        !can?.viewSupplemental
                                    }
                                >
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>*/}
                    {/*)}*/}
                </div>

                <DataTable
                    className="pr-2"
                    columns={ppmpColumns}
                    data={filteredPpmpItems}
                    showFooter={true}
                    meta={{
                        year: fiscalYear,
                        onSavingChange: (saving: boolean) =>
                            setSavingCount((c) =>
                                Math.max(0, c + (saving ? 1 : -1)),
                            ),
                        //readOnly: !isActiveTab,
                        //onDelete: handleDeleteDialogOpen,
                    }}
                >
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button variant="outline" size="sm">
                                        <Filter /> {filterLabel}
                                    </Button>
                                }
                            />
                            <DropdownMenuContent align="end">
                                <DropdownMenuRadioGroup
                                    value={expenseClassFilter}
                                    onValueChange={(value) =>
                                        setExpenseClassFilter(
                                            value as 'ALL' | 'MOOE' | 'CO',
                                        )
                                    }
                                >
                                    <DropdownMenuRadioItem
                                        value="ALL"
                                        closeOnClick
                                    >
                                        All items
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                        value="MOOE"
                                        closeOnClick
                                    >
                                        MOOE only
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                        value="CO"
                                        closeOnClick
                                    >
                                        CO only
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button onClick={() => setOpenFormDialog(true)}>
                            Add Price List
                        </Button>

                        {isSaving ? (
                            <Badge variant="secondary">
                                <Spinner />
                                Saving…
                            </Badge>
                        ) : (
                            <Badge variant="ghost">
                                <Check />
                                Saved
                            </Badge>
                        )}
                    </div>
                    {/* <div className="flex items-center gap-1">
                        {can?.export && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <FileDown /> Export
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent>
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                selectedFundingSourceId
                                                    ? exportToPrint({
                                                          filteredPpmpItems,
                                                          priceLists,
                                                          categories,
                                                          chartOfAccounts,
                                                          aipEntry:
                                                              activeAipEntry ||
                                                              aipEntry,
                                                          fundingSources,
                                                          selectedFundingSourceId,
                                                          auth,
                                                          fiscalYear,
                                                          currentTab,
                                                      })
                                                    : setOpenAlert(true)
                                            }
                                        >
                                            <Printer /> Print
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() =>
                                                selectedFundingSourceId
                                                    ? exportToPDF({
                                                          filteredPpmpItems,
                                                          priceLists,
                                                          categories,
                                                          chartOfAccounts,
                                                          aipEntry:
                                                              activeAipEntry ||
                                                              aipEntry,
                                                          fundingSources,
                                                          selectedFundingSourceId,
                                                          auth,
                                                          fiscalYear,
                                                          currentTab,
                                                      })
                                                    : setOpenAlert(true)
                                            }
                                        >
                                            <FileText /> To PDF
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() =>
                                                selectedFundingSourceId
                                                    ? exportToExcel({
                                                          filteredPpmpItems,
                                                          priceLists,
                                                          categories,
                                                          chartOfAccounts,
                                                          aipEntry:
                                                              activeAipEntry ||
                                                              aipEntry,
                                                          fundingSources,
                                                          selectedFundingSourceId,
                                                          auth,
                                                          fiscalYear,
                                                          currentTab,
                                                      })
                                                    : setOpenAlert(true)
                                            }
                                        >
                                            <Sheet /> To Excel
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() =>
                                                setOpenNewPpmpForm(true)
                                            }
                                        >
                                            <FileText /> New PPMP Form
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {can?.generateSummary && (
                            <Button
                                onClick={() =>
                                    setOpenExpenseAccountSummaryDialog(true)
                                }
                            >
                                Expense Account Summary per PPMP
                            </Button>
                        )}

                        {isActiveTab && can?.addPriceList && (
                            <Button onClick={() => setOpen(true)}>
                                <Plus /> Add Item
                            </Button>
                        )}
                    </div> */}
                </DataTable>

                <ScrollBar orientation="vertical" />
            </ScrollArea>

            <FormDialog
                open={openFormDialog}
                onOpenChange={setOpenFormDialog}
                chartOfAccounts={chartOfAccounts}
                categories={categories}
                priceLists={priceLists}
                // selectedEntry={activeAipEntry || aipEntry}
                // fundingSources={fundingSources}
                // selectedFundingSourceId={selectedFundingSourceId}
                // ppaFundingSourceId={currentPpaFundingSourceId}
                // existingPpmps={ppmps}
            />

            {/* <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Funding Source Required
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            You must select a valid funding source before you
                            can export this document. Please choose one from the
                            list and try again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setOpenAlert(false)}>
                            Got it
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ExpenseAccountSummaryDialog
                open={openExpenseAccountSummaryDialog}
                onOpenChange={setOpenExpenseAccountSummaryDialog}
                ppmps={allPpmpItemsForFundingSource}
                aipEntry={activeAipEntry || aipEntry}
                fundingSource={selectedFundingSource}
                auth={auth}
            />

            <NewPpmpFormDialog
                open={openNewPpmpForm}
                onOpenChange={setOpenNewPpmpForm}
            />

            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Remove from AIP Summary?"
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <span className="font-bold text-foreground">
                            "{selectedSource?.ppmp_price_list?.description}"
                        </span>
                        ?
                    </>
                }
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedSource(null);
                }}
                isLoading={isLoading}
            />*/}
        </>
    );
}

PpmpPage.layout = ({ fiscalYear }: PpmpPageProps) => ({
    breadcrumbs: [
        { title: 'Annual Investment Programs', href: index() },
        {
            title: `AIP Summary FY ${fiscalYear.year}`,
            href: summary({ fiscalYear: fiscalYear.id }),
        },
        { title: 'PPMP Management', href: '#' },
    ],
});
