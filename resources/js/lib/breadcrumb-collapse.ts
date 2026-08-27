import type { BreadcrumbItem as BreadcrumbItemType } from "@/types";

export type CollapsedBreadcrumbs<T extends BreadcrumbItemType = BreadcrumbItemType> = {
    visibleHead: T[];
    hidden: T[];
    tail: T[];
    showEllipsis: boolean;
};

/**
 * Collapse breadcrumbs when too many.
 * maxVisible = total crumbs to show when collapsed (including head + tail).
 * Default 3 => [first] + ellipsis + [last]
 * 4 => [first] + ellipsis + [last 2]
 */
export function collapseBreadcrumbs<T extends BreadcrumbItemType>(
    items: T[],
    maxVisible = 3,
): CollapsedBreadcrumbs<T> {
    if (items.length <= maxVisible) {
        return { visibleHead: items, hidden: [], tail: [], showEllipsis: false };
    }

    const headCount = 1;
    const tailCount = maxVisible - headCount;
    const visibleHead = items.slice(0, headCount);
    const tail = items.slice(-tailCount);
    const hidden = items.slice(headCount, items.length - tailCount);

    return { visibleHead, hidden, tail, showEllipsis: hidden.length > 0 };
}
