import { useState, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
    Move,
    FolderOpen,
    ArrowUpToLine,
    ArrowDownToLine,
    Info,
    Home,
    ChevronRight,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import type { Ppa, PaginatedResponse, Filter, PriceList } from '@/types/global';
import columns from './columns/move-columns';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { index } from '@/routes/ppa';

interface MoveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    paginatedDialogPriceList: PaginatedResponse<PriceList>;
    filters: Filter;
}

export default function MoveDialog({
    open,
    onOpenChange,
    paginatedDialogPriceList,
    filters,
}: MoveDialogProps) {
    console.log(paginatedDialogPriceList);

    function handleSelect(e) {
        console.log(e);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[95vh] flex-col border-none shadow-2xl sm:max-w-[85%]">
                <DialogHeader>
                    <DialogTitle>Move PPA</DialogTitle>
                    <DialogDescription className="sr-only">
                        Navigate the library to find a destination.
                    </DialogDescription>
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

                <div className="flex min-h-0">
                    <div className="w-full pr-3">
                        {!Array.isArray(paginatedDialogPriceList) && (
                            <DataTable
                                // key={`move-table-${filters?.dialog_id}`}
                                columns={columns}
                                data={paginatedDialogPriceList?.data}
                                withSearch
                                // onShowChildren={handleShowChildren}
                                paginationObj={paginatedDialogPriceList}
                                negativeHeight={18}
                                filters={filters}
                                searchKey="dialog_search"
                                pageKey="dialog_page"
                                onlyKeys={[
                                    'paginatedDialogPriceList',
                                    'filters',
                                ]}
                                // meta={{
                                //     ppaToMove: ppaToMove,
                                //     selectedId: selectedTarget?.id,
                                //     onSelect: (ppa: Ppa | null) =>
                                //         setSelectedTarget(ppa),
                                // }}
                                isDialog={true}
                                onSelect={(e) => handleSelect(e)}
                            />
                        )}
                    </div>
                </div>

                <DialogFooter className="flex items-center justify-between border-t bg-background pt-4">
                    {/*<div className="flex flex-1 items-center gap-2 text-sm text-muted-foreground italic">
                        <Info className="h-4 w-4 text-primary/50" />
                        {selectedTarget ? (
                            <span className="flex animate-in gap-1 fade-in slide-in-from-left-2">
                                <span>Moving relative to:</span>
                                <strong className="block max-w-[400px] truncate text-foreground">
                                    {selectedTarget.name}
                                </strong>
                            </span>
                        ) : (
                            <span>Select a folder or sibling above</span>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>

                        {buttonLabels.showSiblingButtons && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => handleMove('top')}
                                    disabled={
                                        !buttonLabels.siblingEnabled || loading
                                    }
                                >
                                    <ArrowUpToLine className="mr-2 h-4 w-4" />{' '}
                                    Move Above Sibling
                                </Button>
                                <Button
                                    onClick={() => handleMove('bottom')}
                                    disabled={
                                        !buttonLabels.siblingEnabled || loading
                                    }
                                >
                                    <ArrowDownToLine className="mr-2 h-4 w-4" />{' '}
                                    Move Below Sibling
                                </Button>
                            </>
                        )}

                        {buttonLabels.showMoveHereButton && (
                            <Button
                                onClick={() => handleMove('into')}
                                disabled={
                                    !buttonLabels.moveHereEnabled || loading
                                }
                                className="gap-2"
                            >
                                {loading ? (
                                    <Spinner />
                                ) : (
                                    <>
                                        {buttonLabels.moveHereIcon}
                                        {buttonLabels.moveHereLabel}
                                    </>
                                )}
                            </Button>
                        )}
                    </div>*/}

                    <Button variant="outline">Cancel</Button>
                    <Button disabled>Move Up</Button>
                    <Button disabled>Move Down</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
