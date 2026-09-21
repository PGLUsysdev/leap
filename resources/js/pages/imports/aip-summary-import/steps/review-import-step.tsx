// resources/js/pages/imports/aip-summary-import/steps/review-import-step.tsx
//
// Page-local Review & Import step (not shared — AIP-only). One top-level
// tab whose content switches between the three import views (PPA /
// Expected Outputs / Funding Source) via inner tabs. The views are passed
// in as slots so this wrapper only owns the tab chrome.

import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ImportTarget } from '../types';

interface ReviewImportStepProps {
    tabsValue?: string;

    target: ImportTarget;
    onTargetChange: (t: ImportTarget) => void;
    ppaContent: ReactNode;
    outputsContent: ReactNode;
    fundingContent: ReactNode;
}

export function ReviewImportStep({
    tabsValue = 'review',

    target,
    onTargetChange,
    ppaContent,
    outputsContent,
    fundingContent,
}: ReviewImportStepProps) {
    return (
        <TabsContent value={tabsValue} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold tracking-tight">
                    Review &amp; Import — DB mapping
                </h2>
                <p className="text-muted-foreground text-sm">
                    Review and import PPA, Expected Outputs, and Funding
                    Sources — all DB connecting mapping in one tab.
                </p>
            </div>
            <Tabs
                value={target}
                onValueChange={(v) => onTargetChange(v as ImportTarget)}
            >
                <TabsList>
                    <TabsTrigger value="ppa">PPA</TabsTrigger>
                    <TabsTrigger value="outputs">
                        Expected Outputs
                    </TabsTrigger>
                    <TabsTrigger value="funding">Funding Source</TabsTrigger>
                </TabsList>
                {ppaContent}
                {outputsContent}
                {fundingContent}
            </Tabs>
        </TabsContent>
    );
}
