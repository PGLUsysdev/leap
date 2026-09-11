// resources/js/pages/price-list-quantities-import/steps/verify-step.tsx

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import type { PriceListQuantitiesImportState } from '../types';

export function VerifyStep({ s }: { s: PriceListQuantitiesImportState }) {
    const {
        selectedSheets,
        canVerify,
        hasAnyVerify,
        allVerifyValid,
        verifyResults,
        activeVerifySheet,
        setActiveVerifySheet,
        handleVerify,
        runExtraction,
    } = s;

    return (
        <TabsContent value="verify" className="mt-4 flex flex-col gap-4">
            <div className="flex gap-2">
                <Button onClick={handleVerify} disabled={!canVerify}>
                    Run Verify ({selectedSheets.length} sheets)
                </Button>
                {hasAnyVerify && allVerifyValid && (
                    <Badge variant="default" className="self-center">
                        All valid ✓
                    </Badge>
                )}
                {hasAnyVerify && !allVerifyValid && (
                    <Badge variant="destructive" className="self-center">
                        Fix errors to continue
                    </Badge>
                )}
            </div>

            {!hasAnyVerify && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            What verification checks
                        </CardTitle>
                        <CardDescription>
                            Runs against each selected sheet using its
                            calibration. Extraction stays locked until every
                            sheet passes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
                            <li>
                                Calibrated ranges are sane and the procurement
                                section has data
                            </li>
                            <li>Every item row has a unit and a COA</li>
                            <li>
                                Every quantity cell is numeric (amount columns
                                are skipped)
                            </li>
                            <li>
                                Every item row carries quantities in at least
                                one month
                            </li>
                        </ul>
                        {selectedSheets.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {selectedSheets.map((sh) => (
                                    <Badge key={sh} variant="secondary">
                                        {sh}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {selectedSheets.length > 0 &&
                Object.keys(verifyResults).length > 0 && (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {selectedSheets.map((sh) => {
                            const r = verifyResults[sh];
                            const valid = r?.valid ?? false;

                            return (
                                <button
                                    key={sh}
                                    type="button"
                                    onClick={() => setActiveVerifySheet(sh)}
                                    className={`rounded-lg border p-3 text-left transition-colors ${
                                        activeVerifySheet === sh
                                            ? 'border-primary ring-primary/30 ring-1'
                                            : 'hover:bg-muted/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate text-sm font-medium">
                                            {sh}
                                        </span>
                                        <Badge
                                            variant={
                                                valid
                                                    ? 'default'
                                                    : 'destructive'
                                            }
                                        >
                                            {r
                                                ? valid
                                                    ? '✓ Valid'
                                                    : '❌ Invalid'
                                                : '—'}
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {r ? r.message : 'Not verified yet'}
                                    </p>
                                    {r && r.errors.length > 0 && (
                                        <p className="text-destructive mt-1 text-xs">
                                            {r.errors.length} problem(s) — click
                                            for details
                                        </p>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

            {activeVerifySheet && verifyResults[activeVerifySheet] && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            {activeVerifySheet}
                        </CardTitle>
                        <CardDescription>
                            {verifyResults[activeVerifySheet].message}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        {verifyResults[activeVerifySheet].errors.length > 0 && (
                            <ul className="text-destructive flex flex-col gap-1 text-sm">
                                {verifyResults[activeVerifySheet].errors.map(
                                    (e, i) => (
                                        <li key={i}>
                                            Row {e.row}: {e.message}
                                        </li>
                                    ),
                                )}
                            </ul>
                        )}

                        <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
                            {verifyResults[activeVerifySheet].details.map(
                                (d, i) => (
                                    <li key={i}>{d}</li>
                                ),
                            )}
                        </ul>

                        {allVerifyValid && (
                            <div>
                                <Button onClick={runExtraction}>
                                    Run extraction
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </TabsContent>
    );
}
