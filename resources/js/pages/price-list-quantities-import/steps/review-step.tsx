// resources/js/pages/price-list-quantities-import/steps/review-step.tsx

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TabsContent } from '@/components/ui/tabs';
import { ReviewItemsTable } from '../components/review-items-table';
import type { PriceListQuantitiesImportState } from '../types';

export function ReviewStep({ s }: { s: PriceListQuantitiesImportState }) {
    const {
        selectedSheets,
        allVerifyValid,
        canReview,
        extractResults,
        activeExtractSheet,
        setActiveExtractSheet,
        hideEmptyQty,
        setHideEmptyQty,
        runExtraction,
        setActiveImportSheet,
        setStep,
    } = s;

    return (
        <TabsContent value="review" className="mt-4 flex flex-col gap-4">
            {selectedSheets.length === 0 && (
                <p className="text-muted-foreground text-sm">
                    No sheets selected.
                </p>
            )}

            {selectedSheets.length > 0 &&
                Object.keys(extractResults).length === 0 && (
                    <div className="flex flex-col items-start gap-2">
                        <p className="text-muted-foreground text-sm">
                            {allVerifyValid
                                ? 'Extraction has not run yet.'
                                : 'Verify all sheets first.'}
                        </p>
                        <Button disabled={!canReview} onClick={runExtraction}>
                            Run extraction
                        </Button>
                    </div>
                )}

            {Object.keys(extractResults).length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    {selectedSheets.map((sh) => (
                        <Button
                            key={sh}
                            variant={
                                activeExtractSheet === sh
                                    ? 'default'
                                    : 'outline'
                            }
                            size="sm"
                            onClick={() => setActiveExtractSheet(sh)}
                        >
                            {sh}{' '}
                            {extractResults[sh]?.valid
                                ? '✓'
                                : extractResults[sh]
                                  ? '❌'
                                  : ''}
                        </Button>
                    ))}
                    <Button
                        size="sm"
                        onClick={() => {
                            setActiveImportSheet(activeExtractSheet);
                            setStep('import');
                        }}
                    >
                        Go to Import →
                    </Button>
                </div>
            )}

            {activeExtractSheet && extractResults[activeExtractSheet] && (
                <div className="flex flex-col gap-3">
                    <p className="text-sm font-medium">
                        {extractResults[activeExtractSheet].message}
                    </p>
                    {extractResults[activeExtractSheet].errors.length > 0 && (
                        <ul className="text-destructive flex flex-col gap-1 text-sm">
                            {extractResults[activeExtractSheet].errors.map(
                                (e, i) => (
                                    <li key={i}>
                                        Row {e.row}: {e.message}
                                    </li>
                                ),
                            )}
                        </ul>
                    )}

                    <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
                        {extractResults[activeExtractSheet].details.map(
                            (d, i) => (
                                <li key={i}>{d}</li>
                            ),
                        )}
                    </ul>

                    {(() => {
                        const items =
                            extractResults[activeExtractSheet].uniqueItems;
                        const emptyCount = items.filter(
                            (item) => item.monthTotal === 0,
                        ).length;
                        const visibleItems = hideEmptyQty
                            ? items.filter((item) => item.monthTotal > 0)
                            : items;

                        return (
                            <>
                                <div className="flex flex-wrap items-center gap-3">
                                    <label
                                        htmlFor="hide-empty-qty"
                                        className="flex cursor-pointer items-center gap-2 text-sm"
                                    >
                                        <Checkbox
                                            id="hide-empty-qty"
                                            checked={hideEmptyQty}
                                            onCheckedChange={(v) =>
                                                setHideEmptyQty(v === true)
                                            }
                                        />
                                        Hide rows with no quantities
                                        {emptyCount > 0 && ` (${emptyCount})`}
                                    </label>
                                    <span className="text-muted-foreground text-xs">
                                        Showing {visibleItems.length} of{' '}
                                        {items.length} items
                                    </span>
                                </div>

                                <ReviewItemsTable items={visibleItems} />
                            </>
                        );
                    })()}
                </div>
            )}
        </TabsContent>
    );
}
