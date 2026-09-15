import { useMemo } from 'react';
import DataTable from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { TabsContent } from '@/components/ui/tabs';
import { getCategoryMatch } from '@/lib/ppmp/normalize';
import type {
    CategoryImportState,
    CategoryReviewRow,
    CategoryReviewTableMeta,
} from '../types';
import { getCategoryReviewColumns } from './import-columns';

export function ImportStep({ s }: { s: CategoryImportState }) {
    const {
        selectedSheets,
        extractResult,
        extractionStats,
        ppmpRawItems,
        handleExtract,
        selected,
        setSelected,
        existingCategories,
        importing,
        handleImport,
        setStep,
    } = s;

    const columns = useMemo(
        () => getCategoryReviewColumns(selectedSheets.length),
        [selectedSheets.length],
    );

    const rows = useMemo<CategoryReviewRow[]>(() => {
        if (!extractResult) return [];

        return extractResult.unique.map((u) => {
            const match = getCategoryMatch(u.normalized, existingCategories);
            const first = u.locations[0];

            return {
                normalized: u.normalized,
                raw: u.raw,
                sheets: u.sheets,
                sheetCount: u.sheetCount,
                count: u.count,
                locations: u.locations,
                firstAddress: first?.address ?? '',
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
                    {ppmpRawItems.length > 0
                        ? `Raw extracted (${ppmpRawItems.length} rows) — process them to review unique categories.`
                        : 'Extract first to review import.'}
                </div>
                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setStep('extract')}
                    >
                        Back: Extract
                    </Button>
                    <div className="flex gap-2">
                        {ppmpRawItems.length > 0 && (
                            <Button
                                variant="secondary"
                                onClick={() => handleExtract()}
                            >
                                Process {ppmpRawItems.length} raw rows
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            onClick={() => setStep('calibrate')}
                        >
                            Recalibrate
                        </Button>
                    </div>
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
                    className={`rounded-md border p-2 text-center ${extractResult.skippedProblematic.length > 0 ? 'border-amber-200 bg-amber-50' : ''}`}
                >
                    <div
                        className={`text-lg font-semibold ${extractResult.skippedProblematic.length > 0 ? 'text-amber-700' : ''}`}
                    >
                        {extractResult.skippedProblematic.length}
                    </div>
                    <div className="text-muted-foreground">
                        Skipped: problematic
                    </div>
                </div>
            </div>

            <div className="rounded-lg border">
                <div className="flex items-start justify-between gap-3 p-3 pb-0">
                    <div>
                        <h3 className="text-sm font-semibold">
                            Review — Unique Categories (
                            {extractResult.unique.length}) across{' '}
                            {selectedSheets.length} sheet
                            {selectedSheets.length === 1 ? '' : 's'}
                        </h3>
                        <p className="text-muted-foreground text-xs">
                            Global dedupe by normalized across all{' '}
                            {selectedSheets.length} sheets. Check to import.
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
                                — kept {d.keptAddress} ({d.keptSheet}!
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
