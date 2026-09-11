/**
 * AIP Summary extraction — verified sheet → reviewable records.
 *
 * Runs only after Verify passes (`errors` empty; warnings OK), so ref
 * codes and prefixes are known-good and this module derives instead of
 * re-validating. One record per kept sheet row (the sheet's grain is one
 * row per expected output × funding source); blank-A continuation rows
 * attach to the preceding PPA block. Amount columns (H–L) are ignored —
 * only A–G and M–O are consumed. Funding source is coerced via
 * `effectiveFundingSource` (Verify gate): rows without an expected output
 * carry `fundingSource: null`, even if the cell is filled.
 *
 * Docs: `docs/aip-summary-file-structure.md` (spec),
 * `docs/aip-summary-import.md` (pipeline).
 */
import type ExcelJS from 'exceljs';
import { normalize } from '@/lib/ppmp/normalize';
import {
    PPA_TYPES,
    effectiveFundingSource,
    extractAipSummaryRows,
    isBlankCell,
    parseColBPrefix,
} from './verify';
import type { AipPpaType } from './verify';
import type { AipSummarySheetConfig } from './sheet-config';

export type AipSummaryRecord = {
    /** Stable per-row id within the sheet: `${fullCode}#${row}`. */
    key: string;
    /** This record's sheet row. */
    row: number;
    /** Sheet row of the PPA block header (== row for block leaders). */
    blockRow: number;
    isContinuation: boolean;
    fullCode: string;
    type: AipPpaType;
    typeIndex: number;
    /** Description with the numbering prefix removed (storage form). */
    name: string;
    /** Description as written in the sheet (display form). */
    nameRaw: string;
    /** Implementing office acronyms — col C split on `/`. */
    offices: string[];
    /** Normalized `YYYY-MM-DD` (`Mon-YY` → `20YY-MM-01`). */
    startDate: string | null;
    endDate: string | null;
    startDateRaw: string | null;
    endDateRaw: string | null;
    expectedOutput: string | null;
    fundingSource: string | null;
    adaptation: string | null;
    mitigation: string | null;
    typology: string | null;
    // Normalized keys for matching/dedupe downstream.
    fullCodeNorm: string;
    nameNorm: string;
    outputNorm: string | null;
    fundNorm: string | null;
    typologyNorm: string | null;
};

export type AipSummaryExtractResult = {
    records: AipSummaryRecord[];
    /** Distinct PPA blocks. */
    blocks: number;
    rowsKept: number;
};

const MONTH_NUM: Record<string, string> = {
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dec: '12',
};

/** `Jan-27` → `2027-01-01`; `YYYY-MM-DD` passes through; else null. */
export function normalizeAipSchedule(value: string | null): string | null {
    if (value == null) return null;

    const trimmed = value.trim();
    const monYear = /^([A-Za-z]{3})-(\d{2})$/.exec(trimmed);

    if (monYear) {
        const month = MONTH_NUM[monYear[1].toLowerCase()];

        return month ? `20${monYear[2]}-${month}-01` : null;
    }

    return /^(\d{4})-(\d{2})-(\d{2})$/.test(trimmed) ? trimmed : null;
}

const MONTH_SHORT = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

/** `2027-12-01` → `Dec-27` for display; null passes through. */
export function formatAipScheduleShort(value: string | null): string | null {
    if (value == null) return null;

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

    if (!match) return value;

    const month = MONTH_SHORT[Number(match[2]) - 1] ?? match[2];

    return `${month}-${match[1].slice(2)}`;
}

/** `PICTO/SDU` or `OPG,PGENRO,PHO` → acronym list (slash or comma). */
export function splitAipOffices(value: string | null): string[] {
    if (value == null) return [];

    return value
        .split(/[/,]/)
        .map((part) => part.trim())
        .filter((part) => part !== '');
}

/**
 * Build one reviewable record per kept row. Call only with a sheet that
 * passed Verify — malformed codes/prefixes fall back to raw values.
 */
export function extractAipSummaryRecords(
    ws: ExcelJS.Worksheet,
    config: AipSummarySheetConfig & { headerRow: number },
): AipSummaryExtractResult {
    const { kept } = extractAipSummaryRows(ws, config);
    const records: AipSummaryRecord[] = [];
    let blocks = 0;
    let block: {
        fullCode: string;
        typeIndex: number;
        name: string;
        nameRaw: string;
        blockRow: number;
        values: Record<string, string | null>;
    } | null = null;

    for (const keptRow of kept) {
        if (keptRow.kind === 'ppa') {
            const fullCode = (keptRow.values.refCode ?? '').trim();
            // Segment count ⇒ type is guaranteed by the Verify gate
            // (office prefix + 5–9 segments, fixed widths).
            const typeIndex = fullCode.split('-').length - 5;
            const description = keptRow.values.description ?? '';
            const prefix = parseColBPrefix(description, typeIndex);

            block = {
                fullCode,
                typeIndex,
                name: prefix?.stripped ?? description.trim(),
                nameRaw: description,
                blockRow: keptRow.row,
                values: keptRow.values,
            };
            blocks++;
        }

        // Orphan continuations are skipped by extraction; Verify flags
        // nothing for them (they never reach `kept` without a block).
        if (!block) continue;

        const values = keptRow.values;
        // Continuation rows inherit the leader's output context for blank
        // cells (same output × additional funds grain); own values win.
        // This keeps fund links attached to the block's expected output.
        const leaderValues = block.values;
        const pick = (
            field: 'office' | 'startDate' | 'endDate' | 'expectedOutput',
        ): string | null => {
            const own = values[field];
            if (!isBlankCell(own)) return own;
            const inherited = leaderValues[field];
            return isBlankCell(inherited) ? null : inherited;
        };

        const expectedOutput = pick('expectedOutput');
        const officeText = pick('office');
        const startText = pick('startDate');
        const endText = pick('endDate');
        // Funding source anchors on the expected output (Verify gate):
        // rows without one carry no fund, even if the cell is filled.
        // Continuations inherit the leader's context for that judgment
        // but keep their own fund cell (one fund per row).
        const fundingSource = effectiveFundingSource(values, block.values);
        const typology = values.typology;

        records.push({
            key: `${block.fullCode}#${keptRow.row}`,
            row: keptRow.row,
            blockRow: block.blockRow,
            isContinuation: keptRow.kind === 'continuation',
            fullCode: block.fullCode,
            type: PPA_TYPES[block.typeIndex] ?? 'Program',
            typeIndex: block.typeIndex,
            name: block.name,
            nameRaw: block.nameRaw,
            offices: splitAipOffices(officeText),
            startDate: normalizeAipSchedule(startText),
            endDate: normalizeAipSchedule(endText),
            startDateRaw: startText,
            endDateRaw: endText,
            expectedOutput,
            fundingSource,
            adaptation: values.adaptation,
            mitigation: values.mitigation,
            typology,
            fullCodeNorm: normalize(block.fullCode),
            nameNorm: normalize(block.name),
            outputNorm:
                expectedOutput == null ? null : normalize(expectedOutput),
            fundNorm: fundingSource == null ? null : normalize(fundingSource),
            typologyNorm: typology == null ? null : normalize(typology),
        });
    }

    return { records, blocks, rowsKept: kept.length };
}
