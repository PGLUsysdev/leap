import { writeFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";

async function exportColumnToJson(fileName: string, sheetName: string, colLetter: string) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.join(import.meta.dirname, fileName));

    const worksheet = workbook.getWorksheet(sheetName);

    if (!worksheet) {
        throw new Error(`Sheet "${sheetName}" not found.`);
    }

    const data: any[] = [];

    // Start at row 9 (skip rows 6-8)
    worksheet.getColumn(colLetter).eachCell({ includeEmpty: true }, (cell, row) => {
        if (row < 9) {
            return;
        }

        let value = cell.value;

        if (typeof value === "object" && value !== null && "result" in value) {
            value = value.result;
        }

        // Skip null/undefined/empty strings
        if (value == null || value === "") {
            return;
        }

        data.push(value);
    });

    const outputPath = path.join(import.meta.dirname, "ppa.json");

    await writeFile(outputPath, JSON.stringify(data, null, 2), "utf8");

    console.log(`Saved ${data.length} values to ${outputPath}`);
}

exportColumnToJson("Reference-1_-PGLU-AIP-CY-2027-2.xlsx", "G11_PICTO", "B");
