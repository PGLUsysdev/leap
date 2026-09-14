import { ReviewStep } from './review-step';
import { ImportStep } from './import-step';
import type { PriceListQuantitiesImportState } from '../types';

export function ReviewAndImport({ s }: { s: PriceListQuantitiesImportState }) {
    return (
        <>
            <ReviewStep s={s} />
            <ImportStep s={s} />
        </>
    );
}
