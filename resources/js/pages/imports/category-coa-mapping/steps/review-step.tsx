// resources/js/pages/imports/category-coa-mapping/steps/review-step.tsx

import { useMemo, useState } from 'react';
import { AlertTriangle, Check, Plus, X } from 'lucide-react';
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
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { TabsContent } from '@/components/ui/tabs';
import {
    formatCoaOption,
    groupUnmatchedByExtractedCoa,
    type ExtractedCoaGroup,
} from '@/lib/ppmp/batch-match';
import { cn } from '@/lib/utils';
import { index as categoryImportIndex } from '@/routes/category-import';
import type { CategoryCoaMappingState, EffectiveVerifiedPair } from '../types';

type PairFilter = 'all' | 'creatable' | 'missingCat' | 'missingCoa' | 'exists';

type RowStatus = 'creatable' | 'missingCat' | 'missingCoa' | 'exists';

/** Display labels drop the `coa:<id>:` machine prefix from option values. */
function stripCoaPrefix(option: string): string {
    return option.replace(/^coa:\d+:/, '');
}

function rowStatus(p: EffectiveVerifiedPair): RowStatus {
    if (!p.catExists) return 'missingCat';
    if (!p.effectiveCoaExists) return 'missingCoa';
    if (p.effectiveMappingExists) return 'exists';

    return 'creatable';
}

const ROW_TINT: Record<RowStatus, string> = {
    creatable:
        'bg-amber-50/40 hover:bg-amber-50/70 dark:bg-amber-950/10 dark:hover:bg-amber-950/20',
    missingCat: 'bg-destructive/5 hover:bg-destructive/10',
    missingCoa: 'bg-destructive/5 hover:bg-destructive/10',
    exists: 'opacity-70 hover:opacity-100',
};

export function ReviewStep({ s }: { s: CategoryCoaMappingState }) {
    const {
        selectedSheet,
        effectiveVerification,
        existingCoas,
        existingCategories,
        existingMappings,
        isSaving,
        coaOverrides,
        setCoaOverrides,
        handleClearOverride,
        handleBulkCreateMappings,
        setStep,
    } = s;

    const [filter, setFilter] = useState<PairFilter>('all');
    const [batchSelections, setBatchSelections] = useState<
        Record<string, string>
    >({});

    // Hoisted once: "path — title" -> id. Avoids re-scanning the COA list per row.
    const coaLabelToId = useMemo(() => {
        const map = new Map<string, number>();
        for (const c of existingCoas) {
            map.set(stripCoaPrefix(formatCoaOption(c)), c.id);
        }
        return map;
    }, [existingCoas]);

    const allCoaLabels = useMemo(
        () => Array.from(coaLabelToId.keys()),
        [coaLabelToId],
    );

    const pairs = useMemo(
        () => effectiveVerification?.effectivePairs ?? [],
        [effectiveVerification],
    );

    const counts = useMemo(() => {
        return {
            total: pairs.length,
            creatable: pairs.filter((p) => rowStatus(p) === 'creatable').length,
            missingCat: pairs.filter((p) => rowStatus(p) === 'missingCat')
                .length,
            missingCoa: pairs.filter((p) => rowStatus(p) === 'missingCoa')
                .length,
            exists: pairs.filter((p) => rowStatus(p) === 'exists').length,
        };
    }, [pairs]);

    const filteredPairs = useMemo(() => {
        if (filter === 'all') return pairs;
        return pairs.filter((p) => rowStatus(p) === filter);
    }, [pairs, filter]);

    // Batch map: unresolved pairs grouped by Excel COA text. Strict-matched
    // and already-overridden pairs self-exclude, so groups shrink as picks
    // are applied (per-row or batch).
    const batchGroups = useMemo(
        () => groupUnmatchedByExtractedCoa(pairs),
        [pairs],
    );

    function handleBatchApplyGroup(group: ExtractedCoaGroup) {
        const picked =
            batchSelections[group.coaNorm] ??
            (group.topSuggestion
                ? stripCoaPrefix(formatCoaOption(group.topSuggestion))
                : '');
        const id =
            coaLabelToId.get(picked) ?? group.topSuggestion?.id ?? null;

        if (id === null || id === undefined) return;

        setCoaOverrides((prev) => {
            const next = { ...prev };

            for (const k of group.rowKeys) next[k] = id;

            return next;
        });
    }

    function handleCoaPick(rowKey: string, selectedValue: string | null) {
        if (!selectedValue) {
            handleClearOverride(rowKey);
            return;
        }

        const id = coaLabelToId.get(selectedValue);
        if (id !== undefined) {
            setCoaOverrides((prev) => ({ ...prev, [rowKey]: id }));
        }
    }

    if (!effectiveVerification) {
        return (
            <TabsContent value="review" className="mt-4 flex flex-col gap-4">
                <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center text-sm">
                    <AlertTriangle className="h-5 w-5 opacity-60" />
                    Extract first to review mappings.
                </div>
                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setStep('extract')}
                    >
                        Back: Extract
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setStep('calibrate')}
                    >
                        Recalibrate
                    </Button>
                </div>
            </TabsContent>
        );
    }

    const filterDefs: { value: PairFilter; label: string; count: number }[] = [
        { value: 'all', label: 'All', count: counts.total },
        { value: 'creatable', label: 'To create', count: counts.creatable },
        {
            value: 'missingCat',
            label: 'Missing category',
            count: counts.missingCat,
        },
        { value: 'missingCoa', label: 'Missing COA', count: counts.missingCoa },
        { value: 'exists', label: 'Mapped', count: counts.exists },
    ];

    const overrideCount = Object.keys(coaOverrides).length;

    return (
        <TabsContent value="review" className="mt-4 flex flex-col gap-4">
            {/* ── Summary + filters ─────────────────────────────────── */}
            <div className="bg-muted/30 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5">
                <span className="text-muted-foreground mr-1 text-xs font-medium">
                    {selectedSheet ? `Sheet: ${selectedSheet}` : 'No sheet'}
                </span>
                {filterDefs.map((f) => {
                    const isActive = filter === f.value;
                    const isDisabled = f.value !== 'all' && f.count === 0;

                    return (
                        <button
                            key={f.value}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setFilter(f.value)}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                                isActive
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-background hover:bg-muted',
                                isDisabled &&
                                    'hover:bg-background cursor-not-allowed opacity-40',
                            )}
                        >
                            {f.label}
                            <span
                                className={cn(
                                    'rounded-full px-1.5 text-[10px] tabular-nums',
                                    isActive
                                        ? 'bg-primary-foreground/20'
                                        : 'bg-muted text-muted-foreground',
                                )}
                            >
                                {f.count}
                            </span>
                        </button>
                    );
                })}

                {overrideCount > 0 && (
                    <div className="ml-auto flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className="border-amber-500 text-amber-600"
                        >
                            {overrideCount} override
                            {overrideCount === 1 ? '' : 's'}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => setCoaOverrides({})}
                        >
                            Clear
                        </Button>
                    </div>
                )}
            </div>

            {/* ── Batch map ─────────────────────────────────────────── */}
            {batchGroups.length > 0 && (
                <div className="rounded-lg border p-3">
                    <p className="mb-2 text-xs font-semibold">
                        Batch map by Excel COA — {batchGroups.length} group
                        {batchGroups.length === 1 ? '' : 's'} still need
                        {batchGroups.length === 1 ? 's' : ''} a pick. One
                        choice applies to every row in the group.
                    </p>
                    <div className="flex max-h-64 flex-col gap-2 overflow-auto">
                        {batchGroups.map((group) => {
                            const groupSuggested = new Set(
                                group.topMatches.map((m) =>
                                    stripCoaPrefix(formatCoaOption(m.coa)),
                                ),
                            );
                            const groupItems = [
                                ...group.topMatches.map((m) =>
                                    stripCoaPrefix(formatCoaOption(m.coa)),
                                ),
                                ...allCoaLabels.filter(
                                    (l) => !groupSuggested.has(l),
                                ),
                            ];
                            const groupValue =
                                batchSelections[group.coaNorm] ??
                                (group.topSuggestion
                                    ? stripCoaPrefix(
                                          formatCoaOption(group.topSuggestion),
                                      )
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
                                                    ? 'Suggested at top — search…'
                                                    : 'Search COA…'
                                            }
                                            className="h-8 text-xs"
                                        />
                                        <ComboboxContent>
                                            <ComboboxEmpty>
                                                No COA found.
                                            </ComboboxEmpty>
                                            <ComboboxList>
                                                {(item: string) => (
                                                    <ComboboxItem
                                                        key={item}
                                                        value={item}
                                                        className={
                                                            groupSuggested.has(
                                                                item,
                                                            )
                                                                ? 'font-medium'
                                                                : ''
                                                        }
                                                    >
                                                        {groupSuggested.has(
                                                            item,
                                                        )
                                                            ? '★ '
                                                            : ''}
                                                        {item}
                                                    </ComboboxItem>
                                                )}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                    <Button
                                        size="sm"
                                        className="h-8 text-xs"
                                        onClick={() =>
                                            handleBatchApplyGroup(group)
                                        }
                                    >
                                        <Plus className="mr-1 h-3 w-3" />
                                        Apply to all {group.count}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Table ─────────────────────────────────────────────── */}
            <div className="overflow-hidden rounded-lg border">
                <div className="max-h-[65vh] overflow-auto">
                    <Table>
                        <TableHeader className="bg-background sticky top-0 z-10 shadow-[inset_0_-1px_0_hsl(var(--border))]">
                            <TableRow>
                                <TableHead className="w-[22%]">
                                    Category
                                </TableHead>
                                <TableHead className="min-w-[340px]">
                                    COA
                                </TableHead>
                                <TableHead className="w-[10%]">
                                    Section
                                </TableHead>
                                <TableHead className="w-[6%] text-right">
                                    Items
                                </TableHead>
                                <TableHead className="w-[16%]">
                                    Status
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPairs.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-muted-foreground p-10 text-center text-sm"
                                    >
                                        {counts.total === 0
                                            ? 'No Category ↔ COA pairs extracted.'
                                            : 'No pairs match this filter.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPairs.map((p) => {
                                    const status = rowStatus(p);
                                    const suggestedLabels = p.coaTopMatches.map(
                                        (m) =>
                                            stripCoaPrefix(
                                                formatCoaOption(m.coa),
                                            ),
                                    );
                                    const suggestedSet = new Set(
                                        suggestedLabels,
                                    );
                                    const itemsForRow = [
                                        ...suggestedLabels,
                                        ...allCoaLabels.filter(
                                            (l) => !suggestedSet.has(l),
                                        ),
                                    ];
                                    const selectedDisplay = p.effectiveCoa
                                        ? stripCoaPrefix(
                                              formatCoaOption(p.effectiveCoa),
                                          )
                                        : '';

                                    return (
                                        <TableRow
                                            key={p.key}
                                            className={cn(ROW_TINT[status])}
                                        >
                                            {/* Category */}
                                            <TableCell className="align-top">
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
                                                            {p.catExists &&
                                                            p.catId !== null
                                                                ? `id ${p.catId}`
                                                                : `row ${p.catRow} · not in DB`}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* COA */}
                                            <TableCell className="align-top">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-1.5 text-[11px]">
                                                        <span className="text-muted-foreground shrink-0">
                                                            Excel:
                                                        </span>
                                                        <span
                                                            className="truncate font-mono"
                                                            title={p.coa}
                                                        >
                                                            {p.coa}
                                                        </span>
                                                        {p.coaExists ? (
                                                            <Check className="h-3 w-3 shrink-0 text-green-600" />
                                                        ) : p.coaMatchType ===
                                                          'partial' ? (
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
                                                            value={
                                                                selectedDisplay
                                                            }
                                                            onValueChange={(
                                                                val,
                                                            ) =>
                                                                handleCoaPick(
                                                                    p.key,
                                                                    val as
                                                                        | string
                                                                        | null,
                                                                )
                                                            }
                                                        >
                                                            <ComboboxInput
                                                                placeholder={
                                                                    p.coaMatchType ===
                                                                    'partial'
                                                                        ? 'Suggested at top — search COA…'
                                                                        : 'Search COA…'
                                                                }
                                                                className="h-8 w-full text-xs"
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
                                                                            suggestedSet.has(
                                                                                item,
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
                                                                                {
                                                                                    item
                                                                                }
                                                                            </ComboboxItem>
                                                                        );
                                                                    }}
                                                                </ComboboxList>
                                                            </ComboboxContent>
                                                        </Combobox>
                                                        {p.overrideId !==
                                                            null && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 shrink-0"
                                                                title="Clear override"
                                                                onClick={() =>
                                                                    handleClearOverride(
                                                                        p.key,
                                                                    )
                                                                }
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
                                                            →{' '}
                                                            {
                                                                p.effectiveCoa
                                                                    .path
                                                            }{' '}
                                                            —{' '}
                                                            {
                                                                p.effectiveCoa
                                                                    .account_title
                                                            }
                                                            {p.overrideId !==
                                                                null && (
                                                                <span className="ml-1 text-amber-600">
                                                                    (override)
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : p.coaTopMatches.length >
                                                      0 ? (
                                                        <div
                                                            className="text-muted-foreground truncate text-xs"
                                                            title={p.coaTopMatches
                                                                .map(
                                                                    (m) =>
                                                                        `${m.coa.path} — ${m.coa.account_title} (score ${m.score})`,
                                                                )
                                                                .join(' | ')}
                                                        >
                                                            Suggest:{' '}
                                                            {
                                                                p
                                                                    .coaTopMatches[0]
                                                                    .coa.path
                                                            }{' '}
                                                            —{' '}
                                                            {
                                                                p
                                                                    .coaTopMatches[0]
                                                                    .coa
                                                                    .account_title
                                                            }
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </TableCell>

                                            {/* Section */}
                                            <TableCell className="text-muted-foreground align-top text-xs">
                                                <div
                                                    className="truncate"
                                                    title={p.section}
                                                >
                                                    {p.section}
                                                </div>
                                                <div className="text-[10px]">
                                                    coa row {p.coaRow}
                                                </div>
                                            </TableCell>

                                            {/* Items */}
                                            <TableCell className="text-right align-top text-xs tabular-nums">
                                                {p.items}
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell className="align-top">
                                                {status === 'creatable' && (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-amber-500 text-amber-700 dark:text-amber-400"
                                                    >
                                                        <Plus className="mr-1 h-3 w-3" />
                                                        Not mapped
                                                    </Badge>
                                                )}
                                                {status === 'exists' && (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-green-600 text-green-700 dark:text-green-400"
                                                    >
                                                        <Check className="mr-1 h-3 w-3" />
                                                        Mapped
                                                    </Badge>
                                                )}
                                                {status === 'missingCat' && (
                                                    <div className="flex flex-col gap-1">
                                                        <Badge variant="destructive">
                                                            <X className="mr-1 h-3 w-3" />
                                                            No category
                                                        </Badge>
                                                        <a
                                                            href={
                                                                categoryImportIndex()
                                                                    .url
                                                            }
                                                            className="text-[11px] underline"
                                                        >
                                                            Category Import →
                                                        </a>
                                                    </div>
                                                )}
                                                {status === 'missingCoa' && (
                                                    <Badge variant="destructive">
                                                        <X className="mr-1 h-3 w-3" />
                                                        Pick a COA
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* ── Sticky bulk action bar ─────────────────────────────── */}
            <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-10 flex flex-wrap items-center gap-3 rounded-lg border p-3 backdrop-blur">
                <Button
                    size="sm"
                    disabled={isSaving || counts.creatable === 0}
                    onClick={handleBulkCreateMappings}
                >
                    {isSaving ? (
                        <>
                            <Spinner className="mr-1 h-3 w-3" /> Saving…
                        </>
                    ) : (
                        `Create ${counts.creatable} mapping${counts.creatable === 1 ? '' : 's'}`
                    )}
                </Button>
                <span className="text-muted-foreground text-xs">
                    COAs are linked, not created. Missing categories need{' '}
                    <a href={categoryImportIndex().url} className="underline">
                        Category Import
                    </a>{' '}
                    first · {existingCategories.length} categories ·{' '}
                    {existingCoas.length} COAs · {existingMappings.length}{' '}
                    mappings in DB
                </span>
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('extract')}>
                    Back: Extract
                </Button>
                <Button variant="outline" onClick={() => setStep('calibrate')}>
                    Recalibrate
                </Button>
            </div>
        </TabsContent>
    );
}
