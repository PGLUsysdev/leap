import { describe, expect, it } from "vitest";
import { getDefaultMappingConfig, getDefaultSharedConfig } from "@/lib/ppmp/sheet-config";
import type { SharedSheetConfig } from "@/lib/ppmp/sheet-config";

describe("getDefaultSharedConfig", () => {
    it("should_ReturnStandardDefaults_When_Called", () => {
        // Arrange + Act
        const cfg = getDefaultSharedConfig();
        // Assert: the calibration standard — D/E/F/G/H columns, header row 7,
        // with-label mode, account-title matching.
        expect(cfg.columnConfig).toEqual({
            category: "F",
            coa: "D",
            unit: "G",
            price: "H",
            itemNumber: "E",
        });
        expect(cfg.rowConfig).toEqual({
            headerRow: 7,
            additionalItemsHeaderRow: null,
            nonProcurementHeaderRow: null,
        });
        expect(cfg.coaLabelMode).toBe("with-label");
        expect(cfg.coaMatchField).toBe("account_title");
    });

    it("should_ReturnFreshObjects_When_CalledTwice", () => {
        // Arrange + Act
        const a = getDefaultSharedConfig();
        const b = getDefaultSharedConfig();
        // Assert: no shared references between calls (safe to mutate per sheet).
        expect(a).toEqual(b);
        expect(a.columnConfig).not.toBe(b.columnConfig);
        expect(a.rowConfig).not.toBe(b.rowConfig);
    });
});

describe("shared calibration shape", () => {
    it("should_CarryAllStandardFields_When_BuiltManually", () => {
        // Arrange
        const cfg: SharedSheetConfig = {
            columnConfig: { category: "F", coa: "D", unit: "G", price: "H", itemNumber: "E" },
            rowConfig: { headerRow: 7, additionalItemsHeaderRow: 100, nonProcurementHeaderRow: 200 },
            coaLabelMode: "without-label",
            coaMatchField: "account_title",
        };
        // Act + Assert: every standard field survives a spread (per-sheet patching).
        const patched: SharedSheetConfig = { ...cfg, coaLabelMode: "with-label" };
        expect(patched.columnConfig.itemNumber).toBe("E");
        expect(patched.rowConfig.additionalItemsHeaderRow).toBe(100);
        expect(patched.rowConfig.nonProcurementHeaderRow).toBe(200);
        expect(patched.coaLabelMode).toBe("with-label");
        expect(patched.coaMatchField).toBe("account_title");
    });
});

describe("getDefaultMappingConfig", () => {
    it("should_MatchSharedDefaults_When_Called", () => {
        expect(getDefaultMappingConfig()).toEqual(getDefaultSharedConfig());
    });
});
