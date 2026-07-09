import { router } from '@inertiajs/react';
import { useState } from 'react';
import { AlertErrorDialog } from '@/components/alert-error-dialog';
import { DataTable } from '@/components/data-table';
import { DeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import FormDialog from '@/pages/price-list/form-dialog';
import { index } from '@/routes/price-lists';
import type {
    PriceList,
    ChartOfAccount,
    PpmpCategory,
    PaginatedResponse,
    Filter,
} from '@/types';
import columns from './columns/columns';
import MoveDialog from './move-dialog';

interface PriceListPageProps {
    paginatedPriceList: PaginatedResponse<PriceList>;
    chartOfAccounts: ChartOfAccount[];
    ppmpCategory: PpmpCategory[];
    filters: Filter;
    paginatedDialogPriceList: PaginatedResponse<PriceList>;
    can?: {
        add: boolean;
        edit: boolean;
        delete: boolean;
        move: boolean;
    };
}

export default function PriceListPage({
    paginatedPriceList,
    chartOfAccounts,
    ppmpCategory,
    filters,
    paginatedDialogPriceList,
    can,
}: PriceListPageProps) {
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedPriceList, setSelectedPriceList] =
        useState<PriceList | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<PriceList | null>(null);

    function handleAdd() {
        setSelectedPriceList(null);

        setOpenEdit(true);
    }

    function handleDialogOpenChange(isOpen: boolean) {
        setOpenEdit(isOpen);

        if (!isOpen) {
            setSelectedPriceList(null);
        }
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
        router.visit(index(), {
            only: ['paginatedDialogPriceList'],
            preserveState: true,
            onSuccess: () => {
                setSelectedItem(data);
                setIsMoveDialogOpen(true);
            },
        });
    }

    return (
        <>
            <div className="pt-4">
                <DataTable
                    columns={columns(
                        can?.edit ?? false,
                        can?.delete ?? false,
                        can?.move ?? false,
                    )}
                    data={paginatedPriceList.data}
                    withSearch={true}
                    onEdit={handleEdit}
                    onDelete={handleDeleteDialogOpen}
                    onReorder={handleReorder}
                    onMove={handleMove}
                    paginationObj={paginatedPriceList}
                    negativeHeight={10.7}
                    onlyKeys={['paginatedPriceList', 'filters']}
                    filters={filters}
                >
                    {can?.add && (
                        <Button onClick={handleAdd}>Add Price List</Button>
                    )}
                </DataTable>
            </div>

            <FormDialog
                open={openEdit}
                onOpenChange={handleDialogOpenChange}
                chartOfAccounts={chartOfAccounts}
                ppmpCategories={ppmpCategory}
                selectedPriceList={selectedPriceList}
            />

            <MoveDialog
                open={isMoveDialogOpen}
                onOpenChange={setIsMoveDialogOpen}
                paginatedDialogPriceList={paginatedDialogPriceList}
                filters={filters}
                selectedItemToMove={selectedItem}
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
        </>
    );
}

PriceListPage.layout = {
    breadcrumbs: [
        {
            title: 'Price Lists',
            href: '#',
        },
    ],
};
