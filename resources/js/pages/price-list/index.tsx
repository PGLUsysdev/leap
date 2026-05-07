import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import FormDialog from '@/pages/price-list/form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { AlertErrorDialog } from '@/components/alert-error-dialog';
import { router } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import columns from './columns/columns';
import type {
    PriceList,
    ChartOfAccount,
    PpmpCategory,
    PaginatedResponse,
    Filter,
} from '@/types/global';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Price Lists', href: '#' }];

interface PriceListPageProps {
    // paginatedPriceList: PriceList[];
    paginatedPriceList: PaginatedResponse<PriceList>;
    chartOfAccounts: ChartOfAccount[];
    ppmpCategory: PpmpCategory[];
    filters: Filter;
}

export default function PriceListPage({
    paginatedPriceList,
    chartOfAccounts,
    ppmpCategory,
    filters,
}: PriceListPageProps) {
    // console.log(paginatedPriceList);

    const [openEdit, setOpenEdit] = useState(false);
    const [selectedPriceList, setSelectedPriceList] =
        useState<PriceList | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

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
                const errorMessage =
                    errors.database || 'An unknown error occurred';
                console.error('Delete Error:', errorMessage);
                setError(errorMessage);
                setIsErrorDialogOpen(true);
            },
            onFinish: () => setIsLoading(false),
        });
    }

    function handleReorder(activeId: string, overId: string) {
        router.post(
            '/price-lists/reorder',
            {
                active_id: activeId,
                over_id: overId,
            },
            {
                preserveState: false,
                preserveScroll: true,
                onSuccess: () => {
                    window.location.reload();
                },
            },
        );
    }

    function handleMove(data: PriceList) {
        console.log(data);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-4">
                <DataTable
                    columns={columns}
                    data={paginatedPriceList.data}
                    withSearch={true}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                    onReorder={handleReorder}
                    onMove={handleMove}
                    paginationObj={paginatedPriceList}
                    negativeHeight={11}
                    onlyKeys={['paginatedPriceList']}
                    filters={filters}
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

            <AlertErrorDialog
                open={isErrorDialogOpen}
                onOpenChange={setIsErrorDialogOpen}
                error={error}
            />
        </AppLayout>
    );
}
