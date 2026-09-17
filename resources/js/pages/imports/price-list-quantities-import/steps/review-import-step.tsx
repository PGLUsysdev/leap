// resources/js/pages/imports/price-list-quantities-import/steps/review-import-step.tsx
//
// Page-local Review & Import (not shared — quantities-only). Single-sheet
// mode: extraction review on top (message, errors, items with hide-empty
// toggle), scope cascade + price-list-matched items + confirm below.
// The page keeps its state.

import { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import type { QuantitiesExtractResult } from '@/lib/ppmp/quantities-extract';
import type { FiscalYearOption, MappedItem } from '../types';

const columnHelper = createColumnHelper<MappedItem>();

function getMappedItemColumns(isUnclassified: (m: MappedItem) => boolean) {
    return [
        columnHelper.accessor((row) => row.rows.join(', '), {
            id: 'rows',
            size: 90,
            header: () => <div className="px-1 text-right">Row</div>,
            cell: ({ getValue }) => (
                <span className="block px-1 text-right tabular-nums">
                    {getValue()}
                </span>
            ),
        }),
        columnHelper.accessor('description', {
            size: 240,
            header: () => <div className="px-1">Description</div>,
            cell: ({ getValue }) => {
                const value = getValue();

                return (
                    <span
                        className="block max-w-[28ch] truncate px-1"
                        title={value}
                    >
                        {value}
                    </span>
                );
            },
        }),
        columnHelper.accessor('unit', {
            size: 90,
            header: () => <div className="px-1">Unit</div>,
            cell: ({ getValue }) => <span className="px-1">{getValue()}</span>,
        }),
        columnHelper.accessor('monthTotal', {
            size: 100,
            header: () => <div className="px-1 text-right">Total qty</div>,
            cell: ({ getValue }) => {
                const value = getValue();

                return (
                    <span className="block px-1 text-right font-medium">
                        {value === 0 ? '' : value}
                    </span>
                );
            },
        }),
        columnHelper.display({
            id: 'match',
            size: 130,
            header: () => <div className="px-1">Price list match</div>,
            cell: ({ row }) =>
                row.original.status === 'matched' ? (
                    <span className="px-1">₱{row.original.priceListPrice}</span>
                ) : (
                    <span className="px-1">—</span>
                ),
        }),
        columnHelper.display({
            id: 'status',
            size: 200,
            header: () => <div className="px-1">Status</div>,
            cell: ({ row }) => {
                const m = row.original;
                const noClass =
                    m.status === 'matched' && isUnclassified(m);

                return (
                    <div className="px-1">
                        <Badge
                            variant={
                                m.status === 'matched'
                                    ? noClass
                                        ? 'destructive'
                                        : 'default'
                                    : 'destructive'
                            }
                        >
                            {m.status === 'matched'
                                ? noClass
                                    ? 'No class'
                                    : 'Mapped'
                                : 'Unmapped'}
                        </Badge>
                        <p className="text-muted-foreground mt-1 text-xs">
                            {noClass
                                ? 'COA has no expense class — link it on the Expense Class Codes page.'
                                : m.message}
                        </p>
                    </div>
                );
            },
        }),
    ];
}

interface ReviewImportStepProps {
    tabsValue?: string;

    selectedSheet: string | null;
    extractResult: QuantitiesExtractResult | null;
    allVerifyValid: boolean;
    canRunExtraction: boolean;
    onRunExtraction: () => void;

    mappedItems: MappedItem[];
    matchedCount: number;
    effectiveImportSheet: string;
    importableCount: number;
    unclassifiedCount: number;
    isUnclassified: (m: MappedItem) => boolean;

    officeItems: string[];
    officeValue: string;
    selectedOfficeId: number | null;
    onOfficeChange: (id: number | null) => void;

    fiscalYears: FiscalYearOption[];
    selectedFiscalYearId: number | null;
    onFiscalYearChange: (id: number | null) => void;
    ppaScopeCount: number;

    ppaItems: string[];
    ppaValue: string;
    selectedPpaId: number | null;
    onPpaChange: (id: number | null) => void;
    ppaTotalCount: number;

    outputItems: string[];
    outputValue: string;
    selectedAipOutputId: number | null;
    onOutputChange: (id: number | null) => void;
    outputScopeCount: number;

    fundingSourceItems: string[];
    fundingSourceValue: string;
    selectedPpaFundingSourceId: number | null;
    onFundingSourceChange: (id: number | null) => void;
    fundingSourceScopeCount: number;

    showOnlyUnmapped: boolean;
    onShowOnlyUnmappedChange: (v: boolean) => void;
    showOnlyWithQty: boolean;
    onShowOnlyWithQtyChange: (v: boolean) => void;
    excludeUnmapped: boolean;
    onExcludeUnmappedChange: (v: boolean) => void;
    excludeAmbiguous: boolean;
    onExcludeAmbiguousChange: (v: boolean) => void;
    excludeUnclassified: boolean;
    onExcludeUnclassifiedChange: (v: boolean) => void;

    importing: boolean;
    onImport: () => void;
}

export function ReviewImportStep({
    tabsValue = 'review',

    selectedSheet,
    extractResult,
    allVerifyValid,
    canRunExtraction,
    onRunExtraction,

    mappedItems,
    matchedCount,
    effectiveImportSheet,
    importableCount,
    unclassifiedCount,
    isUnclassified,

    officeItems,
    officeValue,
    selectedOfficeId,
    onOfficeChange,

    fiscalYears,
    selectedFiscalYearId,
    onFiscalYearChange,
    ppaScopeCount,

    ppaItems,
    ppaValue,
    selectedPpaId,
    onPpaChange,
    ppaTotalCount,

    outputItems,
    outputValue,
    selectedAipOutputId,
    onOutputChange,
    outputScopeCount,

    fundingSourceItems,
    fundingSourceValue,
    selectedPpaFundingSourceId,
    onFundingSourceChange,
    fundingSourceScopeCount,

    showOnlyUnmapped,
    onShowOnlyUnmappedChange,
    showOnlyWithQty,
    onShowOnlyWithQtyChange,
    excludeUnmapped,
    onExcludeUnmappedChange,
    excludeAmbiguous,
    onExcludeAmbiguousChange,
    excludeUnclassified,
    onExcludeUnclassifiedChange,

    importing,
    onImport,
}: ReviewImportStepProps) {
    const columns = useMemo(
        () => getMappedItemColumns(isUnclassified),
        [isUnclassified],
    );

    const filteredItems = useMemo(
        () =>
            mappedItems
                .filter(
                    (m) => !showOnlyUnmapped || m.status !== 'matched',
                )
                .filter(
                    (m) => !showOnlyWithQty || m.monthTotal > 0,
                ),
        [mappedItems, showOnlyUnmapped, showOnlyWithQty],
    );

    const withQtyCount = useMemo(
        () => mappedItems.filter((m) => m.monthTotal > 0).length,
        [mappedItems],
    );

    return (
        <TabsContent value={tabsValue} className="mt-4 flex flex-col gap-4">
            {selectedSheet === null && (
                <p className="text-muted-foreground text-sm">
                    No sheet selected.
                </p>
            )}

            {selectedSheet !== null && !extractResult && (
                <div className="flex flex-col items-start gap-2">
                    <p className="text-muted-foreground text-sm">
                        {allVerifyValid
                            ? 'Extraction has not run yet.'
                            : 'Verify the sheet first.'}
                    </p>
                    <Button
                        disabled={!canRunExtraction}
                        onClick={onRunExtraction}
                    >
                        Run extraction
                    </Button>
                </div>
            )}

            {extractResult && extractResult.errors.length > 0 && (
                <ul className="text-destructive flex flex-col gap-1 text-sm">
                    {extractResult.errors.map((e, i) => (
                        <li key={i}>
                            Row {e.row}: {e.message}
                        </li>
                    ))}
                </ul>
            )}

            {extractResult && mappedItems.length === 0 && (
                <p className="text-muted-foreground text-sm">
                    No items to map.
                </p>
            )}

            {mappedItems.length > 0 && (
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-end gap-3">
                        <Field className="w-64 max-w-md">
                            <FieldLabel>Office</FieldLabel>
                            <Combobox
                                items={officeItems}
                                value={officeValue}
                                onValueChange={(val) => {
                                    const match = /^office:(\d+):/.exec(
                                        (val as string | null) ?? '',
                                    );
                                    onOfficeChange(
                                        match ? Number(match[1]) : null,
                                    );
                                }}
                            >
                                <ComboboxInput
                                    placeholder="Search offices..."
                                    className="h-9"
                                />
                                <ComboboxContent>
                                    <ComboboxEmpty>
                                        No office found.
                                    </ComboboxEmpty>
                                    <ComboboxList>
                                        {(item: string) => (
                                            <ComboboxItem
                                                key={item}
                                                value={item}
                                            >
                                                {item.replace(
                                                    /^office:\d+:/,
                                                    '',
                                                )}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                            <FieldDescription>
                                {selectedOfficeId
                                    ? `1 office selected — pick one to scope this import.`
                                    : `Pick one to scope this import.`}
                            </FieldDescription>
                        </Field>
                        <Field className="w-40">
                            <FieldLabel>Year</FieldLabel>
                            <Select
                                value={
                                    selectedFiscalYearId != null
                                        ? String(selectedFiscalYearId)
                                        : ''
                                }
                                onValueChange={(v) => {
                                    onFiscalYearChange(
                                        v ? Number(v) : null,
                                    );
                                }}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {fiscalYears.map((fy) => (
                                            <SelectItem
                                                key={fy.id}
                                                value={String(fy.id)}
                                            >
                                                {fy.year}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FieldDescription>
                                {selectedFiscalYearId
                                    ? `${ppaScopeCount} PPAs in scope`
                                    : `Pick a year to filter PPAs.`}
                            </FieldDescription>
                        </Field>
                        <Field className="w-96 max-w-full">
                            <FieldLabel>PPA</FieldLabel>
                            <Combobox
                                items={ppaItems}
                                value={ppaValue}
                                onValueChange={(val) => {
                                    const match = /^ppa:(\d+):/.exec(
                                        (val as string | null) ?? '',
                                    );
                                    onPpaChange(
                                        match ? Number(match[1]) : null,
                                    );
                                }}
                            >
                                <ComboboxInput
                                    placeholder={
                                        selectedOfficeId || selectedFiscalYearId
                                            ? 'Search PPAs...'
                                            : 'Select office/year first...'
                                    }
                                    className="h-9"
                                />
                                <ComboboxContent>
                                    <ComboboxEmpty>No PPA found.</ComboboxEmpty>
                                    <ComboboxList>
                                        {(item: string) => (
                                            <ComboboxItem
                                                key={item}
                                                value={item}
                                            >
                                                {item.replace(/^ppa:\d+:/, '')}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                            <FieldDescription>
                                {selectedPpaId
                                    ? '1 PPA selected'
                                    : `Showing ${ppaScopeCount} of ${ppaTotalCount} PPAs for the selected office/year.`}
                            </FieldDescription>
                        </Field>
                        <Field className="w-96 max-w-full">
                            <FieldLabel>Expected output</FieldLabel>
                            <Combobox
                                items={outputItems}
                                value={outputValue}
                                onValueChange={(val) => {
                                    const match = /^output:(\d+):/.exec(
                                        (val as string | null) ?? '',
                                    );
                                    onOutputChange(
                                        match ? Number(match[1]) : null,
                                    );
                                }}
                            >
                                <ComboboxInput
                                    placeholder={
                                        selectedPpaId
                                            ? 'Search outputs...'
                                            : 'Select a PPA first...'
                                    }
                                    disabled={!selectedPpaId}
                                    className="h-9"
                                />
                                <ComboboxContent>
                                    <ComboboxEmpty>
                                        No output found.
                                    </ComboboxEmpty>
                                    <ComboboxList>
                                        {(item: string) => (
                                            <ComboboxItem
                                                key={item}
                                                value={item}
                                            >
                                                {item.replace(
                                                    /^output:\d+:/,
                                                    '',
                                                )}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                            <FieldDescription>
                                {selectedAipOutputId
                                    ? '1 output selected'
                                    : selectedPpaId
                                      ? `Showing ${outputScopeCount} output(s) for the selected PPA.`
                                      : 'Pick a PPA to list its expected outputs.'}
                            </FieldDescription>
                        </Field>
                        <Field className="w-96 max-w-full">
                            <FieldLabel>Funding source</FieldLabel>
                            <Combobox
                                items={fundingSourceItems}
                                value={fundingSourceValue}
                                onValueChange={(val) => {
                                    const match = /^fs:(\d+):/.exec(
                                        (val as string | null) ?? '',
                                    );
                                    onFundingSourceChange(
                                        match ? Number(match[1]) : null,
                                    );
                                }}
                            >
                                <ComboboxInput
                                    placeholder={
                                        selectedAipOutputId
                                            ? 'Search funding sources...'
                                            : 'Select an output first...'
                                    }
                                    disabled={!selectedAipOutputId}
                                    className="h-9"
                                />
                                <ComboboxContent>
                                    <ComboboxEmpty>
                                        No funding source found.
                                    </ComboboxEmpty>
                                    <ComboboxList>
                                        {(item: string) => (
                                            <ComboboxItem
                                                key={item}
                                                value={item}
                                            >
                                                {item.replace(/^fs:\d+:/, '')}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                            <FieldDescription>
                                {selectedPpaFundingSourceId
                                    ? '1 funding source selected — quantities import to this source.'
                                    : selectedAipOutputId
                                      ? `Showing ${fundingSourceScopeCount} funding source(s) for the selected output.`
                                      : 'Pick office, PPA, and output to list funding sources.'}
                            </FieldDescription>
                        </Field>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="default">
                            {matchedCount} of {mappedItems.length} mapped
                        </Badge>
                        <label
                            htmlFor="show-only-unmapped"
                            className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                            <Checkbox
                                id="show-only-unmapped"
                                checked={showOnlyUnmapped}
                                onCheckedChange={(v) =>
                                    onShowOnlyUnmappedChange(v === true)
                                }
                            />
                            Show only unmapped
                            {mappedItems.length - matchedCount > 0 &&
                                ` (${mappedItems.length - matchedCount})`}
                        </label>
                        <label
                            htmlFor="show-only-with-qty"
                            className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                            <Checkbox
                                id="show-only-with-qty"
                                checked={showOnlyWithQty}
                                onCheckedChange={(v) =>
                                    onShowOnlyWithQtyChange(v === true)
                                }
                            />
                            Show only rows with quantities
                            {withQtyCount > 0 && ` (${withQtyCount})`}
                        </label>
                        <span className="text-muted-foreground text-xs">
                            Sheet: {effectiveImportSheet} —{' '}
                            {importableCount} of {mappedItems.length}{' '}
                            queued for import.
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                        <label
                            htmlFor="exclude-unmapped"
                            className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                            <Checkbox
                                id="exclude-unmapped"
                                checked={excludeUnmapped}
                                onCheckedChange={(v) =>
                                    onExcludeUnmappedChange(v === true)
                                }
                            />
                            Exclude unmapped (not in price list)
                        </label>
                        <label
                            htmlFor="exclude-ambiguous"
                            className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                            <Checkbox
                                id="exclude-ambiguous"
                                checked={excludeAmbiguous}
                                onCheckedChange={(v) =>
                                    onExcludeAmbiguousChange(v === true)
                                }
                            />
                            Exclude ambiguous (multiple matches)
                        </label>
                        <label
                            htmlFor="exclude-unclassified"
                            className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                            <Checkbox
                                id="exclude-unclassified"
                                checked={excludeUnclassified}
                                onCheckedChange={(v) =>
                                    onExcludeUnclassifiedChange(v === true)
                                }
                            />
                            Exclude unclassified (no expense class)
                            {unclassifiedCount > 0 && ` (${unclassifiedCount})`}
                        </label>
                        <Button
                            disabled={
                                !selectedPpaId ||
                                !selectedAipOutputId ||
                                !selectedPpaFundingSourceId ||
                                importableCount === 0 ||
                                importing
                            }
                            onClick={onImport}
                        >
                            {importing
                                ? 'Importing…'
                                : `Import ${importableCount} to PPMP`}
                        </Button>
                        {(!selectedPpaId ||
                            !selectedAipOutputId ||
                            !selectedPpaFundingSourceId) && (
                            <span className="text-muted-foreground text-xs">
                                Select office, year, PPA, output, and funding
                                source above to enable import.
                            </span>
                        )}
                    </div>

                    <DataTable
                        data={filteredItems}
                        columns={columns}
                        withColgroup
                        className="h-[480px]"
                    />
                </div>
            )}
        </TabsContent>
    );
}
