// resources/js/components/imports/import-extract-step.tsx
//
// Shared Extract step — raw 1:1 row×col dump, no formatting.
// All PPMP and AIP importers use `extractRawSheet` (lib/raw-extract.ts) via this UI.
// Shows every row 1..lastRow and every col 1..columnCount as raw cellText, 1:1.
// No virtualization, show all. Strict: Extract disabled until Verify passes.

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import type { RawSheet } from '@/lib/raw-extract';
import type { RawPpmpItem } from '@/lib/ppmp/extract';
import { normalize } from '@/lib/ppmp/normalize';

type PpmpExtractDisplay = {
    sheet: string;
    rawItems: RawPpmpItem[];
    message?: string;
    details?: string[];
};

interface ImportExtractStepProps {
    family: 'ppmp' | 'aip';
    sheets: string[];
    canExtract: boolean;
    hasAnyVerify?: boolean;
    allVerifyValid?: boolean;
    // PPMP raw items aggregated across all sheets, or per-sheet (legacy, kept for compat)
    ppmpItems?: RawPpmpItem[];
    ppmpBySheet?: Record<string, RawPpmpItem[]>;
    // New raw 1:1 sheets — preferred for pure raw view
    rawSheets?: Record<string, RawSheet>;
    aipRecords?: Array<{
        key: string;
        row: number;
        isContinuation: boolean;
        blockRow?: number;
        fullCode: string;
        name: string;
        offices: string[];
        startDate: string | null;
        endDate: string | null;
        expectedOutput: string | null;
        fundingSource: string | null;
        adaptation: string | null;
        mitigation: string | null;
        typology: string | null;
    }>;
    aipBlocks?: number;
    selectedSheet?: string;
    details?: string[];
    message?: string;
    onRunExtract: () => void;
    onBack: () => void;
    onNext: () => void;
    canNext?: boolean;
    nextLabel?: string;
    backLabel?: string;
}

export function ImportExtractStep({
    family,
    sheets,
    canExtract,
    hasAnyVerify,
    allVerifyValid,
    ppmpItems = [],
    ppmpBySheet,
    rawSheets,
    aipRecords = [],
    aipBlocks,
    selectedSheet,
    details = [],
    message,
    onRunExtract,
    onBack,
    onNext,
    canNext = true,
    nextLabel = 'Next: Review',
    backLabel = 'Back: Verify',
}: ImportExtractStepProps) {
    const ppmpCount = ppmpItems.length;
    const hasRawSheets = rawSheets && Object.keys(rawSheets).length > 0;
    const [hideEmptyRows, setHideEmptyRows] = useState(true);

    const isCellEmpty = (v: string | null) => v == null || String(v).trim() === '';
    const isCellFalsy = (v: string | null) => {
        if (isCellEmpty(v)) return true;
        const n = normalize(String(v));
        return n === '-' || n === '—' || n === '0' || n === '0.00';
    };
    const isRowEmpty = (r: { cells: Record<string, string | null> }) => Object.values(r.cells).every(isCellEmpty);
    const isRowFalsy = (r: { cells: Record<string, string | null> }) => Object.values(r.cells).every(isCellFalsy);

    return (
        <TabsContent value="extract" className="mt-4 flex flex-col gap-4">
            {family === 'ppmp' ? (
                <>
                    <p className="text-muted-foreground text-sm">
                        Raw 1:1 extraction — {sheets.length} sheet{sheets.length === 1 ? '' : 's'} selected, strict verify required before extract. Shows every row × every column as in Excel, no formatting.
                    </p>
                    {!canExtract ? (
                        <div className="text-muted-foreground rounded-lg border p-8 text-center text-sm">
                            {hasAnyVerify ? (
                                <>
                                    Verification failed — {hasAnyVerify && !allVerifyValid ? 'fix verify errors to enable extract.' : 'run verify first.'} ({sheets.length} sheets)
                                </>
                            ) : (
                                'Verify format first (must be valid) to enable extraction.'
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <Button onClick={onRunExtract} disabled={sheets.length === 0}>
                                    Extract Raw 1:1 ({sheets.length} sheets)
                                </Button>
                                {hasRawSheets ? (
                                    <span className="text-muted-foreground text-sm">
                                        {Object.keys(rawSheets!).length} sheet{Object.keys(rawSheets!).length === 1 ? '' : 's'} · {Object.values(rawSheets!).reduce((sum, sh) => sum + sh.rows.length, 0)} rows × {Object.values(rawSheets!)[0]?.columnCount ?? 0} cols
                                    </span>
                                ) : ppmpCount > 0 ? (
                                    <span className="text-muted-foreground text-sm">
                                        Raw {ppmpCount} item rows
                                        {ppmpBySheet && ` across ${Object.keys(ppmpBySheet).length} sheets`}
                                    </span>
                                ) : null}
                            </div>

                            {message && <p className="text-sm font-medium text-green-600">✅ {message}</p>}
                            {details.length > 0 && (
                                <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
                                    {details.map((d, i) => (
                                        <li key={i}>{d}</li>
                                    ))}
                                </ul>
                            )}

                            {/* Raw 1:1 sheets — show all rows × all cols, no virtualization, keep simple */}
                            {hasRawSheets && (
                                <div className="flex items-center gap-2">
                                    <Switch id="hide-empty-rows" checked={hideEmptyRows} onCheckedChange={setHideEmptyRows} />
                                    <Label htmlFor="hide-empty-rows" className="text-xs">
                                        Hide fully empty / falsy rows
                                    </Label>
                                    <span className="text-muted-foreground text-xs">
                                        {hideEmptyRows ? '(hidden)' : '(shown)'} — respects calibration cols, rows from headerRow
                                    </span>
                                </div>
                            )}
                            {hasRawSheets &&
                                Object.entries(rawSheets!).map(([sheetName, raw]) => {
                                    const filteredRows = hideEmptyRows ? raw.rows.filter((r) => !isRowFalsy(r)) : raw.rows;
                                    const hiddenCount = raw.rows.length - filteredRows.length;
                                    return (
                                        <div key={sheetName} className="overflow-x-auto rounded-md border">
                                            <div className="bg-muted/30 flex items-center justify-between border-b px-3 py-2 text-xs font-medium">
                                                <span>
                                                    Sheet: {sheetName} — {raw.rowCount} rows × {raw.columnCount} cols
                                                    {hideEmptyRows && hiddenCount > 0 && ` · ${hiddenCount} empty/falsy hidden`}
                                                </span>
                                                <span className="text-muted-foreground font-normal">
                                                    Showing {filteredRows.length} of {raw.rows.length} rows
                                                </span>
                                            </div>
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="bg-muted/50 text-muted-foreground border-b">
                                                        <th className="bg-muted sticky left-0 px-2 py-1 font-medium">Row</th>
                                                        {raw.columnLetters.map((col) => (
                                                            <th key={col} className="px-2 py-1 font-medium whitespace-nowrap">
                                                                {col}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredRows.map((r) => (
                                                        <tr key={r.rowNumber} className="border-b last:border-0">
                                                            <td className="bg-muted/20 sticky left-0 px-2 py-1 font-mono text-xs">{r.rowNumber}</td>
                                                            {raw.columnLetters.map((col) => (
                                                                <td key={col} className="max-w-[18ch] truncate px-2 py-1 whitespace-nowrap" title={r.cells[col] ?? ''}>
                                                                    {r.cells[col] ?? '—'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                    {filteredRows.length === 0 && (
                                                        <tr>
                                                            <td colSpan={raw.columnLetters.length + 1} className="text-muted-foreground p-4 text-center">
                                                                All rows hidden — toggle off to show empty rows.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })}

                            {/* Legacy formatted items fallback (if rawSheets not yet wired) */}
                            {!hasRawSheets && ppmpItems.length > 0 && (
                                <div className="overflow-x-auto rounded-md border">
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
                                                {ppmpItems.some((it) => it.qtys) && <th className="px-2 py-1 font-medium">Qty total</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ppmpItems.slice(0, 100).map((it) => (
                                                <tr key={`${it.sheet}-${it.row}`} className="border-b last:border-0">
                                                    <td className="px-2 py-1 font-mono whitespace-nowrap">{it.sheet}</td>
                                                    <td className="px-2 py-1 font-mono">{it.row}</td>
                                                    <td className="px-2 py-1 whitespace-nowrap">{it.section}</td>
                                                    <td className="max-w-[14ch] truncate px-2 py-1" title={it.category}>{it.category}</td>
                                                    <td className="max-w-[14ch] truncate px-2 py-1 font-mono" title={it.coa}>{it.coa}</td>
                                                    <td className="max-w-[24ch] truncate px-2 py-1" title={it.description}>{it.description}</td>
                                                    <td className="px-2 py-1 whitespace-nowrap">{it.unit || '—'}</td>
                                                    <td className="px-2 py-1 whitespace-nowrap">{it.price != null ? `₱${it.price.toLocaleString()}` : '—'}</td>
                                                    {it.qtys && <td className="px-2 py-1 text-right">{it.monthTotal ?? '—'}</td>}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {ppmpItems.length > 100 && (
                                        <div className="text-muted-foreground p-2 text-center text-xs">Showing first 100 of {ppmpItems.length} raw rows</div>
                                    )}
                                </div>
                            )}

                            {ppmpBySheet && Object.keys(ppmpBySheet).length > 1 && (
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(ppmpBySheet).map(([sh, items]) => (
                                        <Badge key={sh} variant="secondary">{sh}: {items.length} rows</Badge>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </>
            ) : (
                <>
                    <p className="text-muted-foreground text-sm">
                        Sheet <span className="text-foreground font-medium">{selectedSheet}</span> · one record per output × funding source · raw preview before import
                    </p>
                    {!canExtract ? (
                        <div className="text-muted-foreground rounded-lg border p-8 text-center text-sm">Verify first to enable extraction.</div>
                    ) : (
                        <>
                            <div>
                                <Button onClick={onRunExtract} disabled={!canExtract}>
                                    Run extract
                                </Button>
                            </div>
                            {aipRecords.length > 0 && (
                                <div className="flex flex-col gap-2 rounded-md border p-3">
                                    <p className="text-sm font-medium text-green-600">
                                        ✅ Extracted {aipRecords.length} record{aipRecords.length === 1 ? '' : 's'} across {aipBlocks} PPA block{aipBlocks === 1 ? '' : 's'}
                                    </p>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="text-muted-foreground border-b">
                                                    <th className="px-2 py-1 font-medium">Row</th>
                                                    <th className="px-2 py-1 font-medium">Code</th>
                                                    <th className="px-2 py-1 font-medium">Name</th>
                                                    <th className="px-2 py-1 font-medium">Offices</th>
                                                    <th className="px-2 py-1 font-medium">Output</th>
                                                    <th className="px-2 py-1 font-medium">Fund</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {aipRecords.slice(0, 100).map((r) => (
                                                    <tr key={r.key} className="border-b last:border-0">
                                                        <td className="px-2 py-1 font-mono whitespace-nowrap">
                                                            {r.row}
                                                            {r.isContinuation && <span className="text-muted-foreground ml-1">↳</span>}
                                                        </td>
                                                        <td className="px-2 py-1 font-mono whitespace-nowrap">{r.isContinuation ? '—' : r.fullCode}</td>
                                                        <td className="max-w-[20ch] truncate px-2 py-1">{r.name}</td>
                                                        <td className="px-2 py-1 whitespace-nowrap">{r.offices.join(' / ') || '—'}</td>
                                                        <td className="max-w-[24ch] truncate px-2 py-1">{r.expectedOutput ?? '—'}</td>
                                                        <td className="px-2 py-1 whitespace-nowrap">{r.fundingSource ?? '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {aipRecords.length > 100 && <div className="text-muted-foreground p-2 text-center text-xs">Showing first 100 of {aipRecords.length}</div>}
                                    </div>
                                    {message && <p className="text-muted-foreground text-xs">{message}</p>}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>
                    {backLabel}
                </Button>
                <Button onClick={onNext} disabled={!canNext}>
                    {nextLabel}
                </Button>
            </div>
        </TabsContent>
    );
}

export type ImportPpmpExtractShellProps = {
    sheets: string[];
    canExtract: boolean;
    hasAnyVerify?: boolean;
    allVerifyValid?: boolean;
    rawItems: RawPpmpItem[];
    bySheet: Record<string, RawPpmpItem[]>;
    rawSheets?: Record<string, import('@/lib/raw-extract').RawSheet>;
    details?: string[];
    message?: string;
    onRunExtract: () => void;
    onBack: () => void;
    onNext: () => void;
    canNext?: boolean;
    nextLabel?: string;
};

export function ImportPpmpExtractShell({
    sheets,
    canExtract,
    hasAnyVerify,
    allVerifyValid,
    rawItems,
    bySheet,
    rawSheets,
    details,
    message,
    onRunExtract,
    onBack,
    onNext,
    canNext,
    nextLabel,
}: ImportPpmpExtractShellProps) {
    return (
        <ImportExtractStep
            family="ppmp"
            sheets={sheets}
            canExtract={canExtract}
            hasAnyVerify={hasAnyVerify}
            allVerifyValid={allVerifyValid}
            ppmpItems={rawItems}
            ppmpBySheet={bySheet}
            rawSheets={rawSheets}
            details={details}
            message={message}
            onRunExtract={onRunExtract}
            onBack={onBack}
            onNext={onNext}
            canNext={canNext}
            nextLabel={nextLabel}
        />
    );
}
