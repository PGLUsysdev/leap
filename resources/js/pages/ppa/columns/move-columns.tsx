import { createColumnHelper } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Ppa } from '@/types/global';
import { Checkbox } from '@/components/ui/checkbox';
import {
    ButtonGroup,
    ButtonGroupSeparator,
    ButtonGroupText,
} from '@/components/ui/button-group';
import { FolderOpen } from 'lucide-react';

const columnHelper = createColumnHelper<Ppa>();

const isValidParentType = (targetType: string, sourceType: string): boolean => {
    if (sourceType === 'Project') return targetType === 'Program';
    if (sourceType === 'Activity') return targetType === 'Project';
    if (sourceType === 'Sub-Activity') return targetType === 'Activity';
    return false;
};

const canNavigateInto = (targetType: string, sourceType: string): boolean => {
    if (targetType === 'Sub-Activity') return false; // Nothing is below Sub-Activity

    switch (sourceType) {
        case 'Program':
            return false; // Programs stay at Root; no need to go deeper

        case 'Project':
            // Can only go into Programs to look for Project siblings
            return targetType === 'Program';

        case 'Activity':
            // Can go into Programs or Projects to find Activity parents/siblings
            return targetType === 'Program' || targetType === 'Project';

        case 'Sub-Activity':
            // Can go into anything except other Sub-Activities
            return (
                targetType === 'Program' ||
                targetType === 'Project' ||
                targetType === 'Activity'
            );

        default:
            return false;
    }
};

const columns = [
    columnHelper.display({
        id: 'select-target',
        size: 80,
        cell: ({ row, table }) => {
            const meta = table.options.meta as any;
            const source = meta.ppaToMove;
            const target = row.original as any;

            if (!source)
                return (
                    <div className="h-4 w-4 rounded border border-dashed opacity-20" />
                );

            const isSibling = target.type === source.type;
            const isParent = isValidParentType(target.type, source.type);
            const isSelf = String(target.id) === String(source.id);
            const isDisabled = (!isSibling && !isParent) || isSelf;

            const isChecked = !!target._isSelected;

            return (
                <div className="flex items-center justify-center">
                    <Checkbox
                        key={`cb-${target.id}-${isChecked}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                            meta.onSelect(checked ? target : null);
                        }}
                        disabled={isDisabled}
                    />
                </div>
            );
        },
    }),
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

            const isSelf = String(ppa.id) === String(source?.id);
            const isParent = source && isValidParentType(ppa.type, source.type);
            const isSibling = source && ppa.type === source.type;

            return (
                <div
                    className={`flex flex-col py-1 transition-opacity ${isSelf ? 'opacity-30' : ''}`}
                >
                    <div className="mb-1 flex items-center gap-2">
                        <span className="text-[10px] font-bold tracking-tight text-muted-foreground uppercase">
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
        id: 'action',
        size: 74,
        cell: ({ row, table }) => {
            const meta = table.options.meta as any;
            const source = meta.ppaToMove;
            const target = row.original;
            const childrenCount = target.children_count;

            // Logic 1: Standard Sub-Activity check
            const isSubActivity = target.type === 'Sub-Activity';

            // Logic 2: Boundary check
            const isNavigationAllowed = source
                ? canNavigateInto(target.type, source.type)
                : false;

            // Logic 3: Prevent navigating into yourself while moving yourself
            const isSelf = source && String(target.id) === String(source.id);

            return (
                // <Button
                //     size="icon"
                //     variant="outline"
                //     onClick={() => meta?.onShowChildren?.(target)}
                //     disabled={isSubActivity || !isNavigationAllowed || isSelf}
                // >
                //     {childrenCount}
                // </Button>

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
                        disabled={
                            isSubActivity || !isNavigationAllowed || isSelf
                        }
                    >
                        <FolderOpen />
                    </Button>
                </ButtonGroup>
            );
        },
    }),
];

export default columns;
