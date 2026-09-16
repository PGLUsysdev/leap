import { createColumnHelper } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import {
    newDecisionItem,
    suggestedDecisionItem,
} from '@/lib/ppmp/category-extract';
import type { CategoryReviewRow, CategoryReviewTableMeta } from '../types';

const columnHelper = createColumnHelper<CategoryReviewRow>();

export function getCategoryReviewColumns() {
    return [
        columnHelper.display({
            id: 'select',
            size: 44,
            header: ({ table }) => {
                const meta = table.options.meta as
                    | CategoryReviewTableMeta
                    | undefined;
                const selected = meta?.selected ?? new Set<string>();
                const selectable = table
                    .getFilteredRowModel()
                    .rows.map((r) => r.original.normalized);
                const allChecked =
                    selectable.length > 0 &&
                    selectable.every((n) => selected.has(n));

                return (
                    <Checkbox
                        checked={allChecked}
                        onCheckedChange={(checked) => {
                            if (!meta) return;
                            const next = new Set(selected);

                            if (checked === true) {
                                for (const n of selectable) next.add(n);
                            } else {
                                for (const n of selectable) next.delete(n);
                            }

                            meta.setSelected(next);
                        }}
                        aria-label="Select all rows"
                    />
                );
            },
            cell: ({ row, table }) => {
                const meta = table.options.meta as
                    | CategoryReviewTableMeta
                    | undefined;
                const n = row.original.normalized;

                return (
                    <Checkbox
                        checked={meta?.selected.has(n) ?? false}
                        onCheckedChange={(checked) =>
                            meta?.toggleOne(n, checked === true)
                        }
                        aria-label={`Import ${row.original.raw}`}
                    />
                );
            },
        }),
        columnHelper.accessor((row) => `${row.raw} ${row.normalized}`, {
            id: 'raw',
            size: 220,
            header: () => <div className="px-1">Category</div>,
            cell: ({ row }) => (
                <div className="flex flex-col gap-0.5 px-1">
                    <span
                        className="max-w-[24ch] truncate text-xs font-medium"
                        title={row.original.raw}
                    >
                        {row.original.raw}
                    </span>
                    <span
                        className="text-muted-foreground max-w-[24ch] truncate text-[10px]"
                        title={row.original.normalized}
                    >
                        {row.original.normalized}
                    </span>
                </div>
            ),
        }),
        columnHelper.accessor((row) => row.matchName ?? row.normalized, {
            id: 'dbMatch',
            size: 300,
            header: () => <div className="px-1">DB Match</div>,
            cell: ({ row, table }) => {
                const u = row.original;

                if (u.matchType === 'strict') {
                    return (
                        <Badge
                            variant="secondary"
                            className="max-w-full justify-start bg-amber-100 text-amber-800"
                            title={u.matchName ?? undefined}
                        >
                            <span className="truncate">
                                Exists: {u.matchName}
                            </span>
                        </Badge>
                    );
                }

                // Partial or new: Combobox picks the name to import.
                // Default `＋ raw` creates a new category; picking an
                // existing name resolves the row as that duplicate.
                const meta = table.options.meta as
                    | CategoryReviewTableMeta
                    | undefined;
                const newItem = newDecisionItem(u.raw);
                const suggestedNames = new Set(
                    u.topMatches.map((t) => t.name),
                );
                const items = [
                    newItem,
                    ...u.topMatches.map((t) =>
                        suggestedDecisionItem(t.name),
                    ),
                    ...(meta?.allNames ?? []).filter(
                        (n) => n !== u.raw && !suggestedNames.has(n),
                    ),
                ];
                const value = meta?.decisions[u.normalized] ?? newItem;

                return (
                    <div className="flex min-w-[220px] flex-col gap-1 px-1">
                        {u.matchType === 'partial' && (
                            <span className="text-xs font-medium text-amber-700">
                                Similar — pick what to import
                            </span>
                        )}
                        <Combobox
                            items={items}
                            value={value}
                            onValueChange={(v) => {
                                if (typeof v === 'string' && v)
                                    meta?.decide(u.normalized, v);
                            }}
                        >
                            <ComboboxInput
                                placeholder={
                                    u.matchType === 'partial'
                                        ? '★ Suggested at top — search...'
                                        : 'Search categories...'
                                }
                                className="h-7 text-xs"
                            />
                            <ComboboxContent>
                                <ComboboxEmpty>
                                    No category found.
                                </ComboboxEmpty>
                                <ComboboxList>
                                    {(item: string) => {
                                        const isSuggested =
                                            u.topMatches.some(
                                                (t) =>
                                                    item ===
                                                    suggestedDecisionItem(
                                                        t.name,
                                                    ),
                                            );

                                        return (
                                            <ComboboxItem
                                                key={item}
                                                value={item}
                                                className={
                                                    isSuggested
                                                        ? 'font-medium'
                                                        : ''
                                                }
                                            >
                                                {item}
                                            </ComboboxItem>
                                        );
                                    }}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    </div>
                );
            },
        }),
        columnHelper.accessor('count', {
            size: 70,
            header: () => <div className="px-1 text-center">Count</div>,
            cell: (info) => (
                <div className="px-1 text-center font-mono text-xs">
                    {info.getValue()}
                </div>
            ),
        }),
        columnHelper.accessor('address', {
            size: 180,
            header: () => <div className="px-1">Location</div>,
            cell: ({ row }) => (
                <div
                    className="max-w-[22ch] truncate px-1 font-mono text-[11px]"
                    title={row.original.address}
                >
                    {row.original.address || '—'}
                </div>
            ),
        }),
    ];
}
