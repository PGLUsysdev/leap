// resources/js/components/imports/import-aip-calibrate-step.tsx
//
// Shared calibration step for the AIP Summary importer. The AIP sheet is a
// different layout from PPMP (fixed flat rows, own config in
// `@/lib/aip-summary-import/sheet-config`), so it gets its own component —
// but it mirrors `import-ppmp-calibrate-step.tsx` field-for-field: header-row
// input, number-row toggle, grouped column inputs, and Back / Reset / Log /
// Next footer. The page keeps its state; edits flow back through callbacks.

import type { ReactNode } from 'react';
import { ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TabsContent } from '@/components/ui/tabs';
import {
    AIP_SUMMARY_FIELD_GROUPS,
    AIP_SUMMARY_FIELD_LABELS,
    getDefaultAipSummaryConfig,
} from '@/lib/aip-summary-import/sheet-config';
import type {
    AipSummaryField,
    AipSummarySheetConfig,
} from '@/lib/aip-summary-import/sheet-config';

const DEFAULT_COLUMNS = getDefaultAipSummaryConfig().columnConfig;

interface ImportAipCalibrateStepProps {
    tabsValue?: string;

    config: AipSummarySheetConfig;
    selectedSheet: string;
    canVerify: boolean;

    onHeaderRowChange: (value: string) => void;
    onHasNumberRowChange: (value: boolean) => void;
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
    onHasNumberRowChange,
    onColumnChange,
    onResetDefaults,
    onLogContents,

    onBack,
    onNext,
    backLabel = 'Back',
    nextLabel = 'Next: Verify',

    scopeBar,
}: ImportAipCalibrateStepProps) {
    const hasNumberRow = config.hasNumberRow ?? true;
    const headerRow = config.headerRow;

    return (
        <TabsContent value={tabsValue} className="mt-4 flex flex-col gap-4">
            {scopeBar}

            <div className="rounded-lg border p-4">
                <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                    Calibration
                </p>

                <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                    Columns
                </p>
                {AIP_SUMMARY_FIELD_GROUPS.map((group) => (
                    <div key={group.title} className="mt-4 first:mt-0">
                        <div className="grid grid-cols-3 gap-4">
                            {group.fields.map((field) => (
                                <Field key={field}>
                                    <FieldLabel
                                        htmlFor={`aip-summary-col-${field}`}
                                    >
                                        {AIP_SUMMARY_FIELD_LABELS[field]} *
                                    </FieldLabel>
                                    <Input
                                        id={`aip-summary-col-${field}`}
                                        className="w-16"
                                        maxLength={3}
                                        value={config.columnConfig[field]}
                                        onChange={(e) =>
                                            onColumnChange(
                                                field,
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        placeholder={DEFAULT_COLUMNS[field]}
                                    />
                                </Field>
                            ))}
                        </div>
                    </div>
                ))}

                <p className="text-muted-foreground mt-4 mb-3 text-xs font-semibold tracking-wide uppercase">
                    Rows
                </p>
                <div className="grid grid-cols-3 gap-4">
                    <Field>
                        <FieldLabel htmlFor="aip-summary-header-row">
                            Header Row *
                        </FieldLabel>
                        <Input
                            id="aip-summary-header-row"
                            type="number"
                            min={1}
                            className="w-32"
                            placeholder="7"
                            value={headerRow}
                            onChange={(e) => onHeaderRowChange(e.target.value)}
                        />
                    </Field>
                </div>

                <div className="mt-4 flex items-center gap-3">
                    <Switch
                        id="aip-summary-has-number-row"
                        size="sm"
                        checked={hasNumberRow}
                        onCheckedChange={onHasNumberRowChange}
                    />
                    <Label htmlFor="aip-summary-has-number-row">
                        Include number row (1–15)
                    </Label>
                </div>

                <div className="mt-4 flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onResetDefaults}
                    >
                        Reset to defaults
                    </Button>
                    <span className="text-muted-foreground self-center text-xs">
                        Columns: A refCode · B description · C office · D start
                        · E end · F output · G fund → M adapt · N mitig · O
                        typology
                    </span>
                </div>
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>
                    {backLabel}
                </Button>
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
