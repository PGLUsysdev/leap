// resources/js/pages/price-list-quantities-import/steps/import-step.tsx

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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { TabsContent } from '@/components/ui/tabs';
import type { PriceListQuantitiesImportState } from '../types';

export function ImportStep({ s }: { s: PriceListQuantitiesImportState }) {
    const {
        importSheets,
        mappedBySheet,
        effectiveImportSheet,
        mappedItems,
        matchedCount,
        activeImportSheet,
        setActiveImportSheet,

        officeItems,
        officeValue,
        existingOffices,
        selectedOfficeId,
        setSelectedOfficeId,

        fiscalYears,
        selectedFiscalYearId,
        setSelectedFiscalYearId,
        ppasForSelection,

        ppaItems,
        ppaValue,
        selectedPpaId,
        setSelectedPpaId,
        existingPpas,

        outputItems,
        outputValue,
        outputsForSelection,
        selectedAipOutputId,
        setSelectedAipOutputId,

        fundingSourceItems,
        fundingSourceValue,
        fundingSourcesForSelection,
        selectedPpaFundingSourceId,
        setSelectedPpaFundingSourceId,

        showOnlyUnmapped,
        setShowOnlyUnmapped,
        showOnlyWithQty,
        setShowOnlyWithQty,
        excludeUnmapped,
        setExcludeUnmapped,
        excludeAmbiguous,
        setExcludeAmbiguous,
        excludeUnclassified,
        setExcludeUnclassified,
        unclassifiedCount,
        importableItems,
        importing,
        handleImport,
        isUnclassified,
    } = s;

    return (
        <TabsContent value="import" className="mt-4 flex flex-col gap-4">
            {importSheets.length === 0 && (
                <p className="text-muted-foreground text-sm">
                    Run extraction in Review first.
                </p>
            )}

            {importSheets.length > 0 && (
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
                                    setSelectedOfficeId(
                                        match ? Number(match[1]) : null,
                                    );
                                    setSelectedPpaId(null);
                                    setSelectedAipOutputId(null);
                                    setSelectedPpaFundingSourceId(null);
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
                                    ? `${existingOffices.length} offices — 1 selected`
                                    : `Displaying all ${existingOffices.length} offices — pick one to scope this import.`}
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
                                    setSelectedFiscalYearId(
                                        v ? Number(v) : null,
                                    );
                                    setSelectedPpaId(null);
                                    setSelectedAipOutputId(null);
                                    setSelectedPpaFundingSourceId(null);
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
                                    ? `${ppasForSelection.length} PPAs in scope`
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
                                    setSelectedPpaId(
                                        match ? Number(match[1]) : null,
                                    );
                                    setSelectedAipOutputId(null);
                                    setSelectedPpaFundingSourceId(null);
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
                                    : `Showing ${ppasForSelection.length} of ${existingPpas.length} PPAs for the selected office/year.`}
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
                                    setSelectedAipOutputId(
                                        match ? Number(match[1]) : null,
                                    );
                                    setSelectedPpaFundingSourceId(null);
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
                                      ? `Showing ${outputsForSelection.length} output(s) for the selected PPA.`
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
                                    setSelectedPpaFundingSourceId(
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
                                      ? `Showing ${fundingSourcesForSelection.length} funding source(s) for the selected output.`
                                      : 'Pick office, PPA, and output to list funding sources.'}
                            </FieldDescription>
                        </Field>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {importSheets.map((sh) => {
                            const items = mappedBySheet[sh] ?? [];
                            const matched = items.filter(
                                (m) => m.status === 'matched',
                            ).length;

                            return (
                                <Button
                                    key={sh}
                                    variant={
                                        effectiveImportSheet === sh
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => setActiveImportSheet(sh)}
                                >
                                    {sh} ({matched}/{items.length})
                                </Button>
                            );
                        })}
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
                                    setShowOnlyUnmapped(v === true)
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
                                    setShowOnlyWithQty(v === true)
                                }
                            />
                            Show only rows with quantities
                            {mappedItems.filter((m) => m.monthTotal > 0)
                                .length > 0 &&
                                ` (${mappedItems.filter((m) => m.monthTotal > 0).length})`}
                        </label>
                        <span className="text-muted-foreground text-xs">
                            Sheet: {effectiveImportSheet} —{' '}
                            {importableItems.length} of {mappedItems.length}{' '}
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
                                    setExcludeUnmapped(v === true)
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
                                    setExcludeAmbiguous(v === true)
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
                                    setExcludeUnclassified(v === true)
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
                                importableItems.length === 0 ||
                                importing
                            }
                            onClick={handleImport}
                        >
                            {importing
                                ? 'Importing…'
                                : `Import ${importableItems.length} to PPMP`}
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

                    <ScrollArea className="w-full rounded-lg border">
                        <Table className="[&_td]:border-l [&_td:first-child]:border-l-0 [&_th]:border-l [&_th:first-child]:border-l-0">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">
                                        Row
                                    </TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead className="text-right">
                                        Total qty
                                    </TableHead>
                                    <TableHead>Price list match</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mappedItems
                                    .filter(
                                        (m) =>
                                            !showOnlyUnmapped ||
                                            m.status !== 'matched',
                                    )
                                    .filter(
                                        (m) =>
                                            !showOnlyWithQty ||
                                            m.monthTotal > 0,
                                    )
                                    .map((m) => (
                                        <TableRow key={m.key}>
                                            <TableCell className="text-right tabular-nums">
                                                {m.rows.join(', ')}
                                            </TableCell>
                                            <TableCell className="max-w-80 break-words whitespace-normal">
                                                {m.description}
                                            </TableCell>
                                            <TableCell>{m.unit}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {m.monthTotal === 0
                                                    ? ''
                                                    : m.monthTotal}
                                            </TableCell>
                                            <TableCell>
                                                {m.status === 'matched'
                                                    ? `₱${m.priceListPrice}`
                                                    : '—'}
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const noClass =
                                                        m.status ===
                                                            'matched' &&
                                                        isUnclassified(m);

                                                    return (
                                                        <>
                                                            <Badge
                                                                variant={
                                                                    m.status ===
                                                                    'matched'
                                                                        ? noClass
                                                                            ? 'destructive'
                                                                            : 'default'
                                                                        : 'destructive'
                                                                }
                                                            >
                                                                {m.status ===
                                                                'matched'
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
                                                        </>
                                                    );
                                                })()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            )}
        </TabsContent>
    );
}
