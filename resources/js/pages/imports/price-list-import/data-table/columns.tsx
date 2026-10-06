import { createColumnHelper } from '@tanstack/react-table';
import { Link } from '@inertiajs/react';
import { AlertCircle, Check, Minus, Pencil, RefreshCw, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import { formatCoaOption } from '@/lib/ppmp/batch-match';
import { cn } from '@/lib/utils';
import type { PriceListReviewTableMeta } from '../types';
import type { VerifiedItem } from '../types';

type ExistingCoa = PriceListReviewTableMeta['existingCoas'][number];

export const PAGE_SIZE = 50;

/** A row is selectable iff it can actually be imported. */
export function isSelectable(v: VerifiedItem): boolean {
    return v.status !== 'error' && v.status !== 'skipped';
}

/** Strip the `coa:<id>:` machine prefix from a formatted COA option. */
export function stripCoaPrefix(option: string): string {
    return option.replace(/^coa:\d+:/, '');
}

/**
 * Human-facing COA label: `<path> — <account_title>`, without the
 * `coa:<id>:` prefix that `formatCoaOption()` adds. Used for both the
 * Combobox's displayed value and its dropdown items so the input and the
 * list agree.
 */
export function formatCoaLabel(coa: ExistingCoa): string {
    return stripCoaPrefix(formatCoaOption(coa));
}

/**
 * Build the combobox item list for a COA picker: suggested COAs first (in
 * top-match order), then all remaining existing COAs. Both as plain
 * `<path> — <title>` labels (no machine prefix).
 */
export function buildCoaItems(
    suggested: ExistingCoa[],
    all: ExistingCoa[],
): string[] {
    const suggestedIds = new Set(suggested.map((c) => c.id));
    const head = suggested.map(formatCoaLabel);
    const tail = all.filter((c) => !suggestedIds.has(c.id)).map(formatCoaLabel);

    return [...head, ...tail];
}

export function formatMoney(price: number | null): string {
    return price !== null ? `₱${price.toLocaleString()}` : '—';
}

/** Non-selectable rows read as broken; overridden rows get a left accent. */
export function rowClassName(item: VerifiedItem): string {
    return cn(
        !isSelectable(item) && 'bg-destructive/5',
        item.status === 'update' && 'bg-amber-50/30 dark:bg-amber-950/5',
        // Overridden rows get a subtle left accent so they stand out
        // even when the user isn't on the "Overrides" filter.
        item.overrideId !== null &&
            'shadow-[inset_3px_0_0_0_var(--color-amber-500)]',
    );
}

const columnHelper = createColumnHelper<VerifiedItem>();

const selectColumn = columnHelper.display({
    id: 'select',
    size: 40,
    header: ({ table }) => {
        const meta = table.options.meta as PriceListReviewTableMeta;
        const selected = meta.selected ?? new Set<string>();
        const selectable = table
            .getFilteredRowModel()
            .rows.map((r) => r.original)
            .filter(isSelectable);

        const allChecked =
            selectable.length > 0 &&
            selectable.every((v) => selected.has(v.key));
        const someSelected = selectable.some((v) => selected.has(v.key));

        return (
            <Checkbox
                checked={allChecked}
                indeterminate={someSelected && !allChecked}
                onCheckedChange={(v) => {
                    const next = new Set(selected);

                    if (v === true) {
                        for (const it of selectable) next.add(it.key);
                    } else {
                        for (const it of selectable) next.delete(it.key);
                    }

                    meta.setSelected(next);
                }}
                aria-label="Select all importable rows"
                title={`Select all ${selectable.length} importable row${selectable.length === 1 ? '' : 's'} across all pages`}
            />
        );
    },
    cell: ({ row, table }) => {
        const meta = table.options.meta as PriceListReviewTableMeta;
        const item = row.original;
        const isSelected = meta.selected?.has(item.key) ?? false;
        const canSelect = isSelectable(item);

        return (
            <Checkbox
                checked={isSelected}
                disabled={!canSelect}
                onCheckedChange={(checked) => {
                    meta.setSelected((prev) => {
                        const next = new Set(prev);

                        if (checked) next.add(item.key);
                        else next.delete(item.key);

                        return next;
                    });
                }}
                aria-label={`Select ${item.description}`}
            />
        );
    },
});

const descriptionColumn = columnHelper.display({
    id: 'description',
    size: 260,
    header: () => <div>Description</div>,
    cell: ({ row, table }) => {
        const item = row.original;
        const meta = table.options.meta as PriceListReviewTableMeta;

        return (
            <div>
                <div className="flex items-start gap-1.5">
                    <span
                        className="max-w-[30ch] truncate text-sm"
                        title={item.description}
                    >
                        {item.description}
                    </span>
                    {item.count > 1 && (
                        <Badge
                            variant="outline"
                            className="h-4 shrink-0 px-1 text-[10px]"
                            title={`${item.count} raw rows collapsed`}
                        >
                            ×{item.count}
                        </Badge>
                    )}
                    {!item.descriptionValid && (
                        <Badge
                            variant="destructive"
                            className="h-4 shrink-0 px-1 text-[10px]"
                            title={`Length ${item.description.trim().length} > 1000`}
                        >
                            {item.description.trim().length}/1000
                        </Badge>
                    )}
                </div>
                {!item.descriptionValid && (
                    <div className="mt-1 flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => meta.onTruncateDescription(item.key)}
                            className="h-5 px-1 text-[10px] text-amber-600 hover:text-amber-700"
                        >
                            Truncate to 1000
                        </Button>
                        <span className="text-muted-foreground text-[10px]">
                            → “…
                            {item.description.trim().slice(0, 1000).slice(-20)}”
                        </span>
                    </div>
                )}
            </div>
        );
    },
});

function CategoryMark({ item }: { item: VerifiedItem }) {
    if (item.catExists) {
        return (
            <Check
                className="mt-0.5 h-3 w-3 shrink-0 text-green-600"
                aria-label="Category found"
            />
        );
    }
    if (item.catMatchType === 'partial') {
        return (
            <span
                className="text-muted-foreground mt-0.5 shrink-0 text-xs leading-none"
                title="Partial match"
            >
                ~
            </span>
        );
    }
    return (
        <X
            className="text-destructive mt-0.5 h-3 w-3 shrink-0"
            aria-label="Category not found"
        />
    );
}

const categoryColumn = columnHelper.display({
    id: 'category',
    size: 170,
    header: () => <div>Category</div>,
    cell: ({ row }) => {
        const item = row.original;

        return (
            <div className="flex items-start gap-1.5 text-xs">
                <span className="max-w-[14ch] truncate" title={item.category}>
                    {item.category}
                </span>
                <CategoryMark item={item} />
            </div>
        );
    },
});

const coaColumn = columnHelper.display({
    id: 'coa',
    size: 340,
    header: () => <div>COA (Excel → DB)</div>,
    cell: ({ row, table }) => {
        const item = row.original;
        const meta = table.options.meta as PriceListReviewTableMeta;
        const existingCoas = meta.existingCoas ?? [];

        const isOverridden = item.overrideId !== null;
        // Display uses the stripped label. The override handler falls back to
        // a label → id lookup for values without the machine prefix.
        const selectedDisplay = item.effectiveCoa
            ? formatCoaLabel(item.effectiveCoa)
            : '';
        const items = buildCoaItems(
            item.coaTopMatches.map((m) => m.coa),
            existingCoas,
        );
        const suggestedLabels = new Set(
            item.coaTopMatches.map((m) => formatCoaLabel(m.coa)),
        );

        return (
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-muted-foreground tracking-wide uppercase">
                        Excel
                    </span>
                    <span
                        className="max-w-[24ch] truncate font-mono"
                        title={item.coa}
                    >
                        {item.coa}
                    </span>
                    {item.coaExists ? (
                        <Check className="h-3 w-3 shrink-0 text-green-600" />
                    ) : item.coaMatchType === 'partial' ? (
                        <Badge
                            variant="outline"
                            className="h-3.5 shrink-0 px-1 text-[9px]"
                        >
                            partial
                        </Badge>
                    ) : (
                        <X className="text-destructive h-3 w-3 shrink-0" />
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <Combobox
                        items={items}
                        value={selectedDisplay}
                        onValueChange={(val) =>
                            meta.onCoaOverrideChange(
                                item.key,
                                val as string | null,
                            )
                        }
                    >
                        <ComboboxInput
                            placeholder={
                                item.coaMatchType === 'partial'
                                    ? '★ Suggested at top — search…'
                                    : 'Search COA…'
                            }
                            className="h-7 text-xs"
                        />
                        <ComboboxContent>
                            <ComboboxEmpty>No COA found.</ComboboxEmpty>
                            <ComboboxList>
                                {(entry: string) => {
                                    const isSuggested =
                                        suggestedLabels.has(entry);

                                    return (
                                        <ComboboxItem
                                            key={entry}
                                            value={entry}
                                            className={
                                                isSuggested ? 'font-medium' : ''
                                            }
                                        >
                                            {isSuggested ? '★ ' : ''}
                                            {entry}
                                        </ComboboxItem>
                                    );
                                }}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                    {isOverridden && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 shrink-0 px-1 text-xs"
                            onClick={() => meta.onClearOverride(item.key)}
                            title="Clear override"
                            aria-label="Clear COA override"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>

                {item.effectiveCoa ? (
                    <div
                        className={cn(
                            'truncate text-[11px]',
                            isOverridden ? 'text-amber-600' : 'text-green-600',
                        )}
                        title={`${item.effectiveCoa.path} — ${item.effectiveCoa.account_title}`}
                    >
                        {isOverridden ? (
                            <>
                                <Pencil className="mr-1 inline h-3 w-3" />
                                {item.effectiveCoa.path} —{' '}
                                {item.effectiveCoa.account_title}
                                <span className="ml-1">(override)</span>
                            </>
                        ) : (
                            <>
                                ✓ {item.effectiveCoa.path} —{' '}
                                {item.effectiveCoa.account_title}
                            </>
                        )}
                    </div>
                ) : item.coaTopMatches.length > 0 ? (
                    <div
                        className="text-muted-foreground truncate text-[11px]"
                        title={item.coaTopMatches
                            .map(
                                (m) =>
                                    `${m.coa.path} — ${m.coa.account_title} (score ${m.score})`,
                            )
                            .join(' | ')}
                    >
                        Suggest: {item.coaTopMatches[0].coa.path} —{' '}
                        {item.coaTopMatches[0].coa.account_title}
                    </div>
                ) : null}
            </div>
        );
    },
});

const unitColumn = columnHelper.display({
    id: 'unit',
    size: 85,
    header: () => <div>Unit</div>,
    cell: ({ row }) => <div className="text-xs">{row.original.unit}</div>,
});

const priceColumn = columnHelper.display({
    id: 'price',
    size: 110,
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => (
        <div className="text-right text-xs tabular-nums">
            {formatMoney(row.original.price)}
        </div>
    ),
});

const statusColumn = columnHelper.display({
    id: 'status',
    size: 215,
    header: () => <div>Status</div>,
    cell: ({ row }) => {
        const item = row.original;
        const base = 'flex items-start gap-1 text-xs';

        return (
            <div>
                {item.status === 'error' && (
                    <div className={cn(base, 'text-destructive')}>
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                            {item.message}
                            {!item.catExists && (
                                <>
                                    {' '}
                                    <Link
                                        href="/imports/category-import"
                                        className="underline"
                                    >
                                        Category Import
                                    </Link>
                                </>
                            )}
                            {!item.effectiveMappingExists &&
                                item.catExists &&
                                item.effectiveCoaExists && (
                                    <>
                                        {' '}
                                        <Link
                                            href="/imports/category-coa-mapping"
                                            className="underline"
                                        >
                                            → Map
                                        </Link>
                                    </>
                                )}
                        </span>
                    </div>
                )}
                {item.status === 'skipped' && (
                    <div className={cn(base, 'text-muted-foreground')}>
                        <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                            {item.message}{' '}
                            <Link
                                href="/imports/category-import"
                                className="underline"
                            >
                                Category Import
                            </Link>
                        </span>
                    </div>
                )}
                {item.status === 'update' && (
                    <div className={cn(base, 'text-amber-600')}>
                        <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{item.message}</span>
                    </div>
                )}
                {item.status === 'ready' && (
                    <div className={cn(base, 'text-green-600')}>
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{item.message}</span>
                    </div>
                )}
                <div className="text-muted-foreground mt-1 text-[10px]">
                    {item.sheets.join(', ')} · row {item.rows.join(', ')}
                </div>
            </div>
        );
    },
});

const columns = [
    selectColumn,
    descriptionColumn,
    categoryColumn,
    coaColumn,
    unitColumn,
    priceColumn,
    statusColumn,
];

export default columns;
