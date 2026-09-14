// resources/js/pages/imports/price-list-import/steps/extract-step.tsx
import { ImportPpmpExtractShell } from '@/components/imports/import-extract-step';
import type { PriceListImportState } from '../types';

export function ExtractStep({ s }: { s: PriceListImportState }) {
    const { selectedSheets, canVerify, hasAnyVerify, allVerifyValid, ppmpRawItems, ppmpExtractResults, rawSheets, handlePpmpExtract, setStep } = s as unknown as {
        selectedSheets: string[];
        canVerify: boolean;
        hasAnyVerify: boolean;
        allVerifyValid: boolean;
        ppmpRawItems: import('@/lib/ppmp/extract').RawPpmpItem[];
        ppmpExtractResults: Record<string, import('@/lib/ppmp/extract').PpmpExtractResult>;
        rawSheets: Record<string, import('@/lib/raw-extract').RawSheet>;
        handlePpmpExtract: () => void;
        setStep: (s: unknown) => void;
    };

    const canExtract = canVerify && hasAnyVerify && allVerifyValid;
    const bySheet: Record<string, import('@/lib/ppmp/extract').RawPpmpItem[]> = {};
    for (const item of ppmpRawItems) {
        bySheet[item.sheet] = bySheet[item.sheet] ?? [];
        bySheet[item.sheet].push(item);
    }
    const details = ppmpRawItems.length > 0 ? [`Extracted ${ppmpRawItems.length} raw rows`] : [];
    const message = ppmpRawItems.length > 0 ? `Extracted ${ppmpRawItems.length} raw rows` : undefined;

    const hasRawSheets = rawSheets && Object.keys(rawSheets).length > 0;
    return (
        <ImportPpmpExtractShell
            sheets={selectedSheets}
            canExtract={canExtract}
            hasAnyVerify={hasAnyVerify}
            allVerifyValid={allVerifyValid}
            rawItems={ppmpRawItems}
            bySheet={bySheet}
            rawSheets={rawSheets}
            details={details}
            message={message}
            onRunExtract={handlePpmpExtract}
            onBack={() => (setStep as (s: string) => void)('verify')}
            onNext={() => (setStep as (s: string) => void)('review')}
            canNext={hasRawSheets || ppmpRawItems.length > 0}
            nextLabel="Next: Review & Import"
        />
    );
}
