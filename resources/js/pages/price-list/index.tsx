import { router } from '@inertiajs/react';
import { useState } from 'react';
import { AlertErrorDialog } from '@/components/alert-error-dialog';
import DataTable from '@/components/base-ui-components/data-table';
import DeleteDialog from '@/components/base-ui-components/delete-dialog';
import { Button as BaseButton } from '@/components/base-ui-components/ui/button';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
import { reorder, destroy } from '@/routes/price-lists';
import type {
    PriceList,
    ChartOfAccount,
    PpmpCategory,
    PaginatedResponse,
    Filter,
    ChartOfAccountPpmpCategory,
} from '@/types';
import columns from './columns/columns';
import FormDialog from './form-dialog';
import MoveDialog from './move-dialog';

interface PriceListPageProps {
    paginatedPriceList: PaginatedResponse<PriceList>;
    chartOfAccounts: ChartOfAccount[];
    ppmpCategories: PpmpCategory[];
    filters: Filter;
    paginatedDialogPriceList: PaginatedResponse<PriceList>;
    can?: {
        add: boolean;
        edit: boolean;
        delete: boolean;
        move: boolean;
    };
    coaCategoryPairs: ChartOfAccountPpmpCategory[];
}

export default function PriceListPage({
    paginatedPriceList,
    chartOfAccounts,
    ppmpCategories,
    paginatedDialogPriceList,
    coaCategoryPairs,
    // filters,
    // can,
}: PriceListPageProps) {
    const { data: priceLists, ...priceListsPagination } = paginatedPriceList;

    const dialogData = paginatedDialogPriceList?.data ?? [];
    const dialogPaginationData = paginatedDialogPriceList
        ? (({ data, ...rest }) => rest)(paginatedDialogPriceList)
        : undefined;
    const [selectedPriceList, setSelectedPriceList] =
        useState<PriceList | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<PriceList | null>(null);
    const [openFormDialog, setOpenFormDialog] = useState(false);
    const [openMoveDialog, setOpenMoveDialog] = useState(false);
    const [moveTarget, setMoveTarget] = useState<PriceList | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    function handleEdit(data: PriceList) {
        setSelectedPriceList(data);
        setOpenFormDialog(true);
    }

    function handleMove(data: PriceList) {
        setSelectedItem(data);

        if (!paginatedDialogPriceList) {
            const params = new URLSearchParams(window.location.search);
            const nextParams = Object.fromEntries(params.entries());
            nextParams.dialog_page = '1';

            router.get(window.location.pathname, nextParams, {
                only: ['paginatedDialogPriceList'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onSuccess: () => {
                    setOpenMoveDialog(true);
                },
            });
        } else {
            setOpenMoveDialog(true);
        }
    }

    function handleDialogOpenChange(isOpen: boolean) {
        setOpenFormDialog(isOpen);

        if (!isOpen) {
            setSelectedPriceList(null);
        }
    }

    function handleDeleteDialogOpen(data: PriceList) {
        setSelectedPriceList(data);
        setDeleteDialogOpen(true);
    }

    function handleDelete() {
        if (!selectedPriceList) {
            return;
        }

        router.visit(destroy(selectedPriceList?.id).url, {
            method: 'delete',
            preserveScroll: true,
            preserveState: true,
            onStart: () => setIsLoading(true),
            onSuccess: () => {
                setDeleteDialogOpen(false);
                // setSelectedPriceList(null);
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

    function handleCreate() {
        setOpenFormDialog(true);
    }

    function handleMoveItem(position: 'up' | 'down') {
        if (!selectedItem || !moveTarget) {
            return;
        }

        router.post(
            reorder().url,
            {
                active_id: selectedItem.id,
                over_id: moveTarget.id,
                position: position,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => {
                    setOpenMoveDialog(false);
                    setSelectedItem(null);
                    setMoveTarget(null);
                },
                onError: (errors) => {
                    const errorMessage =
                        Object.values(errors).join(', ') ||
                        'An unknown error occurred';
                    setError(errorMessage);
                    setIsErrorDialogOpen(true);
                },
                onFinish: () => setIsLoading(false),
            },
        );
    }

    return (
        <>
            <ScrollArea className="h-[calc(100vh-3rem)] w-full">
                <DataTable
                    data={priceLists}
                    paginationData={priceListsPagination}
                    columns={columns}
                    meta={{
                        onMove: handleMove,
                        onUpdate: (data: PriceList) => handleEdit(data),
                        onDelete: (data: PriceList) =>
                            handleDeleteDialogOpen(data),
                    }}
                    pageParamName="price_list_page"
                >
                    <BaseButton
                        onClick={() => {
                            handleCreate();
                        }}
                    >
                        Create Item
                    </BaseButton>
                </DataTable>

                <ScrollBar orientation="vertical" />
            </ScrollArea>

            <FormDialog
                open={openFormDialog}
                onOpenChange={handleDialogOpenChange}
                selectedPriceList={selectedPriceList}
                chartOfAccounts={chartOfAccounts}
                ppmpCategories={ppmpCategories}
                coaCategoryPairs={coaCategoryPairs}
            />

            <MoveDialog
                open={openMoveDialog}
                onOpenChange={setOpenMoveDialog}
                selectedItem={selectedItem}
                moveTarget={moveTarget}
                onMoveTargetChange={setMoveTarget}
                dialogData={dialogData}
                dialogPaginationData={dialogPaginationData}
                onMoveItem={handleMoveItem}
                title="Move Price List Item"
                description={`Select a target position for "${selectedItem?.description}" and click Move Down.`}
            />

            {/*<DeleteDialog
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
            />*/}

            <DeleteDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title={'Delete Price List?'}
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <span className="text-foreground font-bold">
                            "{selectedPriceList?.description}"
                        </span>
                        ?
                    </>
                }
                loading={isLoading}
                handleDelete={handleDelete}
            />

            <DeleteDialog
                open={isErrorDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title={'Delete Price List?'}
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <span className="text-foreground font-bold">
                            "{selectedPriceList?.description}"
                        </span>
                        ?
                    </>
                }
                loading={isLoading}
                handleDelete={handleDelete}
            />

            {/*<AlertErrorDialog
                open={isErrorDialogOpen}
                onOpenChange={setIsErrorDialogOpen}
                error={error}
            />*/}
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
