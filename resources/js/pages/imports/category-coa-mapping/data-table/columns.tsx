import { createColumnHelper } from '@tanstack/react-table';
import { Check, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import { formatCoaOption } from '@/lib/ppmp/batch-match';
import { index as categoryImportIndex } from '@/routes/category-import';
import type { CategoryCoaReviewTableMeta } from '../types';
import type { EffectiveVerifiedPair } from '../types';

export type PairFilter =
    | 'all'
    | 'creatable'
    | 'missingCat'
    | 'missingCoa'
    | 'exists';

export type RowStatus = 'creatable' | 'missingCat' | 'missingCoa' | 'exists';

/** Display labels drop the `coa:<id>:` machine prefix from option values. */
export function stripCoaPrefix(option: string): string {
    return option.replace(/^coa:\d+:/, '');
}

export function rowStatus(p: EffectiveVerifiedPair): RowStatus {
    if (!p.catExists) return 'missingCat';
    if (!p.effectiveCoaExists) return 'missingCoa';
    if (p.effectiveMappingExists) return 'exists';

    return 'creatable';
}

export const ROW_TINT: Record<RowStatus, string> = {
    creatable:
        'bg-amber-50/40 hover:bg-amber-50/70 dark:bg-amber-950/10 dark:hover:bg-amber-950/20',
    missingCat: 'bg-destructive/5 hover:bg-destructive/10',
    missingCoa: 'bg-destructive/5 hover:bg-destructive/10',
    exists: 'opacity-70 hover:opacity-100',
};

const columnHelper = createColumnHelper<EffectiveVerifiedPair>();

/** Category cell: name plus how it resolved against the DB. */
const categoryColumn = columnHelper.display({
    id: 'category',
    size: 240,
    header: () => <div>Category</div>,
    cell: ({ row }) => {
        const p = row.original;

        return (
            <div className="flex items-start gap-2">
                {p.catExists ? (
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                ) : (
                    <X className="text-destructive mt-0.5 h-3.5 w-3.5 shrink-0" />
                )}
                <div className="min-w-0">
                    <div
                        className="truncate text-sm font-medium"
                        title={p.category}
                    >
                        {p.category}
                    </div>
                    <div className="text-muted-foreground text-[11px]">
                        {p.catExists && p.catId !== null
                            ? `id ${p.catId}`
                            : `row ${p.catRow} · not in DB`}
                    </div>
                </div>
            </div>
        );
    },
});

/**
 * COA cell: the raw Excel text, a combobox to pick/override the mapping, and
 * whatever the effective resolution currently is. Machine-suggested options
 * are floated to the top and starred.
 */
const coaColumn = columnHelper.display({
    id: 'coa',
    size: 340,
    header: () => <div>COA</div>,
    cell: ({ row, table }) => {
        const p = row.original;
        const meta = table.options.meta as CategoryCoaReviewTableMeta;

        const suggestedLabels = p.coaTopMatches.map((m) =>
            stripCoaPrefix(formatCoaOption(m.coa)),
        );
        const suggestedSet = new Set(suggestedLabels);
        const itemsForRow = [
            ...suggestedLabels,
            ...(meta.allCoaLabels ?? []).filter((l) => !suggestedSet.has(l)),
        ];
        const selectedDisplay = p.effectiveCoa
            ? stripCoaPrefix(formatCoaOption(p.effectiveCoa))
            : '';

        return (
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-muted-foreground shrink-0">
                        Excel:
                    </span>
                    <span className="truncate font-mono" title={p.coa}>
                        {p.coa}
                    </span>
                    {p.coaExists ? (
                        <Check className="h-3 w-3 shrink-0 text-green-600" />
                    ) : p.coaMatchType === 'partial' ? (
                        <Badge
                            variant="outline"
                            className="h-4 shrink-0 px-1 text-[10px]"
                        >
                            partial
                        </Badge>
                    ) : (
                        <X className="text-destructive h-3 w-3 shrink-0" />
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <Combobox
                        items={itemsForRow}
                        value={selectedDisplay}
                        onValueChange={(val) =>
                            meta.onCoaPick(p.key, val as string | null)
                        }
                    >
                        <ComboboxInput
                            placeholder={
                                p.coaMatchType === 'partial'
                                    ? 'Suggested at top — search COA…'
                                    : 'Search COA…'
                            }
                            className="h-8 w-full text-xs"
                        />
                        <ComboboxContent>
                            <ComboboxEmpty>No COA found.</ComboboxEmpty>
                            <ComboboxList>
                                {(item: string) => {
                                    const isSuggested = suggestedSet.has(item);

                                    return (
                                        <ComboboxItem
                                            key={item}
                                            value={item}
                                            className={
                                                isSuggested ? 'font-medium' : ''
                                            }
                                        >
                                            {isSuggested ? '★ ' : ''}
                                            {item}
                                        </ComboboxItem>
                                    );
                                }}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                    {p.overrideId !== null && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            title="Clear override"
                            onClick={() => meta.onClearOverride(p.key)}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>

                {p.effectiveCoa ? (
                    <div
                        className="truncate text-xs text-green-600"
                        title={`${p.effectiveCoa.path} — ${p.effectiveCoa.account_title}`}
                    >
                        → {p.effectiveCoa.path} — {p.effectiveCoa.account_title}
                        {p.overrideId !== null && (
                            <span className="ml-1 text-amber-600">
                                (override)
                            </span>
                        )}
                    </div>
                ) : p.coaTopMatches.length > 0 ? (
                    <div
                        className="text-muted-foreground truncate text-xs"
                        title={p.coaTopMatches
                            .map(
                                (m) =>
                                    `${m.coa.path} — ${m.coa.account_title} (score ${m.score})`,
                            )
                            .join(' | ')}
                    >
                        Suggest: {p.coaTopMatches[0].coa.path} —{' '}
                        {p.coaTopMatches[0].coa.account_title}
                    </div>
                ) : null}
            </div>
        );
    },
});

const sectionColumn = columnHelper.display({
    id: 'section',
    size: 110,
    header: () => <div>Section</div>,
    cell: ({ row }) => (
        <div className="text-muted-foreground align-top text-xs">
            <div className="truncate" title={row.original.section}>
                {row.original.section}
            </div>
            <div className="text-[10px]">coa row {row.original.coaRow}</div>
        </div>
    ),
});

const itemsColumn = columnHelper.display({
    id: 'items',
    size: 70,
    header: () => <div className="text-right">Items</div>,
    cell: ({ row }) => (
        <div className="text-right align-top text-xs tabular-nums">
            {row.original.items}
        </div>
    ),
});

const statusColumn = columnHelper.display({
    id: 'status',
    size: 170,
    header: () => <div>Status</div>,
    cell: ({ row }) => {
        const p = row.original;
        const status = rowStatus(p);

        if (status === 'creatable') {
            return (
                <Badge
                    variant="outline"
                    className="border-amber-500 text-amber-700 dark:text-amber-400"
                >
                    <Plus className="mr-1 h-3 w-3" />
                    Not mapped
                </Badge>
            );
        }

        if (status === 'exists') {
            return (
                <Badge
                    variant="outline"
                    className="border-green-600 text-green-700 dark:text-green-400"
                >
                    <Check className="mr-1 h-3 w-3" />
                    Mapped
                </Badge>
            );
        }

        if (status === 'missingCat') {
            return (
                <div className="flex flex-col gap-1">
                    <Badge variant="destructive">
                        <X className="mr-1 h-3 w-3" />
                        No category
                    </Badge>
                    <a
                        href={categoryImportIndex().url}
                        className="text-[11px] underline"
                    >
                        Category Import →
                    </a>
                </div>
            );
        }

        return (
            <Badge variant="destructive">
                <X className="mr-1 h-3 w-3" />
                Pick a COA
            </Badge>
        );
    },
});

const columns = [
    categoryColumn,
    coaColumn,
    sectionColumn,
    itemsColumn,
    statusColumn,
];

export default columns;
