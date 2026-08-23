import { writeFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";

const FILE_NAME = "Reference-1_-PGLU-AIP-CY-2027-2.xlsx";
const SHEET_NAME = "G11_PICTO";

const START_ROW = 9;

const COL = {
    ppa: "B",
    startDate: "D",
    endDate: "E",
    expectedOutput: "F",

    fundingSourceId: "G",
    psAmount: "H",
    mooeAmount: "I",
    feAmount: "J",
    coAmount: "K",
    ccetAdaptation: "M",
    ccetMitigation: "N",
    ccTypologyId: "O",
};

type NodeType = "Program" | "Project" | "Activity" | "Sub-Activity";

interface Ppa {
    id: number;
    parent_id: number | null;
    name: string;
    type: NodeType;
}

interface AipEntry {
    id: number;
    ppa_id: number;
    start_date: string | null;
    end_date: string | null;
    expected_output: string | null;
}

interface PpaFundingSource {
    id: number;
    aip_entry_id: number;
    funding_source_id: string | null;
    ps_amount: number | null;
    mooe_amount: number | null;
    fe_amount: number | null;
    co_amount: number | null;
    ccet_adaptation: number | null;
    ccet_mitigation: number | null;
    cc_typology_id: number | null;
}

function getType(value: string): NodeType | null {
    if (/^[A-Z]\.\s/.test(value)) {
        return "Program";
    }

    if (/^\d+\.\d+\.\d+\.\s/.test(value)) {
        return "Sub-Activity";
    }

    if (/^\d+\.\d+\.\s/.test(value)) {
        return "Activity";
    }

    if (/^\d+\.\s/.test(value)) {
        return "Project";
    }

    return null;
}

function cleanName(value: string): string {
    return value
        .replace(/^[A-Z]\.\s*/, "")
        .replace(/^\d+(?:\.\d+)*\.\s*/, "")
        .trim();
}

function escapePhp(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function cellText(cell: ExcelJS.Cell): string | null {
    let value: any = cell.value;

    if (typeof value === "object" && value !== null && "result" in value) {
        value = value.result;
    }

    if (value == null) {
        return null;
    }

    return String(value).trim() || null;
}

function cellNumber(cell: ExcelJS.Cell): number | null {
    let value: any = cell.value;

    if (typeof value === "object" && value !== null && "result" in value) {
        value = value.result;
    }

    if (value == null || value === "") {
        return null;
    }

    if (typeof value === "number") {
        return value;
    }

    const parsed = Number(String(value).replace(/,/g, "").trim());

    return Number.isNaN(parsed) ? null : parsed;
}

function phpValue(value: string | number | null): string {
    if (value === null) {
        return "null";
    }

    if (typeof value === "number") {
        return String(value);
    }

    return `'${escapePhp(value)}'`;
}

function ppaPhp(data: Ppa[]): string {
    return `[
${data
    .map(
        (item) => `    [
        'id' => ${item.id},
        'parent_id' => ${item.parent_id === null ? "null" : item.parent_id},
        'name' => '${escapePhp(item.name)}',
        'type' => '${item.type}',
    ]`,
    )
    .join(",\n")}
];`;
}

function aipPhp(data: AipEntry[]): string {
    return `[
${data
    .map(
        (item) => `    [
        'id' => ${item.id},
        'ppa_id' => ${item.ppa_id},
        'start_date' => ${phpValue(item.start_date)},
        'end_date' => ${phpValue(item.end_date)},
        'expected_output' => ${phpValue(item.expected_output)},
    ]`,
    )
    .join(",\n")}
];`;
}

function fundingSourcePhp(data: PpaFundingSource[]): string {
    return `[
${data
    .map(
        (item) => `    [
        'id' => ${item.id},
        'aip_entry_id' => ${item.aip_entry_id},
        'funding_source_id' => ${phpValue(item.funding_source_id)},
        'ps_amount' => ${phpValue(item.ps_amount)},
        'mooe_amount' => ${phpValue(item.mooe_amount)},
        'fe_amount' => ${phpValue(item.fe_amount)},
        'co_amount' => ${phpValue(item.co_amount)},
        'ccet_adaptation' => ${phpValue(item.ccet_adaptation)},
        'ccet_mitigation' => ${phpValue(item.ccet_mitigation)},
        'cc_typology_id' => ${phpValue(item.cc_typology_id)},
    ]`,
    )
    .join(",\n")}
];`;
}

async function main() {
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.readFile(path.join(import.meta.dirname, FILE_NAME));

    const worksheet = workbook.getWorksheet(SHEET_NAME);

    if (!worksheet) {
        throw new Error(`Worksheet "${SHEET_NAME}" not found.`);
    }

    const ppas: Ppa[] = [];
    const aipEntries: AipEntry[] = [];
    const fundingSources: PpaFundingSource[] = [];

    let nextId = 1;

    let currentProgramId: number | null = null;
    let currentProjectId: number | null = null;
    let currentActivityId: number | null = null;

    for (let rowNumber = START_ROW; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        const raw = cellText(row.getCell(COL.ppa));

        if (!raw) {
            continue;
        }

        const type = getType(raw);

        if (!type) {
            continue;
        }

        const id = nextId++;

        let parentId: number | null = null;

        switch (type) {
            case "Program":
                currentProgramId = id;
                currentProjectId = null;
                currentActivityId = null;
                break;

            case "Project":
                parentId = currentProgramId;
                currentProjectId = id;
                currentActivityId = null;
                break;

            case "Activity":
                parentId = currentProjectId;
                currentActivityId = id;
                break;

            case "Sub-Activity":
                parentId = currentActivityId;
                break;
        }

        ppas.push({
            id,
            parent_id: parentId,
            name: cleanName(raw),
            type,
        });

        aipEntries.push({
            id,
            ppa_id: id,
            start_date: cellText(row.getCell(COL.startDate)),
            end_date: cellText(row.getCell(COL.endDate)),
            expected_output: cellText(row.getCell(COL.expectedOutput)),
        });

        fundingSources.push({
            id,
            aip_entry_id: id,
            funding_source_id: cellText(row.getCell(COL.fundingSourceId)),
            ps_amount: cellNumber(row.getCell(COL.psAmount)),
            mooe_amount: cellNumber(row.getCell(COL.mooeAmount)),
            fe_amount: cellNumber(row.getCell(COL.feAmount)),
            co_amount: cellNumber(row.getCell(COL.coAmount)),
            ccet_adaptation: cellNumber(row.getCell(COL.ccetAdaptation)),
            ccet_mitigation: cellNumber(row.getCell(COL.ccetMitigation)),
            cc_typology_id: cellNumber(row.getCell(COL.ccTypologyId)),
        });
    }

    await writeFile(path.join(import.meta.dirname, "ppa.php"), ppaPhp(ppas), "utf8");

    await writeFile(path.join(import.meta.dirname, "aip_entries.php"), aipPhp(aipEntries), "utf8");

    await writeFile(
        path.join(import.meta.dirname, "ppa_funding_sources.php"),
        fundingSourcePhp(fundingSources),
        "utf8",
    );

    console.log(`Generated ${ppas.length} PPAs.`);
    console.log(`Generated ${aipEntries.length} AIP entries.`);
    console.log(`Generated ${fundingSources.length} funding sources.`);
}

main().catch(console.error);
