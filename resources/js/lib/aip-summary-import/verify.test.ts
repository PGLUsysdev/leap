import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { getDefaultAipSummaryConfig } from "./sheet-config";
import { extractAipSummaryRows, verifyAipSummarySheet } from "./verify";

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "M", "N", "O"];
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 13, 14, 15];

function buildSheet(dataRows: Array<Array<string | null>>, numberRow?: Array<number | null>) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sheet1");

    LETTERS.forEach((letter, i) => {
        ws.getRow(8).getCell(letter).value = numberRow?.[i] ?? NUMBERS[i];
    });

    dataRows.forEach((cells, i) => {
        const row = ws.getRow(9 + i);
        cells.forEach((value, j) => {
            row.getCell(LETTERS[j]).value = value;
        });
    });

    return wb;
}

const PROGRAM = [
    "1000-1-03-009-001",
    "A. Health Program",
    "MHO",
    "Jan-26",
    "Dec-26",
    "Served",
    "GF",
    "0",
    "0",
    "A123",
];

const PROJECT = [
    "1000-1-03-009-001-001",
    "1. Immunization",
    "MHO",
    "Jan-26",
    "Jun-26",
    "500 kids",
    "GF",
    "0",
    "0",
    "A123",
];

describe("extractAipSummaryRows", () => {
    it("classifies ppa, continuation, blank, and signatory rows", () => {
        const wb = buildSheet([
            PROGRAM,
            [null, null, "MHO", "Jan-26", "Dec-26", "500 kids", "SEF", "0", "0", "A123"],
            [null, null, null, null, null, null, null, null, null, null],
            [
                "Prepared by:",
                null,
                "Reviewed by:",
                null,
                null,
                "Approved by:",
                null,
                null,
                null,
                null,
            ],
        ]);
        const ws = wb.getWorksheet("Sheet1")!;
        const result = extractAipSummaryRows(ws, { ...getDefaultAipSummaryConfig(), headerRow: 7 });

        expect(result.kept.map((k) => k.kind)).toEqual(["ppa", "continuation"]);
        expect(result.skippedBlank).toBe(1);
        expect(result.skippedFooter).toBe(1);
    });
});

describe("verifyAipSummarySheet", () => {
    it("accepts a valid program + project hierarchy", () => {
        const wb = buildSheet([PROGRAM, PROJECT]);
        const result = verifyAipSummarySheet(wb, "Sheet1", getDefaultAipSummaryConfig());

        expect(result.valid).toBe(true);
        expect(result.ppaBlocks).toBe(2);
        expect(result.rowsKept).toBe(2);
    });

    it("rejects a child whose parent is missing", () => {
        const wb = buildSheet([PROJECT]);
        const result = verifyAipSummarySheet(wb, "Sheet1", getDefaultAipSummaryConfig());

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.message.includes("not found in sheet"))).toBe(true);
    });

    it("rejects ref codes deeper than subsubactivity", () => {
        const wb = buildSheet([
            PROGRAM,
            [
                "1000-1-03-009-001-001-01-1-2-3",
                "1.1.1.1.1. Too deep",
                "MHO",
                "Jan-26",
                "Dec-26",
                "Deep",
                "GF",
                "0",
                "0",
                "A123",
            ],
        ]);
        const result = verifyAipSummarySheet(wb, "Sheet1", getDefaultAipSummaryConfig());

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.message.includes("5–9"))).toBe(true);
    });

    it("rejects a wrong number row", () => {
        const wb = buildSheet([PROGRAM], [1, 2, 3, 4, 5, 6, 7, 13, 14, 99]);
        const result = verifyAipSummarySheet(wb, "Sheet1", getDefaultAipSummaryConfig());

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.message.includes("Number row mismatch"))).toBe(true);
    });

    it("treats office, expected output, funding source, and schedule as optional", () => {
        const wb = buildSheet([
            [
                "1000-1-03-009-001",
                "A. Health Program",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
            ],
        ]);
        const result = verifyAipSummarySheet(wb, "Sheet1", getDefaultAipSummaryConfig());

        expect(result.valid).toBe(true);
    });

    it("rejects a tandem mismatch between code depth and description prefix", () => {
        const wb = buildSheet([
            PROGRAM,
            [
                "1000-1-03-009-001-001",
                "1.1. Wrong depth prefix",
                "MHO",
                "Jan-26",
                "Jun-26",
                "Mismatch",
                "GF",
                "0",
                "0",
                "A123",
            ],
        ]);
        const result = verifyAipSummarySheet(wb, "Sheet1", getDefaultAipSummaryConfig());

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.message.includes("doesn't match"))).toBe(true);
    });
});
