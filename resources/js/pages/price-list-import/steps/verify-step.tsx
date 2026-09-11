// resources/js/pages/price-list-import/steps/verify-step.tsx

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import type { PriceListImportState } from '../types';

export function VerifyStep({ s }: { s: PriceListImportState }) {
    const {
        selectedSheets,
        verifyResults,
        activeVerifySheet,
        setActiveVerifySheet,
        handleVerify,
        hasAnyVerify,
        allVerifyValid,
        isMounted,
        handleExtract,
        setStep,
    } = s;

    return (
        <TabsContent value="verify" className="mt-4 flex flex-col gap-4">
            <div className="flex gap-2">
                <Button onClick={handleVerify}>
                    Run Verify ({selectedSheets.length} sheets)
                </Button>
                {hasAnyVerify && allVerifyValid && (
                    <Badge variant="default" className="self-center">
                        All valid ✓
                    </Badge>
                )}
                {hasAnyVerify && !allVerifyValid && (
                    <Badge variant="destructive" className="self-center">
                        {
                            Object.values(verifyResults).filter((r) => r.valid)
                                .length
                        }
                        /{selectedSheets.length} valid
                    </Badge>
                )}
            </div>
            {hasAnyVerify && (
                <>
                    {selectedSheets.length > 1 && (
                        <div className="flex gap-2">
                            {selectedSheets.map((sh) => (
                                <Badge
                                    key={sh}
                                    variant={
                                        verifyResults[sh]?.valid
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className="cursor-pointer"
                                    onClick={() => setActiveVerifySheet(sh)}
                                >
                                    {sh} {verifyResults[sh]?.valid ? '✓' : '❌'}
                                </Badge>
                            ))}
                        </div>
                    )}
                    {(() => {
                        const active = activeVerifySheet || selectedSheets[0];
                        const r = verifyResults[active];

                        if (!r) return null;

                        return (
                            <div className="rounded-lg border p-4">
                                <p
                                    className={`text-sm font-medium ${r.valid ? 'text-green-600' : 'text-destructive'}`}
                                >
                                    {r.message} — {active}
                                </p>
                                {r.errors.length > 0 && (
                                    <div className="mt-2 max-h-48 overflow-auto rounded border p-2 text-xs">
                                        {r.errors.map((e, i) => (
                                            <div key={i}>
                                                Row {e.row}: {e.message}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {r.details.length > 0 && (
                                    <div className="text-muted-foreground mt-2 text-xs">
                                        {r.details.map((d, i) => (
                                            <div key={i}>{d}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </>
            )}
            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('calibrate')}>
                    Back
                </Button>
                <Button
                    suppressHydrationWarning
                    disabled={isMounted ? !allVerifyValid : false}
                    onClick={() => {
                        handleExtract();
                        setStep('review');
                    }}
                >
                    Next: Extract {allVerifyValid ? '✓' : '(fix errors first)'}
                </Button>
            </div>
        </TabsContent>
    );
}
