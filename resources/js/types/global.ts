export interface Sector {
    id: number;
    code: string;
    name: string;
    created_at: string | null;
    updated_at: string | null;
}

export interface LguLevel {
    id: number;
    code: string;
    name: string;
    created_at: string | null;
    updated_at: string | null;
}

export interface OfficeType {
    id: number;
    code: string;
    name: string;
    created_at: string | null;
    updated_at: string | null;
}

export interface Office {
    id: number;
    sector_id: number | null;
    lgu_level_id: number;
    office_type_id: number;
    parent_id: number | null;
    code: string;
    name: string;
    acronym: string | null;
    is_lee: boolean;
    created_at: string | null;
    updated_at: string | null;

    full_code: string;

    lgu_level?: LguLevel;
    office_type?: OfficeType;
    sector?: Sector;
    parent?: Office;
    children?: Office[];
}

export type FiscalYearStatus = 'active' | 'inactive' | 'closed';

export interface FiscalYear {
    id: number;
    year: string;
    status: FiscalYearStatus;
    created_at: string | null;
    updated_at: string | null;
}

export interface AipEntry {
    id: number;
    fiscal_year_id: number;
    ppa_id: number;
    start_date: string;
    end_date: string;
    expected_output: string;
    ps_amount: string;
    mooe_amount: string;
    fe_amount: string;
    co_amount: string;
    // total_amount: string;
    ccet_adaptation: string;
    ccet_mitigation: string;
    created_at: string | null;
    updated_at: string | null;

    ppa_funding_sources?: PpaFundingSource[];
    ppa?: Ppa;
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
}

export interface PpaFundingSource {
    id: number;
    ppa_id: number;
    funding_source_id: number;
    ps_amount: string;
    mooe_amount: string;
    fe_amount: string;
    co_amount: string;
    ccet_adaptation: string;
    ccet_mitigation: string;
    created_at: string | null;
    updated_at: string | null;

    funding_source?: FundingSource;
}

export interface Ppa {
    id: number;
    office_id: number;
    parent_id: number | null;
    name: string;
    type: 'Program' | 'Project' | 'Activity' | 'Sub-Activity';
    code_suffix: string;
    is_active: boolean;
    created_at: string | null;
    updated_at: string | null;

    aip_entries?: AipEntry[];
    children?: Ppa[];
    office?: Office;
    // ppa_funding_sources?: PpaFundingSource[];

    full_code: string;
    ancestor: Ppa;
}

export interface FlattenedPpa extends Ppa {
    // Overwrite children to be an array of the flattened version
    children?: FlattenedPpa[];

    // The specific funding source for this row
    current_fs: PpaFundingSource | null;

    // Metadata for row spanning and UI logic
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
    groupSize: number;
    depth: number; // No longer optional since your function always provides it
}

// --- not checked

export interface ChartOfAccount {
    id: number;
    account_number: string;
    account_title: string;
    account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    expense_class: 'PS' | 'MOOE' | 'FE' | 'CO';
    account_series: string | null;
    level: number;
    is_postable: boolean;
    is_active: boolean;
    normal_balance: string;
    description: string | null;
    created_at: string;
    updated_at: string;

    parent_id: number | null;

    ppmp_price_lists?: PriceList[];
}

export interface Ppmp {
    id: number;
    jan_qty: number;
    jan_amount: string;
    feb_qty: number;
    feb_amount: string;
    mar_qty: number;
    mar_amount: string;
    apr_qty: number;
    apr_amount: string;
    may_qty: number;
    may_amount: string;
    jun_qty: number;
    jun_amount: string;
    jul_qty: number;
    jul_amount: string;
    aug_qty: number;
    aug_amount: string;
    sep_qty: number;
    sep_amount: string;
    oct_qty: number;
    oct_amount: string;
    nov_qty: number;
    nov_amount: string;
    dec_qty: number;
    dec_amount: string;
    created_at: string | null;
    updated_at: string | null;

    aip_entry_id: number;
    funding_source_id: number;
    ppmp_price_list_id: number | null;

    ppmp_price_list?: PriceList;
    funding_source: FundingSource;
}

export interface PriceList {
    id: number;
    item_number: number;
    sort_order: number;
    description: string;
    unit_of_measurement: string;
    price: string;
    created_at: string | null;
    updated_at: string | null;

    ppmp_category_id: number;
    chart_of_account_id: number;

    chart_of_account?: ChartOfAccount;
    category?: PpmpCategory;
}

export interface PpmpCategory {
    id: number;
    name: string;
    is_non_procurement: boolean;
    created_at: string | null;
    updated_at: string | null;

    chart_of_account_pivot: ChartOfAccountPpmpCategory[];
    chart_of_accounts: ChartOfAccount[];
}

export interface ChartOfAccountPpmpCategory {
    id: number;
    ppmp_category_id: number;
    chart_of_account_id: number;
    created_at: string | null;
    updated_at: string | null;
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

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    password?: string;
    remember_token?: string;
    created_at: string | null;
    updated_at: string | null;
    status: string;

    office?: Office;

    office_id: number;
    role: string;
}

// not a table in the database

export interface App {
    ppmp_price_list: PriceList;

    q1_qty: number;
    q2_qty: number;
    q3_qty: number;
    q4_qty: number;
    total_qty: number;

    q1_amount: number;
    q2_amount: number;
    q3_amount: number;
    q4_amount: number;
    total_amount: number;
}

export type AuthData = {
    user: User;
    can: {
        manage_users: boolean;
    };
};
export type SharedData = {
    auth: AuthData;
};

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
    page: number | null;
}

export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}
