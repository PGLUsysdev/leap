// resources/js/components/imports/import-verify-step.tsx
//
// Shared PPMP verify step shell (category-import, category-coa-mapping, …).
// Pages keep their own state and only pass values + callbacks. Per-sheet
// cards show message + group badges + details accordion + issue list via
// `ImportVerifyIssues`. Optional `skip` section lets a flow proceed past
// invalid sheets (e.g. category-import's skip-problematic).

import type { ReactNode } from 'react';
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
import { ImportVerifyIssues } from '@/components/imports/import-verify-issues';

export type PpmpVerifySheetResult = {
    valid: boolean;
    message: string;
    errors: Array<{ row: number; message: string }>;
    warnings?: Array<{ row: number; message: string }>;
    groups: { procurement: number; additional: number; nonProcurement: number };
    details: string[];
};

export type PpmpVerifySkipSection = {
    checked: boolean;
    onChange: (v: boolean) => void;
    problematicCount: number;
    invalidSheetCount: number;
};

interface ImportPpmpVerifyStepProps {
    tabsValue?: string;
    title: string;
    description: ReactNode;
    verifyButtonLabel: string;
    canVerify: boolean;
    onVerify: () => void;
    selectedSheets: string[];
    results: Record<string, PpmpVerifySheetResult>;
    hasResult: boolean;
    allValid: boolean;
    activeSheet: string;
    onActiveChange: (s: string) => void;
    skip?: PpmpVerifySkipSection | null;
    onBack: () => void;
    onNext: () => void;
    canNext: boolean;
    backLabel?: string;
    nextLabel: string;
}

export function ImportPpmpVerifyStep({
    tabsValue = 'verify',
    title,
    description,
    verifyButtonLabel,
    canVerify,
    onVerify,
    selectedSheets,
    results,
    hasResult,
    allValid,
    activeSheet,
    onActiveChange,
    skip = null,
    onBack,
    onNext,
    canNext,
    backLabel = 'Back',
    nextLabel,
}: ImportPpmpVerifyStepProps) {
    const validCount = selectedSheets.filter((s) => results[s]?.valid).length;

    return (
        <TabsContent value={tabsValue} className="mt-4 flex flex-col gap-4">
            <div className="rounded-lg border p-4">
                <p className="mb-2 text-sm font-medium">{title}</p>
                <p className="text-muted-foreground mb-3 text-xs">
                    {description}
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        disabled={!canVerify}
                        onClick={onVerify}
                    >
                        {verifyButtonLabel}
                    </Button>
                    {hasResult && (
                        <span className="text-muted-foreground text-xs">
                            {validCount}/{selectedSheets.length} valid
                            {allValid && ' — all ✅'}
                        </span>
                    )}
                </div>

                {hasResult && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {selectedSheets.map((sh) => {
                            const r = results[sh];

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

                {hasResult && (
                    <Tabs
                        value={activeSheet}
                        onValueChange={onActiveChange}
                        className="mt-4"
                    >
                        {selectedSheets.length > 1 && (
                            <TabsList>
                                {selectedSheets.map((sh) => {
                                    const r = results[sh];

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
                            const verifyResult = results[sh];

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
                                            <Accordion className="mt-2">
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
                                            <ImportVerifyIssues
                                                errors={verifyResult.errors}
                                                warnings={
                                                    verifyResult.warnings ?? []
                                                }
                                                details={[]}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>
                            );
                        })}
                    </Tabs>
                )}

                {skip && hasResult && !allValid && (
                    <div className="mt-4 flex items-center gap-2 rounded-md border p-2">
                        <Switch
                            checked={skip.checked}
                            onCheckedChange={skip.onChange}
                            size="sm"
                        />
                        <span className="text-xs">
                            Skip {skip.problematicCount} problematic row(s)
                            across {skip.invalidSheetCount} sheet(s) and proceed
                            to extraction (they will show as{' '}
                            <span className="font-medium">
                                skipped: problematic
                            </span>{' '}
                            in Review)
                        </span>
                    </div>
                )}
            </div>
            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>
                    {backLabel}
                </Button>
                <Button onClick={onNext} disabled={!canNext}>
                    {nextLabel}
                </Button>
            </div>
        </TabsContent>
    );
}
