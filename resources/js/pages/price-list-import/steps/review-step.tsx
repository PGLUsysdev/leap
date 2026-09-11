// resources/js/pages/price-list-import/steps/review-step.tsx

import { Link } from '@inertiajs/react';
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
import { Input } from '@/components/ui/input';
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
import type { PriceListImportState, ReviewFilter } from '../types';

export function ReviewStep({ s }: { s: PriceListImportState }) {
    const {
        rawItems,
        uniqueItems,
        verifiedItems,
        filteredItems,
        batchGroups,
        batchSelections,
        setBatchSelections,
        coaOverrides,
        handleCoaOverrideChange,
        handleClearOverride,
        handleClearAllOverrides,
        handleBatchApplyGroup,
        handleTruncateDescription,
        handleTruncateAllLongDescriptions,
        selected,
        setSelected,
        reviewFilter,
        setReviewFilter,
        showDuplicateDetails,
        setShowDuplicateDetails,
        excludeMissingCategory,
        setExcludeMissingCategory,
        existingCoas,
        insertCount,
        updateCount,
        readyCount,
        errorCount,
        missingMappingCount,
        missingCategoryCount,
        skippedCount,
        duplicateCount,
        duplicateItems,
        longDescriptionCount,
        importable,
        importableSelected,
        importing,
        isMounted,
        handleImport,
        setStep,
    } = s;

    return (
        <TabsContent value="review" className="mt-4 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">Raw items: {rawItems.length}</Badge>
                <Badge variant="secondary">Unique: {uniqueItems.length}</Badge>
                <Badge variant="default">
                    Ready: {insertCount} + Updates: {updateCount} = {readyCount}
                </Badge>
                {errorCount > 0 && (
                    <Badge variant="destructive">
                        {errorCount} errors (missing official mapping)
                    </Badge>
                )}
                {missingMappingCount > 0 && (
                    <Badge
                        variant="outline"
                        className="border-amber-500 text-amber-600"
                    >
                        {missingMappingCount} missing mapping
                    </Badge>
                )}
                {longDescriptionCount > 0 && (
                    <Badge variant="destructive">
                        {longDescriptionCount} description &gt;1000
                    </Badge>
                )}
                {longDescriptionCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTruncateAllLongDescriptions}
                        className="h-6 border-amber-600 text-xs text-amber-700"
                        title="Truncate all long descriptions to 1000 characters"
                    >
                        Truncate all to 1000
                    </Button>
                )}
                {duplicateCount > 0 && (
                    <Badge
                        variant="outline"
                        className="border-amber-500 text-amber-600"
                    >
                        {duplicateCount} duplicate
                        {duplicateCount > 1 ? 's' : ''} ({duplicateItems.length}{' '}
                        unique)
                    </Badge>
                )}
                {skippedCount > 0 && (
                    <Badge variant="secondary">
                        {skippedCount} skipped (category not found)
                    </Badge>
                )}
                {(errorCount > 0 ||
                    duplicateCount > 0 ||
                    longDescriptionCount > 0) && (
                    <ToggleGroup
                        value={[reviewFilter]}
                        onValueChange={(v) => {
                            const next = (v as unknown as string[])[0] as
                                | ReviewFilter
                                | undefined;

                            if (next) {
                                setReviewFilter(next);
                                setShowDuplicateDetails(false);
                            } else {
                                setReviewFilter('all');
                            }
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
                )}
                {duplicateCount > 0 && reviewFilter !== 'duplicates' && (
                    <Button
                        variant={showDuplicateDetails ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setShowDuplicateDetails((v) => !v)}
                        className="h-6 text-xs"
                    >
                        {showDuplicateDetails
                            ? 'Hide duplicate details'
                            : 'Show duplicate details'}
                    </Button>
                )}
                {Object.keys(coaOverrides).length > 0 && (
                    <Badge
                        variant="outline"
                        className="border-amber-500 text-amber-600"
                    >
                        {Object.keys(coaOverrides).length} COA override(s)
                    </Badge>
                )}
                {Object.keys(coaOverrides).length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearAllOverrides}
                        className="h-6 text-xs"
                    >
                        Clear overrides
                    </Button>
                )}
            </div>
            {Object.keys(coaOverrides).length > 0 && (
                <p className="text-xs text-amber-600">
                    Overrides are per unique price-list row
                    (`category|coa|description|unit`). Counts reflect overridden
                    COAs.
                </p>
            )}
            {batchGroups.length > 0 && (
                <div className="rounded-lg border p-3">
                    <p className="mb-2 text-xs font-semibold">
                        Batch match by extracted COA — {batchGroups.length}{' '}
                        group
                        {batchGroups.length === 1 ? '' : 's'} still need
                        {batchGroups.length === 1 ? 's' : ''} a human pick. One
                        choice applies to every row in the group.
                    </p>
                    <div className="flex max-h-64 flex-col gap-2 overflow-auto">
                        {batchGroups.map((group) => {
                            const suggestedIds = new Set(
                                group.topMatches.map((m) => m.coa.id),
                            );
                            const groupItems = [
                                ...group.topMatches.map((m) => m.coa),
                                ...existingCoas.filter(
                                    (c) => !suggestedIds.has(c.id),
                                ),
                            ].map(formatCoaOption);
                            const groupValue =
                                batchSelections[group.coaNorm] ??
                                (group.topSuggestion
                                    ? formatCoaOption(group.topSuggestion)
                                    : '');

                            return (
                                <div
                                    key={group.coaNorm}
                                    className="flex flex-wrap items-center gap-2 rounded border px-2 py-1.5"
                                >
                                    <span
                                        className="flex min-w-0 flex-1 items-center gap-1 truncate text-xs font-medium"
                                        title={`Excel: ${group.label}`}
                                    >
                                        <span className="truncate">
                                            {group.label}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="h-4 border-amber-500 px-1 text-[10px] text-amber-600"
                                        >
                                            ×{group.count}
                                        </Badge>
                                    </span>
                                    <Combobox
                                        items={groupItems}
                                        value={groupValue}
                                        onValueChange={(val) =>
                                            setBatchSelections((prev) => ({
                                                ...prev,
                                                [group.coaNorm]:
                                                    (val as string | null) ??
                                                    '',
                                            }))
                                        }
                                    >
                                        <ComboboxInput
                                            placeholder={
                                                group.topSuggestion
                                                    ? '★ Suggested at top — search...'
                                                    : 'Search COA...'
                                            }
                                            className="h-7 text-xs"
                                        />
                                        <ComboboxContent>
                                            <ComboboxEmpty>
                                                No COA found.
                                            </ComboboxEmpty>
                                            <ComboboxList>
                                                {(item: string) => {
                                                    const isSuggested =
                                                        group.topMatches.some(
                                                            (m) =>
                                                                item.includes(
                                                                    `coa:${m.coa.id}:`,
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
                                                            {isSuggested
                                                                ? '★ '
                                                                : ''}
                                                            {item.replace(
                                                                /^coa:\d+:/,
                                                                '',
                                                            )}
                                                        </ComboboxItem>
                                                    );
                                                }}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                    <Button
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() =>
                                            handleBatchApplyGroup(group)
                                        }
                                    >
                                        Apply to all {group.count}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {reviewFilter === 'errors' && (
                <p className="text-muted-foreground text-xs">
                    Showing {filteredItems.length} of {verifiedItems.length} —
                    only rows with errors (COA not found, category not found,
                    mapping missing, description &gt;1000, etc.). Select “All”
                    to see all. COA dropdowns let you fix partial matches per
                    row (e.g., row 468).
                </p>
            )}
            {reviewFilter === 'duplicates' && (
                <p className="text-xs text-amber-600">
                    Showing {filteredItems.length} duplicate unique row
                    {filteredItems.length === 1 ? '' : 's'} ({duplicateCount}{' '}
                    extra raw row
                    {duplicateCount === 1 ? '' : 's'}) — same
                    category|coa|description|unit appears multiple times. Select
                    “All” to see all.
                </p>
            )}
            {reviewFilter === 'longDesc' && (
                <p className="text-xs text-amber-600">
                    Showing {filteredItems.length} of {verifiedItems.length} —
                    only rows with description &gt;1000 chars. Use “Truncate”
                    per row or “Truncate all to 1000” above. Select “All” to see
                    all.
                </p>
            )}
            {showDuplicateDetails && duplicateItems.length > 0 && (
                <div className="rounded-lg border p-3">
                    <p className="mb-2 text-xs font-semibold">
                        Duplicate details — {duplicateItems.length} unique
                        duplicate(s), {duplicateCount} extra raw row
                        {duplicateCount === 1 ? '' : 's'} (Raw {rawItems.length}{' '}
                        → Unique {uniqueItems.length})
                    </p>
                    <div className="max-h-64 overflow-auto rounded border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>COA</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Count</TableHead>
                                    <TableHead>Sheets / Rows</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {duplicateItems.map((it) => (
                                    <TableRow key={it.key}>
                                        <TableCell
                                            className="max-w-[24ch] truncate text-xs"
                                            title={it.description}
                                        >
                                            {it.description}
                                        </TableCell>
                                        <TableCell
                                            className="max-w-[16ch] truncate text-xs"
                                            title={it.category}
                                        >
                                            {it.category}
                                        </TableCell>
                                        <TableCell
                                            className="max-w-[16ch] truncate text-xs"
                                            title={it.coa}
                                        >
                                            {it.coa}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {it.unit}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {it.price !== null
                                                ? `₱${it.price.toLocaleString()}`
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            <Badge
                                                variant="outline"
                                                className="border-amber-500 text-amber-600"
                                            >
                                                ×{it.count}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-[10px]">
                                            {it.sheets.join(', ')} row{' '}
                                            {it.rows.join(', ')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <p className="text-muted-foreground mt-2 text-[10px]">
                        Duplicates are deduped by normalized
                        category|coa|description|unit. Raw rows with same key
                        are merged; count shows how many raw rows collapsed.
                    </p>
                </div>
            )}
            {verifiedItems.length > 0 ? (
                <>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-8">
                                        <Input
                                            type="checkbox"
                                            checked={
                                                filteredItems.length > 0 &&
                                                filteredItems.every(
                                                    (v) =>
                                                        selected.has(v.key) ||
                                                        v.status === 'error' ||
                                                        v.status === 'skipped',
                                                )
                                            }
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    const toAdd = filteredItems
                                                        .filter(
                                                            (v) =>
                                                                v.status !==
                                                                    'error' &&
                                                                v.status !==
                                                                    'skipped',
                                                        )
                                                        .map((v) => v.key);
                                                    setSelected(
                                                        (prev) =>
                                                            new Set([
                                                                ...prev,
                                                                ...toAdd,
                                                            ]),
                                                    );
                                                } else {
                                                    const filteredKeys =
                                                        new Set(
                                                            filteredItems.map(
                                                                (v) => v.key,
                                                            ),
                                                        );
                                                    setSelected(
                                                        (prev) =>
                                                            new Set(
                                                                [
                                                                    ...prev,
                                                                ].filter(
                                                                    (k) =>
                                                                        !filteredKeys.has(
                                                                            k,
                                                                        ),
                                                                ),
                                                            ),
                                                    );
                                                }
                                            }}
                                        />
                                    </TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="min-w-[320px]">
                                        COA (Excel → DB)
                                    </TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-muted-foreground p-8 text-center text-sm"
                                        >
                                            {reviewFilter === 'duplicates'
                                                ? 'No duplicates — all rows are unique. Select “All” to see all items.'
                                                : reviewFilter === 'errors'
                                                  ? 'No errors — all rows are ready or updates. Select “All” to see all items.'
                                                  : reviewFilter === 'longDesc'
                                                    ? 'No long descriptions — all descriptions ≤1000 chars. Select “All” to see all items.'
                                                    : 'No items match filter.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredItems.map((it) => {
                                        const isOverridden =
                                            it.overrideId !== null;
                                        const selectedDisplay = it.effectiveCoa
                                            ? `coa:${it.effectiveCoa.id}:${it.effectiveCoa.path} — ${it.effectiveCoa.account_title}`
                                            : '';
                                        const suggestedIds = new Set(
                                            it.coaTopMatches.map(
                                                (m) => m.coa.id,
                                            ),
                                        );
                                        const suggestedCoas =
                                            it.coaTopMatches.map((m) => m.coa);
                                        const remainingCoas =
                                            existingCoas.filter(
                                                (c) => !suggestedIds.has(c.id),
                                            );
                                        const itemsForRow =
                                            it.coaMatchType === 'partial' &&
                                            suggestedCoas.length > 0
                                                ? [
                                                      ...suggestedCoas.map(
                                                          (c) =>
                                                              `coa:${c.id}:${c.path} — ${c.account_title}`,
                                                      ),
                                                      ...remainingCoas.map(
                                                          (c) =>
                                                              `coa:${c.id}:${c.path} — ${c.account_title}`,
                                                      ),
                                                  ]
                                                : existingCoas.map(
                                                      (c) =>
                                                          `coa:${c.id}:${c.path} — ${c.account_title}`,
                                                  );

                                        return (
                                            <TableRow key={it.key}>
                                                <TableCell>
                                                    <Input
                                                        type="checkbox"
                                                        checked={selected.has(
                                                            it.key,
                                                        )}
                                                        onChange={(e) => {
                                                            const n = new Set(
                                                                selected,
                                                            );

                                                            if (
                                                                e.target.checked
                                                            ) {
                                                                n.add(it.key);
                                                            } else {
                                                                n.delete(
                                                                    it.key,
                                                                );
                                                            }

                                                            setSelected(n);
                                                        }}
                                                        disabled={
                                                            it.status ===
                                                                'error' ||
                                                            it.status ===
                                                                'skipped'
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell
                                                    className="max-w-[28ch] truncate"
                                                    title={it.description}
                                                >
                                                    <span className="flex items-center gap-1">
                                                        <span className="truncate">
                                                            {it.description}
                                                        </span>
                                                        {it.count > 1 && (
                                                            <Badge
                                                                variant="outline"
                                                                className="h-4 border-amber-500 px-1 text-[10px] text-amber-600"
                                                            >
                                                                ×{it.count}
                                                            </Badge>
                                                        )}
                                                        {!it.descriptionValid && (
                                                            <Badge
                                                                variant="destructive"
                                                                className="h-4 px-1 text-[10px]"
                                                                title={`Length ${it.description.trim().length} > 1000`}
                                                            >
                                                                {
                                                                    it.description.trim()
                                                                        .length
                                                                }
                                                                /1000
                                                            </Badge>
                                                        )}
                                                    </span>
                                                    {!it.descriptionValid && (
                                                        <div className="mt-1 flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleTruncateDescription(
                                                                        it.key,
                                                                    )
                                                                }
                                                                className="h-5 px-1 text-[10px] text-amber-600 hover:text-amber-700"
                                                            >
                                                                Truncate to 1000
                                                            </Button>
                                                            <span className="text-muted-foreground self-center text-[10px]">
                                                                will cut to
                                                                &quot;
                                                                {it.description
                                                                    .trim()
                                                                    .slice(
                                                                        0,
                                                                        1000,
                                                                    )
                                                                    .slice(-20)}
                                                                &quot;
                                                            </span>
                                                        </div>
                                                    )}
                                                </TableCell>

                                                <TableCell className="text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <span
                                                            className="truncate"
                                                            title={it.category}
                                                        >
                                                            {it.category}
                                                        </span>
                                                        {it.catExists ? (
                                                            <Badge
                                                                variant="secondary"
                                                                className="h-4 px-1 text-[10px]"
                                                            >
                                                                ✓
                                                            </Badge>
                                                        ) : it.catMatchType ===
                                                          'partial' ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="h-4 px-1 text-[10px]"
                                                            >
                                                                ~
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="secondary"
                                                                className="h-4 px-1 text-[10px]"
                                                            >
                                                                ❌
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <div className="flex flex-col gap-1">
                                                        <span
                                                            className="text-muted-foreground truncate text-[10px]"
                                                            title={`Excel: ${it.coa}`}
                                                        >
                                                            Excel: {it.coa}{' '}
                                                            {it.coaExists
                                                                ? '✓'
                                                                : it.coaMatchType ===
                                                                    'partial'
                                                                  ? '~ partial'
                                                                  : '❌'}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <Combobox
                                                                items={
                                                                    itemsForRow
                                                                }
                                                                value={
                                                                    selectedDisplay
                                                                }
                                                                onValueChange={(
                                                                    val,
                                                                ) =>
                                                                    handleCoaOverrideChange(
                                                                        it.key,
                                                                        val as
                                                                            | string
                                                                            | null,
                                                                    )
                                                                }
                                                            >
                                                                <ComboboxInput
                                                                    placeholder={
                                                                        it.coaMatchType ===
                                                                        'partial'
                                                                            ? '★ Suggested at top — search...'
                                                                            : 'Search COA...'
                                                                    }
                                                                    className="h-7 text-xs"
                                                                />
                                                                <ComboboxContent>
                                                                    <ComboboxEmpty>
                                                                        No COA
                                                                        found.
                                                                    </ComboboxEmpty>
                                                                    <ComboboxList>
                                                                        {(
                                                                            item: string,
                                                                        ) => {
                                                                            const isSuggested =
                                                                                it.coaTopMatches.some(
                                                                                    (
                                                                                        m,
                                                                                    ) =>
                                                                                        item.includes(
                                                                                            `coa:${m.coa.id}:`,
                                                                                        ),
                                                                                );

                                                                            return (
                                                                                <ComboboxItem
                                                                                    key={
                                                                                        item
                                                                                    }
                                                                                    value={
                                                                                        item
                                                                                    }
                                                                                    className={
                                                                                        isSuggested
                                                                                            ? 'font-medium'
                                                                                            : ''
                                                                                    }
                                                                                >
                                                                                    {isSuggested
                                                                                        ? '★ '
                                                                                        : ''}
                                                                                    {item.replace(
                                                                                        /^coa:\d+:/,
                                                                                        '',
                                                                                    )}
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
                                                                    className="h-7 px-1 text-xs"
                                                                    onClick={() =>
                                                                        handleClearOverride(
                                                                            it.key,
                                                                        )
                                                                    }
                                                                >
                                                                    ✕
                                                                </Button>
                                                            )}
                                                        </div>
                                                        {it.effectiveCoa ? (
                                                            <div
                                                                className="truncate text-xs text-green-600"
                                                                title={`${it.effectiveCoa.path} — ${it.effectiveCoa.account_title}`}
                                                            >
                                                                →{' '}
                                                                {
                                                                    it
                                                                        .effectiveCoa
                                                                        .path
                                                                }{' '}
                                                                —{' '}
                                                                {
                                                                    it
                                                                        .effectiveCoa
                                                                        .account_title
                                                                }
                                                            </div>
                                                        ) : it.coaTopMatches
                                                              .length > 0 ? (
                                                            <div
                                                                className="text-muted-foreground truncate text-xs"
                                                                title={it.coaTopMatches
                                                                    .map(
                                                                        (m) =>
                                                                            `${m.coa.path} — ${m.coa.account_title} (score ${m.score})`,
                                                                    )
                                                                    .join(
                                                                        ' | ',
                                                                    )}
                                                            >
                                                                Suggest:{' '}
                                                                {
                                                                    it
                                                                        .coaTopMatches[0]
                                                                        .coa
                                                                        .path
                                                                }{' '}
                                                                —{' '}
                                                                {
                                                                    it
                                                                        .coaTopMatches[0]
                                                                        .coa
                                                                        .account_title
                                                                }
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{it.unit}</TableCell>
                                                <TableCell>
                                                    {it.price !== null
                                                        ? `₱${it.price.toLocaleString()}`
                                                        : '—'}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {it.status === 'error' ? (
                                                        <span className="text-destructive">
                                                            {it.message}{' '}
                                                            {!it.catExists && (
                                                                <Link
                                                                    href="/category-import"
                                                                    className="underline"
                                                                >
                                                                    Category
                                                                    Import
                                                                </Link>
                                                            )}{' '}
                                                            {!it.effectiveCoaExists &&
                                                                ' '}{' '}
                                                            {!it.effectiveMappingExists &&
                                                                it.catExists &&
                                                                it.effectiveCoaExists && (
                                                                    <Link
                                                                        href="/category-coa-mapping"
                                                                        className="underline"
                                                                    >
                                                                        → Map
                                                                    </Link>
                                                                )}
                                                        </span>
                                                    ) : it.status ===
                                                      'skipped' ? (
                                                        <span className="text-muted-foreground">
                                                            {it.message}{' '}
                                                            <Link
                                                                href="/category-import"
                                                                className="underline"
                                                            >
                                                                Category Import
                                                            </Link>
                                                        </span>
                                                    ) : it.status ===
                                                      'update' ? (
                                                        <span className="text-amber-600">
                                                            {it.message}
                                                        </span>
                                                    ) : (
                                                        <span className="text-green-600">
                                                            {it.message}
                                                        </span>
                                                    )}
                                                    <div className="text-muted-foreground text-[10px]">
                                                        {it.sheets.join(', ')}{' '}
                                                        row {it.rows.join(', ')}{' '}
                                                        {it.count > 1 &&
                                                            `×${it.count}`}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setStep('verify')}
                        >
                            Back
                        </Button>
                        <div className="flex flex-col items-end gap-2">
                            <label
                                htmlFor="exclude-missing-category"
                                className="flex cursor-pointer items-center gap-2 text-sm"
                            >
                                <Checkbox
                                    id="exclude-missing-category"
                                    checked={excludeMissingCategory}
                                    onCheckedChange={(v) =>
                                        setExcludeMissingCategory(v === true)
                                    }
                                />
                                Exclude items with missing category
                                {missingCategoryCount > 0 &&
                                    ` (${missingCategoryCount})`}
                            </label>
                            <Button
                                suppressHydrationWarning
                                disabled={
                                    isMounted
                                        ? importableSelected.length === 0 ||
                                          importing
                                        : false
                                }
                                onClick={handleImport}
                            >
                                {importing
                                    ? 'Importing...'
                                    : `Import ${importableSelected.length} price lists (${insertCount} new + ${updateCount} updates)`}
                            </Button>
                            {skippedCount > 0 && !importing && (
                                <p className="text-muted-foreground text-xs">
                                    {skippedCount}{' '}
                                    {skippedCount === 1 ? 'row' : 'rows'}{' '}
                                    excluded — category not found.
                                </p>
                            )}
                        </div>
                    </div>
                    {importableSelected.length === 0 &&
                        !importing &&
                        verifiedItems.length > 0 && (
                            <p className="text-muted-foreground text-xs">
                                {importable.length === 0
                                    ? `No importable rows — ${errorCount} error${errorCount === 1 ? '' : 's'}, ${skippedCount} skipped. Fix Category/COA via dropdowns or create mappings in Category–COA Mappings.`
                                    : `No rows selected — ${importable.length} importable available. Check a row or click header checkbox. Selected: ${selected.size}/${verifiedItems.length}`}
                            </p>
                        )}
                    {selected.size > 0 &&
                        importableSelected.length === 0 &&
                        importable.length > 0 && (
                            <p className="text-xs text-amber-600">
                                Selected rows are all errors or skipped and
                                cannot be imported. Select only Ready/Update
                                rows (green/amber).
                            </p>
                        )}
                </>
            ) : (
                <p className="text-muted-foreground text-sm">
                    Run Verify, then Extract to see items. Items require
                    existing Category (via{' '}
                    <Link href="/category-import" className="underline">
                        Category Import
                    </Link>
                    ) and Mapping (via{' '}
                    <Link href="/category-coa-mapping" className="underline">
                        Category–COA Mappings
                    </Link>
                    ).
                </p>
            )}
        </TabsContent>
    );
}
