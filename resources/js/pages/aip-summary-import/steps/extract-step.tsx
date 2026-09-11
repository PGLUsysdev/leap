// resources/js/pages/aip-summary-import/steps/extract-step.tsx

import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { formatAipScheduleShort } from '@/lib/aip-summary-import/extract';
import type { AipImportState } from '../types';

export function ExtractStep({ s }: { s: AipImportState }) {
    const {
        selectedSheet,
        canExtract,
        extractResult,
        canImportPpa,
        handleExtract,
        goToImport,
        setStep,
    } = s;

    return (
        <TabsContent value="extract" className="mt-4 flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
                Sheet{' '}
                <span className="text-foreground font-medium">
                    {selectedSheet}
                </span>{' '}
                · one record per output × funding source · continuation rows
                attach to their PPA block
            </p>

            <div>
                <Button onClick={handleExtract} disabled={!canExtract}>
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
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="text-muted-foreground border-b">
                                    <th className="px-2 py-1 font-medium">
                                        Row
                                    </th>
                                    <th className="px-2 py-1 font-medium">
                                        Code
                                    </th>
                                    <th className="px-2 py-1 font-medium">
                                        Name
                                    </th>
                                    <th className="px-2 py-1 font-medium">
                                        Offices
                                    </th>
                                    <th className="px-2 py-1 font-medium">
                                        Schedule
                                    </th>
                                    <th className="px-2 py-1 font-medium">
                                        Output
                                    </th>
                                    <th className="px-2 py-1 font-medium">
                                        Fund
                                    </th>
                                    <th className="px-2 py-1 font-medium">
                                        Adapt.
                                    </th>
                                    <th className="px-2 py-1 font-medium">
                                        Mitig.
                                    </th>
                                    <th className="px-2 py-1 font-medium">
                                        Typology
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {extractResult.records.map((record) => (
                                    <tr
                                        key={record.key}
                                        className="border-b last:border-0"
                                    >
                                        <td className="px-2 py-1 font-mono whitespace-nowrap">
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
                                        <td className="px-2 py-1 font-mono whitespace-nowrap">
                                            {record.isContinuation
                                                ? '—'
                                                : record.fullCode}
                                        </td>
                                        <td className="max-w-[24ch] truncate px-2 py-1">
                                            {record.name}
                                        </td>
                                        <td className="px-2 py-1 whitespace-nowrap">
                                            {record.offices.join(' / ') || '—'}
                                        </td>
                                        <td className="px-2 py-1 whitespace-nowrap">
                                            {formatAipScheduleShort(
                                                record.startDate,
                                            ) ?? '—'}{' '}
                                            →{' '}
                                            {formatAipScheduleShort(
                                                record.endDate,
                                            ) ?? '—'}
                                        </td>
                                        <td className="max-w-[24ch] truncate px-2 py-1">
                                            {record.expectedOutput ?? '—'}
                                        </td>
                                        <td className="px-2 py-1 whitespace-nowrap">
                                            {record.fundingSource ?? '—'}
                                        </td>
                                        <td className="px-2 py-1 whitespace-nowrap">
                                            {record.adaptation ?? '—'}
                                        </td>
                                        <td className="px-2 py-1 whitespace-nowrap">
                                            {record.mitigation ?? '—'}
                                        </td>
                                        <td className="px-2 py-1 whitespace-nowrap">
                                            {record.typology ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-muted-foreground text-xs">
                        Preview only — Review &amp; Import comes next (matching,
                        selection, POST).
                    </p>
                </div>
            )}

            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setStep('verify')}>
                    Back: Verify
                </Button>
                <div className="flex gap-2">
                    <Button
                        disabled={!canImportPpa}
                        onClick={() => goToImport('ppa')}
                    >
                        Import PPA
                    </Button>
                    <Button
                        disabled={!canImportPpa}
                        onClick={() => goToImport('outputs')}
                    >
                        Import Expected Outputs
                    </Button>
                    <Button
                        disabled={!canImportPpa}
                        onClick={() => goToImport('funding')}
                    >
                        Import Funding Source
                    </Button>
                </div>
            </div>
        </TabsContent>
    );
}
