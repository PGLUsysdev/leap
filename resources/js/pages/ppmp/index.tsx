import { useState } from 'react';
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
import PpmpTablePage from './ppmp-table/page';
import { DeleteDialog } from '@/components/delete-dialog';
import { router } from '@inertiajs/react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { type BreadcrumbItem } from '@/types';
import type {
    FiscalYear,
    Ppmp,
    ChartOfAccount,
    AipEntry,
    PpmpCategory,
    PpaFundingSource,
} from '@/types/global';
import {
    exportToExcel,
    exportToPDF,
    exportToPrint,
} from '@/pages/ppmp/utils/export';

interface PpmpPageProps {
    fiscalYear: FiscalYear;
    aipEntry: AipEntry;
    ppmpItems: Ppmp[];
    chartOfAccounts: ChartOfAccount[];
    ppmpCategories: PpmpCategory[];
    fundingSources: PpaFundingSource[];
}

export default function PpmpPage({
    fiscalYear,
    aipEntry,
    ppmpItems,
    chartOfAccounts,
    ppmpCategories,
    fundingSources,
}: PpmpPageProps) {
    const [open, setOpen] = useState(false);
    const [openAlert, setOpenAlert] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedSource, setSelectedSource] = useState<Ppmp | null>(null);
    const [selectedFundingSource, setSelectedFundingSource] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedExpenseClass, setSelectedExpenseClass] =
        useState<string>('ALL');

    // console.log(aipEntry);
    // console.log(ppmpItems);
    console.log(chartOfAccounts);

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

    const filteredPpmpItems =
        selectedFundingSource !== 0
            ? ppmpItems.filter(
                  (ppmpItem) =>
                      selectedFundingSource === ppmpItem.funding_source.id,
              )
            : ppmpItems;

    const filteredChartOfAccounts =
        selectedExpenseClass === 'ALL'
            ? chartOfAccounts
            : chartOfAccounts.filter(
                  (acc) => acc.expense_class === selectedExpenseClass,
              );

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full flex-1 px-4 py-4">
                <PpmpTablePage
                    data={filteredPpmpItems}
                    // onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                >
                    <div className="flex gap-2">
                        <Select
                            onValueChange={(value) =>
                                handleFundingSourceSelect(value)
                            }
                        >
                            <SelectTrigger className="w-full max-w-48">
                                <SelectValue placeholder="Select funding source" />
                            </SelectTrigger>

                            <Select
                                onValueChange={(value) =>
                                    setSelectedExpenseClass(value)
                                }
                                defaultValue="ALL"
                            >
                                <SelectTrigger className="w-full max-w-40">
                                    <SelectValue placeholder="Expense Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Expense Class</SelectLabel>
                                        <SelectItem value="ALL">
                                            All Classes
                                        </SelectItem>
                                        <SelectItem value="MOOE">
                                            MOOE
                                        </SelectItem>
                                        <SelectItem value="CO">CO</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Funding Sources</SelectLabel>

                                    <SelectItem key="0" value="0">
                                        Show All
                                    </SelectItem>

                                    {fundingSources.map((fs) => (
                                        <SelectItem
                                            key={fs.funding_source?.id}
                                            value={String(
                                                fs.funding_source?.id,
                                            )}
                                        >
                                            {fs.funding_source?.title}
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
                                                      ppmpCategories,
                                                      chartOfAccounts,
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
                                                      ppmpCategories,
                                                      chartOfAccounts,
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
                                                      ppmpCategories,
                                                      chartOfAccounts,
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
                </PpmpTablePage>
            </div>

            <PpmpFormDialog
                open={open}
                onOpenChange={setOpen}
                chartOfAccounts={filteredChartOfAccounts}
                ppmpCategories={ppmpCategories}
                selectedEntry={aipEntry}
                fundingSources={fundingSources}
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
