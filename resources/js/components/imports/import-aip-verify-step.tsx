// resources/js/components/imports/import-aip-verify-step.tsx
//
// Shared verify step for the AIP Summary family. Single-sheet mode: one
// `selectedSheet`, one `config`, one `verifyResult`. Renders the sheet
// summary, Run verify button, issues via `ImportVerifyIssues`, and Back /
// Next footer. The page keeps its state; verify runs through `onVerify`.

import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { ImportVerifyIssues } from './import-verify-issues';
import type { AipSummarySheetConfig } from '@/lib/aip-summary-import/sheet-config';
import type { AipSummaryVerifyResult } from '@/lib/aip-summary-import/verify';

interface ImportAipVerifyStepProps {
    tabsValue?: string;

    selectedSheet: string;
    config: AipSummarySheetConfig;
    canVerify: boolean;
    verifyResult: AipSummaryVerifyResult | null;
    canExtract: boolean;
    onVerify: () => void;

    onBack: () => void;
    onNext: () => void;
    backLabel?: string;
    nextLabel?: string;
}

export function ImportAipVerifyStep({
    tabsValue = 'verify',

    selectedSheet,
    config,
    canVerify,
    verifyResult,
    canExtract,
    onVerify,

    onBack,
    onNext,
    backLabel = 'Back: Calibrate',
    nextLabel = 'Next: Extract',
}: ImportAipVerifyStepProps) {
    return (
        <TabsContent value={tabsValue} className="mt-4 flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
                Sheet{' '}
                <span className="text-foreground font-medium">
                    {selectedSheet}
                </span>{' '}
                · header row {config.headerRow === '' ? '—' : config.headerRow}{' '}
                · {Object.keys(config.columnConfig).length} columns
            </p>

            <div>
                <Button onClick={onVerify} disabled={!canVerify}>
                    Run verify
                </Button>
            </div>

            {verifyResult && (
                <ImportVerifyIssues
                    errors={verifyResult.errors}
                    warnings={verifyResult.warnings}
                    details={verifyResult.details}
                    message={verifyResult.message}
                    valid={verifyResult.valid}
                    warningsHint="formatting only, sheet still passes"
                />
            )}

            <div className="flex items-center justify-between gap-2">
                <Button variant="outline" onClick={onBack}>
                    {backLabel}
                </Button>
                <Button disabled={!canExtract} onClick={onNext}>
                    {nextLabel}
                </Button>
            </div>
        </TabsContent>
    );
}
