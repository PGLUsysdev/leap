import { createColumnHelper } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { CategoryReviewRow, CategoryReviewTableMeta } from '../types';

const columnHelper = createColumnHelper<CategoryReviewRow>();

export function getCategoryReviewColumns(sheetTotal: number) {
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
            size: 260,
            header: () => <div className="px-1">DB Match</div>,
            cell: ({ row }) => {
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

                if (u.matchType === 'partial' && u.topMatches.length > 0) {
                    return (
                        <div className="flex max-w-[30ch] flex-col gap-1 px-1">
                            {u.topMatches.slice(0, 2).map((p, idx) => (
                                <Badge
                                    key={idx}
                                    variant="outline"
                                    className="justify-start text-xs"
                                    title={`${p.name} (score ${p.score})`}
                                >
                                    <span className="truncate">{p.name}</span>
                                    <span className="text-muted-foreground ml-1 shrink-0">
                                        {p.score === 99
                                            ? '(substr)'
                                            : `(lev ${p.score})`}
                                    </span>
                                </Badge>
                            ))}
                        </div>
                    );
                }

                return (
                    <span className="text-muted-foreground px-1 text-xs">
                        — new
                    </span>
                );
            },
        }),
        columnHelper.accessor('sheetCount', {
            size: 90,
            header: () => <div className="px-1 text-center">Sheets</div>,
            cell: ({ row }) => (
                <div className="flex justify-center px-1">
                    <Badge
                        variant={
                            row.original.sheetCount === sheetTotal
                                ? 'default'
                                : row.original.sheetCount > 1
                                  ? 'secondary'
                                  : 'outline'
                        }
                        className="font-mono text-xs"
                        title={row.original.sheets.join(', ')}
                    >
                        {row.original.sheetCount}/{sheetTotal}
                    </Badge>
                </div>
            ),
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
        columnHelper.accessor('firstAddress', {
            size: 180,
            header: () => <div className="px-1">Location</div>,
            cell: ({ row }) => (
                <div
                    className="max-w-[22ch] truncate px-1 font-mono text-[11px]"
                    title={row.original.locations
                        .map((l) => l.address)
                        .join(', ')}
                >
                    {row.original.firstAddress || '—'}
                </div>
            ),
        }),
    ];
}
