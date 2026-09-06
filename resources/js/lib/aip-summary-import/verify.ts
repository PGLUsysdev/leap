/**
 * AIP Summary sheet verification — pure functions, no React.
 *
 * Consumes the file-structure spec (`./sheet-config`, `./ref-code`) and
 * owns no layout knowledge of its own. Two passes over the kept rows:
 * Pass 1 judges each row alone, Pass 2 judges hierarchy across rows.
 *
 * Row classification (shared with the page's Log contents via
 * `extractAipSummaryRows`): blank rows skipped, footer/signatory rows
 * skipped (col A lacks the office prefix), blank-A rows attach to the
 * preceding PPA block as continuations, orphan continuations skipped.
 *
 * Docs: `docs/aip-summary-file-structure.md` (rules),
 * `docs/aip-summary-import.md` (pipeline).
 */
import type ExcelJS from 'exceljs';
import { cellText } from '@/lib/excel/cell-helpers';
import { hasAipRefCodePrefix } from './ref-code';
import type { AipSummarySheetConfig } from './sheet-config';

export type AipSummaryVerifyIssue = {
    row: number;
    message: string;
};

export type AipSummaryVerifyResult = {
    valid: boolean;
    message: string;
    errors: AipSummaryVerifyIssue[];
    details: string[];
    ppaBlocks: number;
    rowsKept: number;
};

export type AipSummaryKeptRow = {
    row: number;
    kind: 'ppa' | 'continuation';
    values: Record<string, string | null>;
};

export type AipSummaryExtracted = {
    kept: AipSummaryKeptRow[];
    headerRow: number;
    numberRow: number;
    dataStartRow: number;
    lastRow: number;
    skippedBlank: number;
    skippedFooter: number;
};

const PPA_TYPES = [
    'Program',
    'Project',
    'Activity',
    'Subactivity',
    'Subsubactivity',
] as const;
const PPA_WIDTHS = [3, 3, 2, 1, 1];
const OFFICE_SEGMENT_PATTERNS = [/^\d{4}$/, /^\d$/, /^\d{2}$/, /^\d{3}$/];
const COLUMN_LETTERS = 'ABCDEFGHIJKLMNO';
const MONTHS = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
];

type ParsedRow = {
    row: number;
    typeIndex: number;
    /** Dotted numbers for non-programs, letter for programs. */
    numbers: number[] | null;
    letter: string | null;
};

/** Split + validate a ref code. Returns null when malformed (issue already pushed). */
function parseRefCode(
    code: string,
    row: number,
    errors: AipSummaryVerifyIssue[],
): { segments: string[]; typeIndex: number } | null {
    const segments = code.trim().split('-');

    for (let i = 0; i < OFFICE_SEGMENT_PATTERNS.length; i++) {
        if (!OFFICE_SEGMENT_PATTERNS[i].test(segments[i] ?? '')) {
            errors.push({
                row,
                message: `Malformed office prefix in "${code}"`,
            });

            return null;
        }
    }

    if (segments.length < 5 || segments.length > 9) {
        errors.push({
            row,
            message: `Ref code "${code}" has ${segments.length} segments — must be 5–9 (Program–Subsubactivity)`,
        });

        return null;
    }

    const typeIndex = segments.length - 5;

    for (let i = 0; i <= typeIndex; i++) {
        const suffix = segments[OFFICE_SEGMENT_PATTERNS.length + i] ?? '';

        if (!/^\d+$/.test(suffix) || suffix.length !== PPA_WIDTHS[i]) {
            errors.push({
                row,
                message: `Ref code "${code}": ${PPA_TYPES[i]} suffix "${suffix}" must be ${PPA_WIDTHS[i]} zero-padded digits`,
            });

            return null;
        }
    }

    return { segments, typeIndex };
}

/** Parse a col B numbering prefix for the expected depth. Null when the shape is wrong. */
function parseColBPrefix(
    description: string,
    typeIndex: number,
): { numbers: number[] | null; letter: string | null } | null {
    const trimmed = description.trim();

    if (typeIndex === 0) {
        const match = /^([A-Z])\.\s*\S/.exec(trimmed);

        return match ? { numbers: null, letter: match[1] } : null;
    }

    const match = /^(\d+(?:\.\d+)*)\.\s*\S/.exec(trimmed);

    if (!match) return null;

    const numbers = match[1].split('.').map(Number);

    return numbers.length === typeIndex ? { numbers, letter: null } : null;
}

/** True for `Mon-YY` (Jan-27 = January 2027) or full `YYYY-MM-DD`. */
function isParsableSchedule(value: string): boolean {
    const trimmed = value.trim();
    const monYear = /^([A-Za-z]{3})-(\d{2})$/.exec(trimmed);

    if (monYear) {
        return MONTHS.includes(monYear[1].toLowerCase());
    }

    const full = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

    if (!full) return false;

    const month = Number(full[2]);
    const day = Number(full[3]);

    return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

/**
 * Read every data row in range, classifying each as PPA / continuation /
 * skipped. Shared by Verify and the page's Log contents.
 */
export function extractAipSummaryRows(
    ws: ExcelJS.Worksheet,
    config: AipSummarySheetConfig & { headerRow: number },
): AipSummaryExtracted {
    const headerRow = config.headerRow;
    const numberRow = headerRow + 1;
    const dataStartRow = headerRow + 2;
    const lastRow = ws.lastRow?.number ?? ws.rowCount;
    const kept: AipSummaryKeptRow[] = [];
    let skippedBlank = 0;
    let skippedFooter = 0;
    let currentBlock = false;

    for (let r = dataStartRow; r <= lastRow; r++) {
        const row = ws.getRow(r);
        const values: Record<string, string | null> = {};
        let isBlank = true;

        for (const [field, letter] of Object.entries(config.columnConfig)) {
            const value = cellText(row.getCell(letter));
            values[field] = value;

            if (value !== null) isBlank = false;
        }

        if (isBlank) {
            skippedBlank++;
            continue;
        }

        if (hasAipRefCodePrefix(values.refCode)) {
            currentBlock = true;
            kept.push({ row: r, kind: 'ppa', values });
        } else if (values.refCode === null && currentBlock) {
            kept.push({ row: r, kind: 'continuation', values });
        } else {
            // Footer/signatory text in col A, or an orphan continuation
            // before any PPA block — never data.
            skippedFooter++;
        }
    }

    return {
        kept,
        headerRow,
        numberRow,
        dataStartRow,
        lastRow,
        skippedBlank,
        skippedFooter,
    };
}

/** Verify one sheet against the effective config. Structural only — no DB. */
export function verifyAipSummarySheet(
    workbook: ExcelJS.Workbook,
    sheetName: string,
    config: AipSummarySheetConfig,
): AipSummaryVerifyResult {
    if (config.headerRow === '' || config.headerRow == null) {
        return {
            valid: false,
            message: 'Header Row is required — check calibration',
            errors: [
                {
                    row: 0,
                    message: 'Header Row is required — check calibration',
                },
            ],
            details: [],
            ppaBlocks: 0,
            rowsKept: 0,
        };
    }

    const ws = workbook.getWorksheet(sheetName);

    if (!ws) {
        return {
            valid: false,
            message: `Worksheet "${sheetName}" not found`,
            errors: [{ row: 0, message: `Worksheet "${sheetName}" not found` }],
            details: [],
            ppaBlocks: 0,
            rowsKept: 0,
        };
    }

    const errors: AipSummaryVerifyIssue[] = [];
    const details: string[] = [];

    // Calibrated columns must sit inside the A–O sheet spec.
    for (const [field, letter] of Object.entries(config.columnConfig)) {
        if (COLUMN_LETTERS.indexOf(letter) === -1) {
            errors.push({
                row: 0,
                message: `Column for ${field} ("${letter}") is outside the A–O sheet spec`,
            });
        }
    }

    const { kept, numberRow, skippedBlank, skippedFooter } =
        extractAipSummaryRows(ws, {
            ...config,
            headerRow: config.headerRow,
        });

    // Number row is always exactly one row below the header.
    const numberMismatches: string[] = [];

    for (const [field, letter] of Object.entries(config.columnConfig)) {
        const expected = COLUMN_LETTERS.indexOf(letter) + 1;
        const actual = cellText(ws.getRow(numberRow).getCell(letter));

        if (actual !== String(expected)) {
            numberMismatches.push(
                `${letter}: got "${actual ?? '∅'}", expected "${expected}" (${field})`,
            );
        }
    }

    if (numberMismatches.length > 0) {
        errors.push({
            row: numberRow,
            message: `Number row mismatch — ${numberMismatches.join('; ')}`,
        });
    } else {
        details.push(`Number row ${numberRow} OK at calibrated columns`);
    }

    // ---- Pass 1: each row alone ----
    const parsed = new Map<string, ParsedRow>();
    const ppaRows = kept.filter((k) => k.kind === 'ppa');

    for (const keptRow of kept) {
        const { row, kind, values } = keptRow;

        if (kind === 'ppa') {
            const ref = parseRefCode(values.refCode ?? '', row, errors);

            if (ref) {
                const code = (values.refCode ?? '').trim();
                const prefix =
                    values.description === null
                        ? null
                        : parseColBPrefix(values.description, ref.typeIndex);

                if (values.description === null) {
                    errors.push({
                        row,
                        message: 'Required cell empty: description',
                    });
                } else if (!prefix) {
                    errors.push({
                        row,
                        message: `Description prefix doesn't match ${PPA_TYPES[ref.typeIndex]} depth for "${code}"`,
                    });
                }

                if (parsed.has(code)) {
                    errors.push({
                        row,
                        message: `PPA code "${code}" opens a second block (first at row ${parsed.get(code)!.row})`,
                    });
                } else {
                    parsed.set(code, {
                        row,
                        typeIndex: ref.typeIndex,
                        numbers: prefix?.numbers ?? null,
                        letter: prefix?.letter ?? null,
                    });
                }
            }
        }

        // Only the PPA-row description is required (it carries the tandem
        // prefix). Office, expected output, funding source, and schedule are
        // optional everywhere — but a present schedule must still parse.
        // Continuation rows leave A–B blank by format, so they are exempt.
        for (const field of ['startDate', 'endDate'] as const) {
            const value = values[field];

            if (value !== null && !isParsableSchedule(value)) {
                errors.push({
                    row,
                    message: `Unparseable schedule "${value}" — use Mon-YY (Jan-27) or YYYY-MM-DD`,
                });
            }
        }
    }

    // ---- Pass 2: hierarchy across PPA rows ----
    const childrenByParent = new Map<string, string[]>();

    for (const ppaRow of ppaRows) {
        const code = (ppaRow.values.refCode ?? '').trim();
        const info = parsed.get(code);

        if (!info) continue;

        if (info.typeIndex === 0) {
            const group = childrenByParent.get('__root__') ?? [];
            group.push(code);
            childrenByParent.set('__root__', group);
            continue;
        }

        const parentCode = code.split('-').slice(0, -1).join('-');
        const parent = parsed.get(parentCode);

        if (!parent) {
            errors.push({
                row: ppaRow.row,
                message: `Parent "${parentCode}" not found in sheet`,
            });
            continue;
        }

        if (parent.row > ppaRow.row) {
            errors.push({
                row: ppaRow.row,
                message: `Appears before its parent "${parentCode}" (row ${parent.row})`,
            });
        }

        if (parent.typeIndex !== info.typeIndex - 1) {
            errors.push({
                row: ppaRow.row,
                message: `"${code}" skips a level — parent "${parentCode}" is a ${PPA_TYPES[parent.typeIndex]}, expected ${PPA_TYPES[info.typeIndex - 1]}`,
            });
        }

        const group = childrenByParent.get(parentCode) ?? [];
        group.push(code);
        childrenByParent.set(parentCode, group);
    }

    // Sibling sequence per parent: programs A,B,C… from A; dotted 1,2,3… from 1.
    for (const [parentCode, codes] of childrenByParent) {
        if (parentCode === '__root__') {
            codes.forEach((code, i) => {
                const expected = String.fromCharCode(65 + i);
                const actual = parsed.get(code)?.letter;

                if (actual !== expected) {
                    errors.push({
                        row: parsed.get(code)!.row,
                        message: `Programs out of sequence: got "${actual ?? '?.'}", expected "${expected}."`,
                    });
                }
            });
            continue;
        }

        const parentInfo = parsed.get(parentCode);

        // Non-program parent with no parsed numbers already failed Pass 1 —
        // skip sequencing to avoid cascading errors.
        if (
            !parentInfo ||
            (parentInfo.typeIndex > 0 && parentInfo.numbers === null)
        ) {
            continue;
        }

        const parentNumbers = parentInfo.numbers ?? [];
        let next = 1;

        for (const code of codes) {
            const actual = parsed.get(code)?.numbers ?? null;
            const expected = [...parentNumbers, next];
            const same =
                actual !== null &&
                actual.length === expected.length &&
                actual.every((n, i) => n === expected[i]);
            const info = parsed.get(code)!;

            if (!same) {
                errors.push({
                    row: info.row,
                    message: `Sibling numbering gap under "${parentCode}": got "${actual?.join('.') ?? '?.'}", expected "${expected.join('.')}."`,
                });

                if (
                    actual !== null &&
                    actual
                        .slice(0, -1)
                        .every((n, i) => n === parentNumbers[i]) &&
                    actual[actual.length - 1] >= next
                ) {
                    next = actual[actual.length - 1] + 1;
                } else {
                    next++;
                }
            } else {
                next++;
            }
        }
    }

    const typeCounts = PPA_TYPES.map(
        (t, i) =>
            `${t}s: ${[...parsed.values()].filter((p) => p.typeIndex === i).length}`,
    ).filter((s) => !s.endsWith(': 0'));

    if (typeCounts.length > 0) details.push(typeCounts.join(' · '));

    details.push(
        `Skipped: ${skippedBlank} blank row${skippedBlank === 1 ? '' : 's'}, ${skippedFooter} signatory/footer row${skippedFooter === 1 ? '' : 's'} (info)`,
    );

    const valid = errors.length === 0;

    return {
        valid,
        message: valid
            ? `Format OK — ${parsed.size} PPA block${parsed.size === 1 ? '' : 's'}, ${kept.length} rows kept`
            : `Found ${errors.length} issue${errors.length === 1 ? '' : 's'}`,
        errors,
        details,
        ppaBlocks: parsed.size,
        rowsKept: kept.length,
    };
}
