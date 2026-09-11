// resources/js/pages/aip-summary-import/steps/import-ppa-step.tsx

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { TabsContent } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { AipImportState } from '../types';

export function ImportPpaStep({ s }: { s: AipImportState }) {
    const {
        selectedSheet,
        selectedOffice,
        setSelectedOffice,
        selectedOfficeLabel,
        selectedFiscalYear,
        setSelectedFiscalYear,
        selectedFiscalYearLabel,
        existingOffices,
        fiscalYears,
        blocksForImport,
        newBlocks,
        handleConfirmImport,
        importing,
        setStep,
    } = s;

    return (
        <TabsContent value="import-ppa" className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold tracking-tight">
                    Import PPA
                </h2>
                <p className="text-muted-foreground text-sm">
                    Review and import PPA blocks extracted from sheet “
                    {selectedSheet}”.
                </p>
            </div>

            <div className="flex flex-wrap gap-4">
                <Field>
                    <FieldLabel>Target Office</FieldLabel>
                    <Select
                        value={selectedOffice}
                        onValueChange={(v) => setSelectedOffice(v ?? '')}
                    >
                        <SelectTrigger className="w-[200px]">
                            {selectedOfficeLabel ? (
                                <span className="flex flex-1 text-left">
                                    {selectedOfficeLabel}
                                </span>
                            ) : (
                                <SelectValue placeholder="Select an office" />
                            )}
                        </SelectTrigger>
                        <SelectContent>
                            {existingOffices.map((office) => (
                                <SelectItem
                                    key={office.id}
                                    value={office.id.toString()}
                                >
                                    {office.acronym || office.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FieldDescription>
                        PPAs will be created under this office.
                    </FieldDescription>
                </Field>

                <Field>
                    <FieldLabel>Fiscal Year</FieldLabel>
                    <Select
                        value={selectedFiscalYear}
                        onValueChange={(v) => setSelectedFiscalYear(v ?? '')}
                    >
                        <SelectTrigger className="w-[160px]">
                            {selectedFiscalYearLabel ? (
                                <span className="flex flex-1 text-left">
                                    {selectedFiscalYearLabel}
                                </span>
                            ) : (
                                <SelectValue placeholder="Select a year" />
                            )}
                        </SelectTrigger>
                        <SelectContent>
                            {fiscalYears.map((fy) => (
                                <SelectItem
                                    key={fy.id}
                                    value={fy.id.toString()}
                                >
                                    {fy.year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FieldDescription>
                        PPAs will be created for this fiscal year.
                    </FieldDescription>
                </Field>
            </div>

            {selectedOffice && selectedFiscalYear ? (
                <>
                    <div className="flex flex-wrap items-center gap-3 rounded-md border p-3 text-sm">
                        <div>
                            <span className="text-muted-foreground">
                                Total PPA blocks:
                            </span>{' '}
                            <span className="font-medium">
                                {blocksForImport.length}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">New:</span>{' '}
                            <span className="font-medium text-blue-600">
                                {
                                    blocksForImport.filter(
                                        (b) => b.status === 'new',
                                    ).length
                                }
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Exists:
                            </span>{' '}
                            <span className="font-medium text-green-600">
                                {
                                    blocksForImport.filter(
                                        (b) => b.status === 'exists',
                                    ).length
                                }
                            </span>
                        </div>
                    </div>

                    {blocksForImport.length > 0 && (
                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-muted/50 text-muted-foreground border-b">
                                        <th className="px-3 py-2 font-medium">
                                            Full Code
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Name &amp; Type
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Status
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Rows
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blocksForImport.map((block) => (
                                        <tr
                                            key={block.fullCode}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-3 py-2 font-mono font-medium whitespace-nowrap">
                                                {block.fullCode}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="font-medium">
                                                    {block.name}
                                                </div>
                                                <div className="text-muted-foreground text-[10px] uppercase">
                                                    {block.type}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">
                                                {block.status === 'exists' && (
                                                    <span className="font-medium text-green-600">
                                                        Exists
                                                    </span>
                                                )}
                                                {block.status === 'new' && (
                                                    <span className="font-medium text-blue-600">
                                                        New
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-muted-foreground px-3 py-2 font-mono whitespace-nowrap">
                                                {block.rows.join(', ')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-muted-foreground text-sm">
                    Please select a target office and fiscal year to review the
                    extracted PPAs.
                </div>
            )}

            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setStep('extract')}>
                    Back: Extract
                </Button>
                <Button
                    onClick={handleConfirmImport}
                    disabled={
                        !selectedOffice ||
                        !selectedFiscalYear ||
                        newBlocks.length === 0 ||
                        importing
                    }
                >
                    {importing && <Spinner />}
                    Confirm &amp; Import {newBlocks.length} PPA
                    {newBlocks.length === 1 ? '' : 's'}
                </Button>
            </div>
        </TabsContent>
    );
}
