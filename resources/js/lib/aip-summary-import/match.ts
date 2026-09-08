/**
 * AIP Summary DB matching — extracted records × existing records.
 *
 * Pure functions, no React. Consumes the Inertia props served by
 * `AipSummaryImportController@index` and the records from `./extract`.
 * PPA-only scope: every block resolves its office (from the ref-code
 * prefix) and its existence (by full code within the fiscal year).
 */
import { normalize } from '@/lib/ppmp/normalize';
import type { AipSummaryRecord } from './extract';
import type { AipPpaType } from './verify';

export type ExistingOffice = {
    id: number;
    acronym: string | null;
    parent_id: number | null;
    full_code: string;
};

export type ExistingPpa = {
    id: number;
    office_id: number;
    parent_id: number | null;
    name: string;
    type: string;
    code_suffix: string | null;
    full_code: string;
};

export type PpaBlockMatch = {
    fullCode: string;
    name: string;
    type: AipPpaType;
    rows: number[];
    office: ExistingOffice | null;
    ppa: ExistingPpa | null;
    status: 'exists' | 'new' | 'no-office';
};

/** First four dash segments: the office prefix of a ref code. */
export function officePrefixOf(fullCode: string): string {
    return fullCode.trim().split('-').slice(0, 4).join('-');
}

function indexOfficesByFullCode(
    offices: ExistingOffice[],
): Map<string, ExistingOffice> {
    const map = new Map<string, ExistingOffice>();

    for (const office of offices) {
        if (!map.has(office.full_code)) {
            map.set(office.full_code, office);
        }
    }

    return map;
}

function indexPpasByFullCodeNorm(
    ppas: ExistingPpa[],
): Map<string, ExistingPpa> {
    const map = new Map<string, ExistingPpa>();

    for (const ppa of ppas) {
        const key = normalize(ppa.full_code);

        if (!map.has(key)) {
            map.set(key, ppa);
        }
    }

    return map;
}

/**
 * Group extract records into their PPA blocks and resolve each block
 * against the DB: office by ref-code prefix, existence by full code.
 */
export function matchPpaBlocks(
    records: AipSummaryRecord[],
    offices: ExistingOffice[],
    ppas: ExistingPpa[],
): PpaBlockMatch[] {
    const officesByCode = indexOfficesByFullCode(offices);
    const ppasByCode = indexPpasByFullCodeNorm(ppas);
    const seen = new Map<string, PpaBlockMatch>();

    for (const record of records) {
        let block = seen.get(record.fullCode);

        if (!block) {
            const office =
                officesByCode.get(officePrefixOf(record.fullCode)) ?? null;
            const ppa = ppasByCode.get(record.fullCodeNorm) ?? null;

            block = {
                fullCode: record.fullCode,
                name: record.name,
                type: record.type,
                rows: [],
                office,
                ppa,
                status: office === null ? 'no-office' : ppa === null ? 'new' : 'exists',
            };
            seen.set(record.fullCode, block);
        }

        block.rows.push(record.row);
    }

    return [...seen.values()];
}
