import { createColumnHelper } from '@tanstack/react-table';
import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/base-ui-components/ui/button';
import {
    ButtonGroup,
    ButtonGroupSeparator,
} from '@/components/base-ui-components/ui/button-group';
import { Badge } from '@/components/ui/badge';
import type { Ppa } from '@/types';

const columnHelper = createColumnHelper<Ppa>();

const isValidParentType = (
    targetType: string,
    sourceType: string,
    ppaTypes: string[] = [],
): boolean => {
    const targetIndex = ppaTypes.indexOf(targetType);
    const sourceIndex = ppaTypes.indexOf(sourceType);
    return (
        targetIndex !== -1 &&
        sourceIndex !== -1 &&
        targetIndex === sourceIndex - 1
    );
};

const canNavigateInto = (
    targetType: string,
    sourceType: string,
    ppaTypes: string[] = [],
): boolean => {
    const targetIndex = ppaTypes.indexOf(targetType);
    const sourceIndex = ppaTypes.indexOf(sourceType);
    if (targetIndex === -1 || sourceIndex === -1) {
        return false;
    }
    if (targetIndex === ppaTypes.length - 1) {
        return false;
    }
    return targetIndex < sourceIndex;
};

const columns = [
    columnHelper.accessor('full_code', {
        header: 'AIP Reference Code',
        size: 180,
        cell: (info) => {
            const meta = info.table.options.meta as any;
            const isSelf =
                String(info.row.original.id) === String(meta.ppaToMove?.id);

            return (
                <code
                    className={`font-mono text-xs ${isSelf ? 'opacity-30' : ''}`}
                >
                    {info.getValue<string>()}
                </code>
            );
        },
    }),
    columnHelper.accessor('name', {
        header: 'Program/Project/Activity Description',
        size: 450,
        cell: (info) => {
            const ppa = info.row.original;
            const meta = info.table.options.meta as any;
            const source = meta.ppaToMove;
            const ppaTypes = meta.ppaTypes || [];

            const isSelf = String(ppa.id) === String(source?.id);
            const isParent =
                source && isValidParentType(ppa.type, source.type, ppaTypes);
            const isSibling = source && ppa.type === source.type;

            return (
                <div
                    className={`flex flex-col py-1 transition-opacity ${isSelf ? 'opacity-30' : ''}`}
                >
                    <div className="mb-1 flex items-center gap-2">
                        <span className="text-muted-foreground text-[10px] font-bold tracking-tight uppercase">
                            {ppa.type}
                        </span>
                        {isParent && (
                            <Badge
                                variant="secondary"
                                className="h-4 px-1 text-[9px] font-bold"
                            >
                                PARENT
                            </Badge>
                        )}
                        {isSibling && (
                            <Badge className="h-4 px-1 text-[9px] font-bold">
                                SIBLING
                            </Badge>
                        )}
                        {isSelf && (
                            <Badge
                                variant="outline"
                                className="h-4 px-1 text-[9px]"
                            >
                                CURRENT
                            </Badge>
                        )}
                    </div>

                    <span
                        className={`text-sm leading-tight wrap-break-word whitespace-normal ${isSelf ? 'italic' : 'font-medium'}`}
                    >
                        {ppa.name}
                    </span>
                </div>
            );
        },
    }),
    columnHelper.accessor('is_active', {
        header: 'Status',
        cell: (info) => {
            const active = info.getValue<boolean>();
            const meta = info.table.options.meta as any;
            const isSelf =
                String(info.row.original.id) === String(meta.ppaToMove?.id);

            return (
                <div className={isSelf ? 'opacity-30 grayscale' : ''}>
                    {active ? (
                        <Badge variant="default" className="h-5 text-[10px]">
                            Active
                        </Badge>
                    ) : (
                        <Badge
                            variant="destructive"
                            className="h-5 text-[10px]"
                        >
                            Inactive
                        </Badge>
                    )}
                </div>
            );
        },
    }),
    columnHelper.display({
        id: 'actions',
        size: 74,
        cell: ({ row, table }) => {
            const meta = table.options.meta as any;
            const source = meta.ppaToMove;
            const target = row.original;
            const ppaTypes = meta.ppaTypes || [];
            const childrenCount = target.children_count;

            const isLastLeaf =
                ppaTypes.length > 0 &&
                target.type === ppaTypes[ppaTypes.length - 1];

            const isNavigationAllowed = source
                ? canNavigateInto(target.type, source.type, ppaTypes)
                : false;

            const isSelf = source && String(target.id) === String(source.id);

            return (
                <ButtonGroup>
                    <Button
                        variant="outline"
                        className="w-7 shrink overflow-hidden px-0"
                        disabled
                    >
                        {childrenCount}
                    </Button>
                    <Button
                        size="icon"
                        variant="outline"
                        title="Open PPA"
                        onClick={() => meta?.onShowChildren?.(target)}
                        disabled={isLastLeaf || !isNavigationAllowed || isSelf}
                    >
                        <FolderOpen />
                    </Button>
                </ButtonGroup>
            );
        },
    }),
];

export default columns;
