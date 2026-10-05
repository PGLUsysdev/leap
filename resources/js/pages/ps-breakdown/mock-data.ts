import type { Position } from '@/types';

/**
 * TEMPORARY mock dataset for PS Breakdown UI dev.
 * Set USE_MOCK to false in index.tsx to use live server props again.
 * chartOfAccounts + breakdownItems still come from the server;
 * only positions / rates / annualRateMap are mocked here.
 */

const ios = (id: number, sg: number, cls: string, classId: string) => ({
    id,
    occupational_service_code: '11',
    occupational_group_code: '001',
    class_id: classId,
    class: cls,
    salary_grade: sg,
    created_at: null,
    updated_at: null,
});

const incumbent = (id: number, name: string, step: number) => ({
    id,
    name,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@pglu.gov.ph`,
    email_verified_at: null,
    created_at: '',
    updated_at: '',
    office_id: 18,
    role_id: null,
    step,
});

export const mockPositions: Position[] = [
    {
        id: 101,
        office_id: 18,
        item_number: 'M-001',
        ios_id: 101,
        employment_type: 'permanent',
        is_funded: true,
        status: 'occupied',
        created_at: null,
        updated_at: null,
        ios: ios(101, 24, 'Provincial Administrator', 'PA-1'),
        user: incumbent(1001, 'Maria Santos', 3),
    },
    {
        id: 102,
        office_id: 18,
        item_number: 'M-002',
        ios_id: 102,
        employment_type: 'permanent',
        is_funded: true,
        status: 'occupied',
        created_at: null,
        updated_at: null,
        ios: ios(102, 19, 'Engineer III', 'E3-1'),
        user: incumbent(1002, 'Jose Reyes', 2),
    },
    {
        id: 103,
        office_id: 18,
        item_number: 'M-003',
        ios_id: 103,
        employment_type: 'permanent',
        is_funded: true,
        status: 'occupied',
        created_at: null,
        updated_at: null,
        ios: ios(103, 15, 'Administrative Officer III', 'AO3-1'),
        user: incumbent(1003, 'Ana Cruz', 4),
    },
    {
        id: 104,
        office_id: 18,
        item_number: 'M-004',
        ios_id: 104,
        employment_type: 'permanent',
        is_funded: true,
        status: 'occupied',
        created_at: null,
        updated_at: null,
        ios: ios(104, 11, 'Administrative Officer I', 'AO1-1'),
        user: incumbent(1004, 'Mark Dela Cruz', 1),
    },
    {
        id: 105,
        office_id: 18,
        item_number: 'M-005',
        ios_id: 105,
        employment_type: 'permanent',
        is_funded: true,
        status: 'vacant',
        created_at: null,
        updated_at: null,
        ios: ios(105, 8, 'Administrative Assistant II', 'AA2-1'),
    },
    {
        id: 106,
        office_id: 18,
        item_number: 'M-006',
        ios_id: 106,
        employment_type: 'casual',
        is_funded: true,
        status: 'occupied',
        created_at: null,
        updated_at: null,
        ios: ios(106, 11, 'Project Assistant', 'PAJ-1'),
        user: incumbent(1006, 'Liza Ramos', 1),
    },
    {
        id: 107,
        office_id: 18,
        item_number: 'M-007',
        ios_id: 107,
        employment_type: 'contractual',
        is_funded: true,
        status: 'vacant',
        created_at: null,
        updated_at: null,
        ios: ios(107, 1, 'Administrative Aide I', 'AA1-1'),
    },
    {
        id: 108,
        office_id: 18,
        item_number: 'M-008',
        ios_id: 108,
        employment_type: 'permanent',
        is_funded: true,
        status: 'occupied',
        created_at: null,
        updated_at: null,
        ios: ios(108, 8, 'Clerk III', 'C3-1'),
        user: incumbent(1008, 'Nilo Aquino', 5),
    },
];

export const mockRates: Record<string, number> = {
    pera_monthly: 2000,
    rata_sg_24_above: 4000,
    rata_sg_16_23: 2000,
    ta_sg_24_above: 2000,
    ta_sg_16_23: 1000,
    clothing_annual: 8000,
    laundry_monthly: 150,
    cash_gift: 5000,
    pei_max: 5000,
    gsis_percent: 12,
    ecip_percent: 1,
};

const annual = (monthly: number) => ({
    current: Math.round(monthly * 0.95 * 12),
    budget: monthly * 12,
});

export const mockAnnualRateMap: Record<
    number,
    { current: number; budget: number }
> = {
    101: annual(90000),
    102: annual(50000),
    103: annual(36000),
    104: annual(26000),
    105: annual(20000),
    106: annual(26000),
    107: annual(14634),
    108: annual(19000),
};
