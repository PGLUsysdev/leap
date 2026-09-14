// resources/js/pages/imports/category-coa-mapping/steps/calibrate-step.tsx

import { ImportPpmpCalibrateStep } from '@/components/imports/import-ppmp-calibrate-step';
import { getDefaultMappingConfig } from '@/lib/ppmp/sheet-config';
import type { CategoryCoaMappingState } from '../types';

export function CalibrateStep({ s }: { s: CategoryCoaMappingState }) {
    const verifyMarks: Record<string, boolean> = {};

    for (const [sheet, result] of Object.entries(s.formatResults)) {
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
            getDefaultConfig={getDefaultMappingConfig}
            onInvalidate={() => {
                s.setVerification(null);
                s.setFormatResults({});
                s.setActiveFormatSheet(s.selectedSheets[0] ?? '');
                s.setActiveVerifySheet(s.selectedSheets[0] ?? '');
                s.setCoaOverrides({});
            }}
            verifyMarks={verifyMarks}
            onBack={() => s.setStep('upload')}
            onNext={() => s.setStep('verifyFormat')}
            canNext={s.canVerifyFormat}
            nextLabel="Next: Verify Format"
        />
    );
}
