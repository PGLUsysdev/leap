// resources/js/pages/category-coa-mapping/steps/verify-format-step.tsx

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CategoryCoaMappingState } from '../types';

export function VerifyFormatStep({ s }: { s: CategoryCoaMappingState }) {
    const {
        selectedSheets,
        calibrationMode,
        sharedConfig,
        canVerifyFormat,
        canVerifyMap,
        hasFormatResult,
        formatValid,
        formatResults,
        activeFormatSheet,
        setActiveFormatSheet,
        handleVerifyFormat,
        setStep,
    } = s;

    return (
        <TabsContent value="verifyFormat" className="mt-4 flex flex-col gap-4">
            <div className="rounded-lg border p-4">
                <p className="mb-2 text-sm font-medium">
                    Verify Sheet Format — check calibration and structure (all 3
                    sections)
                </p>
                <p className="text-muted-foreground mb-3 text-xs">
                    Checks {selectedSheets.length} sheet
                    {selectedSheets.length === 1 ? '' : 's'} with current
                    calibration (
                    {calibrationMode === 'shared'
                        ? `shared header ${sharedConfig?.rowConfig.headerRow === '' || sharedConfig?.rowConfig.headerRow == null ? 7 : sharedConfig.rowConfig.headerRow}`
                        : `per-sheet`}
                    ). Validates cat → coa(s) → items → cat - TOTAL per section.
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={handleVerifyFormat}
                        disabled={!canVerifyFormat}
                    >
                        Verify Format{' '}
                        {selectedSheets.length > 1
                            ? `(${selectedSheets.length} sheets)`
                            : ''}
                    </Button>
                    {hasFormatResult && (
                        <span
                            className={`text-xs ${formatValid ? 'text-green-600' : 'text-amber-600'}`}
                        >
                            {formatValid
                                ? `✅ All ${selectedSheets.length} valid`
                                : `❌ ${Object.values(formatResults).filter((r) => !r.valid).length}/${selectedSheets.length} issues`}
                        </span>
                    )}
                </div>
                {hasFormatResult && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {selectedSheets.map((sh) => {
                            const r = formatResults[sh];

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
                                        r.valid ? 'bg-primary' : 'bg-secondary'
                                    }
                                >
                                    {sh}: {r.valid ? '✅' : '❌'}{' '}
                                    {r.errors.length} issues
                                </Badge>
                            );
                        })}
                    </div>
                )}
            </div>

            {hasFormatResult && selectedSheets.length > 1 && (
                <Tabs
                    value={activeFormatSheet}
                    onValueChange={setActiveFormatSheet}
                >
                    <TabsList>
                        {selectedSheets.map((sh) => {
                            const r = formatResults[sh];

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
                        const r = formatResults[sh];

                        if (!r) {
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
                                <div className="bg-card rounded-lg border p-4">
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <Badge
                                            variant={
                                                r.groups.procurement
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            Procurement: {r.groups.procurement}{' '}
                                            cells
                                        </Badge>
                                        <Badge
                                            variant={
                                                r.groups.additional
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            Additional: {r.groups.additional}{' '}
                                            cells
                                        </Badge>
                                        <Badge
                                            variant={
                                                r.groups.nonProcurement
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            Non-Proc: {r.groups.nonProcurement}{' '}
                                            cells
                                        </Badge>
                                    </div>
                                    {r.details.length > 0 && (
                                        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs opacity-80">
                                            {r.details.map((d, i) => (
                                                <li key={i}>{d}</li>
                                            ))}
                                        </ul>
                                    )}
                                    {r.errors.length > 0 && (
                                        <div className="mt-3">
                                            <div className="text-xs font-semibold">
                                                Issues ({r.errors.length}) in{' '}
                                                {sh}:
                                            </div>
                                            <ul className="mt-1 max-h-48 list-disc overflow-auto pl-5 text-xs">
                                                {r.errors.map((e, i) => (
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
                                    {!r.valid && (
                                        <p className="mt-2 text-xs text-amber-800">
                                            Fix calibration or sheet format —
                                            Next is blocked until valid.
                                        </p>
                                    )}
                                </div>
                            </TabsContent>
                        );
                    })}
                </Tabs>
            )}

            {hasFormatResult &&
                selectedSheets.length === 1 &&
                (() => {
                    const sh = selectedSheets[0];
                    const r = formatResults[sh];

                    if (!r) return null;

                    return (
                        <div className="bg-card rounded-lg border p-4">
                            <div className="flex flex-wrap gap-2 text-xs">
                                <Badge
                                    variant={
                                        r.groups.procurement
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    Procurement: {r.groups.procurement} cells
                                </Badge>
                                <Badge
                                    variant={
                                        r.groups.additional
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    Additional: {r.groups.additional} cells
                                </Badge>
                                <Badge
                                    variant={
                                        r.groups.nonProcurement
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    Non-Proc: {r.groups.nonProcurement} cells
                                </Badge>
                            </div>
                            {r.details.length > 0 && (
                                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs opacity-80">
                                    {r.details.map((d, i) => (
                                        <li key={i}>{d}</li>
                                    ))}
                                </ul>
                            )}
                            {r.errors.length > 0 && (
                                <div className="mt-3">
                                    <div className="text-xs font-semibold">
                                        Issues ({r.errors.length}):
                                    </div>
                                    <ul className="mt-1 max-h-48 list-disc overflow-auto pl-5 text-xs">
                                        {r.errors.map((e, i) => (
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
                            {!r.valid && (
                                <p className="mt-2 text-xs text-amber-800">
                                    Fix calibration or sheet format — Next is
                                    blocked until valid.
                                </p>
                            )}
                        </div>
                    );
                })()}

            {!hasFormatResult && (
                <div className="text-muted-foreground rounded-lg border p-8 text-center text-sm">
                    Click Verify Format to check sheet structure.
                </div>
            )}

            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('calibrate')}>
                    Back
                </Button>
                <Button
                    onClick={() => setStep('verifyMap')}
                    disabled={!canVerifyMap}
                >
                    Next: Verify & Map{' '}
                    {hasFormatResult && !formatValid ? '(blocked)' : ''}
                </Button>
            </div>
        </TabsContent>
    );
}
