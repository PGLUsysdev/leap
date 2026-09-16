import { useMemo } from 'react';
import DataTable from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { TabsContent } from '@/components/ui/tabs';
import { getCategoryMatch, normalize } from '@/lib/ppmp/normalize';
import type {
    CategoryImportState,
    CategoryReviewRow,
    CategoryReviewTableMeta,
} from '../types';
import { getCategoryReviewColumns } from './import-columns';

export function ImportStep({ s }: { s: CategoryImportState }) {
    const {
        selectedSheet,
        extractResult,
        extractionStats,
        selected,
        setSelected,
        existingCategories,
        importing,
        handleImport,
        ensuringSentinels,
        handleEnsureSentinels,
        setStep,
    } = s;

    const columns = useMemo(() => getCategoryReviewColumns(), []);

    const sentinelStatuses = useMemo(() => {
        const defs = [
            {
                name: 'Additional Items (Uncategorized)',
                is_non_procurement: false,
                is_additional: true,
            },
            {
                name: 'Non-Procurement (Uncategorized)',
                is_non_procurement: true,
                is_additional: false,
            },
        ];

        return defs.map((def) => {
            const found = existingCategories.find(
                (c) => normalize(c.name) === normalize(def.name),
            );

            if (!found)
                return { ...def, status: 'missing' as const };

            if (
                found.is_non_procurement !== def.is_non_procurement ||
                found.is_additional !== def.is_additional
            )
                return { ...def, status: 'misconfigured' as const };

            return { ...def, status: 'exists' as const };
        });
    }, [existingCategories]);

    const sentinelsOk = sentinelStatuses.every((st) => st.status === 'exists');

    const rows = useMemo<CategoryReviewRow[]>(() => {
        if (!extractResult) return [];

        return extractResult.unique.map((u) => {
            const match = getCategoryMatch(u.normalized, existingCategories);

            return {
                normalized: u.normalized,
                raw: u.raw,
                row: u.row,
                address: u.address,
                count: u.count,
                rows: u.rows,
                matchType: match.type,
                matchName:
                    match.type === 'strict'
                        ? ((match as unknown as { match: { name: string } })
                              .match?.name ?? null)
                        : null,
                topMatches:
                    match.type === 'partial'
                        ? ((match.topMatches ?? []).map((p) => ({
                              name: p.category.name,
                              score: p.score,
                          })) ?? [])
                        : [],
            };
        });
    }, [extractResult, existingCategories]);

    const meta = useMemo<CategoryReviewTableMeta>(
        () => ({
            selected,
            toggleOne: (normalized, checked) => {
                setSelected((prev) => {
                    const next = new Set(prev);

                    if (checked) next.add(normalized);
                    else next.delete(normalized);

                    return next;
                });
            },
            setSelected: (next) => setSelected(next),
        }),
        [selected, setSelected],
    );

    function handleOnlyNew() {
        if (!extractResult) return;
        const onlyNew = extractResult.unique
            .filter(
                (u) =>
                    getCategoryMatch(u.normalized, existingCategories).type ===
                    'none',
            )
            .map((u) => u.normalized);
        setSelected(new Set(onlyNew));
    }

    if (!extractResult) {
        return (
            <TabsContent value="import" className="mt-4 flex flex-col gap-4">
                <div className="text-muted-foreground rounded-lg border p-8 text-center text-sm">
                    Extract first to review import.
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

    return (
        <TabsContent value="import" className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-5 gap-2 text-xs">
                <div className="rounded-md border p-2 text-center">
                    <div className="text-lg font-semibold">
                        {extractionStats?.raw}
                    </div>
                    <div className="text-muted-foreground">Raw</div>
                </div>
                <div className="rounded-md border bg-green-50 p-2 text-center">
                    <div className="text-lg font-semibold text-green-700">
                        {extractionStats?.unique}
                    </div>
                    <div className="text-muted-foreground">Unique</div>
                </div>
                <div className="rounded-md border p-2 text-center">
                    <div className="text-lg font-semibold">
                        {extractResult.duplicates.length}
                    </div>
                    <div className="text-muted-foreground">Duplicates</div>
                </div>
                <div className="rounded-md border p-2 text-center">
                    <div className="text-lg font-semibold">
                        {extractResult.excludedTotal.length}
                    </div>
                    <div className="text-muted-foreground">Totals excluded</div>
                </div>
                <div
                    className={`rounded-md border p-2 text-center ${extractResult.skippedCoaNotEmpty.length > 0 ? 'border-amber-200 bg-amber-50' : ''}`}
                >
                    <div
                        className={`text-lg font-semibold ${extractResult.skippedCoaNotEmpty.length > 0 ? 'text-amber-700' : ''}`}
                    >
                        {extractResult.skippedCoaNotEmpty.length}
                    </div>
                    <div className="text-muted-foreground">
                        Skipped: COA not empty
                    </div>
                </div>
            </div>

            <div className="rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold">
                            System categories
                        </h3>
                        <p className="text-muted-foreground text-xs">
                            Buckets for additional / non-procurement items.
                            Checked on every visit — added or fixed if missing
                            or modified.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEnsureSentinels}
                        disabled={ensuringSentinels || sentinelsOk}
                    >
                        {ensuringSentinels ? (
                            <>
                                <Spinner /> Ensuring...
                            </>
                        ) : sentinelsOk ? (
                            'All present'
                        ) : (
                            'Ensure sentinels'
                        )}
                    </Button>
                </div>
                <ul className="mt-2 flex flex-col gap-1">
                    {sentinelStatuses.map((st) => (
                        <li
                            key={st.name}
                            className="flex flex-wrap items-center gap-2 text-xs"
                        >
                            <span className="font-medium">{st.name}</span>
                            {st.status === 'exists' ? (
                                <Badge variant="secondary">Exists ✓</Badge>
                            ) : st.status === 'missing' ? (
                                <Badge variant="destructive">Missing</Badge>
                            ) : (
                                <Badge
                                    variant="outline"
                                    className="border-amber-500 text-amber-600"
                                >
                                    Wrong flags — will fix
                                </Badge>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="rounded-lg border">
                <div className="flex items-start justify-between gap-3 p-3 pb-0">
                    <div>
                        <h3 className="text-sm font-semibold">
                            Review — Unique Categories (
                            {extractResult.unique.length})
                            {selectedSheet ? ` — ${selectedSheet}` : ''}
                        </h3>
                        <p className="text-muted-foreground text-xs">
                            Procurement-only dedupe by normalized name. Check
                            to import.
                        </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                        Selected {selected.size}/{extractResult.unique.length}
                    </Badge>
                </div>
                <DataTable
                    data={rows}
                    columns={columns}
                    meta={meta}
                    withColgroup
                    className="h-[520px]"
                >
                    <div className="flex shrink-0 flex-wrap items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setSelected(
                                    new Set(
                                        extractResult.unique.map(
                                            (u) => u.normalized,
                                        ),
                                    ),
                                )
                            }
                        >
                            Select all
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelected(new Set())}
                        >
                            Select none
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleOnlyNew}
                        >
                            Only new
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={importing || selected.size === 0}
                            size="sm"
                        >
                            {importing ? (
                                <>
                                    <Spinner /> Importing...
                                </>
                            ) : (
                                `Import ${selected.size}`
                            )}
                        </Button>
                    </div>
                </DataTable>
            </div>

            {extractResult.duplicates.length > 0 && (
                <div className="rounded-lg border p-3">
                    <h4 className="text-xs font-semibold">
                        Duplicates — {extractResult.duplicates.length}
                    </h4>
                    <ul className="mt-1 max-h-40 list-disc overflow-auto pl-5 text-xs">
                        {extractResult.duplicates.slice(0, 15).map((d, i) => (
                            <li key={i}>
                                <span className="font-mono">
                                    {d.normalized}
                                </span>{' '}
                                — kept {d.keptAddress} (row
                                {d.keptRow}), duplicate {d.duplicateAddress} (“
                                {d.duplicateRaw}”)
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex items-center gap-2 rounded-lg border p-3">
                <Button
                    onClick={handleImport}
                    disabled={importing || selected.size === 0}
                >
                    {importing ? (
                        <>
                            <Spinner /> Importing...
                        </>
                    ) : (
                        `Import ${selected.size} Categories`
                    )}
                </Button>
                <span className="text-muted-foreground text-xs">
                    Will create ppmp_categories where not exists. Selected{' '}
                    {selected.size}/{extractResult.unique.length}.
                </span>
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('extract')}>
                    Back: Extract
                </Button>
                <Button variant="ghost" onClick={() => setStep('calibrate')}>
                    Recalibrate
                </Button>
            </div>
        </TabsContent>
    );
}
