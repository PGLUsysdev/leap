import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { groupSheet, isCoaLabel  } from "@/lib/ppmp/sheet-grouping";
import type {SheetGroupOptions} from "@/lib/ppmp/sheet-grouping";

const CFG = { columnConfig: { category: "F", coa: "D" }, coaLabelMode: "without-label" as const };
const CFG_WITH_LABEL = { columnConfig: { category: "F", coa: "D" }, coaLabelMode: "with-label" as const };

function makeSheet(cells: Record<string, string>): ExcelJS.Worksheet {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("S1");

    for (const [addr, value] of Object.entries(cells)) {
        ws.getCell(addr).value = value;
    }

    // Keep the sheet dense like real .xlsx files: groupSheet bounds its loop by
    // ws.actualRowCount (count of non-empty rows), so fill column A down to the
    // max row. Column A is never read by grouping (only F/D), so this is invisible.
    const rows = Object.keys(cells).map((addr) => Number(addr.replace(/^[A-Z]+/, "")));
    const maxRow = rows.length > 0 ? Math.max(...rows) : 1;

    for (let r = 1; r <= maxRow; r++) {
        const anchor = ws.getCell(`A${r}`);

        if (anchor.value == null) anchor.value = ".";
    }

    return ws;
}

function collectErrors() {
    const errors: Array<{ row: number; message: string }> = [];

    return {
        errors,
        onError: (row: number, message: string) => {
            errors.push({ row, message });
        },
    };
}

function withoutLabelOpts(overrides: Partial<SheetGroupOptions> = {}): SheetGroupOptions {
    return {
        sectionName: "procurement",
        coaLabelMode: "without-label",
        ...overrides,
    };
}

function withLabelOpts(overrides: Partial<SheetGroupOptions> = {}): SheetGroupOptions {
    return {
        sectionName: "procurement",
        coaLabelMode: "with-label",
        ...overrides,
    };
}

describe("groupSheet zero/one/many", () => {
    it("should_ReturnEmpty_When_SheetHasNoDataRows", () => {
        // Arrange
        const ws = makeSheet({});
        const { errors, onError } = collectErrors();
        // Act
        const groups = groupSheet(ws, CFG, 2, 10, withoutLabelOpts(), onError);
        // Assert
        expect(groups).toEqual([]);
        expect(errors).toEqual([]);
    });

    it("should_GroupSingleCategoryCoaAndItems_When_WithoutLabelHappyPath", () => {
        // Arrange
        const ws = makeSheet({
            F2: "Office Supplies",
            F3: "paper",
            D3: "COA-1",
            F4: "pen",
            D4: "COA-1",
            F5: "Office Supplies - TOTAL",
        });
        const { errors, onError } = collectErrors();
        // Act
        const groups = groupSheet(ws, CFG, 2, 5, withoutLabelOpts(), onError);
        // Assert
        expect(errors).toEqual([]);
        expect(groups).toHaveLength(1);
        expect(groups[0].cat).toBe("Office Supplies");
        expect(groups[0].catRow).toBe(2);
        expect(groups[0].totalRow).toBe(5);
        expect(groups[0].coas).toHaveLength(1);
        expect(groups[0].coas[0]).toMatchObject({ coa: "COA-1", coaRow: 3, items: 2 });
    });

    it("should_SplitCoaGroups_When_CoaChangesWithoutLabel", () => {
        // Arrange
        const ws = makeSheet({
            F2: "Office Supplies",
            F3: "paper",
            D3: "COA-1",
            F4: "toner",
            D4: "COA-2",
            F5: "Office Supplies - TOTAL",
        });
        const { errors, onError } = collectErrors();
        // Act
        const groups = groupSheet(ws, CFG, 2, 5, withoutLabelOpts(), onError);
        // Assert
        expect(errors).toEqual([]);
        expect(groups).toHaveLength(1);
        expect(groups[0].coas).toHaveLength(2);
        expect(groups[0].coas[0].items).toBe(1);
        expect(groups[0].coas[1].items).toBe(1);
    });
});

describe("groupSheet boundaries and errors", () => {
    it("should_ReportMissingTotal_When_CategoryNeverClosed", () => {
        // Arrange
        const ws = makeSheet({
            F2: "Office Supplies",
            F3: "paper",
            D3: "COA-1",
        });
        const { errors, onError } = collectErrors();
        // Act
        const groups = groupSheet(ws, CFG, 2, 3, withoutLabelOpts(), onError);
        // Assert
        expect(groups).toHaveLength(1);
        expect(errors.some((e) => e.message.includes('missing closing "Office Supplies - TOTAL"'))).toBe(true);
    });

    it("should_ReportItemWithoutCategory_When_ItemAppearsFirst", () => {
        // Arrange
        const ws = makeSheet({
            F2: "paper",
            D2: "COA-1",
        });
        const { errors, onError } = collectErrors();
        // Act
        const groups = groupSheet(ws, CFG, 2, 2, withoutLabelOpts(), onError);
        // Assert
        expect(groups).toEqual([]);
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toContain("without active category");
    });

    it("should_ReportTotalMismatch_When_TotalNameDoesNotMatchStrict", () => {
        // Arrange
        const ws = makeSheet({
            F2: "Office Supplies",
            F3: "paper",
            D3: "COA-1",
            F4: "Wrong - TOTAL",
        });
        const { errors, onError } = collectErrors();
        // Act
        const groups = groupSheet(ws, CFG, 2, 4, withoutLabelOpts({ strictTotal: true }), onError);
        // Assert
        expect(groups).toHaveLength(1);
        expect(errors.some((e) => e.message.includes("Total mismatch"))).toBe(true);
    });

    it("should_CreateSentinel_When_AdditionalSectionStartsWithItem", () => {
        // Arrange
        const ws = makeSheet({
            F2: "paper",
            D2: "COA-1",
            F3: "Additional Items (Uncategorized) - TOTAL",
        });
        const { errors, onError } = collectErrors();
        // Act
        const groups = groupSheet(
            ws,
            CFG,
            2,
            3,
            withoutLabelOpts({ sectionName: "additional", createSentinelIfMissing: true }),
            onError,
        );
        // Assert
        expect(errors).toEqual([]);
        expect(groups).toHaveLength(1);
        expect(groups[0].cat).toBe("Additional Items (Uncategorized)");
        expect(groups[0].coas).toHaveLength(1);
    });

    it("should_SkipDescriptionRow_When_DataIsDescriptionHeader", () => {
        // Arrange
        const ws = makeSheet({
            F2: "Office Supplies",
            F3: "description",
            F4: "paper",
            D4: "COA-1",
            F5: "Office Supplies - TOTAL",
        });
        const { errors, onError } = collectErrors();
        // Act
        const groups = groupSheet(ws, CFG, 2, 5, withoutLabelOpts(), onError);
        // Assert
        expect(errors).toEqual([]);
        expect(groups).toHaveLength(1);
        expect(groups[0].coas[0].items).toBe(1);
    });
});

describe("groupSheet with-label mode", () => {
    it("should_GroupLabelThenItems_When_CoaLabelFollowedByMatchingItems", () => {
        // Arrange: r3 is a COA label because r4 D == "Printers"
        const ws = makeSheet({
            F2: "Office Supplies",
            F3: "Printers",
            F4: "paper",
            D4: "Printers",
            F5: "Office Supplies - TOTAL",
        });
        const { errors, onError } = collectErrors();
        // Act
        const groups = groupSheet(ws, CFG_WITH_LABEL, 2, 5, withLabelOpts(), onError);
        // Assert
        expect(errors).toEqual([]);
        expect(groups).toHaveLength(1);
        expect(groups[0].coas).toHaveLength(1);
        expect(groups[0].coas[0]).toMatchObject({ coa: "Printers", coaRow: 3, items: 1 });
    });

    it("should_ImplicitCreateCoa_When_MissingCoaModeIsImplicitCreate", () => {
        // Arrange: item carries D but no prior label
        const ws = makeSheet({
            F2: "Office Supplies",
            F3: "paper",
            D3: "COA-X",
            F4: "Office Supplies - TOTAL",
        });
        const { errors, onError } = collectErrors();
        // Act
        const groups = groupSheet(ws, CFG_WITH_LABEL, 2, 4, withLabelOpts({ missingCoaMode: "implicitCreate" }), onError);
        // Assert
        expect(errors).toEqual([]);
        expect(groups).toHaveLength(1);
        expect(groups[0].coas).toHaveLength(1);
        expect(groups[0].coas[0].coa).toBe("COA-X");
    });

    it("should_ReportItemWithoutCoa_When_WithLabelAndMissingCoaIsError", () => {
        // Arrange
        const ws = makeSheet({
            F2: "Office Supplies",
            F3: "paper",
            D3: "COA-X",
            F4: "Office Supplies - TOTAL",
        });
        const { errors, onError } = collectErrors();
        // Act
        const groups = groupSheet(ws, CFG_WITH_LABEL, 2, 4, withLabelOpts({ missingCoaMode: "error" }), onError);
        // Assert
        expect(errors.some((e) => e.message.includes("without active COA"))).toBe(true);
        expect(groups).toHaveLength(1);
        expect(groups[0].coas).toHaveLength(0);
    });
});

describe("isCoaLabel", () => {
    it("should_ReturnTrue_When_NextCoaMatchesData", () => {
        // Arrange
        const ws = makeSheet({ F3: "Printers", F4: "x", D4: "Printers" });
        // Act
        const result = isCoaLabel(ws, 3, "printers", "F", "D");
        // Assert
        expect(result.isCoaLabel).toBe(true);
        expect(result.nextCoaRaw).toBe("Printers");
    });

    it("should_ReturnFalse_When_NextCoaDiffers", () => {
        const ws = makeSheet({ F3: "Printers", F4: "x", D4: "Other" });
        expect(isCoaLabel(ws, 3, "printers", "F", "D").isCoaLabel).toBe(false);
    });

    it("should_ReturnFalse_When_AtLastRow", () => {
        const ws = makeSheet({ F2: "Printers" });
        expect(isCoaLabel(ws, 2, "printers", "F", "D").isCoaLabel).toBe(false);
    });
});
