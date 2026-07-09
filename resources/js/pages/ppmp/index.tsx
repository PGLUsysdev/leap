import { router, usePage } from '@inertiajs/react';
import { Decimal } from 'decimal.js';
import { Plus, FileDown, Sheet, FileText, Printer } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import { DeleteDialog } from '@/components/delete-dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectLabel,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExpenseAccountSummaryDialog from '@/pages/ppmp/expense-account-summary-dialog';
import PpmpFormDialog from '@/pages/ppmp/form-dialog';
import NewPpmpFormDialog from '@/pages/ppmp/new-ppmp-form-dialog';
import {
    exportToExcel,
    exportToPDF,
    exportToPrint,
} from '@/pages/ppmp/utils/export';
import { index, summary } from '@/routes/aip';
import type {
    FiscalYear,
    Ppmp,
    ChartOfAccount,
    AipEntry,
    PpmpCategory,
    FundingSource,
    PriceList,
    SharedData,
} from '@/types';
import columns from './columns/columns';

interface PpmpPageProps {
    fiscalYear: FiscalYear;
    aipEntry: AipEntry;
    allAipEntries?: AipEntry[];
    ppmps: Ppmp[];
    isSupplemental?: boolean;
    priceLists: PriceList[];
    chartOfAccounts: ChartOfAccount[];
    ppmpCategories: PpmpCategory[];
    fundingSources: FundingSource[];
    currentTab: string;
    initialChoice: 'MOOE' | 'CO';
    initialPpaFundingSourceId: number;
    can?: {
        addPriceList: boolean;
        viewSupplemental: boolean;
        export: boolean;
        generateSummary: boolean;
        showSummaryAll?: boolean;
    };
    selectedOfficeId?: string;
}

export default function PpmpPage({
    fiscalYear,
    aipEntry,
    allAipEntries = [],
    ppmps,
    isSupplemental = false,
    priceLists,
    chartOfAccounts,
    ppmpCategories,
    fundingSources,
    initialChoice,
    initialPpaFundingSourceId,
    currentTab,
    can,
    selectedOfficeId,
}: PpmpPageProps) {
    const { auth } = usePage<SharedData>().props;

    const buildQuery = (extra: Record<string, any> = {}) => {
        const query = { ...extra };

        if (can?.showSummaryAll && selectedOfficeId) {
            query.selected_office_id = selectedOfficeId;
        }

        return query;
    };

    const initialFsId = useMemo(() => {
        const bridge = aipEntry.ppa_funding_sources?.find(
            (pfs) => pfs.id === Number(initialPpaFundingSourceId),
        );

        return bridge?.funding_source_id || 0;
    }, [aipEntry, initialPpaFundingSourceId]);

    const [selectedExpenseClass, setSelectedExpenseClass] =
        useState(initialChoice);
    const [selectedFundingSourceId, setSelectedFundingSourceId] =
        useState(initialFsId);

    const [open, setOpen] = useState(false);
    const [openAlert, setOpenAlert] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedSource, setSelectedSource] = useState<Ppmp | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [
        openExpenseAccountSummaryDialog,
        setOpenExpenseAccountSummaryDialog,
    ] = useState(false);
    const [openNewPpmpForm, setOpenNewPpmpForm] = useState(false);

    const activeAipEntry = useMemo(() => {
        if (currentTab === 'original') {
            return allAipEntries.find((e) => !e.supplemental_aip_id);
        }

        if (currentTab.startsWith('supplemental_')) {
            const entryId = Number(currentTab.replace('supplemental_', ''));

            return allAipEntries.find((e) => e.id === entryId);
        }

        return null;
    }, [currentTab, allAipEntries]);

    const isActiveTab = useMemo(() => {
        return currentTab !== 'combined';
    }, [currentTab]);

    const activeFundingSources = useMemo(() => {
        if (currentTab === 'combined') {
            return fundingSources;
        }

        const currentEntry = activeAipEntry || aipEntry;
        const entryFsIds = new Set(
            currentEntry?.ppa_funding_sources?.map(
                (pfs) => pfs.funding_source_id,
            ) || [],
        );

        return fundingSources.filter((fs) => entryFsIds.has(fs.id));
    }, [currentTab, activeAipEntry, aipEntry, fundingSources]);

    useEffect(() => {
        if (activeFundingSources.length > 0) {
            const hasSelected = activeFundingSources.some(
                (fs) => fs.id === selectedFundingSourceId,
            );

            if (!hasSelected) {
                const nextFsId = activeFundingSources[0].id;

                setSelectedFundingSourceId(nextFsId);

                const bridgeId = (
                    activeAipEntry || aipEntry
                ).ppa_funding_sources?.find(
                    (pfs) => pfs.funding_source_id === nextFsId,
                )?.id;

                router.get(
                    window.location.pathname,
                    buildQuery({
                        choice: selectedExpenseClass,
                        ppa_funding_source_id: bridgeId,
                        tab: currentTab,
                    }),
                    { preserveState: true, replace: true },
                );
            }
        }
    }, [
        currentTab,
        activeFundingSources,
        selectedFundingSourceId,
        activeAipEntry,
        aipEntry,
        selectedExpenseClass,
    ]);

    const hasSupplementalEntries = useMemo(() => {
        if (!can?.viewSupplemental) {
            return false;
        }

        return allAipEntries.some(
            (e) =>
                e.supplemental_aip_id &&
                (e.ppa_funding_sources?.length ?? 0) > 0,
        );
    }, [allAipEntries, can?.viewSupplemental]);

    const tabsList = useMemo(() => {
        const list: { value: string; label: string }[] = [];
        list.push({ value: 'original', label: 'Original' });
        allAipEntries.forEach((entry) => {
            if (
                entry.supplemental_aip_id &&
                (entry.ppa_funding_sources?.length ?? 0) > 0
            ) {
                const name = entry.supplemental_aip?.name || 'Supplemental';
                list.push({
                    value: `supplemental_${entry.id}`,
                    label: name.replace('AIP', 'PPMP'),
                });
            }
        });
        list.push({ value: 'combined', label: 'Combined' });

        return list;
    }, [allAipEntries]);

    const summaryHref = useMemo(() => {
        let href = `/aip/${fiscalYear.id}/summary`;

        if (can?.showSummaryAll && selectedOfficeId) {
            href += `?selected_office_id=${selectedOfficeId}`;
        }

        return href;
    }, [fiscalYear.id, can?.showSummaryAll, selectedOfficeId]);

    const handleExpenseClassChange = (value: 'MOOE' | 'CO') => {
        setSelectedExpenseClass(value);
        router.get(
            window.location.pathname,
            buildQuery({
                choice: value,
                ppa_funding_source_id: currentPpaFundingSourceId,
            }),
            { preserveState: true, replace: true },
        );
    };

    const handleFundingSourceChange = (value: string) => {
        const fsId = Number(value);
        setSelectedFundingSourceId(fsId);
        const bridgeId = (activeAipEntry || aipEntry).ppa_funding_sources?.find(
            (pfs) => pfs.funding_source_id === fsId,
        )?.id;
        router.get(
            window.location.pathname,
            buildQuery({
                choice: selectedExpenseClass,
                ppa_funding_source_id: bridgeId,
            }),
            { preserveState: true, replace: true },
        );
    };

    const activePpmpItems = useMemo(() => {
        if (currentTab === 'combined') {
            return ppmps;
        }

        if (currentTab === 'original') {
            const origEntry = allAipEntries.find((e) => !e.supplemental_aip_id);

            if (!origEntry) {
                return [];
            }

            return ppmps.filter(
                (item) =>
                    item.ppa_funding_source?.aip_entry_id === origEntry.id,
            );
        }

        if (currentTab.startsWith('supplemental_')) {
            const entryId = Number(currentTab.replace('supplemental_', ''));

            return ppmps.filter(
                (item) => item.ppa_funding_source?.aip_entry_id === entryId,
            );
        }

        return [];
    }, [currentTab, ppmps, allAipEntries]);

    const filteredPpmpItems = useMemo(() => {
        const items = activePpmpItems.filter((ppmp) => {
            const matchesFunding =
                ppmp.ppa_funding_source?.funding_source_id ===
                selectedFundingSourceId;

            const matchesExpenseClass =
                ppmp.ppmp_price_list?.chart_of_account_ppmp_category
                    ?.chart_of_account?.expense_class === selectedExpenseClass;

            return matchesFunding && matchesExpenseClass;
        });

        if (currentTab === 'combined') {
            const grouped = new Map<number, Ppmp[]>();
            items.forEach((item) => {
                const key = item.ppmp_price_list_id;

                if (!key) {
                    return;
                }

                const list = grouped.get(key) || [];
                list.push(item);
                grouped.set(key, list);
            });

            return Array.from(grouped.values()).map((list) => {
                const base = { ...list[0] };
                const months = [
                    'jan',
                    'feb',
                    'mar',
                    'apr',
                    'may',
                    'jun',
                    'jul',
                    'aug',
                    'sep',
                    'oct',
                    'nov',
                    'dec',
                ];

                months.forEach((m) => {
                    const qtyKey = `${m}_qty`;
                    const amtKey = `${m}_amount`;

                    let totalQty = 0;
                    let totalAmt = new Decimal(0);

                    list.forEach((item) => {
                        totalQty += Number((item as any)[qtyKey] || 0);
                        totalAmt = totalAmt.plus(
                            new Decimal((item as any)[amtKey] || 0),
                        );
                    });

                    (base as any)[qtyKey] = totalQty;
                    (base as any)[amtKey] = totalAmt.toString();
                });

                base.isCombined = true;

                return base;
            });
        }

        return items;
    }, [
        activePpmpItems,
        selectedFundingSourceId,
        selectedExpenseClass,
        currentTab,
    ]);

    function handleDeleteDialogOpen(source: Ppmp) {
        setSelectedSource(source);
        setIsDeleteDialogOpen(true);
    }

    function handleDelete() {
        router.delete(`/ppmp/${selectedSource?.id}`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setSelectedSource(null);
            },
            onFinish: () => setIsLoading(false),
        });
    }

    const filteredChartOfAccounts = useMemo(() => {
        return chartOfAccounts.filter(
            (coa) => coa.expense_class === selectedExpenseClass,
        );
    }, [chartOfAccounts, selectedExpenseClass]);

    const selectedFundingSource = fundingSources.find((fs) => {
        return fs.id === selectedFundingSourceId;
    });

    const currentPpaFundingSourceId = useMemo(() => {
        // Look for the record in the pivot/bridge table
        const bridge = (activeAipEntry || aipEntry).ppa_funding_sources?.find(
            (pfs) => pfs.funding_source_id === selectedFundingSourceId,
        );

        return bridge?.id; // This is the primary key of ppa_funding_sources
    }, [activeAipEntry, aipEntry, selectedFundingSourceId]);

    const allPpmpItemsForFundingSource = useMemo(() => {
        if (!selectedFundingSourceId) {
            return [];
        }

        return activePpmpItems.filter(
            (ppmp) =>
                ppmp.ppa_funding_source?.funding_source_id ===
                selectedFundingSourceId,
        );
    }, [activePpmpItems, selectedFundingSourceId]);

    return (
        <>
            <div className="flex flex-col gap-4 pt-4">
                <div
                    // className="flex flex-wrap items-center justify-between gap-4"
                    className="flex flex-col gap-2 px-4"
                >
                    <small className="text-sm leading-none font-medium">
                        Viewing: {aipEntry?.ppa?.name}
                    </small>

                    {/*{hasSupplementalEntries && (*/}
                    <Tabs
                        value={currentTab}
                        onValueChange={(val: any) => {
                            const query: Record<string, any> = { tab: val };

                            // Keep the selected office for super admins
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
                    </Tabs>
                    {/*)}*/}
                </div>

                <DataTable
                    columns={columns}
                    data={filteredPpmpItems}
                    withSearch={true}
                    withFooter={true}
                    negativeHeight={11.4}
                    onDelete={handleDeleteDialogOpen}
                    meta={{
                        readOnly: !isActiveTab,
                    }}
                >
                    <div className="flex gap-2">
                        <Select
                            onValueChange={handleExpenseClassChange}
                            value={selectedExpenseClass}
                        >
                            <SelectTrigger className="w-full max-w-40 min-w-30">
                                <SelectValue placeholder="Expense Class" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Expense Class</SelectLabel>
                                    <SelectItem value="MOOE">MOOE</SelectItem>
                                    <SelectItem value="CO">CO</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        <Select
                            onValueChange={handleFundingSourceChange}
                            defaultValue={String(selectedFundingSourceId)}
                        >
                            <SelectTrigger className="w-full max-w-48 min-w-30">
                                <SelectValue placeholder="Select funding source">
                                    {selectedFundingSourceId && (
                                        <span>
                                            {
                                                fundingSources.find(
                                                    (fs) =>
                                                        fs.id ===
                                                        selectedFundingSourceId,
                                                )?.code
                                            }
                                        </span>
                                    )}
                                </SelectValue>
                            </SelectTrigger>

                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Funding Sources</SelectLabel>
                                    {activeFundingSources.map((fs) => (
                                        <SelectItem
                                            key={fs.id}
                                            value={String(fs.id)}
                                            className="gap-4"
                                        >
                                            <div className="flex gap-4">
                                                <span className="bg-muted font-mono">
                                                    {fs.code}
                                                </span>
                                                <div className="w-80">
                                                    {fs.title}
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>

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
                                                          ppmpCategories,
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
                                                          ppmpCategories,
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
                                                          ppmpCategories,
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
                    </div>
                </DataTable>
            </div>

            <PpmpFormDialog
                open={open}
                onOpenChange={setOpen}
                chartOfAccounts={filteredChartOfAccounts}
                ppmpCategories={ppmpCategories}
                priceLists={priceLists}
                selectedEntry={activeAipEntry || aipEntry}
                fundingSources={fundingSources}
                selectedExpenseClass={selectedExpenseClass}
                selectedFundingSourceId={selectedFundingSourceId}
                ppaFundingSourceId={currentPpaFundingSourceId}
                existingPpmps={ppmps}
            />

            <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
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
            />
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
