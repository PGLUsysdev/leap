import { ImportPpmpExtractShell } from '@/components/imports/import-extract-step';
import type { CategoryCoaMappingState } from '../types';

export function ExtractStep({ s }: { s: CategoryCoaMappingState }) {
    const { selectedSheets, canExtract, hasAnyExtract, ppmpRawItems, ppmpExtractResults, rawSheets, handlePpmpExtract, setStep } = s as unknown as {
        selectedSheets: string[];
        canExtract: boolean;
        hasAnyExtract: boolean;
        ppmpRawItems: import('@/lib/ppmp/extract').RawPpmpItem[];
        ppmpExtractResults: Record<string, import('@/lib/ppmp/extract').PpmpExtractResult>;
        rawSheets: Record<string, import('@/lib/raw-extract').RawSheet>;
        handlePpmpExtract: () => void;
        setStep: (v: string) => void;
    };

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
            hasAnyVerify={canExtract}
            allVerifyValid={canExtract}
            rawItems={ppmpRawItems}
            bySheet={bySheet}
            rawSheets={rawSheets}
            details={details}
            message={message}
            onRunExtract={handlePpmpExtract}
            onBack={() => setStep('verifyFormat')}
            onNext={() => setStep('review')}
            canNext={hasRawSheets || hasAnyExtract}
            nextLabel="Next: Review & Save"
        />
    );
}
