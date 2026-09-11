// resources/js/pages/aip-summary-import/steps/calibrate-step.tsx

import { ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import {
    AIP_SUMMARY_FIELD_GROUPS,
    AIP_SUMMARY_FIELD_LABELS,
} from '@/lib/aip-summary-import/sheet-config';
import type { AipImportState } from '../types';

export function CalibrateStep({ s }: { s: AipImportState }) {
    const {
        config,
        selectedSheet,
        canVerify,
        updateHeaderRow,
        updateColumn,
        handleResetDefaults,
        handleLogContents,
        setStep,
    } = s;

    return (
        <TabsContent value="calibrate" className="mt-4 flex flex-col gap-4">
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
                    onChange={(e) => updateHeaderRow(e.target.value)}
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
                                        updateColumn(field, e.target.value)
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </Field>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep('upload')}>
                        Back
                    </Button>
                    <Button variant="outline" onClick={handleResetDefaults}>
                        Reset defaults
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleLogContents}
                        disabled={!selectedSheet}
                    >
                        <ScrollText className="h-4 w-4" /> Log contents
                    </Button>
                    <Button
                        disabled={!canVerify}
                        onClick={() => setStep('verify')}
                    >
                        Next: Verify
                    </Button>
                </div>
            </div>
        </TabsContent>
    );
}
