import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TabsContent } from '@/components/ui/tabs';
import { getCategoryMatch } from '@/lib/ppmp/normalize';
import type { CategoryImportState } from '../types';

export function ImportStep({ s }: { s: CategoryImportState }) {
    const {
        selectedSheets,
        extractResult,
        extractionStats,
        selected,
        setSelected,
        isAdditionalDraft,
        setIsAdditionalDraft,
        existingCategories,
        importing,
        handleImport,
        setStep,
    } = s;

    if (!extractResult) {
        return (
            <TabsContent value="import" className="mt-4 flex flex-col gap-4">
                <div className="text-muted-foreground rounded-lg border p-8 text-center text-sm">Extract first to review import.</div>
                <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep('extract')}>Back: Extract</Button>
                    <Button variant="ghost" onClick={() => setStep('calibrate')}>Recalibrate</Button>
                </div>
            </TabsContent>
        );
    }

    return (
        <TabsContent value="import" className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-5 gap-2 text-xs">
                <div className="rounded-md border p-2 text-center"><div className="text-lg font-semibold">{extractionStats?.raw}</div><div className="text-muted-foreground">Raw</div></div>
                <div className="rounded-md border bg-green-50 p-2 text-center"><div className="text-lg font-semibold text-green-700">{extractionStats?.unique}</div><div className="text-muted-foreground">Unique</div></div>
                <div className="rounded-md border p-2 text-center"><div className="text-lg font-semibold">{extractResult.duplicates.length}</div><div className="text-muted-foreground">Duplicates</div></div>
                <div className="rounded-md border p-2 text-center"><div className="text-lg font-semibold">{extractResult.excludedTotal.length}</div><div className="text-muted-foreground">Totals excluded</div></div>
                <div className={`rounded-md border p-2 text-center ${extractResult.skippedProblematic.length > 0 ? 'border-amber-200 bg-amber-50' : ''}`}><div className={`text-lg font-semibold ${extractResult.skippedProblematic.length > 0 ? 'text-amber-700' : ''}`}>{extractResult.skippedProblematic.length}</div><div className="text-muted-foreground">Skipped: problematic</div></div>
            </div>

            <div className="rounded-lg border">
                <div className="flex items-start justify-between gap-3 p-3">
                    <div><h3 className="text-sm font-semibold">Review — Unique Categories ({extractResult.unique.length}) across {selectedSheets.length} sheets</h3><p className="text-muted-foreground text-xs">Global dedupe by normalized across all {selectedSheets.length} sheets. Check to import.</p></div>
                    <div className="flex shrink-0 gap-1">
                        <Button variant="outline" size="sm" onClick={() => setSelected(new Set(extractResult.unique.map((u) => u.normalized)))}>Select all</Button>
                        <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Select none</Button>
                        <Button variant="ghost" size="sm" onClick={() => { const onlyNew = extractResult.unique.filter((u) => getCategoryMatch(u.normalized, existingCategories).type === 'none').map((u) => u.normalized); setSelected(new Set(onlyNew)); }}>Only new</Button>
                    </div>
                </div>
                <div className="text-muted-foreground px-3 pb-2 text-xs">Selected {selected.size}/{extractResult.unique.length} will be imported.</div>
                <div className="max-h-96 overflow-auto">
                    <Table>
                        <TableHeader><TableRow><TableHead className="w-10 text-center">Import</TableHead><TableHead>Raw</TableHead><TableHead>DB Match</TableHead><TableHead>Sheets</TableHead><TableHead>Locations</TableHead><TableHead className="text-center">Count</TableHead><TableHead className="text-center">Additional</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {extractResult.unique.slice(0, 80).map((u) => {
                                const match = getCategoryMatch(u.normalized, existingCategories);
                                const isSelected = selected.has(u.normalized);
                                const isStrict = match.type === 'strict';
                                const partials = match.type === 'partial' ? (match.topMatches ?? []) : [];
                                return (
                                    <TableRow key={u.normalized}>
                                        <TableCell className="text-center"><input type="checkbox" checked={isSelected} onChange={(e) => { const next = new Set(selected); if (e.target.checked) next.add(u.normalized); else next.delete(u.normalized); setSelected(next); }} className="h-4 w-4" /></TableCell>
                                        <TableCell className="max-w-[18ch] truncate text-xs" title={u.raw}>{u.raw}</TableCell>
                                        <TableCell className="max-w-[28ch] text-xs">{isStrict ? <Badge variant="secondary" className="bg-amber-100 text-amber-800">Exists: {(match as unknown as { match: { name: string } }).match?.name}</Badge> : partials.length > 0 ? <div className="flex flex-col gap-1">{partials.map((p, idx) => <Badge key={idx} variant="outline" className="justify-start truncate text-xs" title={`${p.category.name} (score ${p.score})`}>{p.category.name} {p.score === 99 ? '(substr)' : `(lev ${p.score})`}</Badge>)}</div> : <span className="text-muted-foreground">— new</span>}<div className="text-muted-foreground truncate text-xs" title={u.normalized}>{u.normalized}</div></TableCell>
                                        <TableCell className="text-center"><Badge variant={u.sheetCount === selectedSheets.length ? 'default' : u.sheetCount > 1 ? 'secondary' : 'outline'} className="font-mono text-xs" title={u.sheets.join(', ')}>{u.sheetCount}/{selectedSheets.length}</Badge></TableCell>
                                        <TableCell className="max-w-[22ch] truncate font-mono text-xs" title={u.locations.map((l) => l.address).join(', ')}>{u.locations.slice(0, 1).map((l) => l.address).join(', ')}<span className="text-muted-foreground"> ({u.locations[0]?.col}{u.locations[0]?.row})</span></TableCell>
                                        <TableCell className="text-center font-mono text-xs">{u.count}</TableCell>
                                        <TableCell className="text-center"><Switch checked={isAdditionalDraft[u.normalized] ?? false} onCheckedChange={(v) => setIsAdditionalDraft((prev) => ({ ...prev, [u.normalized]: v }))} size="sm" /></TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
                {extractResult.unique.length > 80 && <div className="text-muted-foreground p-2 text-center text-xs">Showing first 80 of {extractResult.unique.length}</div>}
            </div>

            {extractResult.duplicates.length > 0 && (
                <div className="rounded-lg border p-3"><h4 className="text-xs font-semibold">Duplicates — {extractResult.duplicates.length}</h4><ul className="mt-1 max-h-40 list-disc overflow-auto pl-5 text-xs">{extractResult.duplicates.slice(0, 15).map((d, i) => <li key={i}><span className="font-mono">{d.normalized}</span> — kept {d.keptAddress} ({d.keptSheet}!{d.keptRow}), duplicate {d.duplicateAddress} (“{d.duplicateRaw}”)</li>)}</ul></div>
            )}

            <div className="flex items-center gap-2 rounded-lg border p-3">
                <Button onClick={handleImport} disabled={importing || selected.size === 0}>{importing ? <><Spinner /> Importing...</> : `Import ${selected.size} Categories`}</Button>
                <span className="text-muted-foreground text-xs">Will create ppmp_categories where not exists. Selected {selected.size}/{extractResult.unique.length}.</span>
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('extract')}>Back: Extract</Button>
                <Button variant="ghost" onClick={() => setStep('calibrate')}>Recalibrate</Button>
            </div>
        </TabsContent>
    );
}
