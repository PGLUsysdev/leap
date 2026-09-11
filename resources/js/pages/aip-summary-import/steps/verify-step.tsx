// resources/js/pages/aip-summary-import/steps/verify-step.tsx

import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
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
                <div className="flex flex-col gap-2 rounded-md border p-3">
                    <p
                        className={`text-sm font-medium ${verifyResult.valid ? 'text-green-600' : 'text-destructive'}`}
                    >
                        {verifyResult.valid ? '✅ ' : '❌ '}
                        {verifyResult.message}
                    </p>
                    {verifyResult.errors.length > 0 && (
                        <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto text-sm">
                            {verifyResult.errors.map((issue, i) => (
                                <li key={`error-${issue.row}-${i}`}>
                                    <span className="text-muted-foreground font-mono">
                                        Row {issue.row}:
                                    </span>{' '}
                                    {issue.message}
                                </li>
                            ))}
                        </ul>
                    )}
                    {verifyResult.warnings.length > 0 && (
                        <>
                            <p className="text-sm font-medium text-amber-600">
                                ⚠ {verifyResult.warnings.length} warning
                                {verifyResult.warnings.length === 1
                                    ? ''
                                    : 's'}{' '}
                                — formatting only, sheet still passes
                            </p>
                            <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto text-sm text-amber-700">
                                {verifyResult.warnings.map((issue, i) => (
                                    <li key={`warning-${issue.row}-${i}`}>
                                        <span className="font-mono opacity-70">
                                            Row {issue.row}:
                                        </span>{' '}
                                        {issue.message}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    {verifyResult.details.length > 0 && (
                        <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
                            {verifyResult.details.map((detail, i) => (
                                <li key={i}>{detail}</li>
                            ))}
                        </ul>
                    )}
                </div>
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
