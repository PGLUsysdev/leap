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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { index } from '@/routes/ppa';

interface PpaMoveDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    ppaToMove: Ppa | null;
    filters: Filter;
    dialogPpaTree: PaginatedResponse<Ppa> | [];
    dialogCurrent: Ppa[];
}

const isValidParentType = (targetType: string, sourceType: string): boolean => {
    if (sourceType === 'Project') return targetType === 'Program';
    if (sourceType === 'Activity') return targetType === 'Project';
    if (sourceType === 'Sub-Activity') return targetType === 'Activity';
    return false;
};

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
                dialog_mode,
                ...mainFilters
            } = filters;

            router.visit(index({ query: mainFilters }), {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }
    }, [isOpen]);

    const buttonLabels = useMemo(() => {
        const currentFolder =
            dialogCurrent.length > 0 ? dialogCurrent[0] : null;
        const isProgram = ppaToMove?.type === 'Program';
        const isSameFolder =
            ppaToMove &&
            currentFolder &&
            ppaToMove.parent_id === currentFolder.id;

        const defaultState = {
            showSiblingButtons: false,
            siblingEnabled: false,
            showMoveHereButton: true,
            moveHereEnabled: false,
            moveHereLabel: 'Select a destination',
            moveHereIcon: <Info className="mr-2 h-4 w-4" />,
            targetId: null as number | null,
        };

        if (!ppaToMove) return defaultState;

        // RULE 1: ROOT PROGRAMS OR MOVING WITHIN THE SAME FOLDER
        // Must ONLY allow "Move Above / Below" sibling actions, kept disabled until selected
        if (isProgram || isSameFolder) {
            const isSelectedSibling =
                selectedTarget && selectedTarget.type === ppaToMove.type;
            return {
                showSiblingButtons: true,
                siblingEnabled: !!isSelectedSibling,
                showMoveHereButton: false,
                moveHereEnabled: false,
                moveHereLabel: '',
                moveHereIcon: null,
                targetId: isSelectedSibling ? selectedTarget.id : null,
            };
        }

        // RULE 2: ROW IN TABLE IS MANUALLY SELECTED
        if (selectedTarget) {
            const isSibling = selectedTarget.type === ppaToMove.type;
            if (isSibling) {
                return {
                    showSiblingButtons: true,
                    siblingEnabled: true,
                    showMoveHereButton: false,
                    moveHereEnabled: false,
                    moveHereLabel: '',
                    moveHereIcon: null,
                    targetId: selectedTarget.id,
                };
            } else {
                // Checked row is a parent folder (e.g. checked a Program row while moving a Project)
                return {
                    showSiblingButtons: false,
                    siblingEnabled: false,
                    showMoveHereButton: true,
                    moveHereEnabled: true,
                    moveHereLabel: 'Move Into Folder',
                    moveHereIcon: <FolderOpen className="mr-2 h-4 w-4" />,
                    targetId: selectedTarget.id,
                };
            }
        }

        // RULE 3: EMPTY SELECTION, INSIDE ANOTHER FOLDER
        if (currentFolder) {
            const canMoveHere = isValidParentType(
                currentFolder.type,
                ppaToMove.type,
            );
            return {
                showSiblingButtons: false,
                siblingEnabled: false,
                showMoveHereButton: true,
                moveHereEnabled: canMoveHere,
                moveHereLabel: canMoveHere ? 'Move Here' : 'Cannot place here',
                moveHereIcon: canMoveHere ? (
                    <ArrowDownToLine className="mr-2 h-4 w-4" />
                ) : (
                    <Info className="mr-2 h-4 w-4" />
                ),
                targetId: canMoveHere ? currentFolder.id : null,
            };
        }

        return defaultState;
    }, [selectedTarget, ppaToMove, dialogCurrent]);

    const handleMove = (direction: 'top' | 'bottom' | 'into') => {
        const finalTargetId = buttonLabels.targetId;
        if (!finalTargetId || !ppaToMove) return;

        router.post(
            `/ppas/${ppaToMove.id}/move`,
            { target_id: finalTargetId, direction },
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

    const displayData = useMemo(() => {
        if (!dialogPpaTree || Array.isArray(dialogPpaTree)) return [];

        return dialogPpaTree.data.map((ppa) => ({
            ...ppa,
            // Inject the selection state into the object
            _isSelected: selectedTarget?.id === ppa.id,
        }));
    }, [dialogPpaTree, selectedTarget]);

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
                                className={`block h-7 flex-1 truncate px-2`}
                            >
                                {item.name}
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="flex min-h-0">
                    <ScrollArea className="w-full pr-3">
                        {/* <div className="w-full overflow-x-auto"> */}
                        {!Array.isArray(dialogPpaTree) && (
                            <DataTable
                                key={`move-table-${filters?.dialog_id}`}
                                columns={columns}
                                data={displayData}
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
                        {/* </div> */}
                    </ScrollArea>
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

                        {/* CONDITION A: Show "Move Above / Move Below Sibling" buttons */}
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

                        {/* CONDITION B: Show single dynamic "Move Here" / "Move Into Folder" action button */}
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
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
