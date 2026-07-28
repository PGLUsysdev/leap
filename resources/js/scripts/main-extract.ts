import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import ExcelJS from 'exceljs';

const FILE_NAME = 'Reference-1_-PGLU-AIP-CY-2027-2.xlsx';
const SHEET_NAME = 'G11_PICTO';

const START_ROW = 9;

const COL = {
    ppa: 'B',
    startDate: 'D',
    endDate: 'E',
    expectedOutput: 'F',

    fundingSourceId: 'G',
    psAmount: 'H',
    mooeAmount: 'I',
    feAmount: 'J',
    coAmount: 'K',
    ccetAdaptation: 'M',
    ccetMitigation: 'N',
    ccTypologyId: 'O',
};

type NodeType = 'Program' | 'Project' | 'Activity' | 'Sub-Activity';

interface Ppa {
    id: number;
    parent_id: number | null;
    name: string;
    type: NodeType;
}

interface AipEntry {
    id: number;
    start_date: string | null;
    end_date: string | null;
    expected_output: string | null;
}

function getType(value: string): NodeType | null {
    if (/^[A-Z]\.\s/.test(value)) {
        return 'Program';
    }

    if (/^\d+\.\d+\.\d+\.\s/.test(value)) {
        return 'Sub-Activity';
    }

    if (/^\d+\.\d+\.\s/.test(value)) {
        return 'Activity';
    }

    if (/^\d+\.\s/.test(value)) {
        return 'Project';
    }

    return null;
}

function cleanName(value: string): string {
    return value
        .replace(/^[A-Z]\.\s*/, '')
        .replace(/^\d+(?:\.\d+)*\.\s*/, '')
        .trim();
}

function escapePhp(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function cellText(cell: ExcelJS.Cell): string | null {
    let value: any = cell.value;

    if (typeof value === 'object' && value !== null && 'result' in value) {
        value = value.result;
    }

    if (value == null) {
        return null;
    }

    return String(value).trim() || null;
}

function phpValue(value: string | null): string {
    return value === null ? 'null' : `'${escapePhp(value)}'`;
}

function ppaPhp(data: Ppa[]): string {
    return `[
${data
    .map(
        (item) => `    [
        'id' => ${item.id},
        'parent_id' => ${item.parent_id === null ? 'null' : item.parent_id},
        'name' => '${escapePhp(item.name)}',
        'type' => '${item.type}',
    ]`,
    )
    .join(',\n')}
];`;
}

function aipPhp(data: AipEntry[]): string {
    return `[
${data
    .map(
        (item) => `    [
        'id' => ${item.id},
        'start_date' => ${phpValue(item.start_date)},
        'end_date' => ${phpValue(item.end_date)},
        'expected_output' => ${phpValue(item.expected_output)},
    ]`,
    )
    .join(',\n')}
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

    let nextId = 1;

    let currentProgramId: number | null = null;
    let currentProjectId: number | null = null;
    let currentActivityId: number | null = null;

    for (
        let rowNumber = START_ROW;
        rowNumber <= worksheet.rowCount;
        rowNumber++
    ) {
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
            case 'Program':
                currentProgramId = id;
                currentProjectId = null;
                currentActivityId = null;
                break;

            case 'Project':
                parentId = currentProgramId;
                currentProjectId = id;
                currentActivityId = null;
                break;

            case 'Activity':
                parentId = currentProjectId;
                currentActivityId = id;
                break;

            case 'Sub-Activity':
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
            start_date: cellText(row.getCell(COL.startDate)),
            end_date: cellText(row.getCell(COL.endDate)),
            expected_output: cellText(row.getCell(COL.expectedOutput)),
        });
    }

    await writeFile(
        path.join(import.meta.dirname, 'ppa.php'),
        ppaPhp(ppas),
        'utf8',
    );

    await writeFile(
        path.join(import.meta.dirname, 'aip_entries.php'),
        aipPhp(aipEntries),
        'utf8',
    );

    console.log(`Generated ${ppas.length} PPAs.`);
    console.log(`Generated ${aipEntries.length} AIP entries.`);
}

main().catch(console.error);
