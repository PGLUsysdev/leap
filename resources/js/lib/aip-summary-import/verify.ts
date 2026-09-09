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
 * A row with a PPA Description but a blank AIP Reference Code (default
 * cols B / A) is never a continuation — it is collected as
 * `descWithoutCode` and Verify errors on it.
 *
 * Issues come in two severities: `errors` block the import, `warnings`
 * pass with a formatting notify (missing trailing "." in the col B
 * prefix, extra spaces inside the prefix which are collapsed before
 * sequencing).
 *
 * Docs: `docs/aip-summary-file-structure.md` (rules),
 * `docs/aip-summary-import.md` (pipeline).
 */
import type ExcelJS from 'exceljs';
import { cellText } from '@/lib/excel/cell-helpers';
import { hasAipRefCodePrefix } from './ref-code';
import { AIP_SUMMARY_FIELD_LABELS } from './sheet-config';
import type { AipSummarySheetConfig } from './sheet-config';

export type AipSummaryVerifyIssue = {
    row: number;
    message: string;
};

export type AipSummaryVerifyResult = {
    valid: boolean;
    message: string;
    errors: AipSummaryVerifyIssue[];
    /** Formatting notifies — sheet still passes when only warnings exist. */
    warnings: AipSummaryVerifyIssue[];
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
    /** Rows with text in col B but a blank col A — Verify errors. */
    descWithoutCode: number[];
};

export const PPA_TYPES = [
    'Program',
    'Project',
    'Activity',
    'Subactivity',
    'Subsubactivity',
] as const;

export type AipPpaType = (typeof PPA_TYPES)[number];
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
export function parseColBPrefix(
    description: string,
    typeIndex: number,
): {
    numbers: number[] | null;
    letter: string | null;
    warnings: string[];
    /** Description with the numbering prefix + separator removed. */
    stripped: string;
} | null {
    const trimmed = description.trim();

    if (typeIndex === 0) {
        const canonical = /^([A-Z])\. +(\S.*)$/.exec(trimmed);

        if (canonical) {
            return {
                numbers: null,
                letter: canonical[1],
                warnings: [],
                stripped: canonical[2],
            };
        }

        const loose = /^([A-Z])(?:\.\s*|\s+)(\S.*)$/.exec(trimmed);

        if (!loose) return null;

        const head = trimmed.slice(0, trimmed.length - loose[2].length);

        // No dot at all ("A Health") → missing-dot; any other
        // non-canonical dot usage ("A.Health", "A . Health") → spaced.
        return {
            numbers: null,
            letter: loose[1],
            warnings: [head.includes('.') ? 'spaced' : 'missing-dot'],
            stripped: loose[2],
        };
    }

    // Dotted prefixes scan as one run: leading number components may be
    // split by spaces ("19. 1."), which collapse to dotted form ("19.1").
    // A space-separated numeric token only continues the prefix when it
    // carries its own dot — "1. 2024 Accomplishments" stays prefix "1.".
    const m = /^(\d+(?:\s*\.\s*\d+)*)(\s*\.?)([\s\S]*)$/.exec(trimmed);

    if (!m) return null;

    const rawNum = m[1];
    const sep = m[2];
    const rest = m[3];

    // No dot/space between prefix and text ("4.5Support"), or no
    // description text at all — still an error, not a warning.
    if (sep === '' || rest.trim() === '') return null;

    const compact = rawNum.replace(/\s+/g, '');
    const numbers = compact.split('.').map(Number);

    if (numbers.length !== typeIndex) return null;

    const warnings: string[] = [];
    const sepHasDot = sep.includes('.');

    if (!sepHasDot) warnings.push('missing-dot');

    if (
        /\s/.test(rawNum) ||
        /^\s+\./.test(sep) ||
        (sepHasDot && !/^\s/.test(rest))
    ) {
        warnings.push('spaced');
    }

    return { numbers, letter: null, warnings, stripped: rest.trim() };
}

/** Blank, `-`, or `—` counts as no value (sheet dash convention). */
export function isBlankCell(value: string | null): boolean {
    if (value == null) return true;

    const trimmed = value.trim();

    return trimmed === '' || trimmed === '-' || trimmed === '—';
}

/**
 * Split a funding-source cell on `/` or `,` into its fund tokens,
 * dropping blanks and dash-only fragments. The sheet grain is one row
 * per expected output × funding source, so more than one token is a
 * structural error (see the funding-source rule in Pass 1).
 */
export function splitFundSources(value: string | null): string[] {
    if (value == null) return [];

    return value
        .split(/[/,]/)
        .map((part) => part.trim())
        .filter((part) => !isBlankCell(part));
}

/**
 * Which output context a kept row carries — the anchor for the funding
 * source rule:
 * - `output`: expected output set — funding source allowed, schedule and
 *   office not required.
 * - `context`: output blank but office/schedule present — funding source
 *   coerced to null (see `effectiveFundingSource`).
 * - `hierarchy`: office, schedule, and output all blank — funding source
 *   must be blank (pure hierarchy row).
 */
export type OutputRowState = 'output' | 'context' | 'hierarchy';

export function outputRowState(
    values: Record<string, string | null>,
): OutputRowState {
    if (!isBlankCell(values.expectedOutput)) return 'output';

    if (
        !isBlankCell(values.office) ||
        !isBlankCell(values.startDate) ||
        !isBlankCell(values.endDate)
    ) {
        return 'context';
    }

    return 'hierarchy';
}

/**
 * Funding source that counts: only `output` rows carry one. Context rows
 * silently coerce to null (no info line); hierarchy rows are judged by
 * the funding-source rule instead.
 *
 * Continuation rows inherit their block leader's context: pass the
 * leader's values as `blockValues` so a fund-carrying continuation under
 * an output block keeps its own fund cell. `'ppa'` rows pass their own
 * values (or nothing — same result).
 */
export function effectiveFundingSource(
    values: Record<string, string | null>,
    blockValues?: Record<string, string | null>,
): string | null {
    return outputRowState(resolveRowContext(values, blockValues)) ===
        'output'
        ? (values.fundingSource ?? null)
        : null;
}

/**
 * Merge a kept row's anchor fields over its block leader's. Continuation
 * rows leave office/schedule/output blank by format; the leader's values
 * fill those gaps so the anchor rule judges the block context, not the
 * blank cells. A row's own non-blank values always win.
 */
export function resolveRowContext(
    values: Record<string, string | null>,
    blockValues?: Record<string, string | null>,
): Record<string, string | null> {
    if (!blockValues) return values;

    const merged = { ...values };

    for (const field of [
        'office',
        'startDate',
        'endDate',
        'expectedOutput',
    ] as const) {
        if (isBlankCell(merged[field])) {
            merged[field] = blockValues[field] ?? null;
        }
    }

    return merged;
}

/** Lenient GF Proper check — dashes/spaces/case ignored (`GF-Proper`, `GF Proper`, `GF`). */
export function isGfProperFund(value: string | null): boolean {
    if (value == null) return false;

    const compact = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

    return compact === 'gfproper' || compact === 'gf';
}

/** Blank, `-`, or any numeric zero (`0`, `0.00`) counts as no CC value. */
export function isEmptyCcValue(value: string | null): boolean {
    if (value == null) return true;

    const trimmed = value.trim();

    if (trimmed === '' || trimmed === '-') return true;

    const numeric = Number(trimmed);

    return !Number.isNaN(numeric) && numeric === 0;
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
    const descWithoutCode: number[] = [];
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

        // A PPA Description with a blank AIP Reference Code is malformed —
        // a real continuation leaves both fields blank together. Never
        // kept; Verify reports it. (A footer row instead carries text in
        // the ref-code field.)
        if (values.refCode === null && values.description !== null) {
            descWithoutCode.push(r);
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
        descWithoutCode,
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
            warnings: [],
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
            warnings: [],
            details: [],
            ppaBlocks: 0,
            rowsKept: 0,
        };
    }

    const errors: AipSummaryVerifyIssue[] = [];
    const warnings: AipSummaryVerifyIssue[] = [];
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

    const { kept, numberRow, skippedBlank, skippedFooter, descWithoutCode } =
        extractAipSummaryRows(ws, {
            ...config,
            headerRow: config.headerRow,
        });

    for (const row of descWithoutCode) {
        errors.push({
            row,
            message:
                `${AIP_SUMMARY_FIELD_LABELS.description} (col ${config.columnConfig.description}) ` +
                `without an ${AIP_SUMMARY_FIELD_LABELS.refCode} (col ${config.columnConfig.refCode}) — ` +
                'continuations leave both blank together',
        });
    }

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

    // Current block leader's anchor fields. Continuation rows inherit
    // them for the anchor rule (they leave these cells blank by format).
    let blockValues: Record<string, string | null> | null = null;

    for (const keptRow of kept) {
        const { row, kind, values } = keptRow;

        if (kind === 'ppa') {
            blockValues = values;
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
                } else {
                    for (const kind of prefix.warnings) {
                        warnings.push({
                            row,
                            message:
                                kind === 'missing-dot'
                                    ? `Prefix missing trailing "." for "${code}" (warning — formatting only)`
                                    : `Prefix spacing normalized for "${code}" (warning — formatting only)`,
                        });
                    }
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

        // Funding source anchors on the expected output: a hierarchy row
        // (office, schedule, and output all blank) carrying a funding
        // source is an error. Context rows silently coerce their fund to
        // null (see `effectiveFundingSource`) — no info line.
        // Continuation rows inherit their block leader's context.
        if (
            outputRowState(resolveRowContext(values, blockValues ?? undefined)) ===
                'hierarchy' &&
            !isBlankCell(values.fundingSource)
        ) {
            errors.push({
                row,
                message:
                    `Funding source "${values.fundingSource}" has no expected output ` +
                    `(office, schedule, and output are all blank) — must be blank`,
            });
        }

        // One row carries exactly one funding source: the sheet grain is
        // one row per expected output × funding source, so a cell naming
        // several funds must be split across rows first.
        if (splitFundSources(values.fundingSource).length > 1) {
            errors.push({
                row,
                message:
                    `Funding source lists ${splitFundSources(values.fundingSource).length} sources ` +
                    `("${values.fundingSource}") — one funding source per row; split across rows`,
            });
        }

        // Climate fields ride on GF Proper funding only — any other fund
        // (or none) with a CC value set is an error. Runs on the
        // effective fund, so context rows (fund coerced to null) with CC
        // values set fail here too. Each continuation judges its own fund
        // cell against its (possibly inherited) output context.
        if (
            !isGfProperFund(
                effectiveFundingSource(values, blockValues ?? undefined),
            )
        ) {
            const set = (
                [
                    'adaptation',
                    'mitigation',
                    'typology',
                ] as const
            ).filter((field) => !isEmptyCcValue(values[field]));

            if (set.length > 0) {
                const names = set
                    .map((field) => AIP_SUMMARY_FIELD_LABELS[field])
                    .join(', ');
                errors.push({
                    row,
                    message:
                        `CC fields require "GF Proper" funding ` +
                        `(got "${effectiveFundingSource(values, blockValues ?? undefined) ?? '—'}"): ${names} must be blank`,
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
    const warningSuffix =
        warnings.length > 0
            ? `, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`
            : '';

    return {
        valid,
        message: valid
            ? `Format OK — ${parsed.size} PPA block${parsed.size === 1 ? '' : 's'}, ${kept.length} rows kept${warningSuffix}`
            : `Found ${errors.length} issue${errors.length === 1 ? '' : 's'}${warningSuffix}`,
        errors,
        warnings,
        details,
        ppaBlocks: parsed.size,
        rowsKept: kept.length,
    };
}
