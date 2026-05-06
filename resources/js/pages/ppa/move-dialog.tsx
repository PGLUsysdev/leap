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
import type { Ppa, PaginatedResponse, Filter } from '@/types/global';
import columns from './columns/move-columns';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { index } from '@/routes/ppa';

interface PpaMoveDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    ppaToMove: Ppa | null;
    filters: Filter;
    dialogPpaTree: PaginatedResponse<Ppa> | [];
    dialogCurrent: Ppa[];
}

export default function PpaMoveDialog({
    isOpen,
    onOpenChange,
    ppaToMove,
    dialogPpaTree = [],
    dialogCurrent = [],
    filters,
}: PpaMoveDialogProps) {
    const [selectedTarget, setSelectedTarget] = useState<Ppa | null>(null);
    const [loading, setLoading] = useState(false);

    // Reset selection when folder changes
    useEffect(() => {
        setSelectedTarget(null);
    }, [filters?.dialog_id]);

    useEffect(() => {
        if (!isOpen) setSelectedTarget(null);

        if (!isOpen) {
            setSelectedTarget(null);

            const {
                dialog_id,
                dialog_page,
                dialog_search,
                is_dialog_open,
                ...mainFilters
            } = filters;

            router.visit(index({ query: mainFilters }), {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }
    }, [isOpen]);

    // RELATIONSHIP HELPER
    const buttonLabels = useMemo(() => {
        if (!selectedTarget || !ppaToMove)
            return { top: 'Move to Top', bottom: 'Move to Bottom' };

        const isSibling = selectedTarget.type === ppaToMove.type;
        if (isSibling) {
            return {
                top: 'Move Above Sibling',
                bottom: 'Move Below Sibling',
                icon: <Move className="mr-2 h-4 w-4" />,
            };
        }
        return {
            top: 'Move to Start of Folder',
            bottom: 'Move to End of Folder',
            icon: <FolderOpen className="mr-2 h-4 w-4" />,
        };
    }, [selectedTarget, ppaToMove]);

    const handleMove = (direction: 'top' | 'bottom') => {
        if (!selectedTarget || !ppaToMove) return;
        router.post(
            `/ppas/${ppaToMove.id}/move`,
            { target_id: selectedTarget.id, direction },
            {
                preserveState: true,
                onStart: () => setLoading(true),
                onSuccess: () => onOpenChange(false),
                onFinish: () => setLoading(false),
            },
        );
    };

    function handleShowChildren(ppa: Ppa) {
        router.get(
            'ppa',
            {
                ...filters,
                dialog_mode: 'move',
                dialog_id: ppa.id,
                dialog_page: 1,
            },
            {
                preserveState: true,
                only: ['dialogPpaTree', 'dialogCurrent', 'filters'],
            },
        );
    }

    function navigateToBreadcrumb(id: number | null) {
        router.get(
            'ppa',
            { ...filters, dialog_id: id, dialog_page: 1 },
            {
                preserveState: true,
                only: ['dialogPpaTree', 'dialogCurrent', 'filters'],
            },
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[95vh] flex-col border-none shadow-2xl sm:max-w-[85%]">
                <DialogHeader>
                    <DialogTitle>Move PPA</DialogTitle>
                    <DialogDescription className="sr-only">
                        Navigate the library to find a destination.
                    </DialogDescription>
                </DialogHeader>

                <Card>
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
                </Card>

                {/* breadcrumbs */}
                <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2 text-sm">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => navigateToBreadcrumb(null)}
                    >
                        <Home className="mr-1 h-4 w-4" /> Root
                    </Button>

                    {[...dialogCurrent].reverse().map((item) => (
                        <div
                            key={item.id}
                            className="flex min-w-0 items-center gap-2"
                        >
                            <ChevronRight className="h-4 w-4 shrink-0 opacity-30" />

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigateToBreadcrumb(item.id)}
                                // className="max-w-[120px] truncate hover:text-primary"
                                className={`block h-7 max-w-100 truncate px-2`}
                            >
                                {item.name}
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="flex min-h-0">
                    {/* <ScrollArea className="w-full pr-3"> */}
                    <div className="w-full overflow-x-auto">
                        {!Array.isArray(dialogPpaTree) && (
                            <DataTable
                                key={`move-table-${filters?.dialog_id}-${selectedTarget?.id ?? 'none'}`}
                                columns={columns}
                                data={dialogPpaTree.data}
                                withSearch
                                onShowChildren={handleShowChildren}
                                paginationObj={dialogPpaTree}
                                negativeHeight={30}
                                filters={filters}
                                searchKey="dialog_search"
                                pageKey="dialog_page"
                                onlyKeys={[
                                    'dialogPpaTree',
                                    'dialogCurrent',
                                    'filters',
                                ]}
                                meta={{
                                    ppaToMove: ppaToMove,
                                    selectedId: selectedTarget?.id,
                                    onSelect: (ppa: Ppa | null) =>
                                        setSelectedTarget(ppa),
                                }}
                                isDialog={true}
                            />
                        )}
                    </div>
                    {/* </ScrollArea> */}
                </div>

                <DialogFooter className="mt-4 flex items-center justify-between border-t bg-background pt-4">
                    <div className="flex flex-1 items-center gap-2 text-sm text-muted-foreground italic">
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

                        <Button
                            variant="outline"
                            onClick={() => handleMove('top')}
                            disabled={!selectedTarget || loading}
                            className="gap-2"
                        >
                            <ArrowUpToLine className="h-4 w-4" />
                            {buttonLabels.top}
                        </Button>

                        <Button
                            onClick={() => handleMove('bottom')}
                            disabled={!selectedTarget || loading}
                            className="gap-2"
                        >
                            {loading ? (
                                <Spinner />
                            ) : (
                                <>
                                    <ArrowDownToLine className="h-4 w-4" />{' '}
                                    {buttonLabels.bottom}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
