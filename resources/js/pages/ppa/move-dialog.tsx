import { useState, useMemo, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { Ppa } from '@/types/global';

interface PpaMoveDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    ppaToMove: Ppa | null;
    ppaTree: Ppa[];
}

export default function PpaMoveDialog({
    isOpen,
    onOpenChange,
    ppaToMove,
    ppaTree,
}: PpaMoveDialogProps) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setSelectedId(null);
            setSearchQuery('');
        }
    }, [isOpen]);

    // Filter tree based on ppaToMove.type to show relevant hierarchy
    const filteredTree = useMemo(() => {
        if (!ppaToMove) return [];

        const filterByType = (items: Ppa[], targetType: string): Ppa[] => {
            return items
                .filter((item) => item.type === targetType)
                .map((item) => ({
                    ...item,
                    children: [],
                }));
        };

        const filterHierarchy = (items: Ppa[], maxDepth: number): Ppa[] => {
            if (maxDepth < 0) return [];

            return items.map((item) => {
                const shouldIncludeChildren = maxDepth > 0;
                return {
                    ...item,
                    children:
                        shouldIncludeChildren && item.children
                            ? filterHierarchy(item.children, maxDepth - 1)
                            : [],
                };
            });
        };

        switch (ppaToMove.type) {
            case 'Project':
                // Project can only move to Program - show only Programs
                return filterByType(ppaTree, 'Program');
            case 'Activity':
                // Activity can only move to Project - show Programs with Projects
                return filterHierarchy(ppaTree, 1);
            case 'Sub-Activity':
                // Sub-Activity can only move to Activity - show Programs → Projects → Activities
                return filterHierarchy(ppaTree, 2);
            default:
                return [];
        }
    }, [ppaTree, ppaToMove]);

    // Filter by search query
    const searchableTree = useMemo(() => {
        if (!searchQuery) return filteredTree;

        const filterBySearch = (items: Ppa[]): Ppa[] => {
            return items
                .filter(
                    (item) =>
                        item.name
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                        item.full_code
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()),
                )
                .map((item) => ({
                    ...item,
                    children: item.children
                        ? filterBySearch(item.children)
                        : [],
                }));
        };

        return filterBySearch(filteredTree);
    }, [filteredTree, searchQuery]);

    // Flatten tree for rendering with depth info
    const flatItems = useMemo(() => {
        const flatten = (
            items: Ppa[],
            depth: number = 0,
        ): Array<Ppa & { depth: number }> => {
            const result: Array<Ppa & { depth: number }> = [];

            for (const item of items) {
                result.push({ ...item, depth });
                if (item.children) {
                    result.push(...flatten(item.children, depth + 1));
                }
            }

            return result;
        };

        return flatten(searchableTree);
    }, [searchableTree]);

    const handleMove = () => {
        if (!selectedId || !ppaToMove) return;

        router.post(
            `/ppas/${ppaToMove.id}/move`,
            { parent_id: selectedId },
            {
                preserveState: false,
                preserveScroll: true,
                onStart: () => setLoading(true),
                onSuccess: () => {
                    onOpenChange(false);
                },
                onError: (errors) => {
                    console.error('Move failed:', errors);
                },
                onFinish: () => setLoading(false),
            },
        );
    };

    const isValidParentType = (parentType: string): boolean => {
        if (!ppaToMove) return false;

        switch (ppaToMove.type) {
            case 'Project':
                return parentType === 'Program';
            case 'Activity':
                return parentType === 'Project';
            case 'Sub-Activity':
                return parentType === 'Activity';
            default:
                return false;
        }
    };

    const selectedParent = useMemo(() => {
        if (!selectedId) return null;

        const findPpa = (items: Ppa[], id: number): Ppa | null => {
            for (const item of items) {
                if (item.id === id) return item;
                if (item.children) {
                    const found = findPpa(item.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        return findPpa(filteredTree, selectedId);
    }, [selectedId, filteredTree]);

    const currentParentName = useMemo(() => {
        if (!ppaToMove?.parent_id) return 'None (Root Level)';

        const findPpa = (items: Ppa[], id: number): Ppa | null => {
            for (const item of items) {
                if (item.id === id) return item;
                if (item.children) {
                    const found = findPpa(item.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        const parent = findPpa(ppaTree, ppaToMove.parent_id);
        return parent ? parent.name : 'Unknown';
    }, [ppaToMove, ppaTree]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[90vh] flex-col sm:max-w-[80%]"
                onPointerDownOutside={(e) => {
                    if (loading) e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    if (loading) e.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle>Move {ppaToMove?.type}</DialogTitle>

                    <DialogDescription>
                        <span className="flex flex-col gap-2">
                            <span>
                                Moving: <strong>{ppaToMove?.name}</strong>
                            </span>
                            <span className="text-sm text-muted-foreground">
                                Currently under: {currentParentName}
                            </span>
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div>
                    <div className="relative">
                        <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-muted/50 pl-9"
                        />
                    </div>
                </div>

                <div className="flex min-h-0">
                    <ScrollArea className="w-full">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>AIP Reference Code</TableHead>
                                    <TableHead>Name</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {flatItems.map((item) => {
                                    const isCurrentParent =
                                        ppaToMove?.parent_id === item.id;
                                    const isSelected = selectedId === item.id;
                                    const canSelect = isValidParentType(
                                        item.type,
                                    );

                                    return (
                                        <TableRow
                                            key={item.id}
                                            className={
                                                isSelected ? 'bg-muted' : ''
                                            }
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) => {
                                                        if (canSelect) {
                                                            setSelectedId(
                                                                checked
                                                                    ? item.id
                                                                    : null,
                                                            );
                                                        }
                                                    }}
                                                    disabled={!canSelect}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <code className="font-mono text-xs">
                                                    {item.full_code}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <div
                                                    className="flex items-center gap-2"
                                                    style={{
                                                        paddingLeft: `${item.depth * 24}px`,
                                                    }}
                                                >
                                                    {item.depth > 0 && (
                                                        <span className="text-muted-foreground opacity-50">
                                                            ↳
                                                        </span>
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                                            {item.type}
                                                        </span>
                                                        <span className="leading-tight">
                                                            {item.name}
                                                        </span>
                                                        {isCurrentParent && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="mt-1 w-fit text-xs"
                                                            >
                                                                Current Parent
                                                            </Badge>
                                                        )}
                                                        {!canSelect && (
                                                            <span className="text-xs text-muted-foreground">
                                                                (Not a valid
                                                                parent)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {flatItems.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            className="h-24 text-center"
                                        >
                                            No results found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>

                <DialogFooter className="sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                        {selectedParent ? (
                            <span>
                                Selected: <strong>{selectedParent.name}</strong>
                            </span>
                        ) : (
                            'No parent selected'
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleMove}
                            disabled={!selectedId || loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-1">
                                    <Spinner />
                                    Moving...
                                </span>
                            ) : (
                                'Move'
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
