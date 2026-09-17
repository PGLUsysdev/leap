// resources/js/pages/imports/aip-summary-import/steps/import-ppa-step.tsx
//
// Page-local Import PPA step (not shared — AIP-only). Single-sheet mode:
// blocks are grouped from the extract result and matched against existing
// PPAs scoped to the selected office + fiscal year.

import { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/data-table';
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
import type {
    FiscalYear,
    ImportOffice,
    PpaBlock,
} from '../types';

const columnHelper = createColumnHelper<PpaBlock>();

function getPpaBlockColumns() {
    return [
        columnHelper.accessor('fullCode', {
            size: 160,
            header: () => <div className="px-1">Full Code</div>,
            cell: ({ getValue }) => (
                <span className="block px-1 font-mono font-medium whitespace-nowrap">
                    {getValue()}
                </span>
            ),
        }),
        columnHelper.accessor('name', {
            size: 240,
            header: () => <div className="px-1">Name &amp; Type</div>,
            cell: ({ row }) => (
                <div className="px-1">
                    <div
                        className="max-w-[28ch] truncate font-medium"
                        title={row.original.name}
                    >
                        {row.original.name}
                    </div>
                    <div className="text-muted-foreground text-[10px] uppercase">
                        {row.original.type}
                    </div>
                </div>
            ),
        }),
        columnHelper.accessor('status', {
            size: 100,
            header: () => <div className="px-1">Status</div>,
            cell: ({ getValue }) =>
                getValue() === 'exists' ? (
                    <span className="px-1 font-medium text-green-600">
                        Exists
                    </span>
                ) : (
                    <span className="px-1 font-medium text-blue-600">New</span>
                ),
        }),
        columnHelper.accessor((row) => row.rows.join(', '), {
            id: 'rows',
            size: 120,
            header: () => <div className="px-1">Rows</div>,
            cell: ({ getValue }) => {
                const value = getValue();

                return (
                    <span
                        className="text-muted-foreground block max-w-[20ch] truncate px-1 font-mono"
                        title={value}
                    >
                        {value}
                    </span>
                );
            },
        }),
    ];
}

interface ImportPpaStepProps {
    tabsValue?: string;

    selectedSheet: string;
    existingOffices: ImportOffice[];
    fiscalYears: FiscalYear[];
    selectedOffice: string;
    onOfficeChange: (v: string) => void;
    selectedOfficeLabel: string;
    selectedFiscalYear: string;
    onFiscalYearChange: (v: string) => void;
    selectedFiscalYearLabel: string;
    blocksForImport: PpaBlock[];
    newBlocks: PpaBlock[];
    importing: boolean;
    onConfirm: () => void;
    onBack: () => void;
    backLabel?: string;
}

export function ImportPpaStep({
    tabsValue = 'import-ppa',

    selectedSheet,
    existingOffices,
    fiscalYears,
    selectedOffice,
    onOfficeChange,
    selectedOfficeLabel,
    selectedFiscalYear,
    onFiscalYearChange,
    selectedFiscalYearLabel,
    blocksForImport,
    newBlocks,
    importing,
    onConfirm,
    onBack,
    backLabel = 'Back: Extract',
}: ImportPpaStepProps) {
    const columns = useMemo(() => getPpaBlockColumns(), []);

    return (
        <TabsContent value={tabsValue} className="mt-4 flex flex-col gap-4">
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
                        onValueChange={(v) => onOfficeChange(v ?? '')}
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
                        onValueChange={(v) => onFiscalYearChange(v ?? '')}
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
                        <DataTable
                            data={blocksForImport}
                            columns={columns}
                            withColgroup
                            className="h-[420px]"
                        />
                    )}
                </>
            ) : (
                <div className="text-muted-foreground text-sm">
                    Please select a target office and fiscal year to review the
                    extracted PPAs.
                </div>
            )}

            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={onBack}>
                    {backLabel}
                </Button>
                <Button
                    onClick={onConfirm}
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
