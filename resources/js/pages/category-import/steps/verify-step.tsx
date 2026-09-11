// resources/js/pages/category-import/steps/verify-step.tsx

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CategoryImportState } from '../types';

export function VerifyStep({ s }: { s: CategoryImportState }) {
    const {
        selectedSheets,
        calibrationMode,
        canVerify,
        canExtract,
        handleVerify,
        hasAnyVerify,
        allVerifyValid,
        verifyResults,
        activeVerifySheet,
        setActiveVerifySheet,
        skipProblematic,
        setSkipProblematic,
        setStep,
    } = s;

    return (
        <TabsContent value="verify" className="mt-4 flex flex-col gap-4">
            <div className="rounded-lg border p-4">
                <p className="mb-2 text-sm font-medium">
                    Verify procurement format per sheet (categories not in
                    additional)
                </p>
                <p className="text-muted-foreground mb-3 text-xs">
                    Checks each selected sheet ({selectedSheets.length}) with
                    its calibration ({calibrationMode}) — cat → coa(s) → items →
                    cat - total. Per-sheet results below.
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        disabled={!canVerify}
                        onClick={handleVerify}
                    >
                        Verify {selectedSheets.length} Sheet
                        {selectedSheets.length === 1 ? '' : 's'}
                    </Button>
                    {hasAnyVerify && (
                        <span className="text-muted-foreground text-xs">
                            {
                                Object.values(verifyResults).filter(
                                    (r) => r.valid,
                                ).length
                            }
                            /{selectedSheets.length} valid
                            {allVerifyValid && ' — all ✅'}
                        </span>
                    )}
                </div>
                {hasAnyVerify && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {selectedSheets.map((sh) => {
                            const r = verifyResults[sh];

                            if (!r) {
                                return (
                                    <Badge key={sh} variant="secondary">
                                        {sh}: —
                                    </Badge>
                                );
                            }

                            return (
                                <Badge
                                    key={sh}
                                    variant={r.valid ? 'default' : 'secondary'}
                                    className={
                                        r.valid
                                            ? 'bg-green-600'
                                            : 'bg-amber-500'
                                    }
                                >
                                    {sh}: {r.valid ? '✅' : '❌'}{' '}
                                    {r.errors.length} issues
                                </Badge>
                            );
                        })}
                    </div>
                )}
                {hasAnyVerify && selectedSheets.length > 1 && (
                    <Tabs
                        value={activeVerifySheet}
                        onValueChange={setActiveVerifySheet}
                        className="mt-4"
                    >
                        <TabsList>
                            {selectedSheets.map((sh) => {
                                const r = verifyResults[sh];

                                return (
                                    <TabsTrigger key={sh} value={sh}>
                                        {sh}{' '}
                                        {r?.valid ? (
                                            <span className="ml-1 text-xs text-green-600">
                                                ✓
                                            </span>
                                        ) : r ? (
                                            <span className="ml-1 text-xs text-amber-600">
                                                ❌ {r.errors.length}
                                            </span>
                                        ) : null}
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                        {selectedSheets.map((sh) => {
                            const verifyResult = verifyResults[sh];

                            if (!verifyResult) {
                                return (
                                    <TabsContent key={sh} value={sh}>
                                        <div className="text-muted-foreground p-4 text-sm">
                                            Not verified yet.
                                        </div>
                                    </TabsContent>
                                );
                            }

                            return (
                                <TabsContent key={sh} value={sh}>
                                    <div
                                        className={`mt-4 rounded-md border p-3 text-sm ${verifyResult.valid ? 'border-green-200 bg-green-50 text-green-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
                                    >
                                        <div className="font-medium">
                                            {verifyResult.message}{' '}
                                            <span className="text-xs font-normal opacity-70">
                                                — {sh}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                            <Badge
                                                variant={
                                                    verifyResult.groups
                                                        .procurement
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                Procurement:{' '}
                                                {
                                                    verifyResult.groups
                                                        .procurement
                                                }{' '}
                                                cells
                                            </Badge>
                                            <Badge
                                                variant={
                                                    verifyResult.groups
                                                        .additional
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                Additional:{' '}
                                                {verifyResult.groups.additional}{' '}
                                                cells
                                            </Badge>
                                            <Badge
                                                variant={
                                                    verifyResult.groups
                                                        .nonProcurement
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                Non-Proc:{' '}
                                                {
                                                    verifyResult.groups
                                                        .nonProcurement
                                                }{' '}
                                                cells
                                            </Badge>
                                        </div>
                                        {verifyResult.details.length > 0 && (
                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs opacity-80">
                                                {verifyResult.details.map(
                                                    (d, i) => (
                                                        <li key={i}>{d}</li>
                                                    ),
                                                )}
                                            </ul>
                                        )}
                                        {verifyResult.errors.length > 0 && (
                                            <div className="mt-3">
                                                <div className="text-xs font-semibold">
                                                    Issues (
                                                    {verifyResult.errors.length}
                                                    ) in {sh}:
                                                </div>
                                                <ul className="mt-1 max-h-48 list-disc overflow-auto pl-5">
                                                    {verifyResult.errors.map(
                                                        (e, i) => (
                                                            <li key={i}>
                                                                <span className="font-mono">
                                                                    Row {e.row}:
                                                                </span>{' '}
                                                                {e.message}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            );
                        })}
                    </Tabs>
                )}
                {hasAnyVerify &&
                    selectedSheets.length === 1 &&
                    (() => {
                        const sh = selectedSheets[0];
                        const verifyResult = verifyResults[sh];

                        if (!verifyResult) return null;

                        return (
                            <div
                                className={`mt-4 rounded-md border p-3 text-sm ${verifyResult.valid ? 'border-green-200 bg-green-50 text-green-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
                            >
                                <div className="font-medium">
                                    {verifyResult.message}
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                    <Badge
                                        variant={
                                            verifyResult.groups.procurement
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        Procurement:{' '}
                                        {verifyResult.groups.procurement} cells
                                    </Badge>
                                    <Badge
                                        variant={
                                            verifyResult.groups.additional
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        Additional:{' '}
                                        {verifyResult.groups.additional} cells
                                    </Badge>
                                    <Badge
                                        variant={
                                            verifyResult.groups.nonProcurement
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        Non-Proc:{' '}
                                        {verifyResult.groups.nonProcurement}{' '}
                                        cells
                                    </Badge>
                                </div>
                                {verifyResult.details.length > 0 && (
                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs opacity-80">
                                        {verifyResult.details.map((d, i) => (
                                            <li key={i}>{d}</li>
                                        ))}
                                    </ul>
                                )}
                                {verifyResult.errors.length > 0 && (
                                    <div className="mt-3">
                                        <div className="text-xs font-semibold">
                                            Issues ({verifyResult.errors.length}
                                            ):
                                        </div>
                                        <ul className="mt-1 max-h-48 list-disc overflow-auto pl-5">
                                            {verifyResult.errors.map((e, i) => (
                                                <li key={i}>
                                                    <span className="font-mono">
                                                        Row {e.row}:
                                                    </span>{' '}
                                                    {e.message}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                {hasAnyVerify && !allVerifyValid && (
                    <div className="mt-4 flex items-center gap-2 rounded-md border border-amber-200 bg-white p-2">
                        <Switch
                            checked={skipProblematic}
                            onCheckedChange={setSkipProblematic}
                            size="sm"
                        />
                        <span className="text-xs">
                            Skip{' '}
                            {Object.values(verifyResults).reduce(
                                (a, r) => a + (r.valid ? 0 : r.errors.length),
                                0,
                            )}{' '}
                            problematic row(s) across{' '}
                            {
                                selectedSheets.filter(
                                    (sh) => !verifyResults[sh]?.valid,
                                ).length
                            }{' '}
                            sheet(s) and proceed to extraction (they will show
                            as{' '}
                            <span className="font-medium">
                                skipped: problematic
                            </span>{' '}
                            in Review)
                        </span>
                    </div>
                )}
            </div>
            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('calibrate')}>
                    Back
                </Button>
                <Button
                    onClick={() => setStep('extract')}
                    disabled={!canExtract}
                >
                    {allVerifyValid
                        ? `Next: Extract (${selectedSheets.length} sheets)`
                        : skipProblematic && hasAnyVerify
                          ? 'Next: Extract (skipping problematic)'
                          : 'Fix verification first'}
                </Button>
            </div>
        </TabsContent>
    );
}
