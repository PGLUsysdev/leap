// resources/js/components/imports/import-verify-step.tsx
//
// Shared PPMP verify step shell. Single-sheet mode: one result, no tabs.

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
import { TabsContent } from '@/components/ui/tabs';
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
    /** The sheet being verified, or null if none selected. */
    selectedSheet: string | null;
    /** Result for the selected sheet, if any. */
    result: PpmpVerifySheetResult | null;
    allValid: boolean;
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
    selectedSheet,
    result,
    allValid,
    skip = null,
    onBack,
    onNext,
    canNext,
    backLabel = 'Back',
    nextLabel,
}: ImportPpmpVerifyStepProps) {
    const hasResult = !!result;

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
                            {result!.valid ? 'valid ✅' : 'failed ❌'}
                            {allValid && ' — all ✅'}
                        </span>
                    )}
                </div>

                {hasResult && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Badge
                            variant={result!.valid ? 'default' : 'secondary'}
                            className={
                                result!.valid ? 'bg-green-600' : 'bg-amber-500'
                            }
                        >
                            {selectedSheet ?? '—'}:{' '}
                            {result!.valid ? '✅' : '❌'}{' '}
                            {result!.errors.length} issues
                        </Badge>
                    </div>
                )}

                {hasResult && (
                    <div className="mt-4 rounded-md border p-3 text-sm">
                        <div className="font-medium">{result!.message}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline">
                                Procurement: {result!.groups.procurement} cells
                            </Badge>
                            <Badge variant="outline">
                                Additional: {result!.groups.additional} cells
                            </Badge>
                            <Badge variant="outline">
                                Non-Proc: {result!.groups.nonProcurement} cells
                            </Badge>
                        </div>

                        {result!.details.length > 0 && (
                            <Accordion className="mt-2">
                                <AccordionItem
                                    value="details"
                                    className="border-b-0"
                                >
                                    <AccordionTrigger className="py-1 text-xs hover:no-underline">
                                        Details ({result!.details.length})
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <ul className="list-disc space-y-1 pl-5 text-xs opacity-80">
                                            {result!.details.map((d, i) => (
                                                <li key={i}>{d}</li>
                                            ))}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        )}

                        <div className="mt-3">
                            <ImportVerifyIssues
                                errors={result!.errors}
                                warnings={result!.warnings ?? []}
                                details={[]}
                            />
                        </div>
                    </div>
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
                            {skip.invalidSheetCount > 0
                                ? ` in ${skip.invalidSheetCount} sheet(s)`
                                : ''}{' '}
                            and proceed to extraction (they will show as{' '}
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
