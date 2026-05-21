import type { Column, Table } from '@tanstack/react-table';
import type { CSSProperties } from 'react';

export const getCommonPinningStyles = <TData>(
    column: Column<TData>,
    table: Table<any>,
    isFooter = false,
    isHeader = false,
): CSSProperties => {
    const isPinned = column.getIsPinned();
    const isLastLeftPinnedColumn =
        isPinned === 'left' && column.getIsLastColumn('left');
    const isFirstRightPinnedColumn =
        isPinned === 'right' && column.getIsFirstColumn('right');

    const size = column.getSize();

    const unpinnedTotal = table
        .getAllColumns()
        .filter((col) => !col.getIsPinned())
        .reduce((acc, col) => acc + col.getSize(), 0);
    const percentage = (size / unpinnedTotal) * 100;

    // --- Dynamic Stacking Logic ---
    let cellZIndex = 0;
    if (isPinned) {
        if (isFooter || isHeader) {
            cellZIndex = 3; // 1. Top Tier: Pinned Headers/Footers freeze above ALL traffic
        } else {
            cellZIndex = 1; // 3. Bottom Tier: Pinned body rows sit low so footers pass over them
        }
    } else if (isFooter || isHeader) {
        cellZIndex = 2; // 2. Middle Tier: Unpinned footers slide OVER body rows but UNDER pinned corners
    }

    return {
        boxShadow: isLastLeftPinnedColumn
            ? `inset -4px 0 4px -4px var(--border)${isFooter ? '' : ', inset 0 -1px 0 0 var(--border)'}`
            : isFirstRightPinnedColumn
              ? isFooter
                  ? undefined
                  : 'inset 0 -1px 0 0 var(--border)'
              : isFooter
                ? undefined
                : 'inset 0 -1px 0 0 var(--border)',

        left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
        right:
            isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
        position: isPinned ? 'sticky' : 'relative',

        width: isPinned ? `${size}px` : `${percentage}%`,
        minWidth: `${size}px`,
        maxWidth: isPinned ? `${size}px` : undefined,

        zIndex: cellZIndex,

        backgroundColor: isFirstRightPinnedColumn
            ? isHeader
                ? 'var(--background)'
                : isFooter
                  ? 'color-mix(in oklch, var(--muted) 50%, var(--background))' // Solid opaque mask
                  : 'color-mix(in oklch, var(--background) 90%, transparent)'
            : isFooter
              ? 'color-mix(in oklch, var(--muted) 50%, var(--background))' // Solid mix prevents body bleeding up
              : isHeader && isPinned
                ? 'var(--background)'
                : undefined,
    };
};
