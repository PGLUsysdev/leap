import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import type { PaginatedResponse, Filter, PriceList } from '@/types/global';
import columns from './columns/move-columns';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { reorder } from '@/routes/price-lists';
import { Spinner } from '@/components/ui/spinner';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';

interface MoveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    paginatedDialogPriceList: PaginatedResponse<PriceList>;
    filters: Filter;
    selectedItemToMove: PriceList;
}

export default function MoveDialog({
    open,
    onOpenChange,
    paginatedDialogPriceList,
    filters,
    selectedItemToMove,
}: MoveDialogProps) {
    const [selectedItem, setSelectedItem] = useState<PriceList | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    console.log(selectedItemToMove);
    console.log(selectedItem);

    function handleSelect(item: PriceList, boolean: boolean) {
        if (boolean) {
            setSelectedItem(item);
        } else {
            setSelectedItem(null);
        }
    }

    function handleMoveItem(
        item: PriceList,
        moveTo: PriceList | null,
        position: 'up' | 'down',
    ) {
        if (!moveTo) return;

        router.visit(
            reorder({
                query: {
                    active_id: item.id,
                    over_id: moveTo.id,
                    position: position,
                },
            }),
            {
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onSuccess: () => onOpenChange(false),
                onError: (error) => console.error(error),
                onFinish: () => setIsLoading(false),
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[95vh] flex-col border-none shadow-2xl sm:max-w-[85%]"
                onPointerDownOutside={(e) => isLoading && e.preventDefault()}
                onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>Move PPA</DialogTitle>
                    <DialogDescription className="sr-only"></DialogDescription>
                </DialogHeader>

                {/*<Card>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="rounded-md bg-primary p-2 text-primary-foreground shadow-sm">
                                    <Move />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-wider text-primary/70 uppercase">
                                        Currently Moving
                                    </p>
                                    <p className="max-w-[400px] truncate text-sm font-bold">
                                        {ppaToMove?.name}
                                    </p>
                                    <p className="font-mono text-[10px] opacity-60">
                                        {ppaToMove?.full_code}
                                    </p>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-background">
                                {ppaToMove?.type}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>*/}

                {/*<div>
                    <span>Item to Move:</span>{' '}
                    <span className="font-bold">
                        {selectedItemToMove?.description}
                    </span>
                </div>*/}

                <Item variant="outline">
                    {/*<ItemMedia variant="icon">
                        <InboxIcon />
                    </ItemMedia>*/}
                    <ItemContent>
                        <ItemTitle>Item to Move:</ItemTitle>
                        <ItemDescription>
                            {selectedItemToMove?.description}
                        </ItemDescription>
                    </ItemContent>
                </Item>

                <div className="flex min-h-0">
                    <div className="w-full pr-3">
                        {!Array.isArray(paginatedDialogPriceList) && (
                            <DataTable
                                columns={columns}
                                data={paginatedDialogPriceList?.data}
                                withSearch
                                paginationObj={paginatedDialogPriceList}
                                negativeHeight={22}
                                filters={filters}
                                searchKey="dialog_search"
                                pageKey="dialog_page"
                                onlyKeys={[
                                    'paginatedDialogPriceList',
                                    'filters',
                                ]}
                                isDialog={true}
                                onSelect={(item, boolean) =>
                                    handleSelect(item, boolean)
                                }
                                selectedItemToMove={selectedItemToMove}
                            />
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <div className="flex w-full items-center justify-between">
                        <div>Relative to Item: {selectedItem?.description}</div>

                        <div className="flex gap-2">
                            <Button variant="outline" disabled={isLoading}>
                                Cancel
                            </Button>

                            {isLoading ? (
                                <Button disabled>
                                    <div className="flex items-center gap-1">
                                        <Spinner /> Moving
                                    </div>
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() =>
                                            handleMoveItem(
                                                selectedItemToMove,
                                                selectedItem,
                                                'up',
                                            )
                                        }
                                        disabled={!selectedItem}
                                    >
                                        Move Up
                                    </Button>

                                    <Button
                                        onClick={() =>
                                            handleMoveItem(
                                                selectedItemToMove,
                                                selectedItem,
                                                'down',
                                            )
                                        }
                                        disabled={!selectedItem}
                                    >
                                        <div className="flex items-center gap-1">
                                            Move Down
                                        </div>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
