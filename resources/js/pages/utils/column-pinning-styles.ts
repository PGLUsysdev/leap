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

    return {
        boxShadow: isLastLeftPinnedColumn
            ? '-4px 0 4px -4px var(--border) inset'
            : isFirstRightPinnedColumn
              ? //   ? '4px 0 4px -4px gray inset'
                '1px 0 0 0 var(--border) inset'
              : undefined,

        left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
        right:
            isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
        // opacity: isPinned ? 0.95 : 1,
        position: isPinned ? 'sticky' : 'relative',

        width: isPinned ? `${size}px` : `${percentage}%`,
        minWidth: `${size}px`,
        maxWidth: isPinned ? `${size}px` : undefined,

        zIndex: isPinned ? 1 : 0,
        backgroundColor: isFooter
            ? 'var(--muted)'
            : isHeader && isPinned
              ? 'var(--primary)'
              : isFirstRightPinnedColumn
                ? 'var(--background)'
                : '',
    };
};
