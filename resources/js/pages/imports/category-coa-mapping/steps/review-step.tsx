// resources/js/pages/imports/category-coa-mapping/steps/review-step.tsx

import { useMemo, useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import DataTable from '@/components/data-table';
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
import { TabsContent } from '@/components/ui/tabs';
import {
    formatCoaOption,
    groupUnmatchedByExtractedCoa,
    type ExtractedCoaGroup,
} from '@/lib/ppmp/batch-match';
import { cn } from '@/lib/utils';
import { index as categoryImportIndex } from '@/routes/category-import';
import columns, {
    ROW_TINT,
    rowStatus,
    stripCoaPrefix,
    type PairFilter,
} from '../data-table/columns';
import type {
    CategoryCoaMappingState,
    CategoryCoaReviewTableMeta,
} from '../types';

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
        const id = coaLabelToId.get(picked) ?? group.topSuggestion?.id ?? null;

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

    const reviewTableMeta: CategoryCoaReviewTableMeta = useMemo(
        () => ({
            allCoaLabels,
            onCoaPick: handleCoaPick,
            onClearOverride: handleClearOverride,
        }),
        // biome-ignore lint/correctness/useExhaustiveDependencies: handlers close over these
        [allCoaLabels, coaLabelToId, handleClearOverride],
    );

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
                        {batchGroups.length === 1 ? 's' : ''} a pick. One choice
                        applies to every row in the group.
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
            <DataTable
                data={filteredPairs}
                columns={columns}
                meta={reviewTableMeta}
                withColgroup
                className="h-[65vh]"
                getRowClassName={({ original }) =>
                    ROW_TINT[rowStatus(original)]
                }
                emptyState={
                    counts.total === 0
                        ? 'No Category ↔ COA pairs extracted.'
                        : 'No pairs match this filter.'
                }
            />
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
