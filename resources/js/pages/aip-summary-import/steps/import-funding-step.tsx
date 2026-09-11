// resources/js/pages/aip-summary-import/steps/import-funding-step.tsx

import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { TableSelect } from '@/components/table-select';
import { TabsContent } from '@/components/ui/tabs';
import { importFundColumns } from '../columns';
import type { AipImportState, ImportFund } from '../types';

export function ImportFundingStep({ s }: { s: AipImportState }) {
    const {
        selectedSheet,
        selectedOffice,
        selectedFiscalYear,
        extractResult,
        fundingSources,
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
        handleConfirmFunds,
        importingFunds,
        setStep,
    } = s;

    return (
        <TabsContent
            value="import-funding"
            className="mt-4 flex flex-col gap-4"
        >
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

            {selectedOffice && selectedFiscalYear ? (
                <>
                    <div className="flex flex-wrap items-center gap-3 rounded-md border p-3 text-sm">
                        <div>
                            <span className="text-muted-foreground">
                                Rows with fund:
                            </span>{' '}
                            <span className="font-medium">
                                {extractResult?.records.filter(
                                    (r) => r.fundingSource != null,
                                ).length ?? 0}
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
                                {
                                    importableFunds.filter(
                                        (r) =>
                                            fundStatuses.get(r.key) ===
                                            'exists',
                                    ).length
                                }
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
                                    className="border-amber-300 text-amber-700 dark:text-amber-400"
                                    title={`${entry.count} row(s)`}
                                >
                                    {entry.token} ×{entry.count}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {(extractResult?.records.length ?? 0) > 0 && (
                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-muted/50 text-muted-foreground border-b">
                                        <th className="px-3 py-2 font-medium">
                                            Row
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            PPA / Output
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Fund
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Climate
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {extractResult?.records.map((record) => {
                                        const match = fundMatches.get(
                                            record.key,
                                        );
                                        const override =
                                            fundOverrides[record.key];
                                        const dismissed =
                                            !!dismissedFunds[record.key];
                                        const effectiveId = fundIdForRecord(
                                            record.key,
                                        );
                                        const effective =
                                            effectiveId == null
                                                ? null
                                                : (fundingSources.find(
                                                      (f) =>
                                                          f.id === effectiveId,
                                                  ) ?? null);

                                        return (
                                            <tr
                                                key={record.key}
                                                className="border-b last:border-0"
                                            >
                                                <td className="px-3 py-2 font-mono whitespace-nowrap">
                                                    {record.row}
                                                    {record.isContinuation && (
                                                        <span
                                                            className="text-muted-foreground ml-1"
                                                            title={`Continuation of row ${record.blockRow}`}
                                                        >
                                                            ↳
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="max-w-[28ch] px-3 py-2">
                                                    <div className="truncate font-medium">
                                                        {record.name}
                                                    </div>
                                                    <div className="text-muted-foreground truncate">
                                                        {record.expectedOutput ??
                                                            '—'}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2">
                                                    {record.fundingSource ==
                                                    null ? (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    ) : dismissed ? (
                                                        <span className="text-muted-foreground italic">
                                                            dismissed
                                                        </span>
                                                    ) : (
                                                        <div className="flex max-w-[30ch] flex-wrap items-center gap-1">
                                                            {override !==
                                                            undefined ? (
                                                                <span
                                                                    className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400"
                                                                    title={`"${record.fundingSource}" manually mapped to ${effective?.code ?? 'unknown fund'}`}
                                                                >
                                                                    {
                                                                        record.fundingSource
                                                                    }{' '}
                                                                    →{' '}
                                                                    {effective?.code ??
                                                                        '?'}
                                                                    <button
                                                                        type="button"
                                                                        className="cursor-pointer opacity-60 hover:opacity-100"
                                                                        onClick={() =>
                                                                            setFundOverrides(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const next =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete next[
                                                                                        record
                                                                                            .key
                                                                                    ];

                                                                                    return next;
                                                                                },
                                                                            )
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
                                                                    {
                                                                        match
                                                                            .fund
                                                                            .code
                                                                    }
                                                                </Badge>
                                                            ) : (
                                                                <span
                                                                    className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400"
                                                                    title={`No funding source matches "${record.fundingSource}" — map it or remove it`}
                                                                >
                                                                    {
                                                                        record.fundingSource
                                                                    }{' '}
                                                                    ?
                                                                    <button
                                                                        type="button"
                                                                        className="cursor-pointer rounded px-0.5 font-semibold underline decoration-dotted underline-offset-2 opacity-70 hover:opacity-100"
                                                                        onClick={() =>
                                                                            setFundPickerKey(
                                                                                record.key,
                                                                            )
                                                                        }
                                                                        title={`Map "${record.fundingSource}" to a funding source`}
                                                                    >
                                                                        Map
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="cursor-pointer opacity-60 hover:opacity-100"
                                                                        onClick={() =>
                                                                            setDismissedFunds(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [record.key]: true,
                                                                                }),
                                                                            )
                                                                        }
                                                                        title="Remove this row from the fund import"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    {record.adaptation ?? '—'} /{' '}
                                                    {record.mitigation ?? '—'} /{' '}
                                                    {match?.typology ? (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px]"
                                                        >
                                                            {
                                                                match.typology
                                                                    .code
                                                            }
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            {record.typology ??
                                                                '—'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    {(() => {
                                                        const status =
                                                            fundStatuses.get(
                                                                record.key,
                                                            );

                                                        if (
                                                            status === 'exists'
                                                        ) {
                                                            return (
                                                                <span className="font-medium text-green-600">
                                                                    Exists
                                                                </span>
                                                            );
                                                        }

                                                        if (
                                                            status ===
                                                            'no-output'
                                                        ) {
                                                            return record.fundingSource ==
                                                                null ||
                                                                dismissedFunds[
                                                                    record.key
                                                                ] ? (
                                                                <span className="text-muted-foreground">
                                                                    —
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    className="font-medium text-amber-600"
                                                                    title="No matching PPA output yet — import expected outputs first"
                                                                >
                                                                    No output
                                                                </span>
                                                            );
                                                        }

                                                        if (status === 'new') {
                                                            return (
                                                                <span className="font-medium text-blue-600">
                                                                    New
                                                                </span>
                                                            );
                                                        }

                                                        return (
                                                            <span className="text-muted-foreground">
                                                                —
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-muted-foreground text-sm">
                    Please select a target office and fiscal year to review the
                    extracted fund links.
                </div>
            )}

            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setStep('extract')}>
                    Back: Extract
                </Button>
                <div className="flex flex-col items-end gap-1">
                    <Button
                        onClick={handleConfirmFunds}
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
        </TabsContent>
    );
}
