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
import DeleteDialog from './delete-dialog';

import { type BreadcrumbItem } from '@/types';
import type {
    FiscalYear,
    Ppmp,
    ChartOfAccount,
    AipEntry,
    PpmpCategory,
    PpaFundingSource,
} from '@/pages/types/types';
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
    // console.log(ppmpItems);
    console.log(fundingSources);

    const [open, setOpen] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [selectedSource, setSelectedSource] = useState<Ppmp | null>(null);
    const [selectedFundingSource, setSelectedFundingSource] = useState(0);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Annual Investment Programs', href: '/aip' },
        {
            title: `AIP Summary FY ${fiscalYear.year}`,
            href: `/aip/${fiscalYear.id}/summary`,
        },
        { title: `PPMP Management`, href: `#` },
    ];

    function handleDelete(source: Ppmp) {
        setSelectedSource(source);
        setOpenDelete(true);
    }

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

    // console.log(filteredPpmpItems);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full flex-1 px-4 py-4">
                <PpmpTablePage
                    data={filteredPpmpItems}
                    // onEdit={handleEdit}
                    onDelete={handleDelete}
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
                                            exportToPrint({
                                                filteredPpmpItems,
                                                ppmpCategories,
                                                chartOfAccounts,
                                            })
                                        }
                                    >
                                        <Printer /> Print
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        onClick={() =>
                                            exportToPDF({
                                                filteredPpmpItems,
                                                ppmpCategories,
                                                chartOfAccounts,
                                            })
                                        }
                                    >
                                        <FileText /> To PDF
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        onClick={() =>
                                            exportToExcel({
                                                filteredPpmpItems,
                                                ppmpCategories,
                                                chartOfAccounts,
                                            })
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
                chartOfAccounts={chartOfAccounts}
                ppmpCategories={ppmpCategories}
                selectedEntry={aipEntry}
                fundingSources={fundingSources}
            />

            <DeleteDialog
                open={openDelete}
                setOpen={setOpenDelete}
                initialData={selectedSource}
            />
        </AppLayout>
    );
}
