// resources/js/components/imports/import-aip-calibrate-step.tsx
//
// Shared calibration step for the AIP Summary importer. The AIP sheet is a
// different layout from PPMP (fixed flat rows, own config in
// `@/lib/aip-summary-import/sheet-config`), so it gets its own component:
// header-row input, grouped column inputs, and Back / Reset / Log / Next
// footer. The page keeps its state; edits flow back through callbacks.

import type { ReactNode } from 'react';
import { ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import {
    AIP_SUMMARY_FIELD_GROUPS,
    AIP_SUMMARY_FIELD_LABELS,
} from '@/lib/aip-summary-import/sheet-config';
import type {
    AipSummaryField,
    AipSummarySheetConfig,
} from '@/lib/aip-summary-import/sheet-config';

interface ImportAipCalibrateStepProps {
    tabsValue?: string;

    config: AipSummarySheetConfig;
    selectedSheet: string;
    canVerify: boolean;

    onHeaderRowChange: (value: string) => void;
    onColumnChange: (field: AipSummaryField, letter: string) => void;
    onResetDefaults: () => void;
    /** Omit to hide the debug button. */
    onLogContents?: () => void;

    onBack: () => void;
    onNext: () => void;
    backLabel?: string;
    nextLabel?: string;

    /** Optional scope UI slot (reserved for future multi-sheet support). */
    scopeBar?: ReactNode;
}

export function ImportAipCalibrateStep({
    tabsValue = 'calibrate',

    config,
    selectedSheet,
    canVerify,

    onHeaderRowChange,
    onColumnChange,
    onResetDefaults,
    onLogContents,

    onBack,
    onNext,
    backLabel = 'Back',
    nextLabel = 'Next: Verify',

    scopeBar,
}: ImportAipCalibrateStepProps) {
    return (
        <TabsContent value={tabsValue} className="mt-4 flex flex-col gap-4">
            {scopeBar}

            <Field>
                <FieldLabel htmlFor="aip-summary-header-row">
                    Header row
                </FieldLabel>
                <Input
                    id="aip-summary-header-row"
                    type="number"
                    min={1}
                    className="w-32"
                    value={config.headerRow}
                    onChange={(e) => onHeaderRowChange(e.target.value)}
                />
                <FieldDescription>
                    1-indexed leaf-header row. The number row (`1`–`15`) is
                    always one row below
                    {config.headerRow === '' || config.headerRow == null
                        ? ' the header'
                        : ` (row ${config.headerRow + 1})`}
                    ; data starts two rows below.
                </FieldDescription>
            </Field>

            {AIP_SUMMARY_FIELD_GROUPS.map((group) => (
                <Field key={group.title}>
                    <FieldLabel>{group.title}</FieldLabel>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {group.fields.map((field) => (
                            <div
                                key={field}
                                className="flex items-center gap-2"
                            >
                                <label
                                    htmlFor={`aip-summary-col-${field}`}
                                    className="text-muted-foreground w-36 shrink-0 text-sm"
                                >
                                    {AIP_SUMMARY_FIELD_LABELS[field]}
                                </label>
                                <Input
                                    id={`aip-summary-col-${field}`}
                                    className="w-16 text-center uppercase"
                                    maxLength={3}
                                    value={config.columnConfig[field]}
                                    onChange={(e) =>
                                        onColumnChange(field, e.target.value)
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </Field>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onBack}>
                        {backLabel}
                    </Button>
                    <Button variant="outline" onClick={onResetDefaults}>
                        Reset defaults
                    </Button>
                </div>
                <div className="flex gap-2">
                    {onLogContents && (
                        <Button
                            onClick={onLogContents}
                            disabled={!selectedSheet}
                        >
                            <ScrollText className="h-4 w-4" /> Log contents
                        </Button>
                    )}
                    <Button disabled={!canVerify} onClick={onNext}>
                        {nextLabel}
                    </Button>
                </div>
            </div>
        </TabsContent>
    );
}
