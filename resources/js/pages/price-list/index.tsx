import { router } from '@inertiajs/react';
import { useState } from 'react';
import { AlertErrorDialog } from '@/components/alert-error-dialog';
import NewTable from '@/components/base-ui-components/data-table';
import { Button as BaseButton } from '@/components/base-ui-components/ui/button';
import {
    ScrollArea,
    ScrollBar,
} from '@/components/base-ui-components/ui/scroll-area';
import { DeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { reorder } from '@/routes/price-lists';
import type {
    PriceList,
    ChartOfAccount,
    PpmpCategory,
    PaginatedResponse,
    Filter,
    ChartOfAccountPpmpCategory,
} from '@/types';
import columnsBase from './columns/columns-base';
import FormDialog from './form-dialog-base';
import MoveDialog from './move-dialog-base';

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
    filters,
    paginatedDialogPriceList,
    can,
    coaCategoryPairs,
}: PriceListPageProps) {
    const { data: pageData, ...pagePaginationData } = paginatedPriceList;

    const dialogData = paginatedDialogPriceList?.data ?? [];
    const dialogPaginationData = paginatedDialogPriceList
        ? (({ data, ...rest }) => rest)(paginatedDialogPriceList)
        : undefined;

    console.log(paginatedDialogPriceList);

    const [selectedPriceList, setSelectedPriceList] =
        useState<PriceList | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<PriceList | null>(null);

    const [openFormDialog, setOpenFormDialog] = useState(false);

    const [openMoveDialog, setOpenMoveDialog] = useState(false);
    const [moveTarget, setMoveTarget] = useState<PriceList | null>(null);

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
                <NewTable
                    data={pageData}
                    paginationData={pagePaginationData}
                    columns={columnsBase(
                        can?.edit ?? false,
                        can?.delete ?? false,
                        can?.move ?? false,
                    )}
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
                </NewTable>

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
                columns={columnsBase}
                title="Move Price List Item"
                description={`Select a target position for "${selectedItem?.description}" and click Move Down.`}
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
