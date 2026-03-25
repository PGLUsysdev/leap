export interface AipEntry {
    id: number;
    ppa_id: number;
    parent_ppa_id: number;
    start_date: string;
    end_date: string;
    expected_output: string;
    // funding_source?: FundingSource;
    funding_source?: FundingSource[];
    ps_amount: string;
    mooe_amount: string;
    fe_amount: string;
    co_amount: string;
    total_amount: string;
    ccet_adaptation: string;
    ccet_mitigation: string;
    created_at: string;
    updated_at: string;
}

// export interface AipEntry {
//     id: number;
//     ppa_id: number;
//     parent_ppa_id: number | null;
//     aip_ref_code: string;
//     ppa_desc: string;
//     implementing_office_department: string;
//     sched_implementation: {
//         start_date: string;
//         completion_date: string;
//     };
//     expected_outputs: string;
//     funding_source: string;
//     amount: {
//         ps: string;
//         mooe: string;
//         fe: string;
//         co: string;
//         total: string;
//     };
//     cc_adaptation: string;
//     cc_mitigation: string;
//     cc_typology_code: string;
//     children?: AipEntry[];
//     created_at: string;
//     updated_at: string;
// }

export interface LguLevel {
    code: string;
    created_at: string;
    id: number;
    level: string;
    updated_at: string;
}

export interface OfficeType {
    code: string;
    created_at: string;
    id: number;
    type: string;
    updated_at: string;
}

export interface ChartOfAccount {
    id: number;
    account_number: string;
    account_title: string;
    account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    expense_class: 'PS' | 'MOOE' | 'FE' | 'CO';
    account_series: string | null;
    parent_id: number | null;
    level: number;
    is_postable: boolean;
    is_active: boolean;
    normal_balance: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    ppmp_price_lists?: PriceList[];
}

export interface FiscalYear {
    id: number;
    year: string;
    status: string; // change later to enum
    created_at: string | null;
    updated_at: string | null;
}

export interface Ppmp {
    id: number;
    aip_entry_id: number;
    ppmp_price_list_id: number | null;
    jan_qty: string;
    jan_amount: string;
    feb_qty: string;
    feb_amount: string;
    mar_qty: string;
    mar_amount: string;
    apr_qty: string;
    apr_amount: string;
    may_qty: string;
    may_amount: string;
    jun_qty: string;
    jun_amount: string;
    jul_qty: string;
    jul_amount: string;
    aug_qty: string;
    aug_amount: string;
    sep_qty: string;
    sep_amount: string;
    oct_qty: string;
    oct_amount: string;
    nov_qty: string;
    nov_amount: string;
    dec_qty: string;
    dec_amount: string;
    created_at: string | null;
    updated_at: string | null;
    ppmp_price_list?: PriceList;
    funding_source: FundingSource;
}

export interface PriceList {
    id: number;
    item_number: number;
    description: string;
    unit_of_measurement: string;
    price: string;
    chart_of_account_id: number;
    ppmp_category_id: number;
    created_at: string | null;
    updated_at: string | null;
    category?: PpmpCategory;
    chart_of_account?: ChartOfAccount;
}

export interface PpmpCategory {
    id: number;
    name: string;
    created_at: string | null;
    updated_at: string | null;
}

export interface Sector {
    id: number;
    code: string;
    sector: string;
    created_at: string | null;
    updated_at: string | null;
}

export interface Ppa {
    id: number;
    office_id: number;
    parent_id: number | null;
    title: string;
    type: 'Program' | 'Project' | 'Activity' | 'Sub-Activity';
    code_suffix: string;
    is_active: boolean;
    created_at: string | null;
    updated_at: string | null;
    full_code: string;
    office?: Office;
    children?: Ppa[];
    aip_entry?: AipEntry;
}

export interface Office {
    id: number;
    sector_id: number | null;
    lgu_level_id: number;
    office_type_id: number;
    code: string;
    name: string;
    acronym: string | null;
    is_lee: boolean;
    created_at: string | null;
    updated_at: string | null;
    // full_code: string;
    sector?: Sector;
    lgu_level?: LguLevel;
    office_type?: OfficeType;
}

export interface AipSummary {
    id: string | number;
    full_code: string;
    title: string;
    ppa_id: number;
    funding_source?: string;
    cc_typology_code?: string;
    office: {
        id?: string | number;
        name: string;
    };
    aip_entry_for_year: {
        start_date: string; // or Date
        end_date: string; // or Date
        expected_output: string;
        ps_amount: string | null;
        mooe_amount: string | null;
        fe_amount: string | null;
        co_amount: string | null;
        ccet_adaptation: string | null;
        ccet_mitigation: string | null;
    };
}

export interface FundingSource {
    id: number;
    fund_type: string;
    code: string;
    title: string;
    description: string | null;
    allow_typhoon: boolean;
    created_at: string | null;
    updated_at: string | null;
    pivot: {
        funding_source_id: number;
        ppa_id: number;
    };
}

export interface PpaFundingSource {
    id: number;
    ppa_id: number;
    funding_source_id: number;
    ps_amount: string | null;
    mooe_amount: string | null;
    fe_amount: string | null;
    co_amount: string | null;
    ccet_adaptation: string | null;
    ccet_mitigation: string | null;
    created_at: string | null;
    updated_at: string | null;
    funding_source?: FundingSource;
}
