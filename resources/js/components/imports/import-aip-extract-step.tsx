// resources/js/components/imports/import-aip-extract-step.tsx
//
// Shared extract step for the AIP Summary family. Single-sheet mode: one
// `selectedSheet`, one `extractResult`. Renders the sheet summary, Run
// extract button, records preview table, and Back / Import-target footer.
// The page keeps its state; extraction runs through `onExtract`, import
// navigation through `onImportPpa` / `onImportOutputs` / `onImportFunding`.

import { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { formatAipScheduleShort } from '@/lib/aip-summary-import/extract';
import type {
    AipSummaryExtractResult,
    AipSummaryRecord,
} from '@/lib/aip-summary-import/extract';

const columnHelper = createColumnHelper<AipSummaryRecord>();

function getExtractPreviewColumns() {
    return [
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
            header: () => <div className="px-1">Code</div>,
            cell: ({ row }) => {
                const value = row.original.isContinuation
                    ? '—'
                    : row.original.fullCode;

                return (
                    <span
                        className="block max-w-[20ch] truncate px-1 font-mono whitespace-nowrap"
                        title={value}
                    >
                        {value}
                    </span>
                );
            },
        }),
        columnHelper.accessor('name', {
            size: 200,
            header: () => <div className="px-1">Name</div>,
            cell: ({ getValue }) => (
                <span
                    className="block max-w-[24ch] truncate px-1"
                    title={getValue()}
                >
                    {getValue()}
                </span>
            ),
        }),
        columnHelper.accessor((row) => row.offices.join(' / ') || '—', {
            id: 'offices',
            size: 120,
            header: () => <div className="px-1">Offices</div>,
            cell: ({ getValue }) => (
                <span
                    className="block max-w-[20ch] truncate whitespace-nowrap px-1"
                    title={getValue()}
                >
                    {getValue()}
                </span>
            ),
        }),
        columnHelper.accessor('startDate', {
            size: 90,
            header: () => <div className="px-1">Start</div>,
            cell: ({ getValue }) => (
                <span className="block whitespace-nowrap px-1">
                    {formatAipScheduleShort(getValue()) ?? '—'}
                </span>
            ),
        }),
        columnHelper.accessor('endDate', {
            size: 90,
            header: () => <div className="px-1">End</div>,
            cell: ({ getValue }) => (
                <span className="block whitespace-nowrap px-1">
                    {formatAipScheduleShort(getValue()) ?? '—'}
                </span>
            ),
        }),
        columnHelper.accessor('expectedOutput', {
            size: 200,
            header: () => <div className="px-1">Output</div>,
            cell: ({ getValue }) => {
                const value = getValue() ?? '—';

                return (
                    <span
                        className="block max-w-[24ch] truncate px-1"
                        title={value}
                    >
                        {value}
                    </span>
                );
            },
        }),
        columnHelper.accessor('fundingSource', {
            size: 120,
            header: () => <div className="px-1">Fund</div>,
            cell: ({ getValue }) => {
                const value = getValue() ?? '—';

                return (
                    <span
                        className="block max-w-[20ch] truncate whitespace-nowrap px-1"
                        title={value}
                    >
                        {value}
                    </span>
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
        columnHelper.accessor('typology', {
            size: 100,
            header: () => <div className="px-1">Typology</div>,
            cell: ({ getValue }) => {
                const value = getValue() ?? '—';

                return (
                    <span
                        className="block max-w-[16ch] truncate whitespace-nowrap px-1"
                        title={value}
                    >
                        {value}
                    </span>
                );
            },
        }),
    ];
}

interface ImportAipExtractStepProps {
    tabsValue?: string;

    selectedSheet: string;
    canExtract: boolean;
    extractResult: AipSummaryExtractResult | null;
    canImportPpa: boolean;
    onExtract: () => void;

    onImportPpa: () => void;
    onImportOutputs: () => void;
    onImportFunding: () => void;
    onBack: () => void;
    backLabel?: string;
}

export function ImportAipExtractStep({
    tabsValue = 'extract',

    selectedSheet,
    canExtract,
    extractResult,
    canImportPpa,
    onExtract,

    onImportPpa,
    onImportOutputs,
    onImportFunding,
    onBack,
    backLabel = 'Back: Verify',
}: ImportAipExtractStepProps) {
    const columns = useMemo(() => getExtractPreviewColumns(), []);

    return (
        <TabsContent value={tabsValue} className="mt-4 flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
                Sheet{' '}
                <span className="text-foreground font-medium">
                    {selectedSheet}
                </span>{' '}
                · one record per output × funding source · continuation rows
                attach to their PPA block
            </p>

            <div>
                <Button onClick={onExtract} disabled={!canExtract}>
                    Run extract
                </Button>
            </div>

            {extractResult && (
                <div className="flex flex-col gap-2 rounded-md border p-3">
                    <p className="text-sm font-medium text-green-600">
                        ✅ Extracted {extractResult.records.length} record
                        {extractResult.records.length === 1
                            ? ''
                            : 's'} across{' '}
                        {extractResult.blocks} PPA block
                        {extractResult.blocks === 1 ? '' : 's'}
                    </p>
                    <DataTable
                        data={extractResult.records}
                        columns={columns}
                        withColgroup
                        className="h-[420px]"
                    />
                    <p className="text-muted-foreground text-xs">
                        Preview only — Review &amp; Import comes next (matching,
                        selection, POST).
                    </p>
                </div>
            )}

            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={onBack}>
                    {backLabel}
                </Button>
                <div className="flex gap-2">
                    <Button disabled={!canImportPpa} onClick={onImportPpa}>
                        Import PPA
                    </Button>
                    <Button disabled={!canImportPpa} onClick={onImportOutputs}>
                        Import Expected Outputs
                    </Button>
                    <Button disabled={!canImportPpa} onClick={onImportFunding}>
                        Import Funding Source
                    </Button>
                </div>
            </div>
        </TabsContent>
    );
}
