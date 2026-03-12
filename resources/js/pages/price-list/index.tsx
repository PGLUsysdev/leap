import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { PriceList, ChartOfAccount, PpmpCategory } from '@/pages/types/types';
import PriceListTablePage from '@/pages/price-list/table/page';
import FormDialog from '@/pages/price-list/form-dialog';
import DeleteDialog from '@/pages/price-list/delete-dialog';

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
    const [openDelete, setOpenDelete] = useState(false);
    const [selectedPriceList, setSelectedPriceList] =
        useState<PriceList | null>(null);

    function handleAdd() {
        setSelectedPriceList(null);

        setOpenEdit(true);
    }

    function handleEdit(data: PriceList) {
        setSelectedPriceList(data);
        setOpenEdit(true);
    }

    function handleDelete(data: PriceList) {
        setSelectedPriceList(data);
        setOpenDelete(true);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-4">
                <PriceListTablePage
                    data={priceList}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
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
                open={openDelete}
                onOpenChange={setOpenDelete}
                data={selectedPriceList}
            />
        </AppLayout>
    );
}
