// resources/js/pages/category-coa-mapping/steps/verify-map-step.tsx

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import { TabsContent } from '@/components/ui/tabs';
import type { CategoryCoaMappingState } from '../types';

export function VerifyMapStep({ s }: { s: CategoryCoaMappingState }) {
    const {
        selectedSheets,
        currentSheet,
        sharedConfig,
        existingCategories,
        existingCoas,
        existingMappings,
        effectiveVerification,
        coaOverrides,
        setCoaOverrides,
        handleCoaOverrideChange,
        handleClearOverride,
        handleLog,
        handleLogRelationships,
        getEffectiveConfig,
        canReview,
        setStep,
    } = s;

    return (
        <TabsContent value="verifyMap" className="mt-4 flex flex-col gap-4">
            <div className="rounded-lg border p-4">
                <p className="mb-2 text-sm font-medium">
                    Verify & Map — extract relationships and check DB
                </p>
                <p className="text-muted-foreground mb-3 text-xs">
                    Click Log Unique Relationships to extract from{' '}
                    {selectedSheets.length} sheet
                    {selectedSheets.length === 1 ? '' : 's'} and verify against
                    DB. Use dropdowns for ~ partial / ❌ missing COAs.
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleLog}>
                        Log {(currentSheet || selectedSheets[0]) ?? 'sheet'} +
                        calibration
                    </Button>
                    <Button size="sm" onClick={handleLogRelationships}>
                        Log Unique Relationships{' '}
                        {selectedSheets.length > 1
                            ? `(${selectedSheets.length} sheets)`
                            : ''}
                    </Button>
                </div>
            </div>

            {effectiveVerification ? (
                <div className="rounded-lg border">
                    <div className="border-b p-3">
                        <h3 className="text-sm font-semibold">
                            DB Verification — {effectiveVerification.total}{' '}
                            unique pairs
                        </h3>
                        <p className="text-muted-foreground text-xs">
                            Checked against {existingCategories.length}{' '}
                            categories, {existingCoas.length} COAs (
                            {(currentSheet
                                ? getEffectiveConfig(currentSheet).coaMatchField
                                : sharedConfig?.coaMatchField) ??
                                'account_title'}
                            ), {existingMappings.length} existing mappings
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
                                {effectiveVerification.total}{' '}
                                {effectiveVerification.catFound ===
                                effectiveVerification.total
                                    ? '✅'
                                    : `❌ ${effectiveVerification.missingCat} missing`}
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
                                {effectiveVerification.total}{' '}
                                {effectiveVerification.effCoaFound ===
                                effectiveVerification.total
                                    ? '✅'
                                    : `❌ ${effectiveVerification.effMissingCoa} missing`}
                            </Badge>
                            <Badge
                                variant={
                                    effectiveVerification.effMappingFound ===
                                    effectiveVerification.total
                                        ? 'default'
                                        : effectiveVerification.effMappingFound >
                                            0
                                          ? 'secondary'
                                          : 'outline'
                                }
                            >
                                Mappings:{' '}
                                {effectiveVerification.effMappingFound}/
                                {effectiveVerification.total}{' '}
                                {effectiveVerification.effMappingFound ===
                                effectiveVerification.total
                                    ? '✅ all mapped'
                                    : effectiveVerification.effMissingMapping >
                                        0
                                      ? `${effectiveVerification.effMissingMapping} missing`
                                      : '—'}
                            </Badge>
                        </div>
                        {Object.keys(coaOverrides).length > 0 && (
                            <p className="mt-2 text-xs text-amber-600">
                                {Object.keys(coaOverrides).length} COA
                                override(s) selected — mapping counts reflect
                                overrides.
                            </p>
                        )}
                    </div>
                    <div className="max-h-[480px] overflow-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-card text-muted-foreground sticky top-0">
                                <tr className="border-b">
                                    <th className="p-2 text-left">Sheet</th>
                                    <th className="p-2 text-left">Section</th>
                                    <th className="p-2 text-left">Category</th>
                                    <th className="p-2 text-center">Cat DB</th>
                                    <th className="p-2 text-left">
                                        COA (Excel)
                                    </th>
                                    <th className="min-w-[280px] p-2 text-left">
                                        COA DB
                                    </th>
                                    <th className="p-2 text-center">Mapping</th>
                                </tr>
                            </thead>
                            <tbody>
                                {effectiveVerification.effectivePairs.map(
                                    (v) => {
                                        const needsDropdown = !v.coaExists;
                                        const isOverridden =
                                            v.overrideId !== null;
                                        const selectedDisplay = v.effectiveCoa
                                            ? `coa:${v.effectiveCoa.id}:${v.effectiveCoa.path} — ${v.effectiveCoa.account_title}`
                                            : '';
                                        const suggestedIds = new Set(
                                            v.coaTopMatches.map(
                                                (m) => m.coa.id,
                                            ),
                                        );
                                        const suggestedCoas =
                                            v.coaTopMatches.map((m) => m.coa);
                                        const remainingCoas =
                                            existingCoas.filter(
                                                (c) => !suggestedIds.has(c.id),
                                            );
                                        const itemsForRow =
                                            v.coaMatchType === 'partial' &&
                                            suggestedCoas.length > 0
                                                ? [
                                                      ...suggestedCoas.map(
                                                          (c) =>
                                                              `coa:${c.id}:${c.path} — ${c.account_title}`,
                                                      ),
                                                      ...remainingCoas.map(
                                                          (c) =>
                                                              `coa:${c.id}:${c.path} — ${c.account_title}`,
                                                      ),
                                                  ]
                                                : existingCoas.map(
                                                      (c) =>
                                                          `coa:${c.id}:${c.path} — ${c.account_title}`,
                                                  );

                                        return (
                                            <tr
                                                key={v.key}
                                                className="hover:bg-accent border-b"
                                            >
                                                <td className="text-muted-foreground p-2">
                                                    {v.sheet}
                                                </td>
                                                <td className="text-muted-foreground p-2">
                                                    {v.section}
                                                </td>
                                                <td
                                                    className="max-w-[16ch] truncate p-2"
                                                    title={v.category}
                                                >
                                                    {v.category}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {v.catExists ? (
                                                        <Badge
                                                            variant="secondary"
                                                            className="bg-secondary text-secondary-foreground"
                                                        >
                                                            ✅ {v.catId}
                                                        </Badge>
                                                    ) : v.catMatchType ===
                                                      'partial' ? (
                                                        <Badge
                                                            variant="outline"
                                                            title={v.catTopMatches
                                                                .map(
                                                                    (m) =>
                                                                        `${m.category.name} (lev ${m.score})`,
                                                                )
                                                                .join(', ')}
                                                        >
                                                            ~ partial
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="secondary"
                                                            className="bg-secondary text-secondary-foreground"
                                                        >
                                                            ❌ missing
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td
                                                    className="max-w-[18ch] truncate p-2"
                                                    title={v.coa}
                                                >
                                                    {v.coa}
                                                </td>
                                                <td className="p-2">
                                                    {needsDropdown ? (
                                                        <div className="flex items-center gap-1">
                                                            <Combobox
                                                                items={
                                                                    itemsForRow
                                                                }
                                                                value={
                                                                    selectedDisplay
                                                                }
                                                                onValueChange={(
                                                                    val,
                                                                ) =>
                                                                    handleCoaOverrideChange(
                                                                        v.key,
                                                                        val as
                                                                            | string
                                                                            | null,
                                                                    )
                                                                }
                                                            >
                                                                <ComboboxInput
                                                                    placeholder={
                                                                        v.coaMatchType ===
                                                                        'partial'
                                                                            ? '★ Suggested at top — search...'
                                                                            : 'Search COA...'
                                                                    }
                                                                    className="h-7 text-xs"
                                                                />
                                                                <ComboboxContent>
                                                                    <ComboboxEmpty>
                                                                        No COA
                                                                        found.
                                                                    </ComboboxEmpty>
                                                                    <ComboboxList>
                                                                        {(
                                                                            item: string,
                                                                        ) => {
                                                                            const isSuggested =
                                                                                v.coaTopMatches.some(
                                                                                    (
                                                                                        m,
                                                                                    ) =>
                                                                                        item.includes(
                                                                                            `coa:${m.coa.id}:`,
                                                                                        ),
                                                                                );

                                                                            return (
                                                                                <ComboboxItem
                                                                                    key={
                                                                                        item
                                                                                    }
                                                                                    value={
                                                                                        item
                                                                                    }
                                                                                    className={
                                                                                        isSuggested
                                                                                            ? 'bg-card font-medium'
                                                                                            : ''
                                                                                    }
                                                                                >
                                                                                    {isSuggested
                                                                                        ? '★ '
                                                                                        : ''}
                                                                                    {item.replace(
                                                                                        /^coa:\d+:/,
                                                                                        '',
                                                                                    )}
                                                                                </ComboboxItem>
                                                                            );
                                                                        }}
                                                                    </ComboboxList>
                                                                </ComboboxContent>
                                                            </Combobox>
                                                            {isOverridden && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 px-1 text-xs"
                                                                    onClick={() =>
                                                                        handleClearOverride(
                                                                            v.key,
                                                                        )
                                                                    }
                                                                >
                                                                    ✕
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1">
                                                            <Badge
                                                                variant="secondary"
                                                                className="bg-secondary text-secondary-foreground"
                                                            >
                                                                ✅ {v.coaId}
                                                            </Badge>
                                                            <span
                                                                className="text-muted-foreground truncate"
                                                                title={
                                                                    v
                                                                        .effectiveCoa
                                                                        ?.path
                                                                }
                                                            >
                                                                {
                                                                    v
                                                                        .effectiveCoa
                                                                        ?.path
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                    {needsDropdown &&
                                                        v.effectiveCoa && (
                                                            <div className="mt-1 text-xs text-green-600">
                                                                →{' '}
                                                                {
                                                                    v
                                                                        .effectiveCoa
                                                                        .path
                                                                }{' '}
                                                                —{' '}
                                                                {
                                                                    v
                                                                        .effectiveCoa
                                                                        .account_title
                                                                }
                                                            </div>
                                                        )}
                                                    {needsDropdown &&
                                                        !v.effectiveCoa &&
                                                        v.coaTopMatches.length >
                                                            0 && (
                                                            <div
                                                                className="text-muted-foreground mt-1 truncate text-xs"
                                                                title={v.coaTopMatches
                                                                    .map(
                                                                        (m) =>
                                                                            `${m.coa.path} — ${m.coa.account_title} (score ${m.score})`,
                                                                    )
                                                                    .join(
                                                                        ' | ',
                                                                    )}
                                                            >
                                                                Suggest:{' '}
                                                                {
                                                                    v
                                                                        .coaTopMatches[0]
                                                                        .coa
                                                                        .path
                                                                }{' '}
                                                                —{' '}
                                                                {
                                                                    v
                                                                        .coaTopMatches[0]
                                                                        .coa
                                                                        .account_title
                                                                }
                                                            </div>
                                                        )}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {v.effectiveMappingExists ? (
                                                        <span className="text-green-600">
                                                            ✅ exists
                                                        </span>
                                                    ) : v.catExists &&
                                                      v.effectiveCoaExists ? (
                                                        <span className="text-amber-600">
                                                            ❌ not mapped
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    },
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t p-3">
                        <span className="text-muted-foreground text-xs">
                            Detailed logs in console (F12) — with top
                            suggestions. Mode:{' '}
                            {(currentSheet
                                ? getEffectiveConfig(currentSheet).coaMatchField
                                : sharedConfig?.coaMatchField) ??
                                'account_title'}{' '}
                            — overrides are row-unique (
                            {Object.keys(coaOverrides).length} active).
                        </span>
                        <div className="flex gap-2">
                            {Object.keys(coaOverrides).length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCoaOverrides({})}
                                >
                                    Clear overrides
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-muted-foreground rounded-lg border p-8 text-center text-sm">
                    No verification yet — click Log Unique Relationships.
                </div>
            )}

            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={() => setStep('verifyFormat')}
                >
                    Back
                </Button>
                <Button onClick={() => setStep('review')} disabled={!canReview}>
                    Next: Review & Save{' '}
                    {effectiveVerification
                        ? `(${effectiveVerification.effMissingMapping} to create)`
                        : ''}
                </Button>
            </div>
        </TabsContent>
    );
}
