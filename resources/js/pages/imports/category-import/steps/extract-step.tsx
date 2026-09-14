// resources/js/pages/imports/category-import/steps/extract-step.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TabsContent } from '@/components/ui/tabs';
import { normalize } from '@/lib/ppmp/normalize';
import type { CategoryImportState } from '../types';

export function ExtractStep({ s }: { s: CategoryImportState }) {
    const {
        selectedSheets,
        canExtract,
        hasAnyVerify,
        verifyResults,
        handlePpmpExtract,
        ppmpRawItems,
        ppmpExtractResults,
        rawSheets,
        setStep,
    } = s as unknown as CategoryImportState & { rawSheets: Record<string, import('@/lib/raw-extract').RawSheet> };
    const [hideEmptyRows, setHideEmptyRows] = useState(true);
    const isCellEmpty = (v: string | null) => v == null || String(v).trim() === '';
    const isCellFalsy = (v: string | null) => {
        if (isCellEmpty(v)) return true;
        const n = normalize(String(v));
        return n === '-' || n === '—' || n === '0' || n === '0.00';
    };
    const isRowFalsy = (r: { cells: Record<string, string | null> }) => Object.values(r.cells).every(isCellFalsy);

    return (
        <TabsContent value="extract" className="mt-4 flex flex-col gap-4">
            {!canExtract ? (
                <div className="text-muted-foreground rounded-lg border p-8 text-center text-sm">
                    {hasAnyVerify ? (
                        <>
                            Verification failed —{' '}
                            {
                                Object.values(verifyResults).filter(
                                    (r) => !r.valid,
                                ).length
                            }{' '}
                            sheet(s) invalid — enable{' '}
                            <span className="font-medium">
                                Skip problematic rows
                            </span>{' '}
                            in Verify tab to proceed, or fix sheet format. (
                            {selectedSheets.length} sheets selected,{' '}
                            {
                                Object.values(verifyResults).filter(
                                    (r) => r.valid,
                                ).length
                            }{' '}
                            valid)
                        </>
                    ) : (
                        'Verify format first (must be valid or skipped) to enable extraction.'
                    )}
                </div>
            ) : (
                <>
                    {/* Raw 1:1 — row by row, col by col, no formatting */}
                    <div className="rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                            <Button onClick={handlePpmpExtract} disabled={selectedSheets.length === 0} variant="secondary">
                                Extract Raw 1:1 — {selectedSheets.length} sheets
                            </Button>
                            {rawSheets && Object.keys(rawSheets).length > 0 ? (
                                <span className="text-muted-foreground text-sm">
                                    {Object.keys(rawSheets).length} sheet{Object.keys(rawSheets).length === 1 ? '' : 's'} · {Object.values(rawSheets).reduce((sum, sh) => sum + sh.rows.length, 0)} rows × {Object.values(rawSheets)[0]?.columnCount ?? 0} cols
                                </span>
                            ) : ppmpRawItems.length > 0 ? (
                                <span className="text-muted-foreground text-sm">Raw {ppmpRawItems.length} rows</span>
                            ) : null}
                        </div>

                        {rawSheets && Object.keys(rawSheets).length > 0 ? (
                            <div className="mt-3 flex flex-col gap-4">
                                <div className="flex items-center gap-2">
                                    <Switch id="hide-empty-rows-cat" checked={hideEmptyRows} onCheckedChange={setHideEmptyRows} />
                                    <Label htmlFor="hide-empty-rows-cat" className="text-xs">Hide fully empty / falsy rows</Label>
                                    <span className="text-muted-foreground text-xs">{hideEmptyRows ? '(hidden)' : '(shown)'}</span>
                                </div>
                                {Object.entries(rawSheets).map(([sheetName, raw]) => {
                                    const filteredRows = hideEmptyRows ? raw.rows.filter((r) => !isRowFalsy(r)) : raw.rows;
                                    const hiddenCount = raw.rows.length - filteredRows.length;
                                    return (
                                        <div key={sheetName} className="overflow-x-auto rounded-md border">
                                            <div className="bg-muted/30 flex items-center justify-between border-b px-3 py-2 text-xs font-medium">
                                                <span>Sheet: {sheetName} — {raw.rowCount} rows × {raw.columnCount} cols{hideEmptyRows && hiddenCount > 0 && ` · ${hiddenCount} empty/falsy hidden`}</span>
                                                <span className="text-muted-foreground font-normal">Showing {filteredRows.length} of {raw.rows.length} rows</span>
                                            </div>
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="bg-muted/50 text-muted-foreground border-b">
                                                        <th className="bg-muted sticky left-0 px-2 py-1 font-medium">Row</th>
                                                        {raw.columnLetters.map((col) => (
                                                            <th key={col} className="px-2 py-1 font-medium whitespace-nowrap">{col}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredRows.map((r) => (
                                                        <tr key={r.rowNumber} className="border-b last:border-0">
                                                            <td className="bg-muted/20 sticky left-0 px-2 py-1 font-mono text-xs">{r.rowNumber}</td>
                                                            {raw.columnLetters.map((col) => (
                                                                <td key={col} className="max-w-[14ch] truncate px-2 py-1 whitespace-nowrap" title={r.cells[col] ?? ''}>{r.cells[col] ?? '—'}</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                    {filteredRows.length === 0 && (
                                                        <tr><td colSpan={raw.columnLetters.length + 1} className="text-muted-foreground p-4 text-center">All rows hidden — toggle off to show empty rows.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : ppmpRawItems.length > 0 ? (
                            <div className="mt-3 overflow-x-auto rounded-md border">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-muted/50 text-muted-foreground border-b">
                                            <th className="px-2 py-1 font-medium">Sheet</th>
                                            <th className="px-2 py-1 font-medium">Row</th>
                                            <th className="px-2 py-1 font-medium">Section</th>
                                            <th className="px-2 py-1 font-medium">Category</th>
                                            <th className="px-2 py-1 font-medium">COA</th>
                                            <th className="px-2 py-1 font-medium">Description</th>
                                            <th className="px-2 py-1 font-medium">Unit</th>
                                            <th className="px-2 py-1 font-medium">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ppmpRawItems.slice(0, 80).map((it) => (
                                            <tr key={`${it.sheet}-${it.row}`} className="border-b last:border-0">
                                                <td className="px-2 py-1 font-mono whitespace-nowrap">{it.sheet}</td>
                                                <td className="px-2 py-1 font-mono">{it.row}</td>
                                                <td className="px-2 py-1 whitespace-nowrap">{it.section}</td>
                                                <td className="max-w-[14ch] truncate px-2 py-1" title={it.category}>{it.category}</td>
                                                <td className="max-w-[14ch] truncate px-2 py-1 font-mono" title={it.coa}>{it.coa}</td>
                                                <td className="max-w-[24ch] truncate px-2 py-1" title={it.description}>{it.description}</td>
                                                <td className="px-2 py-1 whitespace-nowrap">{it.unit || '—'}</td>
                                                <td className="px-2 py-1 whitespace-nowrap">{it.price != null ? `₱${it.price.toLocaleString()}` : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : null}
                        <p className="text-muted-foreground mt-2 text-xs">Raw 1:1 — every row × every column as in Excel, no formatting, show all (no virtualization).</p>
                    </div>
                </>
            )}
            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('verify')}>
                    Back: Verify
                </Button>
                <Button onClick={() => setStep('import')} disabled={ppmpRawItems.length === 0}>
                    Next: Import
                </Button>
            </div>
        </TabsContent>
    );
}
