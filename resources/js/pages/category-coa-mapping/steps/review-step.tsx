// resources/js/pages/category-coa-mapping/steps/review-step.tsx

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { TabsContent } from '@/components/ui/tabs';
import type { CategoryCoaMappingState } from '../types';

export function ReviewStep({ s }: { s: CategoryCoaMappingState }) {
    const {
        effectiveVerification,
        existingCategories,
        existingCoas,
        existingMappings,
        isSaving,
        setCoaOverrides,
        handleBulkCreateMappings,
        setStep,
    } = s;

    return (
        <TabsContent value="review" className="mt-4 flex flex-col gap-4">
            {effectiveVerification ? (
                <div className="rounded-lg border">
                    <div className="border-b p-3">
                        <h3 className="text-sm font-semibold">
                            Review — {effectiveVerification.total} unique pairs
                        </h3>
                        <p className="text-muted-foreground text-xs">
                            Checked against {existingCategories.length}{' '}
                            categories, {existingCoas.length} COAs,{' '}
                            {existingMappings.length} mappings —{' '}
                            {effectiveVerification.effMissingMapping} will be
                            created.
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <Badge
                                variant={
                                    effectiveVerification.catFound ===
                                    effectiveVerification.total
                                        ? 'default'
                                        : 'secondary'
                                }
                            >
                                Categories: {effectiveVerification.catFound}/
                                {effectiveVerification.total}
                            </Badge>
                            <Badge
                                variant={
                                    effectiveVerification.effCoaFound ===
                                    effectiveVerification.total
                                        ? 'default'
                                        : 'secondary'
                                }
                            >
                                COAs: {effectiveVerification.effCoaFound}/
                                {effectiveVerification.total}
                            </Badge>
                            <Badge
                                variant={
                                    effectiveVerification.effMappingFound ===
                                    effectiveVerification.total
                                        ? 'default'
                                        : 'secondary'
                                }
                            >
                                Mappings:{' '}
                                {effectiveVerification.effMappingFound}/
                                {effectiveVerification.total}
                            </Badge>
                        </div>
                    </div>
                    <div className="max-h-96 overflow-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-card text-muted-foreground sticky top-0">
                                <tr className="border-b">
                                    <th className="p-2 text-left">Sheet</th>
                                    <th className="p-2 text-left">Category</th>
                                    <th className="p-2 text-left">
                                        COA (Excel → DB)
                                    </th>
                                    <th className="p-2 text-center">Mapping</th>
                                </tr>
                            </thead>
                            <tbody>
                                {effectiveVerification.effectivePairs
                                    .filter(
                                        (p) =>
                                            p.catExists &&
                                            p.effectiveCoaExists &&
                                            !p.effectiveMappingExists,
                                    )
                                    .map((p) => (
                                        <tr key={p.key} className="border-b">
                                            <td className="text-muted-foreground p-2">
                                                {p.sheet}
                                            </td>
                                            <td className="p-2">
                                                {p.category}{' '}
                                                <span className="text-muted-foreground">
                                                    [{p.catId}]
                                                </span>
                                            </td>
                                            <td className="p-2">
                                                {p.coa}{' '}
                                                <span className="text-muted-foreground">
                                                    →
                                                </span>{' '}
                                                {p.effectiveCoa?.path} —{' '}
                                                {p.effectiveCoa?.account_title}
                                            </td>
                                            <td className="p-2 text-center text-amber-600">
                                                ❌ not mapped
                                            </td>
                                        </tr>
                                    ))}
                                {effectiveVerification.effMissingMapping ===
                                    0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="text-muted-foreground p-4 text-center"
                                        >
                                            All mappings already exist — nothing
                                            to create.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t p-3">
                        <span className="text-muted-foreground text-xs">
                            {effectiveVerification.effMissingMapping} mapping(s)
                            will be created. COAs are not created, only linked.
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCoaOverrides({})}
                            >
                                Clear overrides
                            </Button>
                            <Button
                                size="sm"
                                disabled={
                                    isSaving ||
                                    effectiveVerification.effMissingMapping ===
                                        0
                                }
                                onClick={handleBulkCreateMappings}
                            >
                                {isSaving ? (
                                    <>
                                        <Spinner className="mr-1 h-3 w-3" />{' '}
                                        Saving...
                                    </>
                                ) : (
                                    `Create ${effectiveVerification.effMissingMapping} Mapping${effectiveVerification.effMissingMapping === 1 ? '' : 's'}`
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-muted-foreground rounded-lg border p-8 text-center text-sm">
                    Verify first to review mappings.
                </div>
            )}

            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('verifyMap')}>
                    Back
                </Button>
                <Button variant="outline" onClick={() => setStep('calibrate')}>
                    Recalibrate
                </Button>
            </div>
        </TabsContent>
    );
}
