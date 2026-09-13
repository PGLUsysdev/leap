// resources/js/pages/imports/price-list-import/steps/calibrate-step.tsx

import { ImportPpmpCalibrateStep } from '@/components/imports/import-ppmp-calibrate-step';
import { getDefaultSharedConfig } from '@/lib/ppmp/sheet-config';
import type { PriceListImportState } from '../types';

export function CalibrateStep({ s }: { s: PriceListImportState }) {
    const verifyMarks: Record<string, boolean> = {};

    for (const [sheet, result] of Object.entries(s.verifyResults)) {
        if (result) {
            verifyMarks[sheet] = result.valid;
        }
    }

    return (
        <ImportPpmpCalibrateStep
            calibrationMode={s.calibrationMode}
            setCalibrationMode={s.setCalibrationMode}
            sharedConfig={s.sharedConfig}
            setSharedConfig={s.setSharedConfig}
            calibrations={s.calibrations}
            setCalibrations={s.setCalibrations}
            currentSheet={s.currentSheet}
            setCurrentSheet={s.setCurrentSheet}
            selectedSheets={s.selectedSheets}
            getDefaultConfig={getDefaultSharedConfig}
            onInvalidate={() => {
                s.setVerifyResults({});
                s.setRawItems([]);
                s.setUniqueItems([]);
                s.setSelected(new Set());
                s.setCoaOverrides({});
                s.setReviewFilter('all');
                s.setShowDuplicateDetails(false);
            }}
            verifyMarks={verifyMarks}
            onBack={() => s.setStep('upload')}
            onNext={() => s.setStep('verify')}
            canNext={s.isMounted ? !!s.sharedConfig : true}
            nextLabel="Next: Verify Format"
        />
    );
}
