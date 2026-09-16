// resources/js/pages/imports/price-list-import/steps/review-step.tsx
//
// Review & Import step for Price List Import.
//
// Layout:
//   1. Summary bar — always-visible stats, status pills, filters
//   2. Batch-match panel (only when there are unresolved COA groups)
//   3. Contextual filter note
//   4. Items table (sticky header, per-row COA override + selection)
//   5. Sticky footer — import action
//
// State lives in the parent (PriceListImportState). This file is a view.

import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import {
    AlertCircle,
    AlertTriangle,
    Check,
    Minus,
    RefreshCw,
    X,
} from 'lucide-react';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { TabsContent } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatCoaOption } from '@/lib/ppmp/batch-match';
import type { ExtractedCoaGroup } from '@/lib/ppmp/batch-match';
import { cn } from '@/lib/utils';
import type {
    PriceListImportState,
    ReviewFilter,
    VerifiedItem,
} from '../types';

// ─── helpers ────────────────────────────────────────────────────────────────

/** A row is selectable iff it can actually be imported. */
function isSelectable(v: VerifiedItem): boolean {
    return v.status !== 'error' && v.status !== 'skipped';
}

function stripCoaPrefix(option: string): string {
    return option.replace(/^coa:\d+:/, '');
}

function parseCoaId(option: string): number | null {
    const m = option.match(/^coa:(\d+):/);

    return m ? Number(m[1]) : null;
}

function formatMoney(price: number | null): string {
    return price !== null ? `₱${price.toLocaleString()}` : '—';
}

/**
 * Build the combobox item list for a COA picker: suggested COAs first (in
 * top-match order), then all remaining existing COAs, both as prefixed
 * `coa:<id>:<path> — <title>` strings.
 */
function buildCoaItems(
    suggested: PriceListImportState['existingCoas'],
    all: PriceListImportState['existingCoas'],
): string[] {
    const suggestedIds = new Set(suggested.map((c) => c.id));
    const head = suggested.map(formatCoaOption);
    const tail = all
        .filter((c) => !suggestedIds.has(c.id))
        .map(formatCoaOption);

    return [...head, ...tail];
}

// ─── root ───────────────────────────────────────────────────────────────────

export function ReviewStep({ s }: { s: PriceListImportState }) {
    if (s.verifiedItems.length === 0) {
        return <EmptyState />;
    }

    return (
        <TabsContent value="review" className="mt-4 flex flex-col gap-4">
            <SummaryBar s={s} />
            {s.batchGroups.length > 0 && <BatchMatchPanel s={s} />}
            <FilterNote filter={s.reviewFilter} s={s} />
            <ItemsTable s={s} />
            <ImportFooter s={s} />
        </TabsContent>
    );
}

// ─── empty ──────────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <TabsContent value="review" className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
                <AlertTriangle className="text-muted-foreground h-6 w-6" />
                <div>
                    <p className="text-sm font-medium">No items to review</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                        Run Verify, then Extract to see items.
                    </p>
                </div>
                <div className="text-muted-foreground flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
                    <span>Requires:</span>
                    <Link href="/imports/category-import" className="underline">
                        Category Import
                    </Link>
                    <span>·</span>
                    <Link
                        href="/imports/category-coa-mapping"
                        className="underline"
                    >
                        Category–COA Mappings
                    </Link>
                </div>
            </div>
        </TabsContent>
    );
}

// ─── summary bar ────────────────────────────────────────────────────────────

function SummaryBar({ s }: { s: PriceListImportState }) {
    const {
        rawItems,
        uniqueItems,
        verifiedItems,
        reviewFilter,
        setReviewFilter,
        setShowDuplicateDetails,
        errorCount,
        missingMappingCount,
        duplicateCount,
        duplicateItems,
        longDescriptionCount,
        handleTruncateAllLongDescriptions,
        skippedCount,
        insertCount,
        updateCount,
        coaOverrides,
        handleClearAllOverrides,
    } = s;

    const overrideCount = Object.keys(coaOverrides).length;
    const importableCount = insertCount + updateCount;

    return (
        <div className="overflow-hidden rounded-lg border">
            {/* ── Header ────────────────────────────────────────── */}
            <div className="bg-muted/30 flex items-center justify-between gap-2 border-b px-4 py-2.5">
                <h3 className="text-sm font-semibold">Import summary</h3>
                {importableCount > 0 && errorCount === 0 && (
                    <Badge variant="default" className="bg-green-600">
                        <Check className="mr-1 h-3 w-3" />
                        No errors — ready to import
                    </Badge>
                )}
                {errorCount > 0 && (
                    <Badge variant="destructive">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        {errorCount} row{errorCount === 1 ? '' : 's'} need
                        {errorCount === 1 ? 's' : ''} attention
                    </Badge>
                )}
            </div>

            {/* ── Primary stats (always all four) ──────────────── */}
            <div className="bg-border grid grid-cols-2 gap-px sm:grid-cols-4">
                <StatCard
                    label="Raw items"
                    value={rawItems.length}
                    hint="Rows read from the sheet"
                />
                <StatCard
                    label="Unique items"
                    value={uniqueItems.length}
                    hint={
                        rawItems.length === uniqueItems.length
                            ? 'No duplicates found'
                            : `${rawItems.length - uniqueItems.length} collapsed`
                    }
                />
                <StatCard
                    label="Ready to import"
                    value={importableCount}
                    tone="primary"
                    hint={`${insertCount} new · ${updateCount} update${updateCount === 1 ? '' : 's'}`}
                />
                <StatCard
                    label="Errors"
                    value={errorCount}
                    tone={errorCount > 0 ? 'destructive' : 'muted'}
                    hint={
                        errorCount > 0
                            ? 'Blocking — fix before importing'
                            : 'None'
                    }
                />
            </div>

            {/* ── Status pills (always visible) ─────────────────── */}
            <div className="bg-muted/20 flex flex-wrap items-center gap-2 border-t px-4 py-2.5">
                <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                    Status
                </span>
                <StatusPill
                    label="Errors"
                    count={errorCount}
                    tone="destructive"
                />
                <StatusPill
                    label="Missing mapping"
                    count={missingMappingCount}
                    tone="amber"
                />
                <StatusPill
                    label="Skipped"
                    count={skippedCount}
                    tone="muted"
                    title="Rows excluded because their category isn't in the DB"
                />
                <StatusPill
                    label="Collapsed duplicates"
                    count={duplicateCount}
                    tone="muted"
                    title={`${duplicateItems.length} unique row${duplicateItems.length === 1 ? '' : 's'} with same-price duplicates collapsed`}
                />
                <StatusPill
                    label="Long descriptions"
                    count={longDescriptionCount}
                    tone="destructive"
                    title="Descriptions over 1000 characters"
                />
                {longDescriptionCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTruncateAllLongDescriptions}
                        className="h-6 border-amber-600 text-xs text-amber-700"
                    >
                        Truncate all
                    </Button>
                )}
                {overrideCount > 0 && (
                    <>
                        <StatusPill
                            label="COA overrides"
                            count={overrideCount}
                            tone="amber"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearAllOverrides}
                            className="h-6 text-xs"
                        >
                            Clear overrides
                        </Button>
                    </>
                )}
            </div>

            {/* ── Filters (always visible) ──────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 border-t px-4 py-2.5">
                <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                    Show
                </span>
                <ToggleGroup
                    value={[reviewFilter]}
                    onValueChange={(v) => {
                        const next = (v as unknown as string[])[0] as
                            | ReviewFilter
                            | undefined;
                        setReviewFilter(next ?? 'all');
                        setShowDuplicateDetails(false);
                    }}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                >
                    <ToggleGroupItem value="all" aria-label="Show all">
                        All ({verifiedItems.length})
                    </ToggleGroupItem>
                    <ToggleGroupItem
                        value="errors"
                        aria-label="Show only errors"
                        disabled={errorCount === 0}
                    >
                        Errors ({errorCount})
                    </ToggleGroupItem>
                    <ToggleGroupItem
                        value="duplicates"
                        aria-label="Show only duplicates"
                        disabled={duplicateCount === 0}
                    >
                        Duplicates ({duplicateItems.length})
                    </ToggleGroupItem>
                    <ToggleGroupItem
                        value="longDesc"
                        aria-label="Show only long descriptions"
                        disabled={longDescriptionCount === 0}
                    >
                        Long desc ({longDescriptionCount})
                    </ToggleGroupItem>
                </ToggleGroup>
                {overrideCount > 0 && (
                    <span className="text-muted-foreground ml-auto text-[10px]">
                        Overrides are per unique row
                    </span>
                )}
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    hint,
    tone = 'default',
}: {
    label: string;
    value: number;
    hint?: string;
    tone?: 'default' | 'primary' | 'destructive' | 'muted';
}) {
    const valueClass = cn(
        'text-2xl leading-none font-semibold tabular-nums',
        tone === 'primary' && 'text-green-600',
        tone === 'destructive' && 'text-destructive',
        tone === 'muted' && 'text-muted-foreground',
    );
    const labelClass = cn(
        'text-[11px] font-medium tracking-wide uppercase',
        tone === 'muted' ? 'text-muted-foreground' : 'text-foreground/70',
    );

    return (
        <div className="bg-background px-4 py-3">
            <div className={valueClass}>{value.toLocaleString()}</div>
            <div className={cn(labelClass, 'mt-1')}>{label}</div>
            {hint && (
                <div className="text-muted-foreground mt-0.5 truncate text-[10px]">
                    {hint}
                </div>
            )}
        </div>
    );
}

function StatusPill({
    label,
    count,
    tone,
    title,
}: {
    label: string;
    count: number;
    tone: 'destructive' | 'amber' | 'muted';
    title?: string;
}) {
    const isZero = count === 0;
    const toneClass = isZero
        ? 'border-muted-foreground/25 text-muted-foreground/60'
        : tone === 'destructive'
          ? 'border-destructive/50 text-destructive'
          : tone === 'amber'
            ? 'border-amber-500 text-amber-600'
            : 'border-muted-foreground/40 text-muted-foreground';

    return (
        <Badge
            variant="outline"
            className={cn('h-6 gap-1.5 text-xs font-normal', toneClass)}
            title={title}
        >
            {label}
            <span className="font-semibold tabular-nums">
                {count.toLocaleString()}
            </span>
        </Badge>
    );
}

// ─── batch match panel ──────────────────────────────────────────────────────

function BatchMatchPanel({ s }: { s: PriceListImportState }) {
    const {
        batchGroups,
        batchSelections,
        setBatchSelections,
        existingCoas,
        handleBatchApplyGroup,
    } = s;

    return (
        <div className="rounded-lg border border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/10">
            <div className="flex items-center gap-2 border-b border-amber-500/30 px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs font-semibold">
                    {batchGroups.length} COA group
                    {batchGroups.length === 1 ? '' : 's'} need a human pick
                </span>
                <span className="text-muted-foreground ml-auto text-[10px]">
                    One choice applies to every row in the group.
                </span>
            </div>
            <div className="flex max-h-64 flex-col gap-2 overflow-auto p-3">
                {batchGroups.map((group) => (
                    <BatchMatchRow
                        key={group.coaNorm}
                        group={group}
                        value={batchSelections[group.coaNorm] ?? ''}
                        onChange={(v) =>
                            setBatchSelections((prev) => ({
                                ...prev,
                                [group.coaNorm]: v ?? '',
                            }))
                        }
                        onApply={() => handleBatchApplyGroup(group)}
                        existingCoas={existingCoas}
                    />
                ))}
            </div>
        </div>
    );
}

function BatchMatchRow({
    group,
    value,
    onChange,
    onApply,
    existingCoas,
}: {
    group: ExtractedCoaGroup;
    value: string;
    onChange: (v: string | null) => void;
    onApply: () => void;
    existingCoas: PriceListImportState['existingCoas'];
}) {
    const suggestedIds = new Set(group.topMatches.map((m) => m.coa.id));
    const items = buildCoaItems(
        group.topMatches.map((m) => m.coa),
        existingCoas,
    );
    const effectiveValue =
        value ||
        (group.topSuggestion ? formatCoaOption(group.topSuggestion) : '');

    return (
        <div className="bg-background flex flex-wrap items-center gap-2 rounded border px-2 py-1.5">
            <span
                className="flex min-w-0 flex-1 items-center gap-1 truncate text-xs font-medium"
                title={`Excel: ${group.label}`}
            >
                <span className="truncate">{group.label}</span>
                <Badge
                    variant="outline"
                    className="h-4 border-amber-500 px-1 text-[10px] text-amber-600"
                >
                    ×{group.count}
                </Badge>
            </span>
            <Combobox
                items={items}
                value={effectiveValue}
                onValueChange={onChange}
            >
                <ComboboxInput
                    placeholder={
                        group.topSuggestion
                            ? '★ Suggested at top — search…'
                            : 'Search COA…'
                    }
                    className="h-7 w-56 text-xs"
                />
                <ComboboxContent>
                    <ComboboxEmpty>No COA found.</ComboboxEmpty>
                    <ComboboxList>
                        {(item: string) => {
                            const isSuggested = suggestedIds.has(
                                parseCoaId(item) ?? -1,
                            );

                            return (
                                <ComboboxItem
                                    key={item}
                                    value={item}
                                    className={isSuggested ? 'font-medium' : ''}
                                >
                                    {isSuggested ? '★ ' : ''}
                                    {stripCoaPrefix(item)}
                                </ComboboxItem>
                            );
                        }}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
            <Button size="sm" className="h-7 text-xs" onClick={onApply}>
                Apply to all {group.count}
            </Button>
        </div>
    );
}

// ─── filter note ────────────────────────────────────────────────────────────

function FilterNote({
    filter,
    s,
}: {
    filter: ReviewFilter;
    s: PriceListImportState;
}) {
    const { filteredItems, verifiedItems, duplicateCount } = s;

    if (filter === 'errors') {
        return (
            <p className="text-muted-foreground text-xs">
                Showing {filteredItems.length} of {verifiedItems.length} — rows
                with errors (COA not found, category not found, mapping missing,
                description &gt;1000). Use the COA dropdowns to fix partial
                matches per row.
            </p>
        );
    }

    if (filter === 'duplicates') {
        return (
            <p className="text-xs text-amber-600">
                Showing {filteredItems.length} unique row
                {filteredItems.length === 1 ? '' : 's'} with collapsed
                duplicates ({duplicateCount} extra raw row
                {duplicateCount === 1 ? '' : 's'}). Same price — safe to import
                as one.
            </p>
        );
    }

    if (filter === 'longDesc') {
        return (
            <p className="text-xs text-amber-600">
                Showing {filteredItems.length} of {verifiedItems.length} — rows
                with description &gt;1000 chars. Use “Truncate” per row or
                “Truncate all” above.
            </p>
        );
    }

    return null;
}

// ─── items table ────────────────────────────────────────────────────────────

function ItemsTable({ s }: { s: PriceListImportState }) {
    const { filteredItems, selected, setSelected, reviewFilter } = s;

    const selectable = filteredItems.filter(isSelectable);
    const allSelected =
        selectable.length > 0 && selectable.every((v) => selected.has(v.key));
    const someSelected = selectable.some((v) => selected.has(v.key));

    function toggleAll(select: boolean) {
        setSelected((prev) => {
            const next = new Set(prev);

            if (select) {
                for (const v of selectable) next.add(v.key);
            } else {
                for (const v of filteredItems) next.delete(v.key);
            }

            return next;
        });
    }

    return (
        <div className="overflow-hidden rounded-lg border">
            <div className="max-h-[65vh] overflow-auto">
                <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur">
                        <TableRow>
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={
                                        allSelected
                                            ? true
                                            : someSelected
                                              ? 'indeterminate'
                                              : false
                                    }
                                    onCheckedChange={(v) =>
                                        toggleAll(v === true)
                                    }
                                    aria-label="Select all importable rows"
                                />
                            </TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[16%]">Category</TableHead>
                            <TableHead className="min-w-[340px]">
                                COA (Excel → DB)
                            </TableHead>
                            <TableHead className="w-[8%]">Unit</TableHead>
                            <TableHead className="w-[10%] text-right">
                                Price
                            </TableHead>
                            <TableHead className="w-[20%]">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredItems.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-muted-foreground p-10 text-center text-sm"
                                >
                                    {emptyMessageFor(reviewFilter)}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredItems.map((it) => (
                                <ItemRow key={it.key} item={it} s={s} />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function emptyMessageFor(filter: ReviewFilter): ReactNode {
    if (filter === 'duplicates')
        return 'No collapsed duplicates. Select “All” to see all items.';
    if (filter === 'errors')
        return 'No errors — all rows are ready or updates. Select “All” to see all items.';
    if (filter === 'longDesc')
        return 'No long descriptions — all descriptions ≤1000 chars. Select “All” to see all items.';

    return 'No items match filter.';
}

// ─── single row ─────────────────────────────────────────────────────────────

function ItemRow({ item, s }: { item: VerifiedItem; s: PriceListImportState }) {
    const { selected, setSelected, handleTruncateDescription } = s;

    const isSelected = selected.has(item.key);
    const canSelect = isSelectable(item);

    return (
        <TableRow
            className={cn(
                !canSelect && 'bg-destructive/5',
                item.status === 'update' &&
                    'bg-amber-50/30 dark:bg-amber-950/5',
            )}
        >
            <TableCell className="align-top">
                <Checkbox
                    checked={isSelected}
                    disabled={!canSelect}
                    onCheckedChange={(checked) => {
                        setSelected((prev) => {
                            const next = new Set(prev);
                            if (checked) next.add(item.key);
                            else next.delete(item.key);
                            return next;
                        });
                    }}
                    aria-label={`Select ${item.description}`}
                />
            </TableCell>

            {/* Description */}
            <TableCell className="align-top">
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
                            onClick={() => handleTruncateDescription(item.key)}
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
            </TableCell>

            {/* Category */}
            <TableCell className="align-top text-xs">
                <div className="flex items-start gap-1.5">
                    <span
                        className="max-w-[14ch] truncate"
                        title={item.category}
                    >
                        {item.category}
                    </span>
                    <CategoryMark item={item} />
                </div>
            </TableCell>

            {/* COA */}
            <CoaCell item={item} s={s} />

            {/* Unit */}
            <TableCell className="align-top text-xs">{item.unit}</TableCell>

            {/* Price */}
            <TableCell className="text-right align-top text-xs tabular-nums">
                {formatMoney(item.price)}
            </TableCell>

            {/* Status */}
            <StatusCell item={item} />
        </TableRow>
    );
}

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

// ─── COA cell ───────────────────────────────────────────────────────────────

function CoaCell({ item, s }: { item: VerifiedItem; s: PriceListImportState }) {
    const { existingCoas, handleCoaOverrideChange, handleClearOverride } = s;

    const isOverridden = item.overrideId !== null;
    const selectedDisplay = item.effectiveCoa
        ? formatCoaOption(item.effectiveCoa)
        : '';
    const items = buildCoaItems(
        item.coaTopMatches.map((m) => m.coa),
        existingCoas,
    );
    const suggestedIds = new Set(item.coaTopMatches.map((m) => m.coa.id));

    return (
        <TableCell className="align-top">
            <div className="flex flex-col gap-1">
                {/* Excel value + match indicator */}
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

                {/* Combobox */}
                <div className="flex items-center gap-1">
                    <Combobox
                        items={items}
                        value={selectedDisplay}
                        onValueChange={(val) =>
                            handleCoaOverrideChange(
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
                                    const isSuggested = suggestedIds.has(
                                        parseCoaId(entry) ?? -1,
                                    );

                                    return (
                                        <ComboboxItem
                                            key={entry}
                                            value={entry}
                                            className={
                                                isSuggested ? 'font-medium' : ''
                                            }
                                        >
                                            {isSuggested ? '★ ' : ''}
                                            {stripCoaPrefix(entry)}
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
                            onClick={() => handleClearOverride(item.key)}
                            title="Clear override"
                            aria-label="Clear COA override"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>

                {/* Resolved DB COA */}
                {item.effectiveCoa ? (
                    <div
                        className="truncate text-[11px] text-green-600"
                        title={`${item.effectiveCoa.path} — ${item.effectiveCoa.account_title}`}
                    >
                        ✓ {item.effectiveCoa.path} —{' '}
                        {item.effectiveCoa.account_title}
                        {isOverridden && (
                            <span className="ml-1 text-amber-600">
                                (override)
                            </span>
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
        </TableCell>
    );
}

// ─── status cell ────────────────────────────────────────────────────────────

function StatusCell({ item }: { item: VerifiedItem }) {
    return (
        <TableCell className="align-top text-xs">
            <StatusText item={item} />
            <div className="text-muted-foreground mt-1 text-[10px]">
                {item.sheets.join(', ')} · row {item.rows.join(', ')}
            </div>
        </TableCell>
    );
}

function StatusText({ item }: { item: VerifiedItem }) {
    const base = 'flex items-start gap-1 text-xs';

    if (item.status === 'error') {
        return (
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
        );
    }
    if (item.status === 'skipped') {
        return (
            <div className={cn(base, 'text-muted-foreground')}>
                <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                    {item.message}{' '}
                    <Link href="/imports/category-import" className="underline">
                        Category Import
                    </Link>
                </span>
            </div>
        );
    }
    if (item.status === 'update') {
        return (
            <div className={cn(base, 'text-amber-600')}>
                <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{item.message}</span>
            </div>
        );
    }
    return (
        <div className={cn(base, 'text-green-600')}>
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{item.message}</span>
        </div>
    );
}

// ─── footer ─────────────────────────────────────────────────────────────────

function ImportFooter({ s }: { s: PriceListImportState }) {
    const {
        excludeMissingCategory,
        setExcludeMissingCategory,
        missingCategoryCount,
        importable,
        importableSelected,
        importing,
        handleImport,
        skippedCount,
        errorCount,
        selected,
        verifiedItems,
        setStep,
    } = s;

    const canImport = importableSelected.length > 0 && !importing;
    const newCount = countByStatus(importableSelected, 'ready');
    const updateCount = countByStatus(importableSelected, 'update');

    return (
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-10 flex flex-col gap-2 rounded-lg border p-3 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStep('verify')}
                    >
                        Back
                    </Button>
                    <label
                        htmlFor="exclude-missing-category"
                        className="flex cursor-pointer items-center gap-2 text-xs"
                    >
                        <Checkbox
                            id="exclude-missing-category"
                            checked={excludeMissingCategory}
                            onCheckedChange={(v) =>
                                setExcludeMissingCategory(v === true)
                            }
                        />
                        Exclude missing category
                        {missingCategoryCount > 0 && (
                            <span className="text-muted-foreground">
                                ({missingCategoryCount})
                            </span>
                        )}
                    </label>
                </div>
                <Button disabled={!canImport} onClick={handleImport}>
                    {importing
                        ? 'Importing…'
                        : importableSelected.length === 0
                          ? 'Import'
                          : `Import ${importableSelected.length} (${newCount} new + ${updateCount} update${updateCount === 1 ? '' : 's'})`}
                </Button>
            </div>

            <FooterHint
                importable={importable.length}
                importableSelected={importableSelected.length}
                selected={selected.size}
                total={verifiedItems.length}
                skipped={skippedCount}
                errors={errorCount}
            />
        </div>
    );
}

function FooterHint({
    importable,
    importableSelected,
    selected,
    total,
    skipped,
    errors,
}: {
    importable: number;
    importableSelected: number;
    selected: number;
    total: number;
    skipped: number;
    errors: number;
}) {
    if (importableSelected > 0) return null;

    let text: string;

    if (importable === 0) {
        text = `No importable rows — ${errors} error${errors === 1 ? '' : 's'}, ${skipped} skipped. Fix Category/COA via dropdowns or create mappings in Category–COA Mappings.`;
    } else if (selected === 0) {
        text = `No rows selected — ${importable} importable available. Check a row or click the header checkbox.`;
    } else {
        text = `Selected ${selected} of ${total}, but none are importable. Select Ready/Update rows (green/amber).`;
    }

    return <p className="text-muted-foreground text-[11px]">{text}</p>;
}

function countByStatus(items: VerifiedItem[], status: 'ready' | 'update') {
    return items.filter((v) => v.status === status).length;
}
