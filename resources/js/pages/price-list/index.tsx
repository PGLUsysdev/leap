import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import type { PriceList, ChartOfAccount, PpmpCategory } from '@/types/global';
import PriceListTablePage from '@/pages/price-list/table/page';
import FormDialog from '@/pages/price-list/form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { router } from '@inertiajs/react';

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
                setIsDeleteDialogOpen(false);
                setSelectedPriceList(null);
            },
            onFinish: () => setIsLoading(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-4">
                <PriceListTablePage
                    data={priceList}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                >
                    <Button onClick={handleAdd}>Add Price List</Button>
                </PriceListTablePage>
            </div>

            <FormDialog
                open={openEdit}
                onOpenChange={setOpenEdit}
                chartOfAccounts={chartOfAccounts}
                ppmpCategories={ppmpCategory}
                selectedPriceList={selectedPriceList}
            />

            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Remove from AIP Summary?"
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
