// resources/js/pages/imports/category-import/steps/verify-step.tsx

import { useEffect, useState } from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
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

    // Issue-level tab state (Errors / Warnings), shared by whichever
    // sheet's card is currently mounted.
    const [activeIssueTab, setActiveIssueTab] = useState<string>('errors');

    const currentResult = verifyResults[activeVerifySheet];
    const hasErrors = (currentResult?.errors.length ?? 0) > 0;
    const hasWarnings = false; // PPMP verify never emits warnings

    // Snap the issue tab to a populated one when the shape changes.
    // If both are populated, leave the user's choice alone.
    useEffect(() => {
        if (hasErrors && hasWarnings) return;
        if (hasErrors) setActiveIssueTab('errors');
        else if (hasWarnings) setActiveIssueTab('warnings');
        else setActiveIssueTab('errors');
    }, [hasErrors, hasWarnings]);

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

                {hasAnyVerify && (
                    <Tabs
                        value={activeVerifySheet}
                        onValueChange={setActiveVerifySheet}
                        className="mt-4"
                    >
                        {selectedSheets.length > 1 && (
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
                        )}

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
                                    <div className="mt-4 rounded-md border p-3 text-sm">
                                        <div className="font-medium">
                                            {verifyResult.message}
                                            {selectedSheets.length > 1 && (
                                                <span className="text-xs font-normal opacity-70">
                                                    {' '}
                                                    — {sh}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                            <Badge variant="outline">
                                                Procurement:{' '}
                                                {
                                                    verifyResult.groups
                                                        .procurement
                                                }{' '}
                                                cells
                                            </Badge>
                                            <Badge variant="outline">
                                                Additional:{' '}
                                                {verifyResult.groups.additional}{' '}
                                                cells
                                            </Badge>
                                            <Badge variant="outline">
                                                Non-Proc:{' '}
                                                {
                                                    verifyResult.groups
                                                        .nonProcurement
                                                }{' '}
                                                cells
                                            </Badge>
                                        </div>

                                        {verifyResult.details.length > 0 && (
                                            <Accordion
                                                type="single"
                                                collapsible
                                                className="mt-2"
                                            >
                                                <AccordionItem
                                                    value="details"
                                                    className="border-b-0"
                                                >
                                                    <AccordionTrigger className="py-1 text-xs hover:no-underline">
                                                        Details (
                                                        {
                                                            verifyResult.details
                                                                .length
                                                        }
                                                        )
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <ul className="list-disc space-y-1 pl-5 text-xs opacity-80">
                                                            {verifyResult.details.map(
                                                                (d, i) => (
                                                                    <li key={i}>
                                                                        {d}
                                                                    </li>
                                                                ),
                                                            )}
                                                        </ul>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        )}

                                        <div className="mt-3">
                                            <Tabs
                                                value={activeIssueTab}
                                                onValueChange={
                                                    setActiveIssueTab
                                                }
                                            >
                                                <TabsList>
                                                    <TabsTrigger
                                                        value="errors"
                                                        disabled={
                                                            verifyResult.errors
                                                                .length === 0
                                                        }
                                                    >
                                                        Errors
                                                        <span
                                                            className={`ml-1 rounded px-1.5 py-0.5 text-xs ${
                                                                verifyResult
                                                                    .errors
                                                                    .length > 0
                                                                    ? 'bg-destructive text-destructive-foreground'
                                                                    : 'bg-muted text-muted-foreground'
                                                            }`}
                                                        >
                                                            {
                                                                verifyResult
                                                                    .errors
                                                                    .length
                                                            }
                                                        </span>
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="warnings"
                                                        disabled
                                                    >
                                                        Warnings
                                                        <span className="bg-muted text-muted-foreground ml-1 rounded px-1.5 py-0.5 text-xs">
                                                            0
                                                        </span>
                                                    </TabsTrigger>
                                                </TabsList>
                                                <TabsContent
                                                    value="errors"
                                                    className="mt-3 max-h-64 overflow-y-auto rounded border p-2"
                                                >
                                                    {verifyResult.errors
                                                        .length === 0 ? (
                                                        <p className="text-muted-foreground py-6 text-center text-sm">
                                                            No errors.
                                                        </p>
                                                    ) : (
                                                        <ul className="text-destructive flex flex-col gap-1 overflow-y-auto text-sm">
                                                            {verifyResult.errors.map(
                                                                (issue, i) => (
                                                                    <li
                                                                        key={`${issue.row}-${i}`}
                                                                        className="flex gap-2 leading-relaxed"
                                                                    >
                                                                        <span className="shrink-0 pt-0.5 font-mono text-xs opacity-70">
                                                                            Row{' '}
                                                                            {
                                                                                issue.row
                                                                            }
                                                                            :
                                                                        </span>
                                                                        <span className="min-w-0 flex-1">
                                                                            {
                                                                                issue.message
                                                                            }
                                                                        </span>
                                                                    </li>
                                                                ),
                                                            )}
                                                        </ul>
                                                    )}
                                                </TabsContent>
                                                <TabsContent
                                                    value="warnings"
                                                    className="mt-3 max-h-64 overflow-y-auto rounded border p-2"
                                                >
                                                    <p className="text-muted-foreground py-6 text-center text-sm">
                                                        No warnings.
                                                    </p>
                                                </TabsContent>
                                            </Tabs>
                                        </div>
                                    </div>
                                </TabsContent>
                            );
                        })}
                    </Tabs>
                )}

                {hasAnyVerify && !allVerifyValid && (
                    <div className="mt-4 flex items-center gap-2 rounded-md border p-2">
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
