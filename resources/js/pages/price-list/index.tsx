import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import type { PriceList, ChartOfAccount, PpmpCategory } from '@/types/global';
import FormDialog from '@/pages/price-list/form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { router } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import columns from './table/columns';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Price Lists', href: '#' }];

interface PriceListPageProps {
    priceList: PriceList[];
    chartOfAccounts: ChartOfAccount[];
    ppmpCategory: PpmpCategory[];
}

export default function PriceListPage({
    priceList,
    chartOfAccounts,
    ppmpCategory,
}: PriceListPageProps) {
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedPriceList, setSelectedPriceList] =
        useState<PriceList | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    console.log(selectedPriceList);

    function handleAdd() {
        setSelectedPriceList(null);

        setOpenEdit(true);
    }

    function handleDialogOpenChange(isOpen: boolean) {
        setOpenEdit(isOpen);
        if (!isOpen) setSelectedPriceList(null);
    }

    function handleEdit(data: PriceList) {
        setSelectedPriceList(data);
        setOpenEdit(true);
    }

    function handleDeleteDialogOpen(data: PriceList) {
        setSelectedPriceList(data);
        setIsDeleteDialogOpen(true);
    }

    function handleDelete() {
        router.delete(`/price-lists/${selectedPriceList?.id}`, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                console.log('Success:', 'Record deleted');

                setIsDeleteDialogOpen(false);
                setSelectedPriceList(null);
            },
            onError: (errors) => {
                console.error(
                    'Delete Error:',
                    errors.database || 'An unknown error occurred',
                );
            },
            onFinish: () => setIsLoading(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-4">
                <DataTable
                    columns={columns}
                    data={priceList}
                    withSearch={true}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                >
                    <Button onClick={handleAdd}>Add Price List</Button>
                </DataTable>
            </div>

            <FormDialog
                open={openEdit}
                onOpenChange={handleDialogOpenChange}
                chartOfAccounts={chartOfAccounts}
                ppmpCategories={ppmpCategory}
                selectedPriceList={selectedPriceList}
            />

            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Price List?"
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <span className="font-bold text-foreground">
                            "{selectedPriceList?.description}"
                        </span>
                        ?
                    </>
                }
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedPriceList(null);
                }}
                isLoading={isLoading}
            />
        </AppLayout>
    );
}
