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
    console.log(auth);

    console.log({
        aipEntry,
        //     priceLists,
        //     chartOfAccounts,
        //     ppmpCategories,
        //     ppmps,
        //     fundingSources,
    });

    const [open, setOpen] = useState(false);
    const [openAlert, setOpenAlert] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedSource, setSelectedSource] = useState<Ppmp | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFundingSource, setSelectedFundingSource] = useState(
        Number(initialFund) || 0,
    );
    const [selectedExpenseClass, setSelectedExpenseClass] = useState<string>(
        initialChoice || 'ALL',
    );

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
        setSelectedFundingSource(id);
    }

    const filteredPpmpItems = ppmps.filter((ppmp) => {
        const matchesFunding =
            selectedFundingSource === 0 ||
            ppmp.funding_source_id === selectedFundingSource;

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

    const processedData = useMemo(() => {
        return filteredPpmpItems.map((item) => ({
            ...item,
            priceListDescription:
                priceLists?.find((pl) => pl.id === item.ppmp_price_list_id)
                    ?.description || '',
        }));
    }, [filteredPpmpItems, priceLists]);

    console.log(processedData);

    // const filteredChartOfAccounts =
    //     selectedExpenseClass === 'ALL'
    //         ? chartOfAccounts
    //         : chartOfAccounts.filter(
    //               (acc) => acc.expense_class === selectedExpenseClass,
    //           );

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
                fund: selectedFundingSource,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleFundingSourceChange = (value: string) => {
        const id = Number(value);
        setSelectedFundingSource(id);

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col gap-4 p-4">
                <small className="text-sm leading-none font-medium">
                    Viewing: {aipEntry?.ppa?.name}
                </small>

                <DataTable
                    columns={columns}
                    data={processedData}
                    // data={ppmps}
                    withSearch={true}
                    // onEdit={handleEdit}
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
                            defaultValue={String(selectedFundingSource)}
                        >
                            <SelectTrigger className="w-full max-w-48 min-w-30">
                                <SelectValue placeholder="Select funding source">
                                    {selectedFundingSource && (
                                        <span>
                                            {
                                                fundingSources.find(
                                                    (fs) =>
                                                        fs.id ===
                                                        selectedFundingSource,
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
                                            selectedFundingSource
                                                ? exportToPrint({
                                                      filteredPpmpItems,
                                                      priceLists,
                                                      ppmpCategories,
                                                      chartOfAccounts,
                                                      aipEntry,
                                                      fundingSources,
                                                      selectedFundingSource,
                                                      auth,
                                                  })
                                                : setOpenAlert(true)
                                        }
                                    >
                                        <Printer /> Print
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        onClick={() =>
                                            selectedFundingSource
                                                ? exportToPDF({
                                                      filteredPpmpItems,
                                                      priceLists,
                                                      ppmpCategories,
                                                      chartOfAccounts,
                                                      aipEntry,
                                                      fundingSources,
                                                      selectedFundingSource,
                                                      auth,
                                                  })
                                                : setOpenAlert(true)
                                        }
                                    >
                                        <FileText /> To PDF
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        onClick={() =>
                                            selectedFundingSource
                                                ? exportToExcel({
                                                      filteredPpmpItems,
                                                      priceLists,
                                                      ppmpCategories,
                                                      chartOfAccounts,
                                                      aipEntry,
                                                      fundingSources,
                                                      selectedFundingSource,
                                                      auth,
                                                  })
                                                : setOpenAlert(true)
                                        }
                                    >
                                        <Sheet /> To Excel
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button onClick={() => setOpen(true)}>
                            <Plus /> Add Item
                        </Button>
                    </div>
                </DataTable>
            </div>

            <PpmpFormDialog
                open={open}
                onOpenChange={setOpen}
                chartOfAccounts={chartOfAccounts}
                priceLists={priceLists}
                ppmpCategories={ppmpCategories}
                selectedEntry={aipEntry}
                fundingSources={fundingSources}
                selectedExpenseClass={selectedExpenseClass}
                selectedFundingSourceId={selectedFundingSource}
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
