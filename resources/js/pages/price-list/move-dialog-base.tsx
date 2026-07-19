import DataTable from '@/components/base-ui-components/data-table';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/base-ui-components/ui/dialog';
import type { PriceList, PaginatedResponse } from '@/types';
import columns from './columns/columns-base';

interface MoveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedItem: PriceList | null;
    moveTarget: PriceList | null;
    onMoveTargetChange: (item: PriceList | null) => void;
    dialogData: PriceList[];
    dialogPaginationData?: Omit<PaginatedResponse<PriceList>, 'data'>;
    onMoveItem: (position: 'up' | 'down') => void;
    title: string;
    description: string;
}

export default function MoveDialog({
    open,
    onOpenChange,
    selectedItem,
    moveTarget,
    onMoveTargetChange,
    dialogData,
    dialogPaginationData,
    onMoveItem,
    title,
    description,
}: MoveDialogProps) {
    const handleOpenChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen);

        if (!nextOpen) {
            onMoveTargetChange(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-w-300">
                <DialogHeader className="flex-none px-4 pt-4">
                    {/*<DialogTitle>Move Price List Item</DialogTitle>
                    <DialogDescription>
                        Select a target position for "
                        {selectedItem?.description}" and click Move Down.
                    </DialogDescription>*/}
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="p-4">
                    <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                        <span className="text-muted-foreground">Moving: </span>
                        <span className="font-medium">
                            {selectedItem?.description}
                        </span>
                    </div>
                </div>

                <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-b-xl">
                    <DataTable
                        data={dialogData}
                        paginationData={dialogPaginationData}
                        columns={columns(false, false, false)}
                        className="h-1000"
                        variant="select"
                        onRowClick={onMoveTargetChange}
                        selectedValue={String(moveTarget?.id ?? '')}
                        selectedKey="id"
                        disabledValue={String(selectedItem?.id ?? '')}
                        disabledKey="id"
                        pageParamName="dialog_page"
                        perPageParamName="dialog_per_page"
                        searchParamName="dialog_search"
                        only={['paginatedDialogPriceList']}
                    ></DataTable>
                </div>

                <div className="p-4 pt-0">
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => onMoveTargetChange(null)}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Close
                        </Button>
                        <Button
                            disabled={!moveTarget}
                            onClick={() => onMoveItem('down')}
                        >
                            Move Down
                        </Button>
                        <Button
                            disabled={!moveTarget}
                            onClick={() => onMoveItem('up')}
                        >
                            Move Up
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
