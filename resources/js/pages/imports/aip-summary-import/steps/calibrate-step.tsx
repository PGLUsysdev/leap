// resources/js/pages/imports/aip-summary-import/steps/calibrate-step.tsx

import { ImportAipCalibrateStep } from '@/components/imports/import-aip-calibrate-step';
import type { AipImportState } from '../types';

export function CalibrateStep({ s }: { s: AipImportState }) {
    return (
        <ImportAipCalibrateStep
            config={s.config}
            selectedSheet={s.selectedSheet}
            canVerify={s.canVerify}
            onHeaderRowChange={s.updateHeaderRow}
            onHasNumberRowChange={s.updateHasNumberRow}
            onColumnChange={s.updateColumn}
            onResetDefaults={s.handleResetDefaults}
            onLogContents={s.handleLogContents}
            onBack={() => s.setStep('upload')}
            onNext={() => s.setStep('verify')}
            nextLabel="Next: Verify"
        />
    );
}
