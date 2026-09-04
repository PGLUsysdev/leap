import { describe, expect, it } from "vitest";
import {
    fromCatSheetConfig,
    getDefaultMappingConfig,
    getDefaultSharedConfig,
    toCatSheetConfig
    
    
} from "@/lib/ppmp/sheet-config";
import type {CatSheetConfig, SharedSheetConfig} from "@/lib/ppmp/sheet-config";

describe("getDefaultSharedConfig", () => {
    it("should_ReturnExpectedDefaults_When_Called", () => {
        // Arrange + Act
        const cfg = getDefaultSharedConfig();
        // Assert
        expect(cfg.columnConfig).toEqual({ category: "F", coa: "D", unit: "G", price: "H" });
        expect(cfg.rowConfig.headerRow).toBe(7);
        expect(cfg.coaLabelMode).toBe("with-label");
        expect(cfg.coaMatchField).toBe("auto");
    });
});

describe("toCatSheetConfig / fromCatSheetConfig", () => {
    it("should_PreserveFields_When_RoundTripping", () => {
        // Arrange
        const shared: SharedSheetConfig = {
            columnConfig: { category: "F", coa: "D", unit: "G", price: "H" },
            rowConfig: { headerRow: 7, additionalItemsHeaderRow: 100, nonProcurementHeaderRow: 200 },
            coaLabelMode: "without-label",
            coaMatchField: "auto",
        };
        // Act
        const cat: CatSheetConfig = toCatSheetConfig(shared);
        const back = fromCatSheetConfig(cat);
        // Assert
        expect(cat.dataColumn).toBe("F");
        expect(cat.coaColumn).toBe("D");
        expect(cat.headerRow).toBe(7);
        expect(back.columnConfig.category).toBe("F");
        expect(back.columnConfig.coa).toBe("D");
        expect(back.rowConfig.additionalItemsHeaderRow).toBe(100);
        expect(back.rowConfig.nonProcurementHeaderRow).toBe(200);
        expect(back.coaLabelMode).toBe("without-label");
    });

    it("should_MapNullToUndefined_When_OptionalRowsMissing", () => {
        const shared = getDefaultSharedConfig();
        const cat = toCatSheetConfig(shared);
        expect(cat.additionalItemsHeaderRow).toBeUndefined();
        expect(cat.nonProcurementHeaderRow).toBeUndefined();
    });
});

describe("getDefaultMappingConfig", () => {
    it("should_MatchSharedDefaults_When_Called", () => {
        expect(getDefaultMappingConfig()).toEqual(getDefaultSharedConfig());
    });
});
