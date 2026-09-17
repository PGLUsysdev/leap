// resources/js/pages/imports/aip-summary-import/steps/import-funding-step.tsx
//
// Page-local Import Funding Source step (not shared — AIP-only).
// Single-sheet mode: records come from the extract result, funds resolve
// per row (auto-match + manual override + dismiss), links match PPA outputs
// within the selected office + fiscal year.

import { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { X } from 'lucide-react';
import DataTable from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { TableSelect } from '@/components/table-select';
import { TabsContent } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { AipSummaryRecord } from '@/lib/aip-summary-import/extract';
import type { RecordFundMatch } from '@/lib/aip-summary-import/match-funds';
import { normalizeCode } from '@/lib/aip-summary-import/match-funds';
import { importFundColumns } from '../columns';
import type {
    FiscalYear,
    FundLinkStatus,
    ImportableFundLink,
    ImportFund,
    ImportOffice,
    UnmatchedFrequencyEntry,
} from '../types';
import type { Dispatch, SetStateAction } from 'react';

const columnHelper = createColumnHelper<AipSummaryRecord>();

interface ImportFundingStepProps {
    tabsValue?: string;

    selectedSheet: string;
    selectedOffice: string;
    selectedFiscalYear: string;
    existingOffices: ImportOffice[];
    fiscalYears: FiscalYear[];
    selectedOfficeLabel: string;
    selectedFiscalYearLabel: string;
    onOfficeChange: (v: string) => void;
    onFiscalYearChange: (v: string) => void;
    fundingSources: ImportFund[];
    records: AipSummaryRecord[];
    fundMatches: Map<string, RecordFundMatch>;
    fundOverrides: Record<string, number>;
    setFundOverrides: Dispatch<SetStateAction<Record<string, number>>>;
    dismissedFunds: Record<string, boolean>;
    setDismissedFunds: Dispatch<SetStateAction<Record<string, boolean>>>;
    importableFunds: ImportableFundLink[];
    fundStatuses: Map<string, FundLinkStatus>;
    newFunds: ImportableFundLink[];
    unmatchedFundEntries: UnmatchedFrequencyEntry[];
    fundIdForRecord: (key: string) => number | null;
    fundPickerKey: string | null;
    setFundPickerKey: (k: string | null) => void;
    bulkFundToken: string | null;
    setBulkFundToken: (t: string | null) => void;
    onBulkConfirm: (fundId: number) => void;

    importingFunds: boolean;
    onConfirm: () => void;
    onBack: () => void;
    backLabel?: string;
}

export function ImportFundingStep({
    tabsValue = 'import-funding',

    selectedSheet,
    selectedOffice,
    selectedFiscalYear,
    existingOffices,
    fiscalYears,
    selectedOfficeLabel,
    selectedFiscalYearLabel,
    onOfficeChange,
    onFiscalYearChange,
    fundingSources,
    records,
    fundMatches,
    fundOverrides,
    setFundOverrides,
    dismissedFunds,
    setDismissedFunds,
    importableFunds,
    fundStatuses,
    newFunds,
    unmatchedFundEntries,
    fundIdForRecord,
    fundPickerKey,
    setFundPickerKey,
    bulkFundToken,
    setBulkFundToken,
    onBulkConfirm,

    importingFunds,
    onConfirm,
    onBack,
    backLabel = 'Back: Extract',
}: ImportFundingStepProps) {
    const columns = useMemo(
        () => [
            columnHelper.accessor('row', {
                size: 70,
                header: () => <div className="px-1">Row</div>,
                cell: ({ row }) => (
                    <span className="px-1 font-mono whitespace-nowrap">
                        {row.original.row}
                        {row.original.isContinuation && (
                            <span
                                className="text-muted-foreground ml-1"
                                title={`Continuation of row ${row.original.blockRow}`}
                            >
                                ↳
                            </span>
                        )}
                    </span>
                ),
            }),
            columnHelper.display({
                id: 'ppa-output',
                size: 220,
                header: () => <div className="px-1">PPA / Output</div>,
                cell: ({ row }) => {
                    const record = row.original;

                    return (
                        <div className="max-w-[28ch] px-1">
                            <div
                                className="truncate font-medium"
                                title={record.name}
                            >
                                {record.name}
                            </div>
                            <div
                                className="text-muted-foreground truncate"
                                title={record.expectedOutput ?? '—'}
                            >
                                {record.expectedOutput ?? '—'}
                            </div>
                        </div>
                    );
                },
            }),
            columnHelper.display({
                id: 'fund',
                size: 200,
                header: () => <div className="px-1">Fund</div>,
                cell: ({ row }) => {
                    const record = row.original;
                    const match = fundMatches.get(record.key);
                    const override = fundOverrides[record.key];
                    const dismissed = !!dismissedFunds[record.key];
                    const effectiveId = fundIdForRecord(record.key);
                    const effective =
                        effectiveId == null
                            ? null
                            : (fundingSources.find(
                                  (f) => f.id === effectiveId,
                              ) ?? null);

                    if (record.fundingSource == null) {
                        return (
                            <span className="text-muted-foreground px-1">
                                —
                            </span>
                        );
                    }

                    if (dismissed) {
                        return (
                            <span className="text-muted-foreground px-1 italic">
                                dismissed
                            </span>
                        );
                    }

                    return (
                        <div className="flex max-w-[30ch] flex-wrap items-center gap-1 px-1">
                            {override !== undefined ? (
                                <span
                                    className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400"
                                    title={`"${record.fundingSource}" manually mapped to ${effective?.code ?? 'unknown fund'}`}
                                >
                                    {record.fundingSource} →{' '}
                                    {effective?.code ?? '?'}
                                    <button
                                        type="button"
                                        className="cursor-pointer opacity-60 hover:opacity-100"
                                        onClick={() =>
                                            setFundOverrides((prev) => {
                                                const next = { ...prev };
                                                delete next[record.key];

                                                return next;
                                            })
                                        }
                                        title={`Unmap "${record.fundingSource}"`}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ) : match?.fund ? (
                                <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                >
                                    {match.fund.code}
                                </Badge>
                            ) : (
                                <span
                                    className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400"
                                    title={`No funding source matches "${record.fundingSource}" — map it or remove it`}
                                >
                                    {record.fundingSource} ?
                                    <button
                                        type="button"
                                        className="cursor-pointer rounded px-0.5 font-semibold underline decoration-dotted underline-offset-2 opacity-70 hover:opacity-100"
                                        onClick={() =>
                                            setFundPickerKey(record.key)
                                        }
                                        title={`Map "${record.fundingSource}" to a funding source`}
                                    >
                                        Map
                                    </button>
                                    <button
                                        type="button"
                                        className="cursor-pointer opacity-60 hover:opacity-100"
                                        onClick={() =>
                                            setDismissedFunds((prev) => ({
                                                ...prev,
                                                [record.key]: true,
                                            }))
                                        }
                                        title="Remove this row from the fund import"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('adaptation', {
                size: 90,
                header: () => <div className="px-1">Adapt.</div>,
                cell: ({ getValue }) => (
                    <span className="block whitespace-nowrap px-1">
                        {getValue() ?? '—'}
                    </span>
                ),
            }),
            columnHelper.accessor('mitigation', {
                size: 90,
                header: () => <div className="px-1">Mitig.</div>,
                cell: ({ getValue }) => (
                    <span className="block whitespace-nowrap px-1">
                        {getValue() ?? '—'}
                    </span>
                ),
            }),
            columnHelper.display({
                id: 'typology',
                size: 100,
                header: () => <div className="px-1">Typology</div>,
                cell: ({ row }) => {
                    const record = row.original;
                    const match = fundMatches.get(record.key);

                    return (
                        <span className="block whitespace-nowrap px-1">
                            {match?.typology ? (
                                <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                >
                                    {match.typology.code}
                                </Badge>
                            ) : (
                                <span className="text-muted-foreground">
                                    {record.typology ?? '—'}
                                </span>
                            )}
                        </span>
                    );
                },
            }),
            columnHelper.display({
                id: 'status',
                size: 100,
                header: () => <div className="px-1">Status</div>,
                cell: ({ row }) => {
                    const record = row.original;
                    const status = fundStatuses.get(record.key);

                    if (status === 'exists') {
                        return (
                            <span className="px-1 font-medium text-green-600">
                                Exists
                            </span>
                        );
                    }

                    if (status === 'no-output') {
                        return record.fundingSource == null ||
                            dismissedFunds[record.key] ? (
                            <span className="text-muted-foreground px-1">
                                —
                            </span>
                        ) : (
                            <span
                                className="px-1 font-medium text-amber-600"
                                title="No matching PPA output yet — import expected outputs first"
                            >
                                No output
                            </span>
                        );
                    }

                    if (status === 'new') {
                        return (
                            <span className="px-1 font-medium text-blue-600">
                                New
                            </span>
                        );
                    }

                    return (
                        <span className="text-muted-foreground px-1">—</span>
                    );
                },
            }),
        ],
        [
            fundingSources,
            fundMatches,
            fundOverrides,
            dismissedFunds,
            fundIdForRecord,
            fundStatuses,
            setFundOverrides,
            setDismissedFunds,
            setFundPickerKey,
        ],
    );

    const existsCount = importableFunds.filter(
        (r) => fundStatuses.get(r.key) === 'exists',
    ).length;
    const emptyCount = records.filter(
        (r) => r.fundingSource == null,
    ).length;
    const [hideEmpty, setHideEmpty] = useState(false);
    const visibleRecords = useMemo(
        () =>
            hideEmpty
                ? records.filter((r) => r.fundingSource != null)
                : records,
        [records, hideEmpty],
    );

    return (
        <TabsContent value={tabsValue} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold tracking-tight">
                    Import Funding Source
                </h2>
                <p className="text-muted-foreground text-sm">
                    Review fund links extracted from sheet “{selectedSheet}” —
                    funding source plus climate (adaptation / mitigation /
                    typology). Peso amounts stay zero.
                </p>
            </div>

            <div className="flex flex-wrap gap-4">
                <Field>
                    <FieldLabel>Target Office</FieldLabel>
                    <Select
                        value={selectedOffice}
                        onValueChange={(v) => onOfficeChange(v ?? '')}
                    >
                        <SelectTrigger className="w-[200px]">
                            {selectedOfficeLabel ? (
                                <span className="flex flex-1 text-left">
                                    {selectedOfficeLabel}
                                </span>
                            ) : (
                                <SelectValue placeholder="Select an office" />
                            )}
                        </SelectTrigger>
                        <SelectContent>
                            {existingOffices.map((office) => (
                                <SelectItem
                                    key={office.id}
                                    value={office.id.toString()}
                                >
                                    {office.acronym || office.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FieldDescription>
                        Fund links will be imported under this office.
                    </FieldDescription>
                </Field>

                <Field>
                    <FieldLabel>Fiscal Year</FieldLabel>
                    <Select
                        value={selectedFiscalYear}
                        onValueChange={(v) => onFiscalYearChange(v ?? '')}
                    >
                        <SelectTrigger className="w-[160px]">
                            {selectedFiscalYearLabel ? (
                                <span className="flex flex-1 text-left">
                                    {selectedFiscalYearLabel}
                                </span>
                            ) : (
                                <SelectValue placeholder="Select a year" />
                            )}
                        </SelectTrigger>
                        <SelectContent>
                            {fiscalYears.map((fy) => (
                                <SelectItem
                                    key={fy.id}
                                    value={fy.id.toString()}
                                >
                                    {fy.year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FieldDescription>
                        Fund links will be imported for this fiscal year.
                    </FieldDescription>
                </Field>
            </div>

            {selectedOffice && selectedFiscalYear ? (
                <>
                    <div className="flex flex-wrap items-center gap-3 rounded-md border p-3 text-sm">
                        <div>
                            <span className="text-muted-foreground">
                                Rows with fund:
                            </span>{' '}
                            <span className="font-medium">
                                {
                                    records.filter(
                                        (r) => r.fundingSource != null,
                                    ).length
                                }
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Importable:
                            </span>{' '}
                            <span className="font-medium text-blue-600">
                                {importableFunds.length}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">New:</span>{' '}
                            <span className="font-medium text-blue-600">
                                {newFunds.length}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Exists:
                            </span>{' '}
                            <span className="font-medium text-green-600">
                                {existsCount}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Unresolved fund:
                            </span>{' '}
                            <span className="font-medium text-amber-600">
                                {unmatchedFundEntries.length}
                            </span>
                        </div>
                    </div>

                    {unmatchedFundEntries.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-900 dark:bg-amber-950">
                            <span className="text-muted-foreground font-medium">
                                Unmatched fund tokens (strict normalized match —
                                candidates for loosening):
                            </span>
                            {unmatchedFundEntries.map((entry) => (
                                <Badge
                                    key={entry.token}
                                    variant="outline"
                                    className="inline-flex items-center gap-1 border-amber-300 text-amber-700 dark:text-amber-400"
                                    title={`${entry.count} row(s)`}
                                >
                                    {entry.token} ×{entry.count}
                                    <button
                                        type="button"
                                        className="cursor-pointer rounded px-0.5 font-semibold underline decoration-dotted underline-offset-2 opacity-70 hover:opacity-100"
                                        onClick={() =>
                                            setBulkFundToken(entry.token)
                                        }
                                        title={`Map all ${entry.count} "${entry.token}" rows at once`}
                                    >
                                        Map all
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    {records.length > 0 && (
                        <>
                            {emptyCount > 0 && (
                                <div className="flex items-center gap-3">
                                    <Switch
                                        id="fund-hide-empty"
                                        size="sm"
                                        checked={hideEmpty}
                                        onCheckedChange={setHideEmpty}
                                    />
                                    <Label htmlFor="fund-hide-empty">
                                        Hide rows without fund ({emptyCount})
                                    </Label>
                                </div>
                            )}
                            <DataTable
                                data={visibleRecords}
                                columns={columns}
                                withColgroup
                                className="h-[420px]"
                            />
                        </>
                    )}
                </>
            ) : (
                <div className="text-muted-foreground text-sm">
                    Please select a target office and fiscal year to review the
                    extracted fund links.
                </div>
            )}

            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={onBack}>
                    {backLabel}
                </Button>
                <div className="flex flex-col items-end gap-1">
                    <Button
                        onClick={onConfirm}
                        disabled={
                            !selectedOffice ||
                            !selectedFiscalYear ||
                            newFunds.length === 0 ||
                            importingFunds
                        }
                    >
                        {importingFunds && <Spinner />}
                        Confirm &amp; Import {newFunds.length} Fund Link
                        {newFunds.length === 1 ? '' : 's'}
                    </Button>
                    <p className="text-muted-foreground text-xs">
                        Links + climate only — peso amounts stay zero.
                    </p>
                </div>
            </div>

            <TableSelect<ImportFund>
                data={fundingSources}
                columns={importFundColumns}
                open={fundPickerKey !== null}
                onOpenChange={(open) => {
                    if (!open) setFundPickerKey(null);
                }}
                onRowSelect={(row) => {
                    if (fundPickerKey) {
                        setFundOverrides((prev) => ({
                            ...prev,
                            [fundPickerKey]: row.id,
                        }));
                    }
                }}
                value={
                    fundPickerKey && fundOverrides[fundPickerKey] !== undefined
                        ? String(fundOverrides[fundPickerKey])
                        : undefined
                }
                valueKey="id"
                title="Map fund to a funding source"
                description="Click a row to map this token to that funding source."
                className="sm:max-w-[30rem]"
            />

            <TableSelect<ImportFund>
                data={fundingSources}
                columns={importFundColumns}
                open={bulkFundToken !== null}
                onOpenChange={(open) => {
                    if (!open) setBulkFundToken(null);
                }}
                onRowSelect={(row) => onBulkConfirm(row.id)}
                value={undefined}
                valueKey="id"
                title={
                    bulkFundToken
                        ? `Bulk map "${bulkFundToken}"`
                        : 'Bulk map fund'
                }
                description={
                    bulkFundToken
                        ? `Applies to ${records.filter(
                              (r) =>
                                  r.fundingSource != null &&
                                  normalizeCode(r.fundingSource) ===
                                      normalizeCode(bulkFundToken),
                          ).length} row(s) sharing this token. Rows already mapped or dismissed are skipped.`
                        : 'Click a row to map every matching token at once.'
                }
                className="sm:max-w-[30rem]"
            />
        </TabsContent>
    );
}
