// resources/js/components/imports/import-extract-step.tsx
//
// Shared Extract step — raw 1:1 row×col dump, no formatting.
// Single-sheet: one `sheet`, one raw grid, no per-sheet iteration.

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import DataTable from '@/components/data-table';
import type { RawSheet } from '@/lib/raw-extract';
import type { RawPpmpItem } from '@/lib/ppmp/extract';
import { normalize } from '@/lib/ppmp/normalize';

type RawGridRow = RawSheet['rows'][number];

interface ImportExtractStepProps {
    /** The sheet being extracted, or null if none selected. */
    sheet: string | null;
    canExtract: boolean;
    hasAnyVerify?: boolean;
    allVerifyValid?: boolean;
    /** PPMP raw items aggregated from the current sheet (legacy fallback). */
    ppmpItems?: RawPpmpItem[];
    /** Raw 1:1 sheet data — preferred for the pure raw view. */
    rawSheets?: Record<string, RawSheet>;
    onRunExtract: () => void;
    onBack: () => void;
    onNext: () => void;
    canNext?: boolean;
    nextLabel?: string;
    backLabel?: string;
}

export function ImportExtractStep({
    sheet,
    canExtract,
    hasAnyVerify,
    allVerifyValid,
    ppmpItems = [],
    rawSheets,
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

    const isCellEmpty = (v: string | null) =>
        v == null || String(v).trim() === '';
    const isCellFalsy = (v: string | null) => {
        if (isCellEmpty(v)) return true;
        const n = normalize(String(v));
        return n === '-' || n === '—' || n === '0' || n === '0.00';
    };
    const isRowFalsy = (r: { cells: Record<string, string | null> }) =>
        Object.values(r.cells).every(isCellFalsy);

    const showQtyTotal = ppmpItems.some((it) => it.qtys);
    const itemColumns: ColumnDef<RawPpmpItem>[] = [
        {
            id: 'sheet',
            header: 'Sheet',
            size: 120,
            cell: ({ row }) => (
                <div className="px-1 font-mono whitespace-nowrap">
                    {row.original.sheet}
                </div>
            ),
        },
        {
            id: 'row',
            header: 'Row',
            size: 64,
            cell: ({ row }) => (
                <div className="px-1 font-mono">{row.original.row}</div>
            ),
        },
        {
            id: 'section',
            header: 'Section',
            size: 110,
            cell: ({ row }) => (
                <div className="px-1 whitespace-nowrap">
                    {row.original.section}
                </div>
            ),
        },
        {
            id: 'category',
            header: 'Category',
            size: 160,
            cell: ({ row }) => (
                <div
                    className="max-w-[14ch] truncate px-1"
                    title={row.original.category}
                >
                    {row.original.category}
                </div>
            ),
        },
        {
            id: 'coa',
            header: 'COA',
            size: 160,
            cell: ({ row }) => (
                <div
                    className="max-w-[14ch] truncate px-1 font-mono"
                    title={row.original.coa}
                >
                    {row.original.coa}
                </div>
            ),
        },
        {
            id: 'description',
            header: 'Description',
            size: 220,
            cell: ({ row }) => (
                <div
                    className="max-w-[24ch] truncate px-1"
                    title={row.original.description}
                >
                    {row.original.description}
                </div>
            ),
        },
        {
            id: 'unit',
            header: 'Unit',
            size: 90,
            cell: ({ row }) => (
                <div className="px-1 whitespace-nowrap">
                    {row.original.unit || '—'}
                </div>
            ),
        },
        {
            id: 'price',
            header: 'Price',
            size: 110,
            cell: ({ row }) => (
                <div className="px-1 whitespace-nowrap">
                    {row.original.price != null
                        ? `₱${row.original.price.toLocaleString()}`
                        : '—'}
                </div>
            ),
        },
        ...(showQtyTotal
            ? [
                  {
                      id: 'qtyTotal',
                      header: 'Qty total',
                      size: 90,
                      cell: ({ row }: { row: { original: RawPpmpItem } }) => (
                          <div className="px-1 text-right">
                              {row.original.monthTotal ?? '—'}
                          </div>
                      ),
                  } as ColumnDef<RawPpmpItem>,
              ]
            : []),
    ];

    return (
        <TabsContent value="extract" className="mt-4 flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
                Raw 1:1 extraction{sheet ? ` — sheet ${sheet}` : ''}, strict
                verify required before extract. Shows every row × every column
                as in Excel, no formatting.
            </p>

            {!canExtract ? (
                <div className="text-muted-foreground rounded-lg border p-8 text-center text-sm">
                    {hasAnyVerify
                        ? 'Verification failed — fix verify errors to enable extract.'
                        : 'Verify format first (must be valid) to enable extraction.'}
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-2">
                        <Button onClick={onRunExtract} disabled={!sheet}>
                            Extract Raw 1:1
                        </Button>
                        {hasRawSheets ? (
                            <span className="text-muted-foreground text-sm">
                                {Object.values(rawSheets!).reduce(
                                    (sum, sh) => sum + sh.rows.length,
                                    0,
                                )}{' '}
                                rows ×{' '}
                                {Object.values(rawSheets!)[0]?.columnCount ?? 0}{' '}
                                cols
                            </span>
                        ) : ppmpCount > 0 ? (
                            <span className="text-muted-foreground text-sm">
                                Raw {ppmpCount} item rows
                            </span>
                        ) : null}
                    </div>

                    {hasRawSheets && (
                        <div className="flex items-center gap-2">
                            <Switch
                                id="hide-empty-rows"
                                checked={hideEmptyRows}
                                onCheckedChange={setHideEmptyRows}
                            />
                            <Label
                                htmlFor="hide-empty-rows"
                                className="text-xs"
                            >
                                Hide fully empty / falsy rows
                            </Label>
                            <span className="text-muted-foreground text-xs">
                                {hideEmptyRows ? '(hidden)' : '(shown)'} —
                                respects calibration cols, rows from headerRow
                            </span>
                        </div>
                    )}

                    {hasRawSheets &&
                        Object.entries(rawSheets!).map(([sheetName, raw]) => {
                            const filteredRows = hideEmptyRows
                                ? raw.rows.filter((r) => !isRowFalsy(r))
                                : raw.rows;
                            const hiddenCount =
                                raw.rows.length - filteredRows.length;
                            const rawGridColumns: ColumnDef<RawGridRow>[] = [
                                {
                                    id: 'row',
                                    header: 'Row',
                                    size: 64,
                                    cell: ({ row }) => (
                                        <div className="px-1 font-mono text-xs">
                                            {row.original.rowNumber}
                                        </div>
                                    ),
                                },
                                ...raw.columnLetters.map(
                                    (col): ColumnDef<RawGridRow> => ({
                                        id: col,
                                        header: col,
                                        size: 140,
                                        cell: ({ row }) => {
                                            const v = row.original.cells[col];

                                            return (
                                                <div
                                                    className="max-w-[18ch] truncate px-1 whitespace-nowrap"
                                                    title={v ?? ''}
                                                >
                                                    {v ?? '—'}
                                                </div>
                                            );
                                        },
                                    }),
                                ),
                            ];

                            return (
                                <div
                                    key={sheetName}
                                    className="flex flex-col gap-2"
                                >
                                    <div className="bg-muted/30 flex items-center justify-between rounded-md border px-3 py-2 text-xs font-medium">
                                        <span>
                                            Sheet: {sheetName} — {raw.rowCount}{' '}
                                            rows × {raw.columnCount} cols
                                            {hideEmptyRows &&
                                                hiddenCount > 0 &&
                                                ` · ${hiddenCount} empty/falsy hidden`}
                                        </span>
                                        <span className="text-muted-foreground font-normal">
                                            Showing {filteredRows.length} of{' '}
                                            {raw.rows.length} rows
                                        </span>
                                    </div>
                                    <DataTable
                                        data={filteredRows}
                                        columns={rawGridColumns}
                                        withColgroup
                                        className="h-[420px]"
                                    />
                                </div>
                            );
                        })}

                    {/* Legacy formatted items fallback (if rawSheets not yet wired) */}
                    {!hasRawSheets && ppmpItems.length > 0 && (
                        <DataTable
                            data={ppmpItems}
                            columns={itemColumns}
                            withColgroup
                            className="h-[420px]"
                        />
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
