// resources/js/pages/imports/aip-summary-import/steps/verify-step.tsx

import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { ImportVerifyIssues } from '@/components/imports/import-verify-issues';
import type { AipImportState } from '../types';

export function VerifyStep({ s }: { s: AipImportState }) {
    const {
        selectedSheet,
        config,
        canVerify,
        verifyResult,
        canExtract,
        handleVerify,
        setStep,
    } = s;

    return (
        <TabsContent value="verify" className="mt-4 flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
                Sheet{' '}
                <span className="text-foreground font-medium">
                    {selectedSheet}
                </span>{' '}
                · header row {config.headerRow === '' ? '—' : config.headerRow}{' '}
                · {Object.keys(config.columnConfig).length} columns
            </p>

            <div>
                <Button onClick={handleVerify} disabled={!canVerify}>
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
                <Button variant="outline" onClick={() => setStep('calibrate')}>
                    Back: Calibrate
                </Button>
                <Button
                    disabled={!canExtract}
                    onClick={() => setStep('extract')}
                >
                    Next: Extract
                </Button>
            </div>
        </TabsContent>
    );
}
