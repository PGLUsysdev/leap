// resources/js/pages/imports/price-list-quantities-import/steps/calibrate-step.tsx

import { ImportPpmpCalibrateStep } from '@/components/imports/import-ppmp-calibrate-step';
import { getDefaultQuantitiesConfig } from '@/lib/ppmp/sheet-config';
import type { PriceListQuantitiesImportState } from '../types';

export function CalibrateStep({ s }: { s: PriceListQuantitiesImportState }) {
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
            getDefaultConfig={getDefaultQuantitiesConfig}
            onInvalidate={() => {
                s.setExtractResults({});
                s.setVerifyResults({});
                s.setActiveExtractSheet('');
                s.setActiveVerifySheet('');
            }}
            showQtyStart
            onBack={() => s.setStep('upload')}
            onNext={() => {
                s.handleVerify();
                s.setStep('verify');
            }}
            canNext={s.canVerify}
            nextLabel="Run verification"
        />
    );
}
