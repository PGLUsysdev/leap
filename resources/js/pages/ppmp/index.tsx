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
import columns from './table/columns';

import { type BreadcrumbItem } from '@/types';
import type {
    FiscalYear,
    Ppmp,
    ChartOfAccount,
    AipEntry,
    PpmpCategory,
    FundingSource,
    PriceList,
} from '@/types/global';
import {
    exportToExcel,
    exportToPDF,
    exportToPrint,
} from '@/pages/ppmp/utils/export';

import ExpenseAccountSummaryDialog from '@/pages/ppmp/expense-account-summary-dialog';
import ppmp from '@/routes/ppmp';

interface PpmpPageProps {
    fiscalYear: FiscalYear;
    aipEntry: AipEntry;
    ppmps: Ppmp[];
    priceLists: PriceList[];
    chartOfAccounts: ChartOfAccount[];
    ppmpCategories: PpmpCategory[];
    fundingSources: FundingSource[];
    initialChoice: 'MOOE' | 'CO';
    initialFund: number;
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
    initialFund,
}: PpmpPageProps) {
    const { auth } = usePage().props;

    const [open, setOpen] = useState(false);
    const [openAlert, setOpenAlert] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedSource, setSelectedSource] = useState<Ppmp | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFundingSourceId, setSelectedFundingSourceId] = useState(
        Number(initialFund) || 0,
    );
    const [selectedExpenseClass, setSelectedExpenseClass] = useState<string>(
        initialChoice || 'ALL',
    );
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

    function handleFundingSourceSelect(value: string) {
        const id = Number(value);
        setSelectedFundingSourceId(id);
    }

    const filteredPpmpItems = ppmps.filter((ppmp) => {
        const matchesFunding =
            selectedFundingSourceId === 0 ||
            ppmp.funding_source_id === selectedFundingSourceId;

        const priceList = priceLists.find(
            (pl) => pl.id === ppmp.ppmp_price_list_id,
        );

        const chartOfAccount = chartOfAccounts.find(
            (coa) => coa.id === priceList?.chart_of_account_id,
        );

        const matchesExpenseClass =
            selectedExpenseClass === 'ALL' ||
            chartOfAccount?.expense_class === selectedExpenseClass;

        return matchesFunding && matchesExpenseClass;
    });

    const filteredChartOfAccounts =
        selectedExpenseClass === 'ALL'
            ? chartOfAccounts
            : chartOfAccounts.filter(
                  (acc) => acc.expense_class === selectedExpenseClass,
              );

    const processedData = useMemo(() => {
        return filteredPpmpItems.map((item) => ({
            ...item,
            priceListDescription:
                priceLists?.find((pl) => pl.id === item.ppmp_price_list_id)
                    ?.description || '',
        }));
    }, [filteredPpmpItems, priceLists]);

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

    const handleExpenseClassChange = (value: string) => {
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
        const id = Number(value);
        setSelectedFundingSourceId(id);

        router.get(
            window.location.pathname,
            {
                choice: selectedExpenseClass,
                fund: id,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    type PpmpWithFundingSource = Ppmp & FundingSource;
    type PpmpWithFundingSourceAndPriceList = PpmpWithFundingSource & PriceList;
    type PpmpWithFundingSourceAndPriceListAndCoa =
        PpmpWithFundingSourceAndPriceList & ChartOfAccount;

    const flatPpmpWithFs: PpmpWithFundingSource[] = filteredPpmpItems.map(
        (ppmp) => {
            const fundingSource = fundingSources.find(
                (fs) => fs.id === ppmp.funding_source_id,
            );

            if (!fundingSource) {
                throw new Error(`Funding source not found for PPMP ${ppmp.id}`);
            }

            return { ...ppmp, ...fundingSource };
        },
    );

    const flatPpmpWithFsWithPl: PpmpWithFundingSourceAndPriceList[] =
        flatPpmpWithFs.map((ppmp) => {
            const priceList = priceLists.find((pl) => {
                return pl.id === ppmp.ppmp_price_list_id;
            });

            if (!priceList) {
                throw new Error(`Price list not found for PPMP ${ppmp.id}`);
            }

            return { ...ppmp, ...priceList };
        });

    const flatPpmpWithFsWithPlWithCoa: PpmpWithFundingSourceAndPriceListAndCoa[] =
        flatPpmpWithFsWithPl.map((ppmp) => {
            const chartOfAccount = chartOfAccounts.find((coa) => {
                return coa.id === ppmp.chart_of_account_id;
            });

            if (!chartOfAccount) {
                throw new Error(
                    `Chart of account not found for PPMP ${ppmp.id}`,
                );
            }

            return {
                ...ppmp,
                ...chartOfAccount,
                description: chartOfAccount.description ?? '',
            };
        });

    const groupedData: Record<
        number,
        PpmpWithFundingSourceAndPriceListAndCoa[]
    > = flatPpmpWithFsWithPlWithCoa.reduce(
        (acc, current) => {
            const key = current.chart_of_account_id;

            if (!acc[key]) {
                acc[key] = [];
            }

            acc[key].push(current);

            return acc;
        },
        {} as Record<number, PpmpWithFundingSourceAndPriceListAndCoa[]>,
    );

    const coaWithPriceLists = ppmps.reduce(
        (
            acc: (ChartOfAccount & { price_lists: (PriceList & Ppmp)[] })[],
            item,
        ) => {
            const priceList = priceLists.find(
                (pl) => pl.id === item.ppmp_price_list_id,
            );
            const coa = chartOfAccounts.find(
                (coa) => coa.id === priceList?.chart_of_account_id,
            );

            if (coa && priceList) {
                const existingCoa = acc.find((c) => c.id === coa.id);
                if (existingCoa) {
                    existingCoa.price_lists.push({ ...priceList, ...item });
                } else {
                    acc.push({
                        ...coa,
                        price_lists: [{ ...priceList, ...item }],
                    });
                }
            }

            return acc;
        },
        [],
    );

    const coaWithPriceListsByExpenseClass = ppmps.reduce(
        (
            acc: Record<
                string,
                (ChartOfAccount & { price_lists: (PriceList & Ppmp)[] })[]
            >,
            item,
        ) => {
            const priceList = priceLists.find(
                (pl) => pl.id === item.ppmp_price_list_id,
            );
            const coa = chartOfAccounts.find(
                (coa) => coa.id === priceList?.chart_of_account_id,
            );

            if (coa && priceList) {
                const expenseClass = coa.expense_class;

                if (!acc[expenseClass]) {
                    acc[expenseClass] = [];
                }

                const existingCoa = acc[expenseClass].find(
                    (c) => c.id === coa.id,
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
        },
        {} as Record<
            string,
            (ChartOfAccount & { price_lists: (PriceList & Ppmp)[] })[]
        >,
    );

    // console.log(filteredPpmpItems);
    console.log(ppmps);
    console.log(coaWithPriceLists);
    console.log(coaWithPriceListsByExpenseClass);

    const selectedFundingSource = fundingSources.find((fs) => {
        return fs.id === selectedFundingSourceId;
    });

    const priceListsWithCategory = priceLists.map((pl) => {
        const category = ppmpCategories.find(
            (cat) => cat.id === pl.ppmp_category_id,
        );

        if (!category) {
            throw new Error(`PPMP category not found for price list ${pl.id}`);
        }

        return { ...pl, ...category };
    });

    const ppmpCategoriesWithCoa = ppmpCategories
        .map((cat) => {
            const coa = filteredChartOfAccounts.find(
                (acc) => acc.id === cat.chart_of_account_id,
            );

            if (!coa) {
                return null;
            }

            const {
                id: coaId,
                description: coaDescription,
                account_number: coaAccountNumber,
                account_title: coaAccountTitle,
                account_type: coaAccountType,
                expense_class: coaExpenseClass,
                ...restCoa
            } = coa;

            return {
                ...cat,
                ...restCoa,
                coa_id: coaId,
                coa_description: coaDescription,
                coa_account_number: coaAccountNumber,
                coa_account_title: coaAccountTitle,
                coa_account_type: coaAccountType,
                coa_expense_class: coaExpenseClass,
            };
        })
        .filter((cat): cat is NonNullable<typeof cat> => cat !== null);

    const priceListsWithCoa = priceLists
        .map((pl) => {
            const coa = filteredChartOfAccounts.find(
                (acc) => acc.id === pl.chart_of_account_id,
            );

            if (!coa) {
                return null;
            }

            const {
                id: coaId,
                description: coaDescription,
                account_number: coaAccountNumber,
                account_title: coaAccountTitle,
                account_type: coaAccountType,
                expense_class: coaExpenseClass,
                ...restCoa
            } = coa;

            return {
                ...pl,
                ...restCoa,
                coa_id: coaId,
                coa_description: coaDescription,
                coa_account_number: coaAccountNumber,
                coa_account_title: coaAccountTitle,
                coa_account_type: coaAccountType,
                coa_expense_class: coaExpenseClass,
            };
        })
        .filter((pl): pl is NonNullable<typeof pl> => pl !== null);

    // console.log('coa', filteredChartOfAccounts);
    // console.log('cat', ppmpCategoriesWithCoa);
    // console.log('pricelist', priceListsWithCoa);

    // console.log(processedData);
    console.log(filteredPpmpItems);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col gap-4 p-4">
                <small className="text-sm leading-none font-medium">
                    Viewing: {aipEntry?.ppa?.name}
                </small>

                <DataTable
                    columns={columns}
                    data={processedData}
                    withSearch={true}
                    onDelete={handleDeleteDialogOpen}
                    withFooter={true}
                    negativeHeight={9.9}
                    meta={{
                        priceLists: priceLists,
                        chartOfAccounts: chartOfAccounts,
                        fundingSources: fundingSources,
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
                priceLists={priceListsWithCoa}
                ppmpCategories={ppmpCategoriesWithCoa}
                selectedEntry={aipEntry}
                fundingSources={fundingSources}
                selectedExpenseClass={selectedExpenseClass}
                selectedFundingSourceId={selectedFundingSourceId}
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
