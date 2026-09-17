// resources/js/pages/imports/aip-summary-import/steps/import-outputs-step.tsx
//
// Page-local Import Expected Outputs step (not shared — AIP-only).
// Single-sheet mode: records come from the extract result, offices resolve
// per row (auto-match + manual token mapping + bulk override), outputs
// match PPAs by name within the selected office + fiscal year.

import { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, RotateCcw, X } from 'lucide-react';
import DataTable from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { MultiTableSelect } from '@/components/multi-table-select';
import { TableSelect } from '@/components/table-select';
import { Spinner } from '@/components/ui/spinner';
import { TabsContent } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatAipScheduleShort } from '@/lib/aip-summary-import/extract';
import type { AipSummaryRecord } from '@/lib/aip-summary-import/extract';
import { visibleUnmatched } from '@/lib/aip-summary-import/match-offices';
import type {
    RecordOfficeMatch,
    TokenMapping,
} from '@/lib/aip-summary-import/match-offices';
import { importOfficeColumns } from '../columns';
import type {
    FiscalYear,
    ImportOffice,
    ImportableOutput,
    OutputImportStatus,
    UnmatchedFrequencyEntry,
} from '../types';
import type { Dispatch, SetStateAction } from 'react';

const columnHelper = createColumnHelper<AipSummaryRecord>();

interface ImportOutputsStepProps {
    tabsValue?: string;

    selectedSheet: string;
    existingOffices: ImportOffice[];
    fiscalYears: FiscalYear[];
    selectedOffice: string;
    onOfficeChange: (v: string) => void;
    selectedOfficeLabel: string;
    selectedFiscalYear: string;
    onFiscalYearChange: (v: string) => void;
    selectedFiscalYearLabel: string;

    records: AipSummaryRecord[];
    outputStatuses: Map<string, OutputImportStatus>;
    newOutputs: ImportableOutput[];
    officeMatches: Map<string, RecordOfficeMatch>;
    officeOverrides: Record<string, number[]>;
    setOfficeOverrides: Dispatch<SetStateAction<Record<string, number[]>>>;
    tokenMappings: Record<string, TokenMapping>;
    dismissedTokens: Record<string, string[]>;
    setDismissedTokens: Dispatch<SetStateAction<Record<string, string[]>>>;
    unmatchedFrequency: UnmatchedFrequencyEntry[];
    officeIdsForRecord: (key: string) => number[];
    setTokenMapping: (
        key: string,
        token: string,
        officeId: number | null,
    ) => void;
    resetRowOffices: (key: string) => void;
    officePickerKey: string | null;
    setOfficePickerKey: (k: string | null) => void;
    mappingTarget: { key: string; token: string } | null;
    setMappingTarget: (t: { key: string; token: string } | null) => void;

    importingOutputs: boolean;
    onConfirm: () => void;
    onBack: () => void;
    backLabel?: string;
}

export function ImportOutputsStep({
    tabsValue = 'import-outputs',

    selectedSheet,
    existingOffices,
    fiscalYears,
    selectedOffice,
    onOfficeChange,
    selectedOfficeLabel,
    selectedFiscalYear,
    onFiscalYearChange,
    selectedFiscalYearLabel,

    records,
    outputStatuses,
    newOutputs,
    officeMatches,
    officeOverrides,
    setOfficeOverrides,
    tokenMappings,
    dismissedTokens,
    setDismissedTokens,
    unmatchedFrequency,
    officeIdsForRecord,
    setTokenMapping,
    resetRowOffices,
    officePickerKey,
    setOfficePickerKey,
    mappingTarget,
    setMappingTarget,

    importingOutputs,
    onConfirm,
    onBack,
    backLabel = 'Back: Extract',
}: ImportOutputsStepProps) {
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
            columnHelper.accessor('fullCode', {
                size: 140,
                header: () => <div className="px-1">PPA Code</div>,
                cell: ({ row }) => (
                    <span className="block px-1 font-mono whitespace-nowrap">
                        {row.original.isContinuation
                            ? '—'
                            : row.original.fullCode}
                    </span>
                ),
            }),
            columnHelper.accessor('name', {
                size: 180,
                header: () => <div className="px-1">PPA Name</div>,
                cell: ({ getValue }) => {
                    const value = getValue();

                    return (
                        <span
                            className="block max-w-[20ch] truncate px-1"
                            title={value}
                        >
                            {value}
                        </span>
                    );
                },
            }),
            columnHelper.display({
                id: 'office',
                size: 220,
                header: () => <div className="px-1">Office</div>,
                cell: ({ row }) => {
                    const record = row.original;
                    const match = officeMatches.get(record.key);
                    const mappings = tokenMappings[record.key] ?? {};
                    const dismissed = dismissedTokens[record.key] ?? [];
                    const hasManual =
                        officeOverrides[record.key] !== undefined ||
                        Object.keys(mappings).length > 0 ||
                        dismissed.length > 0;
                    const effectiveIds = officeIdsForRecord(record.key);
                    const effective = existingOffices.filter((o) =>
                        effectiveIds.includes(o.id),
                    );
                    const visible = visibleUnmatched(
                        match,
                        mappings,
                        dismissed,
                    );

                    function setMapping(token: string, value: string | null) {
                        setTokenMapping(
                            record.key,
                            token,
                            value === null || value === '' ? null : Number(value),
                        );
                    }

                    function dismissToken(token: string) {
                        setDismissedTokens((prev) => ({
                            ...prev,
                            [record.key]: [
                                ...(prev[record.key] ?? []),
                                token,
                            ],
                        }));
                    }

                    return (
                        <div className="flex max-w-[40ch] flex-wrap items-center gap-1 px-1">
                            {effective.length === 0 ? (
                                <span className="text-muted-foreground">—</span>
                            ) : (
                                effective.map((o) => (
                                    <Badge
                                        key={o.id}
                                        variant="secondary"
                                        className="text-[10px]"
                                    >
                                        {o.acronym || o.name}
                                    </Badge>
                                ))
                            )}
                            {Object.entries(mappings).map(
                                ([token, officeId]) => {
                                    const office = existingOffices.find(
                                        (o) => o.id === officeId,
                                    );

                                    return (
                                        <span
                                            key={`mapped-${token}`}
                                            className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400"
                                            title={`"${token}" manually mapped to ${office?.acronym || office?.name || 'unknown office'}`}
                                        >
                                            {token} →{' '}
                                            {office?.acronym ||
                                                office?.name ||
                                                '?'}
                                            <button
                                                type="button"
                                                className="cursor-pointer opacity-60 hover:opacity-100"
                                                onClick={() =>
                                                    setMapping(token, null)
                                                }
                                                title={`Unmap "${token}"`}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    );
                                },
                            )}
                            {visible.map((token) => (
                                <span
                                    key={token}
                                    className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400"
                                    title={`No office matches "${token}" — map it or remove it`}
                                >
                                    {token} ?
                                    <button
                                        type="button"
                                        className="cursor-pointer rounded px-0.5 font-semibold underline decoration-dotted underline-offset-2 opacity-70 hover:opacity-100"
                                        onClick={() =>
                                            setMappingTarget({
                                                key: record.key,
                                                token,
                                            })
                                        }
                                        title={`Map "${token}" to an office`}
                                    >
                                        Map
                                    </button>
                                    <button
                                        type="button"
                                        className="cursor-pointer opacity-60 hover:opacity-100"
                                        onClick={() => dismissToken(token)}
                                        title={`Remove "${token}" from the unresolved list`}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => setOfficePickerKey(record.key)}
                                title="Add or remove offices for this output (bulk, resolves nothing)"
                            >
                                <Pencil />
                            </Button>
                            {hasManual && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => resetRowOffices(record.key)}
                                    title="Reset row to auto-matched offices"
                                >
                                    <RotateCcw />
                                </Button>
                            )}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('startDate', {
                size: 90,
                header: () => <div className="px-1">Start Date</div>,
                cell: ({ getValue }) => (
                    <span className="block whitespace-nowrap px-1">
                        {formatAipScheduleShort(getValue()) ?? '—'}
                    </span>
                ),
            }),
            columnHelper.accessor('endDate', {
                size: 90,
                header: () => <div className="px-1">Completion Date</div>,
                cell: ({ getValue }) => (
                    <span className="block whitespace-nowrap px-1">
                        {formatAipScheduleShort(getValue()) ?? '—'}
                    </span>
                ),
            }),
            columnHelper.accessor('expectedOutput', {
                size: 220,
                header: () => <div className="px-1">Expected Output</div>,
                cell: ({ getValue }) => {
                    const value = getValue() ?? '—';

                    return (
                        <span
                            className="block max-w-[32ch] truncate px-1"
                            title={value}
                        >
                            {value}
                        </span>
                    );
                },
            }),
            columnHelper.display({
                id: 'status',
                size: 100,
                header: () => <div className="px-1">Status</div>,
                cell: ({ row }) => {
                    const status = outputStatuses.get(row.original.key);

                    if (status === 'exists') {
                        return (
                            <span className="px-1 font-medium text-green-600">
                                Exists
                            </span>
                        );
                    }

                    if (status === 'no-ppa') {
                        return (
                            <span
                                className="px-1 font-medium text-amber-600"
                                title="No PPA with this ref code in the selected office + fiscal year"
                            >
                                No PPA
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

                    if (status === 'no-offices') {
                        return (
                            <span
                                className="px-1 font-medium text-amber-600"
                                title="No offices resolved — imports without offices; attach them later via edit"
                            >
                                No offices
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
            existingOffices,
            officeMatches,
            tokenMappings,
            dismissedTokens,
            officeOverrides,
            officeIdsForRecord,
            setTokenMapping,
            setDismissedTokens,
            setOfficePickerKey,
            setMappingTarget,
            resetRowOffices,
            outputStatuses,
        ],
    );

    const withOutput = records.filter((r) => r.expectedOutput).length;
    const existsCount = [...outputStatuses.values()].filter(
        (st) => st === 'exists',
    ).length;
    const unresolvedCount = records.filter(
        (r) => officeIdsForRecord(r.key).length === 0,
    ).length;

    return (
        <TabsContent value={tabsValue} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold tracking-tight">
                    Import Expected Outputs
                </h2>
                <p className="text-muted-foreground text-sm">
                    Review expected outputs extracted from sheet “
                    {selectedSheet}” — office, start date, completion date, and
                    expected output.
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
                        Outputs will be imported under this office.
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
                        Outputs will be imported for this fiscal year.
                    </FieldDescription>
                </Field>
            </div>

            {selectedOffice && selectedFiscalYear ? (
                <>
                    <div className="flex flex-wrap items-center gap-3 rounded-md border p-3 text-sm">
                        <div>
                            <span className="text-muted-foreground">
                                Total rows:
                            </span>{' '}
                            <span className="font-medium">{records.length}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                With expected output:
                            </span>{' '}
                            <span className="font-medium text-blue-600">
                                {withOutput}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Missing output:
                            </span>{' '}
                            <span className="font-medium text-amber-600">
                                {records.length - withOutput}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">New:</span>{' '}
                            <span className="font-medium text-blue-600">
                                {newOutputs.length}
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
                                Unresolved offices:
                            </span>{' '}
                            <span className="font-medium text-amber-600">
                                {unresolvedCount}
                            </span>
                        </div>
                    </div>

                    {unmatchedFrequency.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-900 dark:bg-amber-950">
                            <span className="text-muted-foreground font-medium">
                                Unmatched office tokens (strict normalized match
                                — candidates for loosening):
                            </span>
                            {unmatchedFrequency.map((entry) => (
                                <Badge
                                    key={entry.token}
                                    variant="outline"
                                    className="border-amber-300 text-amber-700 dark:text-amber-400"
                                    title={`${entry.count} row(s)`}
                                >
                                    {entry.token} ×{entry.count}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {records.length > 0 && (
                        <DataTable
                            data={records}
                            columns={columns}
                            withColgroup
                            className="h-[480px]"
                        />
                    )}
                </>
            ) : (
                <div className="text-muted-foreground text-sm">
                    Please select a target office and fiscal year to review the
                    extracted outputs.
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
                            newOutputs.length === 0 ||
                            importingOutputs
                        }
                    >
                        {importingOutputs && <Spinner />}
                        Confirm &amp; Import {newOutputs.length} Output
                        {newOutputs.length === 1 ? '' : 's'}
                    </Button>
                    <p className="text-muted-foreground text-xs">
                        Matched by PPA name — any row with office, schedule, or
                        output imports (offices attach later when unresolved).
                    </p>
                </div>
            </div>

            <MultiTableSelect<ImportOffice>
                data={existingOffices}
                columns={importOfficeColumns}
                open={officePickerKey !== null}
                onOpenChange={(open) => {
                    if (!open) setOfficePickerKey(null);
                }}
                selectedValues={
                    officePickerKey
                        ? officeIdsForRecord(officePickerKey).map(String)
                        : []
                }
                valueKey="id"
                title="Offices for this output"
                description="Select one or more implementing offices. Overrides the auto-matched offices for this row only."
                className="sm:max-w-[30rem]"
                onConfirm={(selected) => {
                    const key = officePickerKey;
                    setOfficePickerKey(null);

                    if (key) {
                        setOfficeOverrides((prev) => ({
                            ...prev,
                            [key]: selected.map((o) => o.id),
                        }));
                    }
                }}
            />

            <TableSelect<ImportOffice>
                data={existingOffices}
                columns={importOfficeColumns}
                open={mappingTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setMappingTarget(null);
                }}
                onRowSelect={(row) => {
                    if (mappingTarget) {
                        setTokenMapping(
                            mappingTarget.key,
                            mappingTarget.token,
                            row.id,
                        );
                    }
                }}
                value={
                    mappingTarget
                        ? (() => {
                              const mapped =
                                  tokenMappings[mappingTarget.key]?.[
                                      mappingTarget.token
                                  ];

                              return mapped === undefined
                                  ? undefined
                                  : String(mapped);
                          })()
                        : undefined
                }
                valueKey="id"
                title={
                    mappingTarget
                        ? `Map "${mappingTarget.token}" to an office`
                        : 'Map office'
                }
                description="Click a row to map this token to that office."
                className="sm:max-w-[30rem]"
            />
        </TabsContent>
    );
}
