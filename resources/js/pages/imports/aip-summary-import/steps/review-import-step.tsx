import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AipImportState } from '../types';
import { ImportPpaStep } from './import-ppa-step';
import { ImportOutputsStep } from './import-outputs-step';
import { ImportFundingStep } from './import-funding-step';

export function ReviewAndImport({ s }: { s: AipImportState }) {
    const { importTarget } = s as unknown as { importTarget: string };

    return (
        <TabsContent value="review" className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold tracking-tight">Review & Import — DB mapping</h2>
                <p className="text-muted-foreground text-sm">Review and import PPA, Expected Outputs, and Funding Sources — all DB connecting mapping in one tab.</p>
            </div>
            <Tabs value={importTarget} onValueChange={(v) => (s as unknown as { setImportTarget: (t: string) => void }).setImportTarget(v as never)}>
                <TabsList>
                    <TabsTrigger value="ppa">PPA</TabsTrigger>
                    <TabsTrigger value="outputs">Expected Outputs</TabsTrigger>
                    <TabsTrigger value="funding">Funding Source</TabsTrigger>
                </TabsList>
                <ImportPpaStep s={s} />
                <ImportOutputsStep s={s} />
                <ImportFundingStep s={s} />
            </Tabs>
        </TabsContent>
    );
}
