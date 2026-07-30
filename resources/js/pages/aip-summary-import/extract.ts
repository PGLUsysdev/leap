import type ExcelJS from 'exceljs';

interface ColumnMap {
    ppa: string;
    startDate: string;
    endDate: string;
    expectedOutput: string;
    fundingSourceId: string;
    psAmount: string;
    mooeAmount: string;
    feAmount: string;
    coAmount: string;
    ccetAdaptation: string;
    ccetMitigation: string;
    ccTypologyId: string;
}

interface ExtractConfig {
    worksheet: ExcelJS.Worksheet;
    startRow: number;
    endRow?: number;
    columnMap: ColumnMap;
}

export type NodeType = 'Program' | 'Project' | 'Activity' | 'Sub-Activity';

export interface PpaRow {
    tempId: number;
    parentTempId: number | null;
    name: string;
    type: NodeType;
}

export interface AipEntryRow {
    ppaTempId: number;
    start_date: string | null;
    end_date: string | null;
    expected_output: string | null;
}

export interface PpaFundingSourceRow {
    ppaTempId: number;
    funding_source_id: string | null;
    ps_amount: number | null;
    mooe_amount: number | null;
    fe_amount: number | null;
    co_amount: number | null;
    ccet_adaptation: number | null;
    ccet_mitigation: number | null;
    cc_typology_id: number | null;
}

export interface ExtractResult {
    ppas: PpaRow[];
    aipEntries: AipEntryRow[];
    fundingSources: PpaFundingSourceRow[];
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

function cellNumber(cell: ExcelJS.Cell): number | null {
    let value: any = cell.value;

    if (typeof value === 'object' && value !== null && 'result' in value) {
        value = value.result;
    }

    if (value == null || value === '') {
        return null;
    }

    if (typeof value === 'number') {
        return value;
    }

    const parsed = Number(String(value).replace(/,/g, '').trim());

    return Number.isNaN(parsed) ? null : parsed;
}

export function extractData(config: ExtractConfig): ExtractResult {
    const { worksheet, startRow, endRow, columnMap } = config;

    const ppas: PpaRow[] = [];
    const aipEntries: AipEntryRow[] = [];
    const fundingSources: PpaFundingSourceRow[] = [];

    let nextTempId = 1;

    let currentProgramTempId: number | null = null;
    let currentProjectTempId: number | null = null;
    let currentActivityTempId: number | null = null;

    const lastRow = endRow ?? worksheet.rowCount;

    for (let rowNumber = startRow; rowNumber <= lastRow; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        const raw = cellText(row.getCell(columnMap.ppa));

        if (!raw) {
            continue;
        }

        const type = getType(raw);

        if (!type) {
            continue;
        }

        const tempId = nextTempId++;

        let parentTempId: number | null = null;

        switch (type) {
            case 'Program':
                currentProgramTempId = tempId;
                currentProjectTempId = null;
                currentActivityTempId = null;
                break;

            case 'Project':
                parentTempId = currentProgramTempId;
                currentProjectTempId = tempId;
                currentActivityTempId = null;
                break;

            case 'Activity':
                parentTempId = currentProjectTempId;
                currentActivityTempId = tempId;
                break;

            case 'Sub-Activity':
                parentTempId = currentActivityTempId;
                break;
        }

        ppas.push({
            tempId,
            parentTempId,
            name: cleanName(raw),
            type,
        });

        aipEntries.push({
            ppaTempId: tempId,
            start_date: cellText(row.getCell(columnMap.startDate)),
            end_date: cellText(row.getCell(columnMap.endDate)),
            expected_output: cellText(row.getCell(columnMap.expectedOutput)),
        });

        fundingSources.push({
            ppaTempId: tempId,
            funding_source_id: cellText(row.getCell(columnMap.fundingSourceId)),
            ps_amount: cellNumber(row.getCell(columnMap.psAmount)),
            mooe_amount: cellNumber(row.getCell(columnMap.mooeAmount)),
            fe_amount: cellNumber(row.getCell(columnMap.feAmount)),
            co_amount: cellNumber(row.getCell(columnMap.coAmount)),
            ccet_adaptation: cellNumber(row.getCell(columnMap.ccetAdaptation)),
            ccet_mitigation: cellNumber(row.getCell(columnMap.ccetMitigation)),
            cc_typology_id: cellNumber(row.getCell(columnMap.ccTypologyId)),
        });
    }

    return { ppas, aipEntries, fundingSources };
}
