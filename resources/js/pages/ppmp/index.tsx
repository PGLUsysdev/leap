import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, FileDown, Sheet, FileText, Printer } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectLabel,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import PpmpFormDialog from '@/pages/ppmp/form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { router, usePage } from '@inertiajs/react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataTable } from '@/components/data-table';
import columns from './columns/columns';

import { type BreadcrumbItem } from '@/types';
import type {
    FiscalYear,
    Ppmp,
    ChartOfAccount,
    AipEntry,
    PpmpCategory,
    FundingSource,
    PriceList,
    SharedData,
} from '@/types/global';
import {
    exportToExcel,
    exportToPDF,
    exportToPrint,
} from '@/pages/ppmp/utils/export';

import ExpenseAccountSummaryDialog from '@/pages/ppmp/expense-account-summary-dialog';

interface PpmpPageProps {
    fiscalYear: FiscalYear;
    aipEntry: AipEntry;
    ppmps: Ppmp[];
    priceLists: PriceList[];
    chartOfAccounts: ChartOfAccount[];
    ppmpCategories: PpmpCategory[];
    fundingSources: FundingSource[];
    initialChoice: 'MOOE' | 'CO';
    initialPpaFundingSourceId: number;
}

export default function PpmpPage({
    fiscalYear,
    aipEntry,
    ppmps,
    priceLists,
    chartOfAccounts,
    ppmpCategories,
    fundingSources,
    initialChoice,
    initialPpaFundingSourceId,
}: PpmpPageProps) {
    console.log({
        fiscalYear,
        aipEntry,
        ppmps,
        priceLists,
        chartOfAccounts,
        ppmpCategories,
        fundingSources,
        initialChoice,
        initialPpaFundingSourceId,
    });

    const { auth } = usePage<SharedData>().props;

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

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Annual Investment Programs', href: '/aip' },
        {
            title: `AIP Summary FY ${fiscalYear.year}`,
            href: `/aip/${fiscalYear.id}/summary`,
        },
        { title: `PPMP Management`, href: `#` },
    ];

    const handleExpenseClassChange = (value: 'MOOE' | 'CO') => {
        setSelectedExpenseClass(value);

        router.get(
            window.location.pathname,
            {
                choice: value,
                fund: selectedFundingSourceId,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleFundingSourceChange = (value: string) => {
        const fsId = Number(value);
        setSelectedFundingSourceId(fsId);

        const bridgeId = aipEntry.ppa_funding_sources?.find(
            (pfs) => pfs.funding_source_id === fsId,
        )?.id;

        router.get(
            window.location.pathname,
            {
                choice: selectedExpenseClass,
                ppa_funding_source_id: bridgeId,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const filteredPpmpItems = ppmps.filter((ppmp) => {
        const matchesFunding =
            ppmp.ppa_funding_source?.funding_source_id ===
            selectedFundingSourceId;

        const matchesExpenseClass =
            ppmp.ppmp_price_list?.chart_of_account?.expense_class ===
            selectedExpenseClass;

        return matchesFunding && matchesExpenseClass;
    });

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

    // console.log(ppmpCategories);
    // console.log(priceLists);

    const filteredChartOfAccounts = useMemo(() => {
        return chartOfAccounts.filter(
            (coa) => coa.expense_class === selectedExpenseClass,
        );
    }, [chartOfAccounts, selectedExpenseClass]);

    // ---

    const coaWithPriceListsByExpenseClass = useMemo(() => {
        return filteredPpmpItems.reduce((acc: any, item) => {
            // Correctly navigate the relationship: PPMP -> PriceList -> COA
            const priceList = item.ppmp_price_list;
            const coa = priceList?.chart_of_account;

            if (coa && priceList) {
                const expenseClass = coa.expense_class;
                if (!acc[expenseClass]) acc[expenseClass] = [];

                const existingCoa = acc[expenseClass].find(
                    (c: any) => c.id === coa.id,
                );

                if (existingCoa) {
                    existingCoa.price_lists.push({ ...priceList, ...item });
                } else {
                    acc[expenseClass].push({
                        ...coa,
                        price_lists: [{ ...priceList, ...item }],
                    });
                }
            }
            return acc;
        }, {});
    }, [filteredPpmpItems]);

    const selectedFundingSource = fundingSources.find((fs) => {
        return fs.id === selectedFundingSourceId;
    });

    const currentPpaFundingSourceId = useMemo(() => {
        // Look for the record in the pivot/bridge table
        const bridge = aipEntry.ppa_funding_sources?.find(
            (pfs) => pfs.funding_source_id === selectedFundingSourceId,
        );
        return bridge?.id; // This is the primary key of ppa_funding_sources
    }, [aipEntry.ppa_funding_sources, selectedFundingSourceId]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col gap-4 p-4">
                <small className="text-sm leading-none font-medium">
                    Viewing: {aipEntry?.ppa?.name}
                </small>

                <DataTable
                    columns={columns}
                    data={filteredPpmpItems}
                    withSearch={true}
                    withFooter={true}
                    negativeHeight={9.9}
                    onDelete={handleDeleteDialogOpen}
                    // meta={{
                    //     priceLists: priceLists,
                    //     chartOfAccounts: chartOfAccounts,
                    //     fundingSources: fundingSources,
                    // }}
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
                                    {fundingSources.map((fs) => (
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
                                                      aipEntry,
                                                      fundingSources,
                                                      selectedFundingSourceId,
                                                      auth,
                                                      fiscalYear,
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
                                                      aipEntry,
                                                      fundingSources,
                                                      selectedFundingSourceId,
                                                      auth,
                                                      fiscalYear,
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
                                                      aipEntry,
                                                      fundingSources,
                                                      selectedFundingSourceId,
                                                      auth,
                                                      fiscalYear,
                                                  })
                                                : setOpenAlert(true)
                                        }
                                    >
                                        <Sheet /> To Excel
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            onClick={() =>
                                setOpenExpenseAccountSummaryDialog(true)
                            }
                        >
                            Expense Account Summary per PPMP
                        </Button>

                        <Button onClick={() => setOpen(true)}>
                            <Plus /> Add Item
                        </Button>
                    </div>
                </DataTable>
            </div>

            <PpmpFormDialog
                open={open}
                onOpenChange={setOpen}
                chartOfAccounts={filteredChartOfAccounts}
                ppmpCategories={ppmpCategories}
                priceLists={priceLists}
                selectedEntry={aipEntry}
                fundingSources={fundingSources}
                selectedExpenseClass={selectedExpenseClass}
                selectedFundingSourceId={selectedFundingSourceId}
                ppaFundingSourceId={currentPpaFundingSourceId}
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
                coaWithPriceListsByExpenseClass={
                    coaWithPriceListsByExpenseClass
                }
                aipEntry={aipEntry}
                fundingSource={selectedFundingSource}
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
        </AppLayout>
    );
}
