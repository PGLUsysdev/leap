// resources/js/lib/ppmp/mapping-extract.ts
//
// Category↔COA mapping domain extraction — all calibrated sections.
// Shared preview (extractPpmpSheet + raw grid) stays on the Extract tab;
// this helper computes the unique Category↔COA pairs plus their DB
// verification (Review input).

import type ExcelJS from 'exceljs';
import { cellText } from '@/lib/excel/cell-helpers';
import {
    getCategoryMatch,
    getCoaMatch,
    isTotalRow,
    normalize,
    type ExistingCategory,
    type ExistingCoa,
} from '@/lib/ppmp/normalize';
import type { CategoryCoaSheetConfig } from '@/lib/ppmp/sheet-config';

export type MappingSection = 'procurement' | 'additional' | 'non-procurement';

export type ExtractedPair = {
    category: string;
    coa: string;
    catRow: number;
    coaRow: number;
    items: number;
    section: MappingSection;
    sheet: string;
};

export type ExistingMappingRef = {
    chart_of_account_id: number;
    ppmp_category_id: number;
};

export type VerifiedPair = {
    category: string;
    coa: string;
    section: string;
    sheet: string;
    catRow: number;
    coaRow: number;
    items: number;
    catNorm: string;
    coaNorm: string;
    catExists: boolean;
    coaExists: boolean;
    mappingExists: boolean;
    catId: number | null;
    coaId: number | null;
    catMatchType: 'strict' | 'partial' | 'none';
    coaMatchType: 'strict' | 'partial' | 'none';
    catMatch: ExistingCategory | null;
    coaMatch: ExistingCoa | null;
    catTopMatches: Array<{ category: ExistingCategory; score: number }>;
    coaTopMatches: Array<{ coa: ExistingCoa; score: number }>;
};

export type VerificationState = {
    total: number;
    catFound: number;
    coaFound: number;
    mappingFound: number;
    missingCat: number;
    missingCoa: number;
    missingMapping: number;
    verifiedPairs: VerifiedPair[];
};

type CatGroup = {
    cat: string;
    catRow: number;
    coas: Array<{ coa: string; coaRow: number; items: number }>;
    totalRow?: number;
};

const ADDITIONAL_SENTINEL = 'Additional Items (Uncategorized)';
const NON_PROC_SENTINEL = 'Non-Procurement (Uncategorized)';

function sentinelFor(section: MappingSection): string | null {
    if (section === 'additional') return ADDITIONAL_SENTINEL;
    if (section === 'non-procurement') return NON_PROC_SENTINEL;

    return null;
}

function extractRelationshipsForSection(
    ws: ExcelJS.Worksheet,
    cfg: CategoryCoaSheetConfig,
    sectionName: MappingSection,
    startRow: number,
    endRow: number,
): { catGroups: CatGroup[]; pairs: Array<Omit<ExtractedPair, 'sheet'>> } {
    const catGroups: CatGroup[] = [];
    let currentCat: CatGroup | null = null;
    let currentCoa: {
        coa: string;
        coaRow: number;
        items: number;
    } | null = null;

    const dataColumn = cfg.columnConfig.category;
    const coaColumn = cfg.columnConfig.coa;
    const coaLabelMode = cfg.coaLabelMode;

    const flushCat = (totalRow?: number) => {
        if (currentCat) {
            if (currentCoa) {
                currentCat.coas.push(currentCoa!);
                currentCoa = null;
            }

            if (totalRow) currentCat.totalRow = totalRow;

            catGroups.push(currentCat);
            currentCat = null;
        }
    };

    const lastRow = ws.actualRowCount;

    for (let r = startRow; r <= endRow && r <= lastRow; r++) {
        const row = ws.getRow(r);
        const coaRaw = cellText(row.getCell(coaColumn));
        const dataRaw = cellText(row.getCell(dataColumn));

        if (!dataRaw && !coaRaw) continue;

        const coaNorm = coaRaw ? normalize(coaRaw) : null;
        const dataNorm = dataRaw ? normalize(dataRaw) : null;

        if (dataNorm === 'description') continue;

        const unitRaw = cellText(row.getCell(cfg.columnConfig.unit));
        const priceRaw = cellText(row.getCell(cfg.columnConfig.price));
        const itemRaw = cellText(row.getCell(cfg.columnConfig.itemNumber));
        const isFalsy = (v: string | null) =>
            !v ||
            normalize(v) === '0' ||
            normalize(v) === '-' ||
            normalize(v) === '0.00';
        const priceNum = priceRaw ? Number(priceRaw.replace(/,/g, '')) : NaN;
        const isFalsyPrice =
            !priceRaw ||
            priceNum === 0 ||
            Number.isNaN(priceNum) ||
            isFalsy(priceRaw);
        const isFalsyUnit = isFalsy(unitRaw);
        const isFalsyCoa = !coaNorm;
        const isFalsyItem = !itemRaw;

        if (
            isFalsyItem &&
            isFalsyCoa &&
            isFalsyUnit &&
            isFalsyPrice &&
            dataRaw
        ) {
            if (
                sectionName === 'additional' ||
                sectionName === 'non-procurement'
            )
                continue;
        }

        if (coaNorm && dataRaw) {
            if (!currentCat) {
                const sentinel = sentinelFor(sectionName);

                if (!sentinel) continue;

                currentCat = { cat: sentinel, catRow: r, coas: [] };
            }

            if (coaLabelMode === 'without-label') {
                if (!currentCoa || coaNorm !== normalize(currentCoa.coa)) {
                    if (currentCoa) {
                        currentCat.coas.push(currentCoa!);
                    }

                    currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                } else {
                    currentCoa.items += 1;
                }

                continue;
            } else {
                // with-label: item rows carry D=COA under an active label.
                // (Both pre-existing branches behaved identically; kept.)
                if (!currentCoa) {
                    currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                    continue;
                }

                if (coaNorm !== normalize(currentCoa.coa)) {
                    currentCat.coas.push(currentCoa!);
                    currentCoa = { coa: coaRaw!, coaRow: r, items: 1 };
                } else {
                    currentCoa.items += 1;
                }

                continue;
            }
        }

        if (!dataRaw || !dataNorm) continue;

        if (isTotalRow(dataNorm)) {
            if (currentCat) {
                if (currentCoa) {
                    currentCat.coas.push(currentCoa!);
                    currentCoa = null;
                }

                flushCat(r);
            }

            continue;
        }

        if (coaLabelMode === 'with-label') {
            let isCoaLabel = false;

            if (r + 1 <= lastRow) {
                const nextCoaRaw = cellText(
                    ws.getRow(r + 1).getCell(coaColumn),
                );
                const nextCoaNorm = nextCoaRaw
                    ? normalize(nextCoaRaw)
                    : null;

                if (nextCoaNorm && dataNorm && nextCoaNorm === dataNorm)
                    isCoaLabel = true;
            }

            if (isCoaLabel) {
                if (!currentCat) {
                    const sentinel = sentinelFor(sectionName);

                    if (!sentinel) continue;

                    currentCat = { cat: sentinel, catRow: r, coas: [] };
                }

                if (currentCoa) {
                    currentCat.coas.push(currentCoa!);
                }

                currentCoa = { coa: dataRaw, coaRow: r, items: 0 };
                continue;
            }
        }

        if (currentCat) {
            if (currentCoa) {
                currentCat.coas.push(currentCoa!);
                currentCoa = null;
            }

            catGroups.push(currentCat);
        }

        currentCat = { cat: dataRaw, catRow: r, coas: [] };
        currentCoa = null;
    }

    if (currentCat) {
        if (currentCoa) {
            currentCat.coas.push(currentCoa!);
        }

        catGroups.push(currentCat);
    }

    const pairs = catGroups.flatMap((g) =>
        g.coas.map((c) => ({
            category: g.cat,
            coa: c.coa,
            catRow: g.catRow,
            coaRow: c.coaRow,
            items: c.items,
            section: sectionName,
        })),
    );

    return { catGroups, pairs };
}

export type EffectiveVerifiedPair = VerifiedPair & {
    key: string;
    overrideId: number | null;
    effectiveCoa: ExistingCoa | null;
    effectiveCoaExists: boolean;
    effectiveCoaId: number | null;
    effectiveCoaMatchType: 'strict' | 'partial' | 'none';
    effectiveMappingExists: boolean;
};

export type EffectiveVerificationState = VerificationState & {
    effectivePairs: EffectiveVerifiedPair[];
    effCoaFound: number;
    effMappingFound: number;
    effMissingMapping: number;
    effMissingCoa: number;
};

export type MappingDbLists = {
    existingCategories: ExistingCategory[];
    existingCoas: ExistingCoa[];
    existingMappings: ExistingMappingRef[];
};

/**
 * Applies per-pair COA overrides (`sheet|catRow|coaRow` → COA id) on top of
 * a verification, recomputing effective COA + mapping existence + counts.
 */
export function applyCoaOverrides(
    verification: VerificationState | null,
    coaOverrides: Record<string, number>,
    existingCoas: ExistingCoa[],
    existingMappings: ExistingMappingRef[],
): EffectiveVerificationState | null {
    if (!verification) return null;

    const mappingSet = new Set(
        existingMappings.map(
            (m) => `${m.ppmp_category_id}|${m.chart_of_account_id}`,
        ),
    );
    const effectivePairs = verification.verifiedPairs.map((v) => {
        const key = `${v.sheet}|${v.catRow}|${v.coaRow}`;
        const overrideId = coaOverrides[key] ?? null;
        const effectiveCoa = overrideId
            ? (existingCoas.find((c) => c.id === overrideId) ?? null)
            : v.coaMatch;
        const effectiveCoaExists =
            overrideId !== null ? true : v.coaExists;
        const effectiveCoaId = overrideId ?? v.coaId;
        const effectiveCoaMatchType =
            overrideId !== null ? ('strict' as const) : v.coaMatchType;
        const effectiveMappingExists =
            v.catId !== null &&
            effectiveCoaId !== null &&
            mappingSet.has(`${v.catId}|${effectiveCoaId}`);

        return {
            ...v,
            key,
            overrideId,
            effectiveCoa,
            effectiveCoaExists,
            effectiveCoaId,
            effectiveCoaMatchType,
            effectiveMappingExists,
        };
    });

    return {
        ...verification,
        effectivePairs,
        effCoaFound: effectivePairs.filter((p) => p.effectiveCoaExists).length,
        effMappingFound: effectivePairs.filter((p) => p.effectiveMappingExists)
            .length,
        effMissingMapping: effectivePairs.filter(
            (p) =>
                p.catExists &&
                p.effectiveCoaExists &&
                !p.effectiveMappingExists,
        ).length,
        effMissingCoa: effectivePairs.filter((p) => !p.effectiveCoaExists)
            .length,
    };
}

export function extractMappingPairs(
    ws: ExcelJS.Worksheet,
    cfg: CategoryCoaSheetConfig,
    sheet: string,
    db: MappingDbLists,
): VerificationState {
    const { headerRow, additionalItemsHeaderRow, nonProcurementHeaderRow } =
        cfg.rowConfig;
    const lastRow = ws.actualRowCount;

    const empty: VerificationState = {
        total: 0,
        catFound: 0,
        coaFound: 0,
        mappingFound: 0,
        missingCat: 0,
        missingCoa: 0,
        missingMapping: 0,
        verifiedPairs: [],
    };

    // Header + Additional required; Non-Procurement optional.
    if (
        headerRow === '' ||
        headerRow == null ||
        additionalItemsHeaderRow === '' ||
        additionalItemsHeaderRow == null
    ) {
        return empty;
    }

    const sections: Array<{
        name: MappingSection;
        start: number;
        end: number;
    }> = [
        {
            name: 'procurement',
            start: headerRow + 1,
            end: additionalItemsHeaderRow
                ? additionalItemsHeaderRow - 1
                : nonProcurementHeaderRow
                  ? nonProcurementHeaderRow - 1
                  : lastRow,
        },
        {
            name: 'additional',
            start: additionalItemsHeaderRow
                ? additionalItemsHeaderRow + 1
                : -1,
            end: nonProcurementHeaderRow
                ? nonProcurementHeaderRow - 1
                : lastRow,
        },
    ];

    if (nonProcurementHeaderRow) {
        sections.push({
            name: 'non-procurement',
            start: nonProcurementHeaderRow + 1,
            end: lastRow,
        });
    }

    const combinedAllPairs: ExtractedPair[] = [];

    for (const s of sections) {
        if (s.start < 0 || s.end < 0 || s.start > s.end) continue;

        const { pairs } = extractRelationshipsForSection(
            ws,
            cfg,
            s.name,
            s.start,
            s.end,
        );

        for (const p of pairs) combinedAllPairs.push({ ...p, sheet });
    }

    const seen = new Map<string, ExtractedPair>();

    for (const p of combinedAllPairs) {
        const key = `${normalize(p.category)}|${normalize(p.coa)}`;

        if (!seen.has(key)) seen.set(key, p);
    }

    const mappingSet = new Set(
        db.existingMappings.map(
            (m) => `${m.ppmp_category_id}|${m.chart_of_account_id}`,
        ),
    );

    const verifiedPairs: VerifiedPair[] = [...seen.values()].map((p) => {
        const catNorm = normalize(p.category);
        const coaNorm = normalize(p.coa);
        const catRes = getCategoryMatch(catNorm, db.existingCategories);
        const coaRes = getCoaMatch(coaNorm, db.existingCoas, 'account_title');
        const catExists = catRes.type === 'strict';
        const coaExists = coaRes.type === 'strict';
        const catId = catRes.match?.id ?? null;
        const coaId = coaRes.match?.id ?? null;
        const mappingExists =
            catId !== null &&
            coaId !== null &&
            mappingSet.has(`${catId}|${coaId}`);

        return {
            category: p.category,
            coa: p.coa,
            section: p.section,
            sheet: p.sheet,
            catRow: p.catRow,
            coaRow: p.coaRow,
            items: p.items,
            catNorm,
            coaNorm,
            catMatchType: catRes.type,
            catMatch: catRes.match ?? null,
            catTopMatches: catRes.topMatches ?? [],
            coaMatchType: coaRes.type,
            coaMatch: coaRes.match ?? null,
            coaTopMatches: coaRes.topMatches ?? [],
            catExists,
            coaExists,
            catId,
            coaId,
            mappingExists,
        };
    });

    return {
        total: verifiedPairs.length,
        catFound: verifiedPairs.filter((v) => v.catExists).length,
        coaFound: verifiedPairs.filter((v) => v.coaExists).length,
        mappingFound: verifiedPairs.filter((v) => v.mappingExists).length,
        missingCat: verifiedPairs.filter((v) => !v.catExists).length,
        missingCoa: verifiedPairs.filter((v) => !v.coaExists).length,
        missingMapping: verifiedPairs.filter(
            (v) => v.catExists && v.coaExists && !v.mappingExists,
        ).length,
        verifiedPairs,
    };
}
