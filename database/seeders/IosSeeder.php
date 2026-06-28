<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Ios;

class IosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ios = [
            // columns:
            // occupational_service_code
            // occupational_group_code
            // class_id
            // class
            // salary_grade

            // 01-GA - GENERAL ADMINISTRATIVE SERVICE

            // ADS - Administrative
            ['01-GA', 'ADS', 'ADA1', 'Administrative Aide I', 1],
            ['01-GA', 'ADS', 'ADA2', 'Administrative Aide II', 2],
            ['01-GA', 'ADS', 'ADA3', 'Administrative Aide III', 3],
            ['01-GA', 'ADS', 'ADA4', 'Administrative Aide IV', 4],
            ['01-GA', 'ADS', 'ADA5', 'Administrative Aide V', 5],
            ['01-GA', 'ADS', 'ADA6', 'Administrative Aide VI', 6],
            ['01-GA', 'ADS', 'ADAS1', 'Administrative Assistant I', 7],
            ['01-GA', 'ADS', 'ADAS2', 'Administrative Assistant II', 8],
            ['01-GA', 'ADS', 'ADAS3', 'Administrative Assistant III', 9],
            ['01-GA', 'ADS', 'ADAS4', 'Administrative Assistant IV', 10],
            ['01-GA', 'ADS', 'ADAS5', 'Administrative Assistant V', 11],
            ['01-GA', 'ADS', 'ADAS6', 'Administrative Assistant VI', 12],
            ['01-GA', 'ADS', 'SADAS1', 'Senior Administrative Assistant I', 13],
            [
                '01-GA',
                'ADS',
                'SADAS2',
                'Senior Administrative Assistant II',
                14,
            ],
            [
                '01-GA',
                'ADS',
                'SADAS3',
                'Senior Administrative Assistant III',
                15,
            ],
            [
                '01-GA',
                'ADS',
                'SADAS4',
                'Senior Administrative Assistant IV',
                16,
            ],
            ['01-GA', 'ADS', 'SADAS5', 'Senior Administrative Assistant V', 18],
            ['01-GA', 'ADS', 'ADOF1', 'Administrative Officer I', 10],
            ['01-GA', 'ADS', 'ADOF2', 'Administrative Officer II', 11],
            ['01-GA', 'ADS', 'ADOF3', 'Administrative Officer III', 14],
            ['01-GA', 'ADS', 'ADOF4', 'Administrative Officer IV', 15],
            ['01-GA', 'ADS', 'ADOF5', 'Administrative Officer V', 18],
            ['01-GA', 'ADS', 'SADOF', 'Supervising Administrative Officer', 22],
            ['01-GA', 'ADS', 'CADOF', 'Chief Administrative Officer', 24],

            ['01-GA', 'ADS', 'ADA', 'Administrative Assistant', 8],
            ['01-GA', 'ADS', 'ADO1', 'Administrative Officer I', 11],
            ['01-GA', 'ADS', 'ADO2', 'Administrative Officer II', 15],
            ['01-GA', 'ADS', 'ADO3', 'Administrative Officer III', 18],
            ['01-GA', 'ADS', 'ADO4', 'Administrative Officer IV', 22],
            ['01-GA', 'ADS', 'ADO5', 'Administrative Officer V', 24],

            // CSET

            // Clerical/Secretariai/Stenographic
            ['01-GA', 'CSET', 'CSTG1', 'Court Stenographer I', 8],
            ['01-GA', 'CSET', 'CSTG2', 'Court Stenographer II', 10],
            ['01-GA', 'CSET', 'CSTG3', 'Court Stenographer III', 12],
            ['01-GA', 'CSET', 'CSTG4', 'Court Stenographer IV', 14],
            ['01-GA', 'CSET', 'JPS', 'Junior Process Server', 3],
            ['01-GA', 'CSET', 'PROCS', 'Process Server', 5],

            ['01-GA', 'CSET', 'CK1', 'Clerk I', 3],
            ['01-GA', 'CSET', 'CK2', 'Clerk II', 4],
            ['01-GA', 'CSET', 'CK3', 'Clerk III', 6],
            ['01-GA', 'CSET', 'CK4', 'Clerk IV', 8],
            ['01-GA', 'CSET', 'M', 'Messenger', 2],
            ['01-GA', 'CSET', 'PSEC1', 'Private Secretary I', 11],
            ['01-GA', 'CSET', 'PSEC2', 'Private Secretary II', 15],
            ['01-GA', 'CSET', 'PSEC3', 'Private Secretary III', 18],
            ['01-GA', 'CSET', 'SEC1', 'Secretary I', 7],
            ['01-GA', 'CSET', 'SEC2', 'Secretary II', 9],
            ['01-GA', 'CSET', 'STENO1', 'Stenographer I', 4],
            ['01-GA', 'CSET', 'STENO2', 'Stenographer II', 6],
            ['01-GA', 'CSET', 'STENO3', 'Stenographer III', 9],
            ['01-GA', 'CSET', 'STENPRES', 'Stenographer to the President', 15],
            [
                '01-GA',
                'CSET',
                'SRSP',
                'Senior Stenographer to the President',
                18,
            ],
            [
                '01-GA',
                'CSET',
                'STENRGOV',
                'Senior Stenographer to the Regional Governor',
                16,
            ],
            ['01-GA', 'CSET', 'STENR1', 'Stenographic Reporter I', 7],
            ['01-GA', 'CSET', 'STENR2', 'Stenographic Reporter II', 9],
            ['01-GA', 'CSET', 'STENR3', 'Stenographic Reporter III', 11],
            ['01-GA', 'CSET', 'STENR4', 'Stenographic Reporter IV', 13],

            // Court / Board Secretaries
            ['01-GA', 'CSET', 'BS1', 'Board Secretary I', 14],
            ['01-GA', 'CSET', 'BS2', 'Board Secretary II', 17],
            ['01-GA', 'CSET', 'BS3', 'Board Secretary III', 20],
            ['01-GA', 'CSET', 'BS4', 'Board Secretary IV', 22],
            ['01-GA', 'CSET', 'BS5', 'Board Secretary V', 24],
            ['01-GA', 'CSET', 'BS6', 'Board Secretary VI', 25],
            ['01-GA', 'CSET', 'CSTR1', 'Court Secretary I', 14],
            ['01-GA', 'CSET', 'CSTR2', 'Court Secretary II', 17],

            // Executive Assistance
            ['01-GA', 'CSET', 'EXA1', 'Executive Assistant I', 14],
            ['01-GA', 'CSET', 'EXA2', 'Executive Assistant II', 17],
            ['01-GA', 'CSET', 'EXA3', 'Executive Assistant III', 20],
            ['01-GA', 'CSET', 'EXA4', 'Executive Assistant IV', 22],
            ['01-GA', 'CSET', 'EXA5', 'Executive Assistant V', 24],
            ['01-GA', 'CSET', 'EXA6', 'Executive Assistant VI', 25],
            ['01-GA', 'CSET', 'HEA', 'Head Executive Assistant', 27],

            // Executive/Judicial/Legislative Staff Assistance
            ['01-GA', 'CSET', 'PRSA', 'Presidential Staff Assistant', 10],
            ['01-GA', 'CSET', 'PSO1', 'Presidential Staff Officer I', 11],
            ['01-GA', 'CSET', 'PSO2', 'Presidential Staff Officer II', 13],
            ['01-GA', 'CSET', 'PSO3', 'Presidential Staff Officer III', 16],
            ['01-GA', 'CSET', 'PS04', 'Presidential Staff Officer IV', 19],
            ['01-GA', 'CSET', 'PS05', 'Presidential Staff Officer V', 22],
            ['01-GA', 'CSET', 'PS06', 'Presidential Staff Officer VI', 24],
            [
                '01-GA',
                'CSET',
                'PLLO1',
                'Presidential Legislative Liaison Officer I',
                24,
            ],
            [
                '01-GA',
                'CSET',
                'PLLO2',
                'Presidential Legislative Liaison Officer II',
                28,
            ],
            [
                '01-GA',
                'CSET',
                'PLLO3',
                'Presidential Legislative Liaison Officer III',
                29,
            ],
            ['01-GA', 'CSET', 'VPSO1', 'Vice-Presidential Staff Officer I', 11],
            [
                '01-GA',
                'CSET',
                'VPSO2',
                'Vice-Presidential Staff Officer II',
                13,
            ],
            [
                '01-GA',
                'CSET',
                'VPSO3',
                'Vice-Presidential Staff Officer III',
                16,
            ],
            [
                '01-GA',
                'CSET',
                'VPSO4',
                'Vice-Presidential Staff Officer IV',
                19,
            ],
            ['01-GA', 'CSET', 'VPSO5', 'Vice-Presidential Staff Officer V', 22],
            [
                '01-GA',
                'CSET',
                'VPSO6',
                'Vice-Presidential Staff Officer VI',
                24,
            ],
            ['01-GA', 'CSET', 'JSE2', 'Judicial Staff Employee II', 4],
            ['01-GA', 'CSET', 'JSA2', 'Judicial Staff Assistant II', 9],
            ['01-GA', 'CSET', 'JSA3', 'Judicial Staff Assistant III', 10],
            ['01-GA', 'CSET', 'JSO3', 'Judicial Staff Officer III', 18],
            ['01-GA', 'CSET', 'JSO4', 'Judicial Staff Officer IV', 19],
            ['01-GA', 'CSET', 'JSO5', 'Judicial Staff Officer V', 20],
            ['01-GA', 'CSET', 'JSO6', 'Judicial Staff Officer VI', 22],
            [
                '01-GA',
                'CSET',
                'SVJSO',
                'Supervising Judicial Staff Officer',
                23,
            ],
            ['01-GA', 'CSET', 'CJSO', 'Chief Judicial Staff Officer', 25],
            ['01-GA', 'CSET', 'JSH', 'Judicial Staff Head', 28],
            ['01-GA', 'CSET', 'CJSH', 'Chief Judicial Staff Head', 29],
            [
                '01-GA',
                'CSET',
                'DLLS',
                'Department Legislative Liaison Specialist',
                22,
            ],
            ['01-GA', 'CSET', 'LESE1', 'Legislative Staff Employee I', 4],
            ['01-GA', 'CSET', 'LESE2', 'Legislative Staff Employee II', 6],
            ['01-GA', 'CSET', 'LSA1', 'Legislative Staff Assistant I', 7],
            ['01-GA', 'CSET', 'LSA2', 'Legislative Staff Assistant II', 10],
            ['01-GA', 'CSET', 'LSA3', 'Legislative Staff Assistant III', 11],
            ['01-GA', 'CSET', 'LSO1', 'Legislative Staff Officer I', 14],
            ['01-GA', 'CSET', 'LSO2', 'Legislative Staff Officer II', 16],
            ['01-GA', 'CSET', 'LSO3', 'Legislative Staff Officer III', 19],
            ['01-GA', 'CSET', 'LSO4', 'Legislative Staff Officer IV', 20],
            ['01-GA', 'CSET', 'LSO5', 'Legislative Staff Officer V', 21],
            ['01-GA', 'CSET', 'LSO6', 'Legislative Staff Officer VI', 22],
            [
                '01-GA',
                'CSET',
                'SLSO1',
                'Supervising Legislative Staff Officer I',
                23,
            ],
            [
                '01-GA',
                'CSET',
                'SLSO2',
                'Supervising Legislative Staff Officer II',
                24,
            ],
            [
                '01-GA',
                'CSET',
                'SLSO3',
                'Supervising Legislative Staff Officer III',
                25,
            ],
            ['01-GA', 'CSET', 'CLSO', 'Chief Legislative Staff Officer', 25],
            ['01-GA', 'CSET', 'LSH', 'Legislative Staff Head', 29],
            ['01-GA', 'CSET', 'LCR', 'Legislative Committee Researcher', 21],
            ['01-GA', 'CSET', 'LCS', 'Legislative Committee Secretary', 23],
            [
                '01-GA',
                'CSET',
                'LLESE1',
                'Local Legislative Staff Employee I',
                2,
            ],
            [
                '01-GA',
                'CSET',
                'LLESE2',
                'Local Legislative Staff Employee II',
                4,
            ],
            [
                '01-GA',
                'CSET',
                'LLSA1',
                'Local Legislative Staff Assistant I',
                6,
            ],
            [
                '01-GA',
                'CSET',
                'LLSA2',
                'Local Legislative Staff Assistant II',
                8,
            ],
            [
                '01-GA',
                'CSET',
                'LLSA3',
                'Local Legislative Staff Assistant III',
                10,
            ],
            ['01-GA', 'CSET', 'LLSO1', 'Local Legislative Staff Officer I', 11],
            [
                '01-GA',
                'CSET',
                'LLSO2',
                'Local Legislative Staff Officer II',
                13,
            ],
            [
                '01-GA',
                'CSET',
                'LLSO3',
                'Local Legislative Staff Officer III',
                16,
            ],
            [
                '01-GA',
                'CSET',
                'LLSO4',
                'Local Legislative Staff Officer IV',
                19,
            ],
            ['01-GA', 'CSET', 'LLSO5', 'Local Legislative Staff Officer V', 22],
            [
                '01-GA',
                'CSET',
                'LLSO6',
                'Local Legislative Staff Officer VI',
                24,
            ],

            // HRM

            // Human Resource Management
            ['01-GA', 'HRM', 'PAN', 'Personnel Analyst', 11],
            ['01-GA', 'HRM', 'PS1', 'Personnel Specialist I', 13],
            ['01-GA', 'HRM', 'PS2', 'Personnel Specialist II', 16],
            ['01-GA', 'HRM', 'SRPS', 'Senior Personnel Specialist', 19],
            ['01-GA', 'HRM', 'SVPS', 'Supervising Personnel Specialist', 22],
            ['01-GA', 'HRM', 'CPS', 'Chief Personnel Specialist', 24],
            ['01-GA', 'HRM', 'HCSFO', 'Head Civil Service Field Officer', 26],
            ['01-GA', 'HRM', 'JSAO', 'Junior Scholarship Affairs Officer', 11],
            ['01-GA', 'HRM', 'SAO1', 'Scholarship Affairs Officer I', 13],
            ['01-GA', 'HRM', 'SAO2', 'Scholarship Affairs Officer II', 16],
            ['01-GA', 'HRM', 'SRSAO', 'Senior Scholarship Affairs Officer', 19],
            [
                '01-GA',
                'HRM',
                'SVSAO',
                'Supervising Scholarship Affairs Officer',
                22,
            ],
            ['01-GA', 'HRM', 'CSAO', 'Chief Scholarship Affairs Officer', 24],
            ['01-GA', 'HRM', 'TTEC1', 'Test Technician I', 6],
            ['01-GA', 'HRM', 'TTEC2', 'Test Technician II', 8],
            ['01-GA', 'HRM', 'TSP1', 'Test Specialist I', 11],
            ['01-GA', 'HRM', 'TSP2', 'Test Specialist II', 15],
            ['01-GA', 'HRM', 'TSP3', 'Test Specialist III', 18],

            ['01-GA', 'HRM', 'HRMA', 'Human Resource Management Aide', 4],
            ['01-GA', 'HRM', 'HRMAS', 'Human Resource Management Assistant', 8],
            [
                '01-GA',
                'HRM',
                'HRMO1',
                'Human Resource Management Officer I',
                11,
            ],
            [
                '01-GA',
                'HRM',
                'HRMO2',
                'Human Resource Management Officer II',
                15,
            ],
            [
                '01-GA',
                'HRM',
                'HRMO3',
                'Human Resource Management Officer III',
                18,
            ],
            [
                '01-GA',
                'HRM',
                'HRMO4',
                'Human Resource Management Officer IV',
                22,
            ],
            [
                '01-GA',
                'HRM',
                'HRMO5',
                'Human Resource Management Officer V',
                24,
            ],

            // RM

            // Records Management
            ['01-GA', 'RM', 'RMA1', 'Records Management Analyst I', 10],
            ['01-GA', 'RM', 'RMA2', 'Records Management Analyst II', 14],
            ['01-GA', 'RM', 'SRRMA', 'Senior Records Management Analyst', 18],
            [
                '01-GA',
                'RM',
                'SVRMA',
                'Supervising Records Management Analyst',
                22,
            ],
            ['01-GA', 'RM', 'CRMA', 'Chief Records Management Analyst', 24],

            ['01-GA', 'RM', 'RO1', 'Records Officer I', 10],
            ['01-GA', 'RM', 'RO2', 'Records Officer II', 14],
            ['01-GA', 'RM', 'RO3', 'Records Officer III', 18],
            ['01-GA', 'RM', 'RO4', 'Records Officer IV', 22],
            ['01-GA', 'RM', 'RO5', 'Records Officer V', 24],

            // SUM

            // Supply Management
            ['01-GA', 'SUM', 'LGMO1', 'Logistics Management Officer I', 11],
            ['01-GA', 'SUM', 'LGMO2', 'Logistics Management Officer II', 15],
            ['01-GA', 'SUM', 'LGMO3', 'Logistics Management Officer III', 18],
            ['01-GA', 'SUM', 'LGMO4', 'Logistics Management Officer IV', 22],
            ['01-GA', 'SUM', 'LGMO5', 'Logistics Management Officer V', 24],
            ['01-GA', 'SUM', 'WHI', 'Warehouse Inspector', 7],
            ['01-GA', 'SUM', 'WH1', 'Warehouseman I', 6],
            ['01-GA', 'SUM', 'WH2', 'Warehouseman II', 8],
            ['01-GA', 'SUM', 'WH3', 'Warehouseman III', 11],
            ['01-GA', 'SUM', 'WH4', 'Warehouseman IV', 13],

            ['01-GA', 'SUM', 'BY1', 'Buyer I', 4],
            ['01-GA', 'SUM', 'BY2', 'Buyer II', 6],
            ['01-GA', 'SUM', 'BY3', 'Buyer III', 9],
            ['01-GA', 'SUM', 'BY4', 'Buyer IV', 11],
            ['01-GA', 'SUM', 'BY5', 'Buyer V', 13],
            ['01-GA', 'SUM', 'PROPC', 'Property Custodian', 8],
            ['01-GA', 'SUM', 'STK1', 'Storekeeper I', 4],
            ['01-GA', 'SUM', 'STK2', 'Storekeeper II', 6],
            ['01-GA', 'SUM', 'STK3', 'Storekeeper', 9],
            ['01-GA', 'SUM', 'STK4', 'Storekeeper', 11],
            ['01-GA', 'SUM', 'SUO1', 'Supply Officer I', 10],
            ['01-GA', 'SUM', 'SUO2', 'Supply Officer II', 14],
            ['01-GA', 'SUM', 'SUO3', 'Supply Officer III', 18],
            ['01-GA', 'SUM', 'SUO4', 'Supply Officer IV', 22],
            ['01-GA', 'SUM', 'SUO5', 'Supply Officer V', 24],

            // 02-FS - FINANCIAL SERVICE

            // AC

            // Accounting
            ['02-FS', 'AC', 'A1', 'Accountant I', 12],
            ['02-FS', 'AC', 'A2', 'Accountant II', 16],
            ['02-FS', 'AC', 'A3', 'Accountant III', 19],
            ['02-FS', 'AC', 'A4', 'Accountant IV', 22],
            ['02-FS', 'AC', 'CACT', 'Chief Accountant', 24],
            ['02-FS', 'AC', 'AA', 'Accounting Analyst', 11],

            ['02-FS', 'AC', 'AC1', 'Accounting Clerk I', 4],
            ['02-FS', 'AC', 'AC2', 'Accounting Clerk II', 6],
            ['02-FS', 'AC', 'AC3', 'Accounting Clerk III', 8],
            ['02-FS', 'AC', 'AMO1', 'Accounting Machine Operator I', 5],
            ['02-FS', 'AC', 'AMO2', 'Accounting Machine Operator II', 7],
            ['02-FS', 'AC', 'AMO3', 'Accounting Machine Operator III', 10],
            ['02-FS', 'AC', 'BKP', 'Bookkeeper', 8],
            ['02-FS', 'AC', 'SRBK', 'Senior Bookkeeper', 9],
            ['02-FS', 'AC', 'FINA1', 'Financial Analyst I', 11],
            ['02-FS', 'AC', 'FINA2', 'Financial Analyst II', 15],
            ['02-FS', 'AC', 'FINA3', 'Financial Analyst III', 18],
            ['02-FS', 'AC', 'FINA4', 'Financial Analyst IV', 22],
            ['02-FS', 'AC', 'FINA5', 'Financial Analyst V', 24],

            // AL

            // Accounts Liquidation
            ['02-FS', 'AL', 'ALA', 'Accounts Liquidation Assistant', 8],
            ['02-FS', 'AL', 'ALO1', 'Accounts Liquidation Officer I', 11],
            ['02-FS', 'AL', 'ALO2', 'Accounts Liquidation Officer II', 15],
            ['02-FS', 'AL', 'ALO3', 'Accounts Liquidation Officer III', 18],
            ['02-FS', 'AL', 'ALO4', 'Accounts Liquidation Officer IV', 22],
            ['02-FS', 'AL', 'ALO5', 'Accounts Liquidation Officer V', 24],

            // AM

            // Assessment
            ['02-FS', 'AM', 'ASCL1', 'Assessment Clerk I', 4],
            ['02-FS', 'AM', 'ASCL2', 'Assessment Clerk II', 6],
            ['02-FS', 'AM', 'ASCL3', 'Assessment Clerk III', 9],
            [
                '02-FS',
                'AM',
                'LAOO1',
                'Local Assessment Operations Officer I',
                11,
            ],
            [
                '02-FS',
                'AM',
                'LAOO2',
                'Local Assessment Operations Officer II',
                15,
            ],
            [
                '02-FS',
                'AM',
                'LAOO3',
                'Local Assessment Operations Officer III',
                18,
            ],
            [
                '02-FS',
                'AM',
                'LAOO4',
                'Local Assessment Operations Officer IV',
                22,
            ],
            [
                '02-FS',
                'AM',
                'LAOO5',
                'Local Assessment Operations Officer V',
                24,
            ],

            // AFE

            // Auditing and Fiscal Examination
            ['02-FS', 'AFE', 'AUSA', 'Auditing Systems Analyst', 11],
            ['02-FS', 'AFE', 'ASS1', 'Auditing Systems Specialist I', 13],
            ['02-FS', 'AFE', 'ASS2', 'Auditing Systems Specialist II', 16],
            ['02-FS', 'AFE', 'SRASS', 'Senior Auditing Systems Specialist', 19],
            [
                '02-FS',
                'AFE',
                'SVASS',
                'Supervising Auditing Systems Specialist',
                22,
            ],
            ['02-FS', 'AFE', 'CASS', 'Chief Auditing Systems Specialist', 24],
            ['02-FS', 'AFE', 'IAAS', 'Internal Auditing Assistant', 8],
            ['02-FS', 'AFE', 'IAUD1', 'Internal Auditor I', 11],
            ['02-FS', 'AFE', 'IAUD2', 'Internal Auditor II', 15],
            ['02-FS', 'AFE', 'IAUD3', 'Internal Auditor III', 18],
            ['02-FS', 'AFE', 'IAUD4', 'Internal Auditor IV', 22],
            ['02-FS', 'AFE', 'IAUD5', 'Internal Auditor V', 24],
            ['02-FS', 'AFE', 'LTEX1', 'Local Treasury Examiner I', 11],
            ['02-FS', 'AFE', 'LTEX2', 'Local Treasury Examiner II', 15],
            ['02-FS', 'AFE', 'SRTE', 'Senior Local Treasury Examiner', 18],
            [
                '02-FS',
                'AFE',
                'SVATE',
                'Supervising Local Treasury Examiner',
                22,
            ],
            ['02-FS', 'AFE', 'CLTE', 'Chief Local Treasury Examiner', 24],
            ['02-FS', 'AFE', 'SAEX1', 'State Auditing Examiner I', 11],
            ['02-FS', 'AFE', 'SAEX2', 'State Auditing Examiner II', 13],
            ['02-FS', 'AFE', 'SA1', 'State Auditor I', 16],
            ['02-FS', 'AFE', 'SA2', 'State Auditor II', 19],
            ['02-FS', 'AFE', 'SA3', 'State Auditor III', 22],
            ['02-FS', 'AFE', 'SA4', 'State Auditor IV', 24],
            ['02-FS', 'AFE', 'SA5', 'State Auditor V', 26],
            ['02-FS', 'AFE', 'STAA1', 'State Technical Audit Analyst I', 11],
            ['02-FS', 'AFE', 'STAA2', 'State Technical Audit Analyst II', 13],
            ['02-FS', 'AFE', 'STAS1', 'State Technical Audit Specialist I', 16],
            [
                '02-FS',
                'AFE',
                'STAS2',
                'State Technical Audit Specialist II',
                19,
            ],
            [
                '02-FS',
                'AFE',
                'STAS3',
                'State Technical Audit Specialist III',
                22,
            ],
            [
                '02-FS',
                'AFE',
                'STAS4',
                'State Technical Audit Specialist IV',
                24,
            ],
            ['02-FS', 'AFE', 'STAS5', 'State Technical Audit Specialist V', 26],
            ['02-FS', 'AFE', 'SCHR', 'Supplies Checker', 4],

            ['02-FS', 'AFE', 'FCK1', 'Fiscal Clerk I', 4],
            ['02-FS', 'AFE', 'FCK2', 'Fiscal Clerk II', 6],
            ['02-FS', 'AFE', 'FCK3', 'Fiscal Clerk III', 8],
            ['02-FS', 'AFE', 'FEX1', 'Fiscal Examiner I', 11],
            ['02-FS', 'AFE', 'FEX2', 'Fiscal Examiner II', 15],
            ['02-FS', 'AFE', 'FEX3', 'Fiscal Examiner III', 18],
            ['02-FS', 'AFE', 'FEX4', 'Fiscal Examiner IV', 22],
            ['02-FS', 'AFE', 'FEX5', 'Fiscal Examiner V', 24],
            ['02-FS', 'AFE', 'FCT1', 'Fiscal Controller I', 11],
            ['02-FS', 'AFE', 'FCT2', 'Fiscal Controller II', 15],
            ['02-FS', 'AFE', 'FCT3', 'Fiscal Controller III', 18],
            ['02-FS', 'AFE', 'FCT4', 'Fiscal Controller IV', 22],
            ['02-FS', 'AFE', 'FCT5', 'Fiscal Controller V', 24],

            // BFCP

            // Bonds and Financial Claims Processing
            ['02-FS', 'BFCP', 'AFCE', 'Assistant Financial Claims Examiner', 7],
            ['02-FS', 'BFCP', 'FINCE1', 'Financial Claims Examiner I', 10],
            ['02-FS', 'BFCP', 'FINCE2', 'Financial Claims Examiner II', 14],
            ['02-FS', 'BFCP', 'FINCE3', 'Financial Claims Examiner III', 18],
            ['02-FS', 'BFCP', 'FIBEX1', 'Fidelity Bond Examiner I', 10],
            ['02-FS', 'BFCP', 'FIBEX2', 'Fidelity Bond Examiner II', 14],
            ['02-FS', 'BFCP', 'SRFBE', 'Senior Fidelity Bond Examiner', 18],
            [
                '02-FS',
                'BFCP',
                'SVFBE',
                'Supervising Fidelity Bond Examiner',
                22,
            ],
            ['02-FS', 'BFCP', 'CFBE', 'Chief Fidelity Bond Examiner', 24],
            ['02-FS', 'BFCP', 'TRECP1', 'Treasury Claims Processor I', 6],
            ['02-FS', 'BFCP', 'TRECP2', 'Treasury Claims Processor II', 8],

            // B

            // Budgeting
            ['02-FS', 'B', 'BMAN', 'Budget and Management Analyst', 11],
            ['02-FS', 'B', 'BMS1', 'Budget and Management Specialist I', 13],
            ['02-FS', 'B', 'BMS2', 'Budget and Management Specialist II', 16],
            [
                '02-FS',
                'B',
                'SRBMS',
                'Senior Budget and Management Specialist',
                19,
            ],
            [
                '02-FS',
                'B',
                'SVBMS',
                'Supervising Budget and Management Specialist',
                22,
            ],
            [
                '02-FS',
                'B',
                'CBMS',
                'Chief Budget and Management Specialist',
                24,
            ],

            ['02-FS', 'B', 'BAI', 'Budgeting Aide', 4],
            ['02-FS', 'B', 'BAS', 'Budgeting Assistant', 8],
            ['02-FS', 'B', 'BUDO1', 'Budget Officer I', 11],
            ['02-FS', 'B', 'BUDO2', 'Budget Officer II', 15],
            ['02-FS', 'B', 'BUDO3', 'Budget Officer III', 18],
            ['02-FS', 'B', 'BUDO4', 'Budget Officer IV', 22],
            ['02-FS', 'B', 'BUDO5', 'Budget Officer V', 24],

            // CH

            // Cashiering
            ['02-FS', 'CH', 'ANC', 'Assistant National Cashier', 22],
            ['02-FS', 'CH', 'NCASH', 'National Cashier', 24],

            ['02-FS', 'CH', 'CH1', 'Cash Clerk I', 4],
            ['02-FS', 'CH', 'CH2', 'Cash Clerk II', 6],
            ['02-FS', 'CH', 'CH3', 'Cash Clerk III', 8],
            ['02-FS', 'CH', 'CASH1', 'Cashier I', 10],
            ['02-FS', 'CH', 'CASH2', 'Cashier II', 14],
            ['02-FS', 'CH', 'CASH3', 'Cashier III', 18],
            ['02-FS', 'CH', 'CASH4', 'Cashier IV', 22],
            ['02-FS', 'CH', 'CASH5', 'Cashier V', 24],
            ['02-FS', 'CH', 'DO1', 'Disbursing Officer I', 6],
            ['02-FS', 'CH', 'DO2', 'Disbursing Officer II', 8],

            // CC

            // Credit Collection
            ['02-FS', 'CC', 'BC', 'Bill Collector', 5],
            ['02-FS', 'CC', 'CROF1', 'Credit Officer I', 9],
            ['02-FS', 'CC', 'CROF2', 'Credit Officer II', 11],
            ['02-FS', 'CC', 'CROF3', 'Credit Officer III', 15],
            ['02-FS', 'CC', 'CROF4', 'Credit Officer IV', 18],

            // CO

            // Customs Operations
            ['02-FS', 'CO', 'ACOO', 'Assistant Customs Operations Officer', 9],
            ['02-FS', 'CO', 'COPO1', 'Customs Operations Officer I', 11],
            ['02-FS', 'CO', 'COPO2', 'Customs Operations Officer II', 13],
            ['02-FS', 'CO', 'COPO3', 'Customs Operations Officer III', 16],
            ['02-FS', 'CO', 'COPO4', 'Customs Operations Officer IV', 18],
            ['02-FS', 'CO', 'COPO5', 'Customs Operations Officer V', 20],
            [
                '02-FS',
                'CO',
                'SVCOO',
                'Supervising Customs Operations Officer',
                22,
            ],
            ['02-FS', 'CO', 'CCOO', 'Chief Customs Operations Officer', 24],
            ['02-FS', 'CO', 'COC1', 'Collector of Customs I', 21],
            ['02-FS', 'CO', 'COC2', 'Collector of Customs II', 22],
            ['02-FS', 'CO', 'COC3', 'Collector of Customs III', 23],
            ['02-FS', 'CO', 'COC4', 'Collector of Customs IV', 24],
            ['02-FS', 'CO', 'COC5', 'Collector of Customs V', 25],
            ['02-FS', 'CO', 'COC6', 'Collector of Customs VI', 26],

            // FO

            // Finance Operations
            [
                '02-FS',
                'FO',
                'SVFMS',
                'Supervising Financial Management Specialist',
                22,
            ],
            [
                '02-FS',
                'FO',
                'CFMS',
                'Chief Financial Management Specialist',
                24,
            ],

            // LI

            // License Inspection
            ['02-FS', 'LI', 'LINS1', 'License Inspector I', 6],
            ['02-FS', 'LI', 'LINS2', 'License Inspector II', 8],
            ['02-FS', 'LI', 'LIOF1', 'Licensing Officer I', 11],
            ['02-FS', 'LI', 'LIOF2', 'Licensing Officer II', 15],
            ['02-FS', 'LI', 'LIOF3', 'Licensing Officer III', 18],
            ['02-FS', 'LI', 'LIOF4', 'Licensing Officer IV', 22],
            ['02-FS', 'LI', 'LIOF5', 'Licensing Officer V', 24],

            // LEXA

            // Loan Examination
            ['02-FS', 'LEX', 'LEX1', 'Loan Examiner I', 9],
            ['02-FS', 'LEX', 'LEX2', 'Loan Examiner II', 11],
            ['02-FS', 'LEX', 'LEX3', 'Loan Examiner III', 15],
            ['02-FS', 'LEX', 'LEX4', 'Loan Examiner IV', 18],

            // LTO

            // Local Treasury Operations
            [
                '02-FS',
                'LTO',
                'LREVCO1',
                'Local Revenue Collection Officer I',
                11,
            ],
            [
                '02-FS',
                'LTO',
                'LREVCO2',
                'Local Revenue Collection Officer II',
                15,
            ],
            [
                '02-FS',
                'LTO',
                'LREVCO3',
                'Local Revenue Collection Officer III',
                18,
            ],
            [
                '02-FS',
                'LTO',
                'LREVCO4',
                'Local Revenue Collection Officer IV',
                22,
            ],
            [
                '02-FS',
                'LTO',
                'LREVCO5',
                'Local Revenue Collection Officer V',
                24,
            ],
            ['02-FS', 'LTO', 'LTOA', 'Local Treasury Operations Assistant', 8],
            [
                '02-FS',
                'LTO',
                'LTOO1',
                'Local Treasury Operations Officer I',
                11,
            ],
            [
                '02-FS',
                'LTO',
                'LTOO2',
                'Local Treasury Operations Officer II',
                15,
            ],
            [
                '02-FS',
                'LTO',
                'LTOO3',
                'Local Treasury Operations Officer III',
                18,
            ],
            [
                '02-FS',
                'LTO',
                'LTOO4',
                'Local Treasury Operations Officer IV',
                22,
            ],
            [
                '02-FS',
                'LTO',
                'LTOO5',
                'Local Treasury Operations Officer V',
                24,
            ],
            ['02-FS', 'LTO', 'RCC1', 'Revenue Collection Clerk I', 5],
            ['02-FS', 'LTO', 'RCC2', 'Revenue Collection Clerk II', 7],
            ['02-FS', 'LTO', 'RCC3', 'Revenue Collection Clerk III', 9],
            ['02-FS', 'LTO', 'TCHK', 'Ticket Checker', 3],

            // MS

            // Management Service
            ['02-FS', 'MS', 'MASST', 'Management and Audit Assistant', 8],
            ['02-FS', 'MS', 'MAA1', 'Management and Audit Analyst I', 11],
            ['02-FS', 'MS', 'MAA2', 'Management and Audit Analyst II', 15],
            ['02-FS', 'MS', 'MAA3', 'Management and Audit Analyst III', 18],
            ['02-FS', 'MS', 'MAA4', 'Management and Audit Analyst IV', 22],
            ['02-FS', 'MS', 'MAA5', 'Management and Audit Analyst V', 24],
            ['02-FS', 'MS', 'FINMO1', 'Financial and Management Officer I', 22],
            [
                '02-FS',
                'MS',
                'FINMO2',
                'Financial and Management Officer II',
                24,
            ],

            // PRA

            // Property Appraisal
            ['02-FS', 'PRA', 'PRAP1', 'Property Appraiser I', 11],
            ['02-FS', 'PRA', 'PRAP2', 'Property Appraiser II', 15],
            ['02-FS', 'PRA', 'PRAP3', 'Property Appraiser III', 18],
            ['02-FS', 'PRA', 'PRAP4', 'Property Appraiser IV', 22],
            ['02-FS', 'PRA', 'PRAP5', 'Property Appraiser V', 24],

            // PM

            // Procurement Management
            ['02-FS', 'PM', 'PROCMO1', 'Procurement Management Officer I', 11],
            ['02-FS', 'PM', 'PROCMO2', 'Procurement Management Officer II', 13],
            [
                '02-FS',
                'PM',
                'PROCMO3',
                'Procurement Management Officer III',
                16,
            ],
            ['02-FS', 'PM', 'PROCMO4', 'Procurement Management Officer IV', 19],
            ['02-FS', 'PM', 'PROCMO5', 'Procurement Management Officer V', 22],
            ['02-FS', 'PM', 'PROCMO6', 'Procurement Management Officer VI', 24],

            // RCEP

            // Revenue Collection, Examination and Planning
            ['02-FS', 'RCEP', 'AREVO', 'Assistant Revenue Officer', 9],
            ['02-FS', 'RCEP', 'REVO1', 'Revenue Officer I', 11],
            ['02-FS', 'RCEP', 'REVO2', 'Revenue Officer II', 13],
            ['02-FS', 'RCEP', 'REVO3', 'Revenue Officer III', 16],
            ['02-FS', 'RCEP', 'REVO4', 'Revenue Officer IV', 19],
            ['02-FS', 'RCEP', 'CRO1', 'Chief Revenue Officer I', 20],
            ['02-FS', 'RCEP', 'CRO2', 'Chief Revenue Officer II', 21],
            ['02-FS', 'RCEP', 'CRO3', 'Chief Revenue Officer III', 22],
            ['02-FS', 'RCEP', 'CRO4', 'Chief Revenue Officer IV', 24],
            ['02-FS', 'RCEP', 'TXS1', 'Tax Specialist I', 11],
            ['02-FS', 'RCEP', 'TXS2', 'Tax Specialist II', 15],
            ['02-FS', 'RCEP', 'SRTXS', 'Senior Tax Specialist', 18],
            ['02-FS', 'RCEP', 'SVTXS', 'Supervising Tax Specialist', 22],
            ['02-FS', 'RCEP', 'CTXS', 'Chief Tax Specialist', 24],
            ['02-FS', 'RCEP', 'TS1', 'Tariff Specialist I', 11],
            ['02-FS', 'RCEP', 'TS2', 'Tariff Specialist II', 15],
            ['02-FS', 'RCEP', 'SRTS', 'Senior Tariff Specialist', 18],
            ['02-FS', 'RCEP', 'SVTS', 'Supervising Tariff Specialist', 22],
            ['02-FS', 'RCEP', 'CTS', 'Chief Tariff Specialist', 24],

            // TREO

            // Treasury Operations
            ['02-FS', 'TREO', 'TROA', 'Treasury Operations Assistant', 9],
            ['02-FS', 'TREO', 'TROO1', 'Treasury Operations Officer I', 11],
            ['02-FS', 'TREO', 'TROO2', 'Treasury Operations Officer II', 13],
            ['02-FS', 'TREO', 'TROO3', 'Treasury Operations Officer III', 16],
            ['02-FS', 'TREO', 'TROO4', 'Treasury Operations Officer IV', 19],
            [
                '02-FS',
                'TREO',
                'CTREOO1',
                'Chief Treasury Operations Officer I',
                22,
            ],
            [
                '02-FS',
                'TREO',
                'CTREOO2',
                'Chief Treasury Operations Officer II',
                24,
            ],

            // 03-PS - PLANNING SERVICE

            // DM

            // Development Management
            ['03-PS', 'DM', 'DMO1', 'Development Management Officer I', 11],
            ['03-PS', 'DM', 'DMO2', 'Development Management Officer II', 15],
            ['03-PS', 'DM', 'DMO3', 'Development Management Officer III', 18],
            ['03-PS', 'DM', 'DMO4', 'Development Management Officer IV', 22],
            ['03-PS', 'DM', 'DMO5', 'Development Management Officer V', 24],

            // ED

            // Economic Development
            ['03-PS', 'ED', 'EDA', 'Economic Development Analyst', 11],
            ['03-PS', 'ED', 'EDS1', 'Economic Development Specialist I', 13],
            ['03-PS', 'ED', 'EDS2', 'Economic Development Specialist II', 16],
            [
                '03-PS',
                'ED',
                'SREDS',
                'Senior Economic Development Specialist',
                19,
            ],
            [
                '03-PS',
                'ED',
                'SVEDS',
                'Supervising Economic Development Specialist',
                22,
            ],
            [
                '03-PS',
                'ED',
                'CEDS',
                'Chief Economic Development Specialist',
                24,
            ],

            // EC

            // Economics
            ['03-PS', 'EC', 'ECOR', 'Economic Researcher', 9],
            ['03-PS', 'EC', 'ECO1', 'Economist I', 11],
            ['03-PS', 'EC', 'ECO2', 'Economist II', 15],
            ['03-PS', 'EC', 'ECO3', 'Economist III', 18],
            ['03-PS', 'EC', 'ECO4', 'Economist IV', 22],
            ['03-PS', 'EC', 'ECO5', 'Economist V', 24],

            // IT

            // Information Technology
            ['03-PS', 'IT', 'CFL1', 'Computer File Librarian I', 8],
            ['03-PS', 'IT', 'CFL2', 'Computer File Librarian II', 10],
            ['03-PS', 'IT', 'CFL3', 'Computer File Librarian III', 12],
            ['03-PS', 'IT', 'CTMT1', 'Computer Maintenance Technologist I', 11],
            [
                '03-PS',
                'IT',
                'CTMT2',
                'Computer Maintenance Technologist II',
                15,
            ],
            [
                '03-PS',
                'IT',
                'CTMT3',
                'Computer Maintenance Technologist III',
                17,
            ],
            ['03-PS', 'IT', 'COMPRO1', 'Computer Programmer I', 11],
            ['03-PS', 'IT', 'COMPRO2', 'Computer Programmer II', 15],
            ['03-PS', 'IT', 'COMPRO3', 'Computer Programmer III', 18],
            ['03-PS', 'IT', 'INFOSR1', 'Information Systems Researcher I', 10],
            ['03-PS', 'IT', 'INFOSR2', 'Information Systems Researcher II', 14],
            [
                '03-PS',
                'IT',
                'INFOSR3',
                'Information Systems Researcher III',
                17,
            ],
            ['03-PS', 'IT', 'INFOSA1', 'Information Systems Analyst I', 12],
            ['03-PS', 'IT', 'INFOSA2', 'Information Systems Analyst II', 16],
            ['03-PS', 'IT', 'INFOSA3', 'Information Systems Analyst III', 19],
            ['03-PS', 'IT', 'ITO1', 'Information Technology Officer I', 19],
            ['03-PS', 'IT', 'ITO2', 'Information Technology Officer II', 22],
            ['03-PS', 'IT', 'ITO3', 'Information Technology Officer III', 24],

            ['03-PS', 'IT', 'AXMO1', 'Auxiliary Machine Operator I', 4],
            ['03-PS', 'IT', 'AXMO2', 'Auxiliary Machine Operator II', 6],
            ['03-PS', 'IT', 'AXMO3', 'Auxiliary Machine Operator III', 8],
            ['03-PS', 'IT', 'AXMO4', 'Auxiliary Machine Operator IV', 11],
            ['03-PS', 'IT', 'COMPO1', 'Computer Operator I', 7],
            ['03-PS', 'IT', 'COMPO2', 'Computer Operator II', 9],
            ['03-PS', 'IT', 'COMPO3', 'Computer Operator III', 12],
            ['03-PS', 'IT', 'COMPO4', 'Computer Operator IV', 14],
            ['03-PS', 'IT', 'DCTL1', 'Data Controller I', 6],
            ['03-PS', 'IT', 'DCTL2', 'Data Controller II', 8],
            ['03-PS', 'IT', 'DCTL3', 'Data Controller III', 11],
            ['03-PS', 'IT', 'DCTL4', 'Data Controller IV', 13],
            ['03-PS', 'IT', 'DAMO1', 'Data Entry Machine Operator I', 6],
            ['03-PS', 'IT', 'DAMO2', 'Data Entry Machine Operator II', 8],
            ['03-PS', 'IT', 'DAMO3', 'Data Entry Machine Operator III', 11],
            ['03-PS', 'IT', 'DAMO4', 'Data Entry Machine Operator IV', 13],
            ['03-PS', 'IT', 'MFLM1', 'Microfilming Machine Operator I', 6],
            ['03-PS', 'IT', 'MFLM2', 'Microfilming Machine Operator II', 8],
            ['03-PS', 'IT', 'MFLM3', 'Microfilming Machine Operator III', 11],

            // PL

            // Planning
            ['03-PS', 'PL', 'PLA', 'Planning Assistant', 8],
            ['03-PS', 'PL', 'PLO1', 'Planning Officer I', 11],
            ['03-PS', 'PL', 'PLO2', 'Planning Officer II', 15],
            ['03-PS', 'PL', 'PLO3', 'Planning Officer III', 18],
            ['03-PS', 'PL', 'PLO4', 'Planning Officer IV', 22],
            ['03-PS', 'PL', 'PLO5', 'Planning Officer V', 24],

            // PPC

            // Production Planning and Control
            ['03-PS', 'PPC', 'PCE1', 'Production Cost Estimator I', 6],
            ['03-PS', 'PPC', 'PCE2', 'Production Cost Estimator II', 8],
            ['03-PS', 'PPC', 'PCE3', 'Production Cost Estimator III', 11],
            [
                '03-PS',
                'PPC',
                'PPCA',
                'Production Planning and Control Assistant',
                8,
            ],
            [
                '03-PS',
                'PPC',
                'PPCO1',
                'Production Planning and Control Officer I',
                10,
            ],
            [
                '03-PS',
                'PPC',
                'PPCO2',
                'Production Planning and Control Officer II',
                14,
            ],
            [
                '03-PS',
                'PPC',
                'PPCO3',
                'Production Planning and Control Officer III',
                18,
            ],
            [
                '03-PS',
                'PPC',
                'PPCO4',
                'Production Planning and Control Officer IV',
                22,
            ],
            [
                '03-PS',
                'PPC',
                'PPCO5',
                'Production Planning and Control Officer V',
                24,
            ],

            // PDE

            // Project Development and Evaluation
            ['03-PS', 'PDE', 'PDA', 'Project Development Assistant', 8],
            ['03-PS', 'PDE', 'PDO1', 'Project Development Officer I', 11],
            ['03-PS', 'PDE', 'PDO2', 'Project Development Officer II', 15],
            ['03-PS', 'PDE', 'PDO3', 'Project Development Officer III', 18],
            ['03-PS', 'PDE', 'PDO4', 'Project Development Officer IV', 22],
            ['03-PS', 'PDE', 'PDO5', 'Project Development Officer V', 24],
            ['03-PS', 'PDE', 'PEA', 'Project Evaluation Assistant', 8],
            ['03-PS', 'PDE', 'PEO1', 'Project Evaluation Officer I', 11],
            ['03-PS', 'PDE', 'PEO2', 'Project Evaluation Officer II', 15],
            ['03-PS', 'PDE', 'PEO3', 'Project Evaluation Officer III', 18],
            ['03-PS', 'PDE', 'PEO4', 'Project Evaluation Officer IV', 22],
            ['03-PS', 'PDE', 'PEO5', 'Project Evaluation Officer V', 24],
            ['03-PS', 'PDE', 'RPC', 'Regional Programs Coordinator', 24],

            // STC

            // Statistical Coordination
            [
                '03-PS',
                'STC',
                'ASCO',
                'Assistant Statistical Coordination Officer',
                9,
            ],
            ['03-PS', 'STC', 'SCO1', 'Statistical Coordination Officer I', 11],
            ['03-PS', 'STC', 'SCO2', 'Statistical Coordination Officer II', 13],
            [
                '03-PS',
                'STC',
                'SCO3',
                'Statistical Coordination Officer III',
                16,
            ],
            ['03-PS', 'STC', 'SCO4', 'Statistical Coordination Officer IV', 19],
            ['03-PS', 'STC', 'SCO5', 'Statistical Coordination Officer V', 22],
            ['03-PS', 'STC', 'SCO6', 'Statistical Coordination Officer VI', 24],

            // ST

            // Statistics
            ['03-PS', 'ST', 'STATA', 'Statistician Aide', 4],
            ['03-PS', 'ST', 'ASTAT', 'Assistant Statistician', 9],
            ['03-PS', 'ST', 'STAT1', 'Statistician I', 11],
            ['03-PS', 'ST', 'STAT2', 'Statistician II', 15],
            ['03-PS', 'ST', 'STAT3', 'Statistician III', 18],
            ['03-PS', 'ST', 'STAT4', 'Statistician IV', 22],
            ['03-PS', 'ST', 'STAT5', 'Statistician V', 24],
            ['03-PS', 'ST', 'SA', 'Statistical Analyst', 11],
            ['03-PS', 'ST', 'SS1', 'Statistical Specialist I', 13],
            ['03-PS', 'ST', 'SS2', 'Statistical Specialist II', 16],
            ['03-PS', 'ST', 'SRSTATS', 'Senior Statistical Specialist', 19],
            [
                '03-PS',
                'ST',
                'SVSTATS',
                'Supervising Statistical Specialist',
                22,
            ],
            ['03-PS', 'ST', 'CSTATS', 'Chief Statistical Specialist', 24],
            ['03-PS', 'ST', 'ASSNS', 'Assistant National Statistician', 28],
            ['03-PS', 'ST', 'DNS', 'Deputy National Statistician', 29],
            ['03-PS', 'ST', 'NSTAT', 'National Statistician', 30],

            // 04-AE - ARCHITECTURE AND ENGINEERING SERVICE

            // AMT

            // Aircraft Maintenance Technology
            ['04-AE', 'AMT', 'AMT1', 'Aircraft Maintenance Technologist I', 11],
            [
                '04-AE',
                'AMT',
                'AMT2',
                'Aircraft Maintenance Technologist II',
                15,
            ],
            [
                '04-AE',
                'AMT',
                'AMT3',
                'Aircraft Maintenance Technologist III',
                18,
            ],

            // AT

            // Airways Technology
            ['04-AE', 'AT', 'ANSS1', 'Air Navigation System Specialist I', 17],
            ['04-AE', 'AT', 'ANSS2', 'Air Navigation System Specialist II', 18],
            [
                '04-AE',
                'AT',
                'SRANSS',
                'Senior Air Navigation System Specialist',
                19,
            ],
            [
                '04-AE',
                'AT',
                'SVANSS',
                'Supervising Air Navigation System Specialist',
                22,
            ],
            [
                '04-AE',
                'AT',
                'ACANSS',
                'Assistant Chief Air Navigation System Specialist',
                23,
            ],
            [
                '04-AE',
                'AT',
                'CANSS',
                'Chief Air Navigation System Specialist',
                24,
            ],
            ['04-AE', 'AT', 'ANSS', 'Air Navigation Services Supervisor', 25],

            // AR

            // Architecture
            ['04-AE', 'AR', 'ARC1', 'Architect I', 12],
            ['04-AE', 'AR', 'ARC2', 'Architect II', 16],
            ['04-AE', 'AR', 'ARC3', 'Architect III', 19],
            ['04-AE', 'AR', 'ARC4', 'Architect IV', 22],
            ['04-AE', 'AR', 'ARC5', 'Architect V', 24],

            // BR

            // Building Regulation
            ['04-AE', 'BR', 'BLDG1', 'Building Inspector', 11],
            ['04-AE', 'BR', 'BLDG2', 'Building Regulations Coordinator', 19],
            ['04-AE', 'BR', 'BLDGO', 'Building Official', 24],

            // CR

            // Cartography
            ['04-AE', 'CR', 'APA1', 'Aerial Photo Analyst I', 12],
            ['04-AE', 'CR', 'APA2', 'Aerial Photo Analyst II', 16],
            ['04-AE', 'CR', 'CGR1', 'Cartographer I', 6],
            ['04-AE', 'CR', 'CGR2', 'Cartographer II', 8],
            ['04-AE', 'CR', 'CGR3', 'Cartographer III', 11],
            ['04-AE', 'CR', 'CGR4', 'Cartographer IV', 15],
            ['04-AE', 'CR', 'CGR5', 'Cartographer V', 19],

            // DF

            // Drafting
            ['04-AE', 'DF', 'DFM1', 'Draftsman I', 6],
            ['04-AE', 'DF', 'DFM2', 'Draftsman II', 8],
            ['04-AE', 'DF', 'DFM3', 'Draftsman III', 11],
            ['04-AE', 'DF', 'DFM4', 'Draftsman IV', 14],

            // DO

            // Dredge Operation
            ['04-AE', 'DO', 'DGN1', 'Dredgeman I', 3],
            ['04-AE', 'DO', 'DGN2', 'Dredgeman II', 5],
            ['04-AE', 'DO', 'DGNF', 'Dredgeman Foreman', 8],
            ['04-AE', 'DO', 'DGM', 'Dredge Master I', 13],
            ['04-AE', 'DO', 'DGM2', 'Dredge Master II', 17],
            ['04-AE', 'DO', 'DGM3', 'Dredge Master III', 20],
            ['04-AE', 'DO', 'DGM4', 'Dredge Master IV', 23],

            // EN

            // Engineering
            ['04-AE', 'EN', 'ENGA', 'Engineering Aide', 4],
            ['04-AE', 'EN', 'ENGA5', 'Engineering Assistant', 8],
            ['04-AE', 'EN', 'ENG1', 'Engineer I', 12],
            ['04-AE', 'EN', 'ENG2', 'Engineer II', 16],
            ['04-AE', 'EN', 'ENG3', 'Engineer III', 19],
            ['04-AE', 'EN', 'ENG4', 'Engineer IV', 22],
            ['04-AE', 'EN', 'ENGS', 'Engineer V', 24],
            ['04-AE', 'EN', 'DENG', 'District Engineer', 25],
            ['04-AE', 'EN', 'REE', 'Regional Equipment Engineer', 25],

            // SZ

            // Surveying and Zoning
            ['04-AE', 'SZ', 'INSTMAN', 'Instrumentman', 5],
            ['04-AE', 'SZ', 'NAUW1', 'Nautical Writer I', 6],
            ['04-AE', 'SZ', 'NAUW2', 'Nautical Writer II', 8],
            ['04-AE', 'SZ', 'SURVM', 'Surveyman', 6],
            ['04-AE', 'SZ', 'ZI1', 'Zoning Inspector I', 6],
            ['04-AE', 'SZ', 'ZI2', 'Zoning Inspector II', 8],
            ['04-AE', 'SZ', 'ZO1', 'Zoning Officer I', 11],
            ['04-AE', 'SZ', 'ZO2', 'Zoning Officer II', 15],
            ['04-AE', 'SZ', 'ZO3', 'Zoning Officer III', 18],
            ['04-AE', 'SZ', 'ZO4', 'Zoning Officer IV', 22],

            // TM

            // Tax Mapping
            ['04-AE', 'TM', 'TXMEX', 'Tax Mapping Examiner', 11],
            ['04-AE', 'TM', 'TXMA', 'Tax Mapping Aide', 4],
            ['04-AE', 'TM', 'TXM1', 'Tax Mapper I', 11],
            ['04-AE', 'TM', 'TXM2', 'Tax Mapper II', 15],
            ['04-AE', 'TM', 'TXM3', 'Tax Mapper III', 18],
            ['04-AE', 'TM', 'TXM4', 'Tax Mapper IV', 22],
            ['04-AE', 'TM', 'TXM5', 'Tax Mapper V', 24],

            // WRSD

            // Water Resource and Systems Development
            [
                '04-AE',
                'WRSD',
                'WRDO1',
                'Water Resources Development Officer I',
                12,
            ],
            [
                '04-AE',
                'WRSD',
                'WRDO2',
                'Water Resources Development Officer II',
                16,
            ],
            [
                '04-AE',
                'WRSD',
                'SRWRDO',
                'Senior Water Resources Development Officer',
                19,
            ],
            [
                '04-AE',
                'WRSD',
                'SVWRDO',
                'Supervising Water Resources Development Officer',
                22,
            ],
            [
                '04-AE',
                'WRSD',
                'CWRDO',
                'Chief Water Resources Development Officer',
                24,
            ],
            ['04-AE', 'WRSD', 'WSDA', 'Water System Development Assistant', 8],
            [
                '04-AE',
                'WRSD',
                'WSDO1',
                'Water System Development Officer I',
                12,
            ],
            [
                '04-AE',
                'WRSD',
                'WSDO2',
                'Water System Development Officer II',
                16,
            ],
            [
                '04-AE',
                'WRSD',
                'WSDO3',
                'Water System Development Officer III',
                19,
            ],

            // 05-TC - TRANSPORTATION, COMMUNICATION AND PUBLIC UTILITIES SERVICE

            // AEO

            // Automotive Equipment Operation
            ['05-TC', 'AEO', 'LEQO', 'Light Equipment Operator', 2],
            ['05-TC', 'AEO', 'HEO1', 'Heavy Equipment Operator I', 4],
            ['05-TC', 'AEO', 'HEO2', 'Heavy Equipment Operator II', 6],
            ['05-TC', 'AEO', 'HEO3', 'Heavy Equipment Operator III', 9],
            ['05-TC', 'AEO', 'FLCM', 'Floating Crane Master', 10],

            ['05-TC', 'AEO', 'DRV1', 'Driver I', 3],
            ['05-TC', 'AEO', 'DRV2', 'Driver II', 4],
            ['05-TC', 'AEO', 'DRC1', 'Driver Courier I', 4],
            ['05-TC', 'AEO', 'DRC2', 'Driver Courier II', 5],
            ['05-TC', 'AEO', 'DRVMECH', 'Driver Mechanic', 4],
            ['05-TC', 'AEO', 'CFER1', 'Chauffeur I', 5],
            ['05-TC', 'AEO', 'CFER2', 'Chauffeur II', 6],
            ['05-TC', 'AEO', 'CFER3', 'Chauffeur III', 7],
            ['05-TC', 'AEO', 'CFER4', 'Chauffeur IV', 8],
            ['05-TC', 'AEO', 'MPD', 'Motorpool Dispatcher', 6],
            ['05-TC', 'AEO', 'MTPS1', 'Motorpool Supervisor I', 7],
            ['05-TC', 'AEO', 'MTPS2', 'Motorpool Supervisor II', 9],

            // AV

            // Aviation
            ['05-TC', 'AV', 'APT1', 'Airfield Power Technician I', 4],
            ['05-TC', 'AV', 'APT2', 'Airfield Power Technician II', 6],
            ['05-TC', 'AV', 'APT3', 'Airfield Power Technician III', 9],
            ['05-TC', 'AV', 'APT4', 'Airfield Power Technician IV', 11],
            ['05-TC', 'AV', 'APTS', 'Airfield Power Technician V', 13],
            ['05-TC', 'AV', 'AIM1', 'Airport Manager I', 20],
            ['05-TC', 'AV', 'AIM2', 'Airport Manager II', 23],
            ['05-TC', 'AV', 'AIM3', 'Airport Manager III', 24],
            ['05-TC', 'AV', 'AIM4', 'Airport Manager IV', 26],
            ['05-TC', 'AV', 'APS', 'Airport Project Supervisor', 17],
            ['05-TC', 'AV', 'ATS', 'Air Terminal Supervisor', 15],
            ['05-TC', 'AV', 'ATC1', 'Air Traffic Controller I', 18],
            ['05-TC', 'AV', 'ATC2', 'Air Traffic Controller II', 19],
            ['05-TC', 'AV', 'SRATC', 'Senior Air Traffic Controller', 20],
            ['05-TC', 'AV', 'SVATC', 'Supervising Air Traffic Controller', 22],
            [
                '05-TC',
                'AV',
                'ACATC',
                'Assistant Chief Air Traffic Controller',
                23,
            ],
            ['05-TC', 'AV', 'CATC', 'Chief Air Traffic Controller', 24],
            ['05-TC', 'AV', 'ATSS', 'Air Traffic Services Supervisor', 25],
            ['05-TC', 'AV', 'ACOM1', 'Airways Communicator I', 17],
            ['05-TC', 'AV', 'ACOM2', 'Airways Communicator II', 18],
            ['05-TC', 'AV', 'SRANC', 'Senior Airways Communicator', 19],
            ['05-TC', 'AV', 'SVAC', 'Supervising Airways Communicator', 22],
            ['05-TC', 'AV', 'ACAC', 'Assistant Chief Airways Communicator', 23],
            ['05-TC', 'AV', 'CAC', 'Chief Airways Communicator', 24],
            [
                '05-TC',
                'AV',
                'ACSS',
                'Airways Communications Services Supervisor',
                25,
            ],
            [
                '05-TC',
                'AV',
                'AVSRO1',
                'Aviation Safety Regulation Officer I',
                11,
            ],
            [
                '05-TC',
                'AV',
                'AVSRO2',
                'Aviation Safety Regulation Officer II',
                15,
            ],
            [
                '05-TC',
                'AV',
                'SRASRO',
                'Senior Aviation Safety Regulation Officer',
                18,
            ],
            [
                '05-TC',
                'AV',
                'SVASRO',
                'Supervising Aviation Safety Regulation Officer',
                22,
            ],
            [
                '05-TC',
                'AV',
                'CASRD',
                'Chief Aviation Safety Regulation Officer',
                24,
            ],
            [
                '05-TC',
                'AV',
                'ICAC',
                'International Civil Aviation Coordinator',
                20,
            ],
            ['05-TC', 'AV', 'CCE1', 'Cabin Crew Examiner I', 11],
            ['05-TC', 'AV', 'CCE2', 'Cabin Crew Examiner II', 13],
            ['05-TC', 'AV', 'CFRO', 'Check Flight Radio Operator', 11],
            ['05-TC', 'AV', 'CPLT1', 'Check Pilot I', 19],
            ['05-TC', 'AV', 'CPLT2', 'Check Pilot II', 21],
            ['05-TC', 'AV', 'CPLT3', 'Check Pilot III', 22],
            ['05-TC', 'AV', 'CPLT4', 'Check Pilot IV', 23],
            ['05-TC', 'AV', 'PIL1', 'Pilot I', 18],
            ['05-TC', 'AV', 'PIL2', 'Pilot II', 20],

            // CDOR

            // Communications Development, Operation and Repair
            ['05-TC', 'CDOR', 'ANR', 'Antenna Rigger', 3],
            [
                '05-TC',
                'CDOR',
                'COMDO1',
                'Communications Development Officer I',
                11,
            ],
            [
                '05-TC',
                'CDOR',
                'COMDO2',
                'Communications Development Officer II',
                15,
            ],
            [
                '05-TC',
                'CDOR',
                'CEI1',
                'Communications Equipment Inspector I',
                8,
            ],
            [
                '05-TC',
                'CDOR',
                'CEI2',
                'Communications Equipment Inspector II',
                11,
            ],
            [
                '05-TC',
                'CDOR',
                'SRCDO',
                'Senior Communications Development Officer',
                18,
            ],
            [
                '05-TC',
                'CDOR',
                'SVCDO',
                'Supervising Communications Development Officer',
                22,
            ],
            [
                '05-TC',
                'CDOR',
                'CCDO',
                'Chief Communications Development Officer',
                4,
            ],
            ['05-TC', 'CDOR', 'LMAN1', 'Lineman I', 3],
            ['05-TC', 'CDOR', 'LMAN2', 'Lineman II', 5],
            ['05-TC', 'CDOR', 'LMAN3', 'Lineman III', 8],
            ['05-TC', 'CDOR', 'LMAN4', 'Lineman IV', 11],
            ['05-TC', 'CDOR', 'LETCAR', 'Letter Carrier', 6],
            ['05-TC', 'CDOR', 'SRLC', 'Senior Letter Carrier', 8],
            ['05-TC', 'CDOR', 'MS', 'Mail Sorter', 4],
            ['05-TC', 'CDOR', 'SRMS', 'Senior Mail Sorter', 6],
            ['05-TC', 'CDOR', 'POSTL1', 'Postal Teller I', 6],
            ['05-TC', 'CDOR', 'POSTL2', 'Postal Teller II', 8],
            ['05-TC', 'CDOR', 'POSTL3', 'Postal Teller III', 11],
            ['05-TC', 'CDOR', 'PSC1', 'Postage Stamps Custodian I', 10],
            ['05-TC', 'CDOR', 'PSC2', 'Postage Stamps Custodian II', 14],
            ['05-TC', 'CDOR', 'PSC3', 'Postage Stamps Custodian III', 17],
            ['05-TC', 'CDOR', 'POSTA', 'Postal Service Assistant', 8],
            ['05-TC', 'CDOR', 'POST1', 'Postal Service Officer I', 11],
            ['05-TC', 'CDOR', 'POST2', 'Postal Service Officer II', 15],
            ['05-TC', 'CDOR', 'SRPSO', 'Senior Postal Service Officer', 18],
            [
                '05-TC',
                'CDOR',
                'SVSPO',
                'Supervising Postal Service Officer',
                22,
            ],
            ['05-TC', 'CDOR', 'CPSO', 'Chief Postal Service Officer', 24],
            ['05-TC', 'CDOR', 'POSTM1', 'Postmaster I', 10],
            ['05-TC', 'CDOR', 'POSTM2', 'Postmaster II', 12],
            ['05-TC', 'CDOR', 'POSTM3', 'Postmaster III', 14],
            ['05-TC', 'CDOR', 'POSTM4', 'Postmaster IV', 17],
            ['05-TC', 'CDOR', 'POSTM5', 'Postmaster V', 19],
            ['05-TC', 'CDOR', 'POSTM6', 'Postmaster VI', 22],
            ['05-TC', 'CDOR', 'POSTM7', 'Postmaster VII', 24],
            [
                '05-TC',
                'CDOR',
                'TELTS',
                'Telecommunications Traffic Supervisor',
                18,
            ],
            [
                '05-TC',
                'CDOR',
                'TELDO',
                'Telecommunications District Officer',
                24,
            ],
            ['05-TC', 'CDOR', 'TELC', 'Telegram Carrier', 4],
            [
                '05-TC',
                'CDOR',
                'TELTSA',
                'Telegraphic Transfer Service Assistant',
                8,
            ],
            [
                '05-TC',
                'CDOR',
                'TELTSO1',
                'Telegraphic Transfer Service Officer I',
                11,
            ],
            [
                '05-TC',
                'CDOR',
                'TELTSO2',
                'Telegraphic Transfer Service Officer II',
                15,
            ],
            [
                '05-TC',
                'CDOR',
                'SRTTSO',
                'Senior Telegraphic Transfer Service Officer',
                18,
            ],
            [
                '05-TC',
                'CDOR',
                'SVTTSO',
                'Supervising Telegraphic Transfer Service Officer',
                22,
            ],
            [
                '05-TC',
                'CDOR',
                'CTTSO',
                'Chief Telegraphic Transfer Service Officer',
                24,
            ],

            ['05-TC', 'CDOR', 'CEO1', 'Communications Equipment Operator I', 4],
            [
                '05-TC',
                'CDOR',
                'CEO2',
                'Communications Equipment Operator II',
                6,
            ],
            [
                '05-TC',
                'CDOR',
                'CEO3',
                'Communications Equipment Operator III',
                9,
            ],
            [
                '05-TC',
                'CDOR',
                'CEO4',
                'Communications Equipment Operator IV',
                11,
            ],
            [
                '05-TC',
                'CDOR',
                'CEO5',
                'Communications Equipment Operator V',
                13,
            ],
            [
                '05-TC',
                'CDOR',
                'ECET1',
                'Electronics and Communications Equipment Technician I',
                6,
            ],
            [
                '05-TC',
                'CDOR',
                'ECET2',
                'Electronics and Communications Equipment Technician II',
                8,
            ],
            [
                '05-TC',
                'CDOR',
                'ECET3',
                'Electronics and Communications Equipment Technician III',
                11,
            ],
            [
                '05-TC',
                'CDOR',
                'ECET4',
                'Electronics and Communications Equipment Technician IV',
                15,
            ],

            // FSCH

            // Freight Service and Cargo Handling
            ['05-TC', 'FSCH', 'FSFM', 'Freight Service Foreman', 6],
            ['05-TC', 'FSCH', 'FSFS1', 'Freight Service Supervisor I', 10],
            ['05-TC', 'FSCH', 'FSFS2', 'Freight Service Supervisor II', 13],

            // LO

            // Lighthouse Operation
            ['05-TC', 'LO', 'LIKP1', 'Lighthouse Keeper I', 3],
            ['05-TC', 'LO', 'LIKP2', 'Lighthouse Keeper II', 5],
            ['05-TC', 'LO', 'LIHI', 'Lighthouse Inspector', 11],
            ['05-TC', 'LO', 'LHSS', 'Lighthouse Service Supervisor', 15],

            // MTS

            // Maritime Service
            ['05-TC', 'MTS', 'COX', 'Coxswain', 3],
            ['05-TC', 'MTS', 'SMAN', 'Seaman', 3],
            ['05-TC', 'MTS', 'BW', 'Boatswain', 4],
            ['05-TC', 'MTS', 'QM', 'Quartermaster', 4],
            ['05-TC', 'MTS', 'LAP', 'Launch Patron', 7],
            ['05-TC', 'MTS', 'ALSS', 'Assistant Launch Service Supervisor', 9],
            ['05-TC', 'MTS', 'LSS', 'Launch Service Supervisor', 12],
            ['05-TC', 'MTS', 'THM', 'Third Mate', 13],
            ['05-TC', 'MTS', 'SECM', 'Second Mate', 17],
            ['05-TC', 'MTS', 'FM', 'First Mate', 20],
            ['05-TC', 'MTS', 'SHN', 'Ship Master', 23],
            ['05-TC', 'MTS', 'CUSUP', 'Cutter Service Supervisor', 24],
            ['05-TC', 'MTS', 'HROA', 'Harbor Operations Assistant', 10],
            [
                '05-TC',
                'MTS',
                'MIDA',
                'Maritime Industry Development Assistant',
                8,
            ],
            [
                '05-TC',
                'MTS',
                'MIDS1',
                'Maritime Industry Development Specialist I',
                11,
            ],
            [
                '05-TC',
                'MTS',
                'MIDS2',
                'Maritime Industry Development Specialist II',
                15,
            ],
            [
                '05-TC',
                'MTS',
                'SRMIDS',
                'Senior Maritime Industry Development Specialist',
                18,
            ],
            [
                '05-TC',
                'MTS',
                'SVMIDS',
                'Supervising Maritime Industry Development Specialist',
                22,
            ],
            [
                '05-TC',
                'MTS',
                'CMIDS',
                'Chief Maritime Industry Development Specialist',
                24,
            ],
            [
                '05-TC',
                'MTS',
                'METSS',
                'Maritime Education and Training Standards Supervisor',
                26,
            ],
            ['05-TC', 'MTS', 'SHS1', 'Shipbuilding Specialist I', 11],
            ['05-TC', 'MTS', 'SHS2', 'Shipbuilding Specialist II', 15],
            ['05-TC', 'MTS', 'SRSS', 'Senior Shipbuilding Specialist', 18],
            ['05-TC', 'MTS', 'SVSS', 'Supervising Shipbuilding Specialist', 22],
            ['05-TC', 'MTS', 'CSS', 'Chief Shipbuilding Specialist', 24],
            ['05-TC', 'MTS', 'SHSI', 'Shipping Operations Inspector', 8],
            ['05-TC', 'MTS', 'SHOS1', 'Shipping Operations Specialist I', 11],
            ['05-TC', 'MTS', 'SHOS2', 'Shipping Operations Specialist II', 15],
            [
                '05-TC',
                'MTS',
                'SRSOS',
                'Senior Shipping Operations Specialist',
                18,
            ],
            [
                '05-TC',
                'MTS',
                'SVSOS',
                'Supervising Shipping Operations Specialist',
                22,
            ],
            [
                '05-TC',
                'MTS',
                'CSOS',
                'Chief Shipping Operations Specialist',
                24,
            ],

            // PUAR

            // Public Utilities Administration and Regulation
            ['05-TC', 'PUAR', 'MRDR1', 'Meter Reader I', 4],
            ['05-TC', 'PUAR', 'MRDR2', 'Meter Reader II', 6],
            ['05-TC', 'PUAR', 'MRDR3', 'Meter Reader III', 9],
            [
                '05-TC',
                'PUAR',
                'PURO1',
                'Public Utilities Regulation Officer I',
                11,
            ],
            [
                '05-TC',
                'PUAR',
                'PURO2',
                'Public Utilities Regulation Officer II',
                15,
            ],
            [
                '05-TC',
                'PUAR',
                'SRPURO',
                'Senior Public Utilities Regulation Officer',
                18,
            ],
            [
                '05-TC',
                'PUAR',
                'SVPURO',
                'Supervising Public Utilities Regulation Officer',
                22,
            ],
            [
                '05-TC',
                'PUAR',
                'CPURO',
                'Chief Public Utilities Regulation Officer',
                24,
            ],
            ['05-TC', 'PUAR', 'WPO', 'Water Pump Operator', 4],
            ['05-TC', 'PUAR', 'WWT', 'Waterworks Technician', 6],
            ['05-TC', 'PUAR', 'WWS', 'Waterworks Supervisor', 14],
            ['05-TC', 'PUAR', 'WWS1', 'Waterworks Superintendent I', 18],
            ['05-TC', 'PUAR', 'WWS2', 'Waterworks Superintendent II', 22],

            // TDR

            // Transportation Development and Regulation
            ['05-TC', 'TDR', 'MVI', 'Motor Vehicle Inspector', 6],
            ['05-TC', 'TDR', 'DSKR', 'Driving Skills Rater', 8],
            ['05-TC', 'TDR', 'TRINSP', 'Transportation Inspector', 8], // SG not explicitly given; set to 8
            [
                '05-TC',
                'TDR',
                'TRNSDO1',
                'Transportation Development Officer I',
                11,
            ],
            [
                '05-TC',
                'TDR',
                'TRNSDO2',
                'Transportation Development Officer II',
                15,
            ],
            [
                '05-TC',
                'TDR',
                'SRTDO',
                'Senior Transportation Development Officer',
                18,
            ],
            [
                '05-TC',
                'TDR',
                'SVTDO',
                'Supervising Transportation Development Officer',
                22,
            ],
            [
                '05-TC',
                'TDR',
                'CTDO',
                'Chief Transportation Development Officer',
                24,
            ],
            [
                '05-TC',
                'TDR',
                'TRNSRO1',
                'Transportation Regulation Officer I',
                11,
            ],
            [
                '05-TC',
                'TDR',
                'TRNSRO2',
                'Transportation Regulation Officer II',
                15,
            ],
            [
                '05-TC',
                'TDR',
                'SRTRO',
                'Senior Transportation Regulation Officer',
                18,
            ],
            [
                '05-TC',
                'TDR',
                'SVTRO',
                'Supervising Transportation Regulation Officer',
                22,
            ],
            [
                '05-TC',
                'TDR',
                'CTRO',
                'Chief Transportation Regulation Officer',
                24,
            ],

            // 06-CT - CRAFTS, TRAPES AND RELATED SERVICE

            // BW

            // Bench Working
            ['06-CT', 'BW', 'ALBM1', 'Artificial Limb and Brace Maker I', 4],
            ['06-CT', 'BW', 'ALBM2', 'Artificial Limb and Brace Maker II', 6],
            ['06-CT', 'BW', 'ALBM3', 'Artificial Limb and Brace Maker III', 9],
            ['06-CT', 'BW', 'CLD', 'Clothes Designer', 8],
            ['06-CT', 'BW', 'FABWK1', 'Fabric Worker I', 3],
            ['06-CT', 'BW', 'FABWK2', 'Fabric Worker II', 5],
            ['06-CT', 'BW', 'HANDW1', 'Handicraft Worker I', 3],
            ['06-CT', 'BW', 'HANDW2', 'Handicraft Worker II', 5],
            ['06-CT', 'BW', 'HANDW3', 'Handicraft Worker III', 8],
            ['06-CT', 'BW', 'PAT1', 'Patternmaker I', 4],
            ['06-CT', 'BW', 'PAT2', 'Patternmaker II', 6],
            ['06-CT', 'BW', 'SMKR', 'Shoemaker', 4],
            ['06-CT', 'BW', 'SEAM', 'Seamstress', 2],
            ['06-CT', 'BW', 'TLR', 'Tailor', 3],
            ['06-CT', 'BW', 'MTLOR1', 'Master Tailor I', 5],
            ['06-CT', 'BW', 'MTLOR2', 'Master Tailor II', 8],

            // BGHC

            // Buildings, Grounds and Highways Construction and Maintenance
            ['06-CT', 'BGHC', 'CMM', 'Construction and Maintenance Man', 2],
            [
                '06-CT',
                'BGHC',
                'CMCZ',
                'Construction and Maintenance Capataz',
                5,
            ],
            ['06-CT', 'BGHC', 'CMF', 'Construction and Maintenance Foreman', 8],
            [
                '06-CT',
                'BGHC',
                'CMGF',
                'Construction and Maintenance General Foreman',
                11,
            ],
            ['06-CT', 'BGHC', 'CEOP', 'Construction Equipment Operator', 4],
            ['06-CT', 'BGHC', 'EI1', 'Electrical Inspector I', 6],
            ['06-CT', 'BGHC', 'EI2', 'Electrical Inspector II', 8],
            ['06-CT', 'BGHC', 'LAPS', 'Landscaping Supervisor', 12],
            ['06-CT', 'BGHC', 'PIP1', 'Pipefitter I', 3],
            ['06-CT', 'BGHC', 'PIP2', 'Pipefitter II', 5],
            ['06-CT', 'BGHC', 'PIPF', 'Pipefitter Foreman', 8],
            ['06-CT', 'BGHC', 'PTI1', 'Plumbing and Tinning Inspector I', 8],
            ['06-CT', 'BGHC', 'PTI2', 'Plumbing and Tinning Inspector II', 10],

            ['06-CT', 'BGHC', 'CP1', 'Carpenter I', 3],
            ['06-CT', 'BGHC', 'CP2', 'Carpenter II', 5],
            ['06-CT', 'BGHC', 'CPF', 'Carpenter Foreman', 8],
            ['06-CT', 'BGHC', 'CPGF', 'Carpenter General Foreman', 10],
            ['06-CT', 'BGHC', 'ELEC1', 'Electrician I', 4],
            ['06-CT', 'BGHC', 'ELEC2', 'Electrician II', 6],
            ['06-CT', 'BGHC', 'EF', 'Electrician Foreman', 9],
            ['06-CT', 'BGHC', 'EGF', 'Electrician General Foreman', 11],
            ['06-CT', 'BGHC', 'MSN1', 'Mason I', 3],
            ['06-CT', 'BGHC', 'MSN2', 'Mason II', 5],
            ['06-CT', 'BGHC', 'MF', 'Mason Foreman', 8],
            ['06-CT', 'BGHC', 'PI', 'Painter I', 3],
            ['06-CT', 'BGHC', 'P2', 'Painter II', 5],
            ['06-CT', 'BGHC', 'PF', 'Painter Foreman', 8],
            ['06-CT', 'BGHC', 'PGF', 'Painter General Foreman', 10],
            ['06-CT', 'BGHC', 'PLUM1', 'Plumber I', 3],
            ['06-CT', 'BGHC', 'PLUM2', 'Plumber II', 5],
            ['06-CT', 'BGHC', 'PLUMF', 'Plumber Foreman', 8],

            // GUS

            // General Utility Services
            ['06-CT', 'GUS', 'CMC', 'Cemetery Caretaker', 2],
            ['06-CT', 'GUS', 'CODL1', 'Core Driller I', 3],
            ['06-CT', 'GUS', 'CODL2', 'Core Driller II', 5],
            ['06-CT', 'GUS', 'DKR1', 'Dockman-Rigger I', 2],
            ['06-CT', 'GUS', 'DKR2', 'Dockman-Rigger II', 4],
            ['06-CT', 'GUS', 'DKD1', 'Dockman-Driver I', 3],
            ['06-CT', 'GUS', 'DKD2', 'Dockman-Driver II', 5],
            ['06-CT', 'GUS', 'DRF', 'Docking and Rigging Foreman', 8],
            ['06-CT', 'GUS', 'MAID1', 'Metro Aide I', 2],
            ['06-CT', 'GUS', 'MAID2', 'Metro Aide II', 4],
            ['06-CT', 'GUS', 'WD1', 'Well Driller I', 3],
            ['06-CT', 'GUS', 'WD2', 'Well Driller II', 5],
            ['06-CT', 'GUS', 'WDS1', 'Well Drilling Supervisor I', 9],
            ['06-CT', 'GUS', 'WDS2', 'Well Drilling Supervisor II', 10],

            ['06-CT', 'GUS', 'UTW1', 'Utility Worker I', 1],
            ['06-CT', 'GUS', 'UTW2', 'Utility Worker II', 3],
            ['06-CT', 'GUS', 'UTF', 'Utility Foreman', 6],
            ['06-CT', 'GUS', 'CTH', 'Crafts and Trades Helper', 1],
            ['06-CT', 'GUS', 'LA1', 'Laborer I', 1],
            ['06-CT', 'GUS', 'LA2', 'Laborer II', 3],
            ['06-CT', 'GUS', 'LAFOR', 'Labor Foreman', 6],
            ['06-CT', 'GUS', 'LAGFOR', 'Labor General Foreman', 8],

            // LS

            // Laboratory Services
            ['06-CT', 'LS', 'LABA1', 'Laboratory Aide I', 2],
            ['06-CT', 'LS', 'LABA2', 'Laboratory Aide II', 4],
            ['06-CT', 'LS', 'LABI1', 'Laboratory Inspector I', 8],
            ['06-CT', 'LS', 'LABI2', 'Laboratory Inspector II', 10],
            ['06-CT', 'LS', 'LABI3', 'Laboratory Inspector III', 14],
            ['06-CT', 'LS', 'LABT1', 'Laboratory Technician I', 6],
            ['06-CT', 'LS', 'LABT2', 'Laboratory Technician II', 8],
            ['06-CT', 'LS', 'LABT3', 'Laboratory Technician III', 10],
            ['06-CT', 'LS', 'VENEX', 'Venom Extractor', 4],

            // MHOR

            // Machine Operation and Repair
            ['06-CT', 'MHOR', 'AM1', 'Aircraft Mechanic I', 6],
            ['06-CT', 'MHOR', 'AM2', 'Aircraft Mechanic II', 8],
            ['06-CT', 'MHOR', 'AM3', 'Aircraft Mechanic III', 11],
            ['06-CT', 'MHOR', 'AM4', 'Aircraft Mechanic IV', 13],
            ['06-CT', 'MHOR', 'AEI1', 'Automotive Equipment Inspector I', 8],
            ['06-CT', 'MHOR', 'AEI2', 'Automotive Equipment Inspector II', 11],
            ['06-CT', 'MHOR', 'ME1', 'Marine Engineman I', 4],
            ['06-CT', 'MHOR', 'ME2', 'Marine Engineman II', 6],
            ['06-CT', 'MHOR', 'MPS1', 'Mechanical Plant Supervisor I', 11],
            ['06-CT', 'MHOR', 'MPS2', 'Mechanical Plant Supervisor II', 13],
            ['06-CT', 'MHOR', 'MEQT1', 'Medical Equipment Technician I', 6],
            ['06-CT', 'MHOR', 'MEQT2', 'Medical Equipment Technician II', 8],
            ['06-CT', 'MHOR', 'MEQT3', 'Medical Equipment Technician III', 11],
            ['06-CT', 'MHOR', 'MEQT4', 'Medical Equipment Technician IV', 13],
            ['06-CT', 'MHOR', 'PITEC1', 'Precision Instrument Technician I', 6],
            [
                '06-CT',
                'MHOR',
                'PITEC2',
                'Precision Instrument Technician II',
                8,
            ],
            [
                '06-CT',
                'MHOR',
                'PITEC3',
                'Precision Instrument Technician III',
                11,
            ],
            [
                '06-CT',
                'MHOR',
                'PPMAC',
                'Printing Plant Maintenance Assistant Chief',
                15,
            ],
            ['06-CT', 'MHOR', 'PPMC', 'Printing Plant Maintenance Chief', 18],

            ['06-CT', 'MHOR', 'ACT1', 'Air-Conditioning Technician I', 6],
            ['06-CT', 'MHOR', 'ACT2', 'Air-Conditioning Technician II', 8],
            ['06-CT', 'MHOR', 'MECH1', 'Mechanic I', 4],
            ['06-CT', 'MHOR', 'MECH2', 'Mechanic II', 6],
            ['06-CT', 'MHOR', 'MECH3', 'Mechanic III', 9],
            ['06-CT', 'MHOR', 'MSF', 'Mechanical Shop Foreman', 11],
            ['06-CT', 'MHOR', 'MSGF', 'Mechanical Shop General Foreman', 13],
            ['06-CT', 'MHOR', 'MPO1', 'Mechanical Plant Operator I', 4],
            ['06-CT', 'MHOR', 'MPO2', 'Mechanical Plant Operator II', 6],
            ['06-CT', 'MHOR', 'MPO3', 'Mechanical Plant Operator III', 9],

            // MW

            // Metal Working
            ['06-CT', 'MW', 'BLK1', 'Blacksmith I', 4],
            ['06-CT', 'MW', 'BLK2', 'Blacksmith II', 6],
            ['06-CT', 'MW', 'BLKSF', 'Blacksmith Shop Foreman', 9],
            ['06-CT', 'MW', 'FDRYW1', 'Foundry Worker I', 4],
            ['06-CT', 'MW', 'FDRYW2', 'Foundry Worker II', 6],
            ['06-CT', 'MW', 'FDRYF', 'Foundry Foreman', 9],
            ['06-CT', 'MW', 'FGENM', 'Foundry General Foreman', 11],
            ['06-CT', 'MW', 'M1', 'Machinist I', 4],
            ['06-CT', 'MW', 'M2', 'Machinist II', 6],
            ['06-CT', 'MW', 'M3', 'Machinist III', 9],
            ['06-CT', 'MW', 'MASF', 'Machine Shop Foreman', 11],
            ['06-CT', 'MW', 'MTW1', 'Metal Worker I', 4],
            ['06-CT', 'MW', 'MTW2', 'Metal Worker II', 6],
            ['06-CT', 'MW', 'MTWF', 'Metal Worker Foreman', 9],
            ['06-CT', 'MW', 'MTWGF', 'Metal Worker General Foreman', 11],
            ['06-CT', 'MW', 'TLMK1', 'Toolmaker I', 4],
            ['06-CT', 'MW', 'TLMK2', 'Toolmaker II', 6],
            ['06-CT', 'MW', 'TLMF', 'Toolmaker Foreman', 9],
            ['06-CT', 'MW', 'TLMGF', 'Toolmaker General Foreman', 11],
            ['06-CT', 'MW', 'WELD1', 'Welder I', 4],
            ['06-CT', 'MW', 'WELD2', 'Welder II', 6],
            ['06-CT', 'MW', 'WELDF', 'Welder Foreman', 9],

            // PW

            // Paper Working
            ['06-CT', 'PW', 'PCMO1', 'Paper Cutting Machine Operator I', 3],
            ['06-CT', 'PW', 'PCMO2', 'Paper Cutting Machine Operator II', 5],
            ['06-CT', 'PW', 'PCMO3', 'Paper Cutting Machine Operator III', 8],

            ['06-CT', 'PW', 'RMO1', 'Reproduction Machine Operator I', 2],
            ['06-CT', 'PW', 'RMO2', 'Reproduction Machine Operator II', 4],
            ['06-CT', 'PW', 'RMO3', 'Reproduction Machine Operator III', 7],
            ['06-CT', 'PW', 'BB1', 'Bookbinder I', 2],
            ['06-CT', 'PW', 'BB2', 'Bookbinder II', 4],
            ['06-CT', 'PW', 'BB3', 'Bookbinder III', 7],
            ['06-CT', 'PW', 'BB4', 'Bookbinder IV', 10],
            ['06-CT', 'PW', 'SVBB', 'Supervising Bookbinder', 16],
            ['06-CT', 'PW', 'CBKD', 'Chief Bookbinder', 18],
            ['06-CT', 'PW', 'STIT1', 'Stitcher I', 2],
            ['06-CT', 'PW', 'STIT2', 'Stitcher II', 4],
            ['06-CT', 'PW', 'STIT3', 'Stitcher III', 7],

            // PMO

            // Printing Machine Operation
            ['06-CT', 'PMO', 'ETYP1', 'Electrotyper I', 4],
            ['06-CT', 'PMO', 'ETYP2', 'Electrotyper II', 6],
            ['06-CT', 'PMO', 'ETYP3', 'Electrotyper III', 9],
            ['06-CT', 'PMO', 'ETYP4', 'Electrotyper IV', 11],
            ['06-CT', 'PMO', 'SVE', 'Supervising Electrotyper', 16],
            ['06-CT', 'PMO', 'CE', 'Chief Electrotyper', 18],
            ['06-CT', 'PMO', 'MRO1', 'Magnetic Recorder Operator I', 6],
            ['06-CT', 'PMO', 'MRO2', 'Magnetic Recorder Operator II', 8],
            ['06-CT', 'PMO', 'MRO3', 'Magnetic Recorder Operator III', 11],
            ['06-CT', 'PMO', 'PHOEN1', 'Photoengraver I', 4],
            ['06-CT', 'PMO', 'PHOEN2', 'Photoengraver II', 6],
            ['06-CT', 'PMO', 'PHOEN3', 'Photoengraver III', 9],
            ['06-CT', 'PMO', 'PHOEN4', 'Photoengraver IV', 11],
            ['06-CT', 'PMO', 'SVPH', 'Supervising Photoengraver', 16],
            ['06-CT', 'PMO', 'CPG', 'Chief Photoengraver', 18],
            ['06-CT', 'PMO', 'PLT1', 'Photo-Lithographic Technician I', 6],
            ['06-CT', 'PMO', 'PLT2', 'Photo-Lithographic Technician II', 8],
            ['06-CT', 'PMO', 'PRM1', 'Press Roller Maker I', 3],
            ['06-CT', 'PMO', 'PRM2', 'Press Roller Maker II', 5],
            ['06-CT', 'PMO', 'HPMAN', 'Head Pressman', 13],
            ['06-CT', 'PMO', 'SVPM', 'Supervising Pressman', 16],
            ['06-CT', 'PMO', 'CPM', 'Chief Pressman', 18],
            ['06-CT', 'PMO', 'PPS', 'Printing Press Supervisor', 13],
            ['06-CT', 'PMO', 'POAC', 'Printing Operations Assistant Chief', 22],
            ['06-CT', 'PMO', 'POC', 'Printing Operations Chief', 24],
            ['06-CT', 'PMO', 'TYPS1', 'Typesetter I', 4],
            ['06-CT', 'PMO', 'TYPS2', 'Typesetter II', 6],
            ['06-CT', 'PMO', 'TYPS3', 'Typesetter III', 9],
            ['06-CT', 'PMO', 'TYPS4', 'Typesetter IV', 11],
            ['06-CT', 'PMO', 'SVT', 'Supervising Typesetter', 16],
            ['06-CT', 'PMO', 'CT', 'Chief Typesetter', 18],

            ['06-CT', 'PMO', 'PMACO1', 'Printing Machine Operator I', 4],
            ['06-CT', 'PMO', 'PMACO2', 'Printing Machine Operator II', 6],
            ['06-CT', 'PMO', 'PMACO3', 'Printing Machine Operator III', 9],
            ['06-CT', 'PMO', 'PMACO4', 'Printing Machine Operator IV', 11],

            // 07-SS - SOCIAL SCIENCES AND WELFARE SERVICE

            // CAD

            // Community Affairs and Development
            ['07-SS', 'CAD', 'CAA1', 'Community Affairs Assistant I', 5],
            ['07-SS', 'CAD', 'CAA2', 'Community Affairs Assistant II', 8],
            ['07-SS', 'CAD', 'CAO1', 'Community Affairs Officer I', 11],
            ['07-SS', 'CAD', 'CAO2', 'Community Affairs Officer II', 15],
            ['07-SS', 'CAD', 'CAO3', 'Community Affairs Officer III', 18],
            ['07-SS', 'CAD', 'CAO4', 'Community Affairs Officer IV', 22],
            ['07-SS', 'CAD', 'CAO5', 'Community Affairs Officer V', 24],
            ['07-SS', 'CAD', 'CDA1', 'Community Development Assistant I', 7],
            ['07-SS', 'CAD', 'CDA2', 'Community Development Assistant II', 9],
            ['07-SS', 'CAD', 'CDVO1', 'Community Development Officer I', 11],
            ['07-SS', 'CAD', 'CDVO2', 'Community Development Officer II', 15],
            ['07-SS', 'CAD', 'CDVO3', 'Community Development Officer III', 18],
            ['07-SS', 'CAD', 'CDVO4', 'Community Development Officer IV', 22],
            ['07-SS', 'CAD', 'CDVO5', 'Community Development Officer V', 24],
            ['07-SS', 'CAD', 'TAA1', 'Tribal Affairs Assistant I', 5],
            ['07-SS', 'CAD', 'TAA2', 'Tribal Affairs Assistant II', 8],

            // DRM

            // Disaster Risk Management
            [
                '07-SS',
                'DRM',
                'LDRRMA',
                'Local Disaster Risk Reduction and Management Assistant',
                8,
            ],
            [
                '07-SS',
                'DRM',
                'LDRRMO1',
                'Local Disaster Risk Reduction and Management Officer I',
                11,
            ],
            [
                '07-SS',
                'DRM',
                'LDRRMO2',
                'Local Disaster Risk Reduction and Management Officer II',
                15,
            ],
            [
                '07-SS',
                'DRM',
                'LDRRMO3',
                'Local Disaster Risk Reduction and Management Officer III',
                18,
            ],
            [
                '07-SS',
                'DRM',
                'LDRRMO4',
                'Local Disaster Risk Reduction and Management Officer IV',
                22,
            ],
            [
                '07-SS',
                'DRM',
                'LDRRMO5',
                'Local Disaster Risk Reduction and Management Officer V',
                24,
            ],

            // EAD

            // Election Administration
            ['07-SS', 'EAD', 'CBBC1', 'Contested Ballot Box Custodian I', 8],
            ['07-SS', 'EAD', 'CBBC2', 'Contested Ballot Box Custodian II', 10],
            ['07-SS', 'EAD', 'EA1', 'Election Assistant I', 7],
            ['07-SS', 'EAD', 'EA2', 'Election Assistant II', 9],
            ['07-SS', 'EAD', 'EFO', 'Election Field Officer', 21],
            ['07-SS', 'EAD', 'EPA1', 'Election Precincts Analyst I', 10],
            ['07-SS', 'EAD', 'EPA2', 'Election Precincts Analyst II', 14],
            ['07-SS', 'EAD', 'EO1', 'Election Officer I', 12],
            ['07-SS', 'EAD', 'EO2', 'Election Officer II', 15],
            ['07-SS', 'EAD', 'EO3', 'Election Officer III', 18],
            ['07-SS', 'EAD', 'EO4', 'Election Officer IV', 21],
            ['07-SS', 'EAD', 'PES1', 'Provincial Election Supervisor I', 23],
            ['07-SS', 'EAD', 'PES2', 'Provincial Election Supervisor II', 24],
            ['07-SS', 'EAD', 'PES3', 'Provincial Election Supervisor III', 25],
            ['07-SS', 'EAD', 'PES4', 'Provincial Election Supervisor IV', 26],

            // ES

            // Emigrant Services
            ['07-SS', 'ES', 'ESO1', 'Emigrant Services Officer I', 11],
            ['07-SS', 'ES', 'ESO2', 'Emigrant Services Officer II', 15],
            ['07-SS', 'ES', 'SRESO', 'Senior Emigrant Services Officer', 18],
            [
                '07-SS',
                'ES',
                'SVESO',
                'Supervising Emigrant Services Officer',
                22,
            ],
            ['07-SS', 'ES', 'CESO', 'Chief Emigrant Services Officer', 24],

            // GAD

            // Gender and Awareness Development
            ['07-SS', 'GAD', 'GAD1', 'GAD Specialist I', 11],
            ['07-SS', 'GAD', 'GAD2', 'GAD Specialist II', 15],
            ['07-SS', 'GAD', 'GAD3', 'GAD Specialist III', 18],
            ['07-SS', 'GAD', 'SVGAD', 'Supervising GAD Specialist', 22],
            ['07-SS', 'GAD', 'CGAD', 'Chief GAD Specialist', 24],

            // GPC

            // Graft Prevention and Control
            [
                '07-SS',
                'GPC',
                'GPCO1',
                'Graft Prevention and Control Officer I',
                11,
            ],
            [
                '07-SS',
                'GPC',
                'GPCO2',
                'Graft Prevention and Control Officer II',
                15,
            ],
            [
                '07-SS',
                'GPC',
                'GPCO3',
                'Graft Prevention and Control Officer III',
                18,
            ],
            [
                '07-SS',
                'GPC',
                'GPCO4',
                'Graft Prevention and Control Officer IV',
                22,
            ],
            [
                '07-SS',
                'GPC',
                'GPCO5',
                'Graft Prevention and Control Officer V',
                24,
            ],

            // HM

            // Home Management
            ['07-SS', 'HM', 'HOMT', 'Home Management Technologist', 10],
            ['07-SS', 'HM', 'HOMS1', 'Home Management Specialist I', 11],
            ['07-SS', 'HM', 'HOMS2', 'Home Management Specialist II', 15],
            ['07-SS', 'HM', 'SRHMS', 'Senior Home Management Specialist', 18],
            [
                '07-SS',
                'HM',
                'SVHMS',
                'Supervising Home Management Specialist',
                22,
            ],
            ['07-SS', 'HM', 'CHMS', 'Chief Home Management Specialist', 24],

            // HHR

            // Housing and Homesite Regulation
            [
                '07-SS',
                'HHR',
                'HHRA',
                'Housing and Homesite Regulation Assistant',
                8,
            ],
            [
                '07-SS',
                'HHR',
                'HHRO1',
                'Housing and Homesite Regulation Officer I',
                11,
            ],
            [
                '07-SS',
                'HHR',
                'HHRO2',
                'Housing and Homesite Regulation Officer II',
                13,
            ],
            [
                '07-SS',
                'HHR',
                'HHRO3',
                'Housing and Homesite Regulation Officer III',
                16,
            ],
            [
                '07-SS',
                'HHR',
                'HHRO4',
                'Housing and Homesite Regulation Officer IV',
                19,
            ],
            [
                '07-SS',
                'HHR',
                'HHRO5',
                'Housing and Homesite Regulation Officer V',
                22,
            ],
            [
                '07-SS',
                'HHR',
                'HHRO6',
                'Housing and Homesite Regulation Officer VI',
                24,
            ],

            // IMR

            // Immigration Regulation
            ['07-SS', 'IMR', 'IMGA', 'Immigration Assistant', 8],
            ['07-SS', 'IMR', 'IMGO1', 'Immigration Officer I', 11],
            ['07-SS', 'IMR', 'IMGO2', 'Immigration Officer II', 13],
            ['07-SS', 'IMR', 'IMGO3', 'Immigration Officer III', 16],
            ['07-SS', 'IMR', 'SRIO', 'Senior Immigration Officer', 19],
            ['07-SS', 'IMR', 'SVIO', 'Supervising Immigration Officer', 22],
            ['07-SS', 'IMR', 'CIO', 'Chief Immigration Officer', 24],

            // LCMA

            // Labor, Conciliation, Mediation and Arbitration
            ['07-SS', 'LCMA', 'CLT', 'Conciliator', 25],
            ['07-SS', 'LCMA', 'CLTM', 'Conciliator-Mediator', 25],
            ['07-SS', 'LCMA', 'MARB', 'Mediator-Arbiter', 25],
            ['07-SS', 'LCMA', 'EXCOM', 'Executive Conciliator-Mediator', 26],
            ['07-SS', 'LCMA', 'LARBA', 'Labor Arbitration Associate', 22],
            ['07-SS', 'LCMA', 'LARB', 'Labor Arbiter', 29],
            ['07-SS', 'LCMA', 'OEA', 'Overseas Employment Adjudicator', 25],

            // LEMD

            // Labor, Employment and Manpower Development
            ['07-SS', 'LEMD', 'LEA', 'Labor and Employment Assistant', 8],
            ['07-SS', 'LEMD', 'LEO1', 'Labor and Employment Officer I', 11],
            ['07-SS', 'LEMD', 'LEO2', 'Labor and Employment Officer II', 13],
            ['07-SS', 'LEMD', 'LEO3', 'Labor and Employment Officer III', 16],
            [
                '07-SS',
                'LEMD',
                'SRLEO',
                'Senior Labor and Employment Officer',
                19,
            ],
            [
                '07-SS',
                'LEMD',
                'SVLEO',
                'Supervising Labor and Employment Officer',
                22,
            ],
            ['07-SS', 'LEMD', 'CLEO', 'Chief Labor and Employment Officer', 24],
            ['07-SS', 'LEMD', 'MDA', 'Manpower Development Assistant', 8],
            ['07-SS', 'LEMD', 'MDO1', 'Manpower Development Officer I', 11],
            ['07-SS', 'LEMD', 'MDO2', 'Manpower Development Officer II', 15],
            [
                '07-SS',
                'LEMD',
                'SRMDO',
                'Senior Manpower Development Officer',
                18,
            ],
            [
                '07-SS',
                'LEMD',
                'SVMDO',
                'Supervising Manpower Development Officer',
                22,
            ],
            ['07-SS', 'LEMD', 'CMDO', 'Chief Manpower Development Officer', 24],
            [
                '07-SS',
                'LEMD',
                'MDRC',
                'Manpower Development Regional Coordinator',
                25,
            ],
            ['07-SS', 'LEMD', 'OWWA', 'Overseas Worker Welfare Assistant', 8],
            ['07-SS', 'LEMD', 'OWWO1', 'Overseas Worker Welfare Officer I', 11],
            [
                '07-SS',
                'LEMD',
                'OWWO2',
                'Overseas Worker Welfare Officer II',
                15,
            ],
            [
                '07-SS',
                'LEMD',
                'OWWO3',
                'Overseas Worker Welfare Officer III',
                18,
            ],
            [
                '07-SS',
                'LEMD',
                'OWWO4',
                'Overseas Worker Welfare Officer IV',
                22,
            ],
            ['07-SS', 'LEMD', 'OWWO5', 'Overseas Worker Welfare Officer V', 24],
            [
                '07-SS',
                'LEMD',
                'OWWO6',
                'Overseas Worker Welfare Officer VI',
                25,
            ],

            // LGO

            // Local Government Operations
            [
                '07-SS',
                'LGO',
                'LGOO1',
                'Local Government Operations Officer I',
                11,
            ],
            [
                '07-SS',
                'LGO',
                'LGOO2',
                'Local Government Operations Officer II',
                13,
            ],
            [
                '07-SS',
                'LGO',
                'LGOO3',
                'Local Government Operations Officer III',
                15,
            ],
            [
                '07-SS',
                'LGO',
                'LGOO4',
                'Local Government Operations Officer IV',
                18,
            ],
            [
                '07-SS',
                'LGO',
                'LGOO5',
                'Local Government Operations Officer V',
                20,
            ],
            [
                '07-SS',
                'LGO',
                'LGOO6',
                'Local Government Operations Officer VI',
                22,
            ],
            [
                '07-SS',
                'LGO',
                'LGOO7',
                'Local Government Operations Officer VII',
                24,
            ],
            [
                '07-SS',
                'LGO',
                'LGOO8',
                'Local Government Operations Officer VIII',
                26,
            ],

            // PPA

            // Parole and Probation Administration
            ['07-SS', 'PPA', 'APO', 'Assistant Parole Officer', 12],
            ['07-SS', 'PPA', 'PARO1', 'Parole Officer I', 16],
            ['07-SS', 'PPA', 'PARO2', 'Parole Officer II', 18],
            ['07-SS', 'PPA', 'SRPO', 'Senior Parole Officer', 21],
            ['07-SS', 'PPA', 'SVPO', 'Supervising Parole Officer', 23],
            ['07-SS', 'PPA', 'CPO', 'Chief Parole Officer', 25],
            ['07-SS', 'PPA', 'PROB1', 'Probation Officer I', 11],
            ['07-SS', 'PPA', 'PROB2', 'Probation Officer II', 15],
            ['07-SS', 'PPA', 'SRPROB', 'Senior Probation Officer', 18],
            ['07-SS', 'PPA', 'SVPROB', 'Supervising Probation Officer', 22],
            ['07-SS', 'PPA', 'CPRO', 'Chief Probation Officer', 24],

            // PP

            // Peace Program
            ['07-SS', 'PP', 'PPO1', 'Peace Program Officer I', 11],
            ['07-SS', 'PP', 'PPO2', 'Peace Program Officer II', 15],
            ['07-SS', 'PP', 'PPO3', 'Peace Program Officer III', 18],
            ['07-SS', 'PP', 'PPO4', 'Peace Program Officer IV', 22],
            ['07-SS', 'PP', 'PPO5', 'Peace Program Officer V', 24],

            // PIM

            // Penal Institution Management
            ['07-SS', 'PIM', 'PBT', 'Phlebotomist', 18],
            ['07-SS', 'PIM', 'SRPBT', 'Senior Phlebotomist', 20],
            [
                '07-SS',
                'PIM',
                'PIPO1',
                'Penal Institution Program Officer I',
                11,
            ],
            [
                '07-SS',
                'PIM',
                'PIPO2',
                'Penal Institution Program Officer II',
                15,
            ],
            [
                '07-SS',
                'PIM',
                'SRPIPO',
                'Senior Penal Institution Program Officer',
                18,
            ],
            [
                '07-SS',
                'PIM',
                'SVPIPO',
                'Supervising Penal Institution Program Officer',
                22,
            ],
            [
                '07-SS',
                'PIM',
                'CPIPO',
                'Chief Penal Institution Program Officer',
                24,
            ],

            // PAF

            // Political Affair
            ['07-SS', 'PAF', 'PAE1', 'Political Affairs Employee I', 4],
            ['07-SS', 'PAF', 'PAE2', 'Political Affairs Employee II', 6],
            ['07-SS', 'PAF', 'PAA1', 'Political Affairs Assistant I', 7],
            ['07-SS', 'PAF', 'PAA2', 'Political Affairs Assistant II', 10],
            ['07-SS', 'PAF', 'PAA3', 'Political Affairs Assistant III', 11],
            ['07-SS', 'PAF', 'PAO1', 'Political Affairs Officer I', 14],
            ['07-SS', 'PAF', 'PAO2', 'Political Affairs Officer II', 16],
            ['07-SS', 'PAF', 'PAO3', 'Political Affairs Officer III', 19],
            ['07-SS', 'PAF', 'PAO4', 'Political Affairs Officer IV', 20],
            ['07-SS', 'PAF', 'PAO5', 'Political Affairs Officer V', 21],
            ['07-SS', 'PAF', 'PAO6', 'Political Affairs Officer VI', 24],
            [
                '07-SS',
                'PAF',
                'SPAO1',
                'Supervising Political Affairs Officer I',
                22,
            ],
            [
                '07-SS',
                'PAF',
                'SPAO2',
                'Supervising Political Affairs Officer II',
                23,
            ],
            [
                '07-SS',
                'PAF',
                'SPAO3',
                'Supervising Political Affairs Officer III',
                25,
            ],
            ['07-SS', 'PAF', 'CPAO', 'Chief Political Affairs Officer', 26],

            // PCL

            // Population Control Program
            ['07-SS', 'PCL', 'POPW1', 'Population Program Worker I', 5],
            ['07-SS', 'PCL', 'POPW2', 'Population Program Worker II', 7],
            ['07-SS', 'PCL', 'POPW3', 'Population Program Worker III', 9],
            ['07-SS', 'PCL', 'POP1', 'Population Program Officer I', 11],
            ['07-SS', 'PCL', 'POP2', 'Population Program Officer II', 15],
            ['07-SS', 'PCL', 'POP3', 'Population Program Officer III', 18],
            ['07-SS', 'PCL', 'POP4', 'Population Program Officer IV', 22],
            ['07-SS', 'PCL', 'POP5', 'Population Program Officer V', 24],
            ['07-SS', 'PCL', 'POPC', 'Population Program Coordinator', 24],

            // PR

            // Professional Regulation
            ['07-SS', 'PR', 'PREGA', 'Professional Regulations Assistant', 8],
            ['07-SS', 'PR', 'PREGO1', 'Professional Regulations Officer I', 11],
            [
                '07-SS',
                'PR',
                'PREGO2',
                'Professional Regulations Officer II',
                13,
            ],
            [
                '07-SS',
                'PR',
                'PREGO3',
                'Professional Regulations Officer III',
                16,
            ],
            [
                '07-SS',
                'PR',
                'SRPREGO',
                'Senior Professional Regulations Officer',
                19,
            ],
            [
                '07-SS',
                'PR',
                'SVPREGO',
                'Supervising Professional Regulations Officer',
                22,
            ],
            [
                '07-SS',
                'PR',
                'CPREGO',
                'Chief Professional Regulations Officer',
                24,
            ],

            // PS

            // Public Services
            ['07-SS', 'PS', 'PSERF', 'Public Services Foreman', 6],
            ['07-SS', 'PS', 'PSERI1', 'Public Services Inspector I', 6],
            ['07-SS', 'PS', 'PSERI2', 'Public Services Inspector II', 8],
            ['07-SS', 'PS', 'PSERA', 'Public Services Assistant', 8],
            ['07-SS', 'PS', 'PSERO1', 'Public Services Officer I', 11],
            ['07-SS', 'PS', 'PSERO2', 'Public Services Officer II', 15],
            ['07-SS', 'PS', 'PSERO3', 'Public Services Officer III', 18],
            ['07-SS', 'PS', 'PSERO4', 'Public Services Officer IV', 22],
            ['07-SS', 'PS', 'PSERO5', 'Public Services Officer V', 24],

            // R

            // Registration
            ['07-SS', 'R', 'ARO', 'Assistant Registration Officer', 8],
            ['07-SS', 'R', 'REGO1', 'Registration Officer I', 10],
            ['07-SS', 'R', 'REGO2', 'Registration Officer II', 14],
            ['07-SS', 'R', 'REGO3', 'Registration Officer III', 18],
            ['07-SS', 'R', 'REGO4', 'Registration Officer IV', 22],
            ['07-SS', 'R', 'REGO5', 'Registration Officer V', 24],

            // RG

            // Religious Guidance
            ['07-SS', 'RG', 'RW', 'Religious Worker', 8],
            ['07-SS', 'RG', 'RS', 'Religious Sister', 8],
            ['07-SS', 'RG', 'CLAIN', 'Chaplain', 16],
            ['07-SS', 'RG', 'RGA', 'Religious Guidance Adviser', 18],

            // SWD

            // Social Welfare Development
            ['07-SS', 'SWD', 'DCW1', 'Day Care Worker I', 6],
            ['07-SS', 'SWD', 'DCW2', 'Day Care Worker II', 8],
            ['07-SS', 'SWD', 'SOCWA', 'Social Welfare Aide', 4],
            ['07-SS', 'SWD', 'SOCWAS', 'Social Welfare Assistant', 8],
            ['07-SS', 'SWD', 'SOCWO1', 'Social Welfare Officer I', 11],
            ['07-SS', 'SWD', 'SOCWO2', 'Social Welfare Officer II', 15],
            ['07-SS', 'SWD', 'SOCWO3', 'Social Welfare Officer III', 18],
            ['07-SS', 'SWD', 'SOCWO4', 'Social Welfare Officer IV', 22],
            ['07-SS', 'SWD', 'SOCWO5', 'Social Welfare Officer V', 24],
            ['07-SS', 'SWD', 'VOLSO1', 'Volunteer Service Officer I', 10],
            ['07-SS', 'SWD', 'VOLSO2', 'Volunteer Service Officer II', 14],
            ['07-SS', 'SWD', 'SRVSO', 'Senior Volunteer Service Officer', 18],
            [
                '07-SS',
                'SWD',
                'SVVSO',
                'Supervising Volunteer Service Officer',
                22,
            ],
            ['07-SS', 'SWD', 'CVSO', 'Chief Volunteer Service Officer', 24],
            ['07-SS', 'SWD', 'YDA1', 'Youth Development Assistant I', 5],
            ['07-SS', 'SWD', 'YDA2', 'Youth Development Assistant II', 8],
            ['07-SS', 'SWD', 'YDO1', 'Youth Development Officer I', 10],
            ['07-SS', 'SWD', 'YDO2', 'Youth Development Officer II', 14],
            ['07-SS', 'SWD', 'YDO3', 'Youth Development Officer III', 18],
            ['07-SS', 'SWD', 'YDO4', 'Youth Development Officer IV', 22],
            ['07-SS', 'SWD', 'YDO5', 'Youth Development Officer V', 24],

            // S

            // Sociology
            ['07-SS', 'S', 'IGO1', 'Inmate Guidance Officer I', 11],
            ['07-SS', 'S', 'IGO2', 'Inmate Guidance Officer II', 15],
            ['07-SS', 'S', 'IGC', 'Inmate Guidance Chief', 24],
            ['07-SS', 'S', 'PSY1', 'Psychologist I', 11],
            ['07-SS', 'S', 'P5Y2', 'Psychologist II', 15],
            ['07-SS', 'S', 'PSY3', 'Psychologist III', 18],
            ['07-SS', 'S', 'SOC1', 'Sociologist I', 11],
            ['07-SS', 'S', 'SOC2', 'Sociologist II', 15],

            // SO

            // Special Operations
            ['07-SS', 'SO', 'SPOO1', 'Special Operations Officer I', 10],
            ['07-SS', 'SO', 'SPOO2', 'Special Operations Officer II', 14],
            ['07-SS', 'SO', 'SPOO3', 'Special Operations Officer III', 18],
            ['07-SS', 'SO', 'SPOO4', 'Special Operations Officer IV', 22],
            ['07-SS', 'SO', 'SPOO5', 'Special Operations Officer V', 24],

            // TESD

            // Technical Education and Skills Development
            [
                '07-SS',
                'TESD',
                'TESDA',
                'Technical Education and Skills Development Analyst',
                11,
            ],
            [
                '07-SS',
                'TESD',
                'TESDS1',
                'Technical Education and Skills Development Specialist I',
                13,
            ],
            [
                '07-SS',
                'TESD',
                'TESDS2',
                'Technical Education and Skills Development Specialist II',
                16,
            ],
            [
                '07-SS',
                'TESD',
                'SRTESDS',
                'Senior Technical Education and Skills Development Specialist',
                19,
            ],
            [
                '07-SS',
                'TESD',
                'SVTESDS',
                'Supervising Technical Education and Skills Development Specialist',
                22,
            ],
            [
                '07-SS',
                'TESD',
                'CTESDS',
                'Chief Technical Education and Skills Development Specialist',
                24,
            ],

            // VA

            // Veterans Assistance
            ['07-SS', 'VA', 'VETAO1', 'Veterans Assistance Officer I', 11],
            ['07-SS', 'VA', 'VETAO2', 'Veterans Assistance Officer II', 15],
            ['07-SS', 'VA', 'SRVAO', 'Senior Veterans Assistance Officer', 18],
            [
                '07-SS',
                'VA',
                'SWAO',
                'Supervising Veterans Assistance Officer',
                22,
            ],
            ['07-SS', 'VA', 'CVAO', 'Chief Veterans Assistance Officer', 24],

            // 08-IA - INFORMATION, ART AND RECREATION SERVICE

            // AVEO

            // Audio-Visual Equipment Operation and Repair
            ['08-IA', 'AVEO', 'SLT', 'Speech Laboratory Technician', 6],

            ['08-IA', 'AVEO', 'AVEO1', 'Audio-Visual Equipment Operator I', 3],
            ['08-IA', 'AVEO', 'AVEO2', 'Audio-Visual Equipment Operator II', 5],
            [
                '08-IA',
                'AVEO',
                'AVEO3',
                'Audio-Visual Equipment Operator III',
                7,
            ],
            ['08-IA', 'AVEO', 'AVAT1', 'Audio-Visual Aids Technician I', 6],
            ['08-IA', 'AVEO', 'AVAT2', 'Audio-Visual Aids Technician II', 8],
            ['08-IA', 'AVEO', 'AVAT3', 'Audio-Visual Aids Technician III', 10],
            ['08-IA', 'AVEO', 'AVAT4', 'Audio-Visual Aids Technician IV', 14],

            // BOPP

            // Broadcast Operation and Program Production
            ['08-IA', 'BOPP', 'BRO1', 'Broadcast Operator I', 6],
            ['08-IA', 'BOPP', 'BRO2', 'Broadcast Operator II', 8],
            ['08-IA', 'BOPP', 'BOT1', 'Broadcast Operations Technician I', 9],
            ['08-IA', 'BOPP', 'BOT2', 'Broadcast Operations Technician II', 11],
            [
                '08-IA',
                'BOPP',
                'BOT3',
                'Broadcast Operations Technician III',
                13,
            ],
            ['08-IA', 'BOPP', 'BPTO', 'Broadcast Program Traffic Officer', 9],
            [
                '08-IA',
                'BOPP',
                'BPPA1',
                'Broadcast Program Producer-Announcer I',
                12,
            ],
            [
                '08-IA',
                'BOPP',
                'BPPA2',
                'Broadcast Program Producer-Announcer II',
                16,
            ],
            [
                '08-IA',
                'BOPP',
                'BPPA3',
                'Broadcast Program Producer-Announcer III',
                19,
            ],
            ['08-IA', 'BOPP', 'BROPS', 'Broadcast Production Supervisor', 19],
            ['08-IA', 'BOPP', 'BSMG', 'Broadcast Station Manager', 22],
            ['08-IA', 'BOPP', 'BOS', 'Broadcast Operations Supervisor', 19],
            ['08-IA', 'BOPP', 'BOC', 'Broadcast Operations Chief', 24],
            ['08-IA', 'BOPP', 'NETC1', 'Network Controller I', 8],
            ['08-IA', 'BOPP', 'NETC2', 'Network Controller II', 11],

            // FC

            // Film Classification
            ['08-IA', 'FC', 'FCD1', 'Film Custodian I', 4],
            ['08-IA', 'FC', 'FCD2', 'Film Custodian II', 6],
            ['08-IA', 'FC', 'FED1', 'Film Editor I', 7],
            ['08-IA', 'FC', 'FED2', 'Film Editor II', 9],
            ['08-IA', 'FC', 'FIPA1', 'Film Preview Assistant I', 7],
            ['08-IA', 'FC', 'FIPA2', 'Film Preview Assistant II', 9],

            // I

            // Illustrating
            ['08-IA', 'I', 'CASL1', 'Creative Arts Specialist I', 11],
            ['08-IA', 'I', 'CASL2', 'Creative Arts Specialist II', 15],
            ['08-IA', 'I', 'CASL3', 'Creative Arts Specialist III', 18],
            ['08-IA', 'I', 'CASL4', 'Creative Arts Specialist IV', 22],
            ['08-IA', 'I', 'CASL5', 'Creative Arts Specialist V', 24],
            ['08-IA', 'I', 'INDA', 'Industrial Design Analyst', 11],
            ['08-IA', 'I', 'INDS', 'Industrial Design Specialist', 15],
            ['08-IA', 'I', 'SRIDS', 'Senior Industrial Design Specialist', 18],
            [
                '08-IA',
                'I',
                'SVIDS',
                'Supervising Industrial Design Specialist',
                22,
            ],
            ['08-IA', 'I', 'CIDS', 'Chief Industrial Design Specialist', 24],
            ['08-IA', 'I', 'PHILA1', 'Philatelic Artist I', 9],
            ['08-IA', 'I', 'PHILA2', 'Philatelic Artist II', 11],
            ['08-IA', 'I', 'TR', 'Tracer I', 3],

            ['08-IA', 'I', 'AL1', 'Artist-Illustrator I', 6],
            ['08-IA', 'I', 'AL2', 'Artist-Illustrator II', 8],
            ['08-IA', 'I', 'AL3', 'Artist-Illustrator III', 11],
            ['08-IA', 'I', 'ILTOR1', 'Illustrator I', 3],
            ['08-IA', 'I', 'ILTOR2', 'Illustrator II', 5],

            // ID

            // Information Dissemination
            ['08-IA', 'ID', 'MW', 'Message Writer', 15],
            ['08-IA', 'ID', 'NA1', 'News Analyst I', 11],
            ['08-IA', 'ID', 'NA2', 'News Analyst II', 15],
            ['08-IA', 'ID', 'NA3', 'News Analyst III', 18],
            ['08-IA', 'ID', 'NA4', 'News Analyst IV', 22],
            ['08-IA', 'ID', 'NE1', 'News Editor I', 12],
            ['08-IA', 'ID', 'NE2', 'News Editor II', 16],
            ['08-IA', 'ID', 'SRNE', 'Senior News Editor', 19],
            ['08-IA', 'ID', 'SVNE', 'Supervising News Editor', 22],
            ['08-IA', 'ID', 'MANEW', 'Managing News Editor', 22],
            ['08-IA', 'ID', 'EXNE', 'Executive News Editor', 24],
            ['08-IA', 'ID', 'NR1', 'News Reporter I', 15],
            ['08-IA', 'ID', 'NR2', 'News Reporter II', 17],
            ['08-IA', 'ID', 'NC1', 'Newscaster I', 15],
            ['08-IA', 'ID', 'NC2', 'Newscaster II', 17],
            ['08-IA', 'ID', 'PCTRCA', 'Publication Circulation Assistant', 8],
            ['08-IA', 'ID', 'PCTRCO1', 'Publication Circulation Officer I', 11],
            [
                '08-IA',
                'ID',
                'PCTRCO2',
                'Publication Circulation Officer II',
                15,
            ],
            [
                '08-IA',
                'ID',
                'PCTRCO3',
                'Publication Circulation Officer III',
                18,
            ],
            ['08-IA', 'ID', 'SW1', 'Scriptwriter I', 12],
            ['08-IA', 'ID', 'SW2', 'Scriptwriter II', 15],
            ['08-IA', 'ID', 'SWR', 'Speechwriter', 16],
            ['08-IA', 'ID', 'STRNS', 'Speech Transcriber', 11],
            ['08-IA', 'ID', 'AIO', 'Assistant Information Officer', 8],

            ['08-IA', 'ID', 'INFO1', 'Information Officer I', 11],
            ['08-IA', 'ID', 'INFO2', 'Information Officer II', 15],
            ['08-IA', 'ID', 'INFO3', 'Information Officer III', 18],
            ['08-IA', 'ID', 'INFO4', 'Information Officer IV', 22],
            ['08-IA', 'ID', 'INFO5', 'Information Officer V', 24],

            // MAR

            // Media Accreditation and Relations
            [
                '08-IA',
                'MAR',
                'MARO1',
                'Media Accreditation and Relation Officer I',
                11,
            ],
            [
                '08-IA',
                'MAR',
                'MARO2',
                'Media Accreditation and Relation Officer II',
                15,
            ],
            [
                '08-IA',
                'MAR',
                'MARO3',
                'Media Accreditation and Relation Officer III',
                18,
            ],
            [
                '08-IA',
                'MAR',
                'MARO4',
                'Media Accreditation and Relation Officer IV',
                22,
            ],
            [
                '08-IA',
                'MAR',
                'MARO5',
                'Media Accreditation and Relation Officer V',
                24,
            ],

            // MMP

            // Media and Movie Production
            ['08-IA', 'MMP', 'CMG1', 'Cinematographer I', 10],
            ['08-IA', 'MMP', 'CMG2', 'Cinematographer II', 14],
            ['08-IA', 'MMP', 'CMG3', 'Cinematographer III', 16],
            ['08-IA', 'MMP', 'CMG4', 'Cinematographer IV', 18],
            ['08-IA', 'MMP', 'MPXA', 'Media Production Aide', 5],
            ['08-IA', 'MMP', 'MPXAS', 'Media Production Assistant', 8],
            ['08-IA', 'MMP', 'MPXS1', 'Media Production Specialist I', 11],
            ['08-IA', 'MMP', 'MPXS2', 'Media Production Specialist II', 15],
            ['08-IA', 'MMP', 'MPXS3', 'Media Production Specialist III', 18],
            ['08-IA', 'MMP', 'MPXS4', 'Media Production Specialist IV', 22],
            ['08-IA', 'MMP', 'MPXS5', 'Media Production Specialist V', 24],
            ['08-IA', 'MMP', 'MET1', 'Movie Equipment Technician I', 6],
            ['08-IA', 'MMP', 'MET2', 'Movie Equipment Technician II', 8],
            ['08-IA', 'MMP', 'MET3', 'Movie Equipment Technician III', 11],

            // MC

            // Musicians
            ['08-IA', 'MC', 'MUSIC', 'Musician', 5],
            ['08-IA', 'MC', 'BM', 'Bandmaster', 9],
            ['08-IA', 'MC', 'MUSICD', 'Music Director', 11],

            // PH

            // Photography
            ['08-IA', 'PH', 'CST1', 'Color Separation Technician I', 6],
            ['08-IA', 'PH', 'CST2', 'Color Separation Technician II', 8],
            ['08-IA', 'PH', 'OCO1', 'Offset Camera Operator I', 6],
            ['08-IA', 'PH', 'OCO2', 'Offset Camera Operator II', 8],
            ['08-IA', 'PH', 'PHED1', 'Photo Editor I', 6],
            ['08-IA', 'PH', 'PHED2', 'Photo Editor II', 8],
            ['08-IA', 'PH', 'PHOJO1', 'Photo Journalist I', 6],
            ['08-IA', 'PH', 'PHOJO2', 'Photo Journalist II', 8],
            ['08-IA', 'PH', 'PCP1', 'Photographic Color Processor I', 6],
            ['08-IA', 'PH', 'PCP2', 'Photographic Color Processor II', 8],
            ['08-IA', 'PH', 'PCP3', 'Photographic Color Processor III', 11],
            ['08-IA', 'PH', 'RPEO', 'Radio Photo Equipment Operator', 7],

            ['08-IA', 'PH', 'PHOTO1', 'Photographer I', 5],
            ['08-IA', 'PH', 'PHOTO2', 'Photographer II', 7],
            ['08-IA', 'PH', 'PHOTO3', 'Photographer III', 10],
            ['08-IA', 'PH', 'PHOTO4', 'Photographer IV', 12],
            ['08-IA', 'PH', 'PHOTO5', 'Photographer V', 15],
            ['08-IA', 'PH', 'PHOTO6', 'Photographer VI', 18],

            // PAD

            // Printing Administration
            ['08-IA', 'PAD', 'PSCHED', 'Printing Scheduler', 5],
            ['08-IA', 'PAD', 'POW1', 'Printing Order Writer I', 6],
            ['08-IA', 'PAD', 'POW2', 'Printing Order Writer II', 8],
            ['08-IA', 'PAD', 'POW3', 'Printing Order Writer III', 11],
            ['08-IA', 'PAD', 'PRINF', 'Printing Foreman', 9],
            ['08-IA', 'PAD', 'QI1', 'Printing Quality Inspector I', 4],
            ['08-IA', 'PAD', 'PQI2', 'Printing Quality Inspector II', 6],
            ['08-IA', 'PAD', 'PQI3', 'Printing Quality Inspector III', 9],
            ['08-IA', 'PAD', 'PQCO1', 'Printing Quality Control Officer I', 10],
            [
                '08-IA',
                'PAD',
                'PQCO2',
                'Printing Quality Control Officer II',
                14,
            ],
            ['08-IA', 'PAD', 'PPROS', 'Publication Production Supervisor', 15],
            ['08-IA', 'PAD', 'PPC', 'Publication Production Chief', 18],
            ['08-IA', 'PAD', 'WOT', 'Work Order Tracer', 3],
            [
                '08-IA',
                'PAD',
                'ASPR',
                'Assistant Superintendent of Printing',
                25,
            ],
            ['08-IA', 'PAD', 'SUPP', 'Superintendent of Printing', 26],

            // PF

            // Proofreading
            ['08-IA', 'PF', 'CPYR', 'Copy Reader', 7],
            ['08-IA', 'PF', 'CPR', 'Press-Proof Revisor', 8],
            ['08-IA', 'PF', 'PROOF1', 'Proofreader I', 4],
            ['08-IA', 'PF', 'PROOF2', 'Proofreader II', 6],

            // PUR

            // Public Information
            ['08-IA', 'PUR', 'PRELA', 'Public Relations Assistant', 8],
            ['08-IA', 'PUR', 'PRO1', 'Public Relations Officer I', 11],
            ['08-IA', 'PUR', 'PRO2', 'Public Relations Officer II', 15],
            ['08-IA', 'PUR', 'PRO3', 'Public Relations Officer III', 18],
            ['08-IA', 'PUR', 'PRO4', 'Public Relations Officer IV', 22],
            ['08-IA', 'PUR', 'PRO5', 'Public Relations Officer V', 24],

            // RC

            // Recreation
            ['08-IA', 'RC', 'LG', 'Lifeguard', 3],
            [
                '08-IA',
                'RC',
                'RWSA',
                'Recreation and Welfare Services Assistant',
                7,
            ],
            [
                '08-IA',
                'RC',
                'RWSO1',
                'Recreation and Welfare Services Officer I',
                9,
            ],
            [
                '08-IA',
                'RC',
                'RWSO2',
                'Recreation and Welfare Services Officer II',
                11,
            ],
            [
                '08-IA',
                'RC',
                'RWSO3',
                'Recreation and Welfare Services Officer III',
                15,
            ],
            [
                '08-IA',
                'RC',
                'RWSO4',
                'Recreation and Welfare Services Officer IV',
                18,
            ],
            [
                '08-IA',
                'RC',
                'RWSO5',
                'Recreation and Welfare Services Officer V',
                22,
            ],
            [
                '08-IA',
                'RC',
                'RWSO6',
                'Recreation and Welfare Services Officer VI',
                24,
            ],

            // SDGR

            // Sports Development and Games Regulation
            ['08-IA', 'SDGR', 'EQE', 'Equine Evaluator', 5],
            ['08-IA', 'SDGR', 'SGI1', 'Sports and Games Inspector I', 6],
            ['08-IA', 'SDGR', 'SGI2', 'Sports and Games Inspector II', 8],
            [
                '08-IA',
                'SDGR',
                'SGREGO1',
                'Sports and Games Regulation Officer I',
                10,
            ],
            [
                '08-IA',
                'SDGR',
                'SGREGO2',
                'Sports and Games Regulation Officer II',
                14,
            ],
            [
                '08-IA',
                'SDGR',
                'SRSGRO',
                'Senior Sports and Games Regulation Officer',
                18,
            ],
            [
                '08-IA',
                'SDGR',
                'SVSGRO',
                'Supervising Sports and Games Regulation Officer',
                22,
            ],
            [
                '08-IA',
                'SDGR',
                'CSGRO',
                'Chief Sports and Games Regulation Officer',
                24,
            ],
            ['08-IA', 'SDGR', 'SDEVO1', 'Sports Development Officer I', 10],
            ['08-IA', 'SDGR', 'SDEVO2', 'Sports Development Officer II', 14],
            ['08-IA', 'SDGR', 'SDEVO3', 'Sports Development Officer III', 18],
            ['08-IA', 'SDGR', 'SDEVO4', 'Sports Development Officer IV', 22],
            ['08-IA', 'SDGR', 'SDEVO5', 'Sports Development Officer V', 24],

            // T

            // Translating
            ['08-IA', 'T', 'INTER1', 'Interpreter I', 8],
            ['08-IA', 'T', 'INTER2', 'Interpreter II', 10],
            ['08-IA', 'T', 'INTER3', 'Interpreter III', 12],
            ['08-IA', 'T', 'TRNS1', 'Translator I', 8],
            ['08-IA', 'T', 'TRNS2', 'Translator II', 11],

            // 09-MH - MEDICINE AND HEALTH SERVICE

            // D

            // Dentistry
            ['09-MH', 'D', 'DTA', 'Dental Aide', 4],
            ['09-MH', 'D', 'DTH', 'Dental Hygienist', 10],
            ['09-MH', 'D', 'DENT1', 'Dentist I', 14],
            ['09-MH', 'D', 'DENT2', 'Dentist II', 17],
            ['09-MH', 'D', 'DENT3', 'Dentist III', 20],
            ['09-MH', 'D', 'DENT4', 'Dentist IV', 23],
            ['09-MH', 'D', 'DENT5', 'Dentist V', 24],
            ['09-MH', 'D', 'DENT6', 'Dentist VI', 26],
            ['09-MH', 'D', 'DENT7', 'Dentist VII', 28],
            ['09-MH', 'D', 'DENPS', 'Dental Program Supervisor', 22],

            // DT

            // Dietetics
            ['09-MH', 'DT', 'AND', 'Assistant Nutritionist-Dietitian', 7],
            ['09-MH', 'DT', 'ND1', 'Nutritionist-Dietitian I', 11],
            ['09-MH', 'DT', 'ND2', 'Nutritionist-Dietitian II', 15],
            ['09-MH', 'DT', 'ND3', 'Nutritionist-Dietitian III', 18],
            ['09-MH', 'DT', 'ND4', 'Nutritionist-Dietitian IV', 20],
            ['09-MH', 'DT', 'ND5', 'Nutritionist-Dietitian V', 22],
            ['09-MH', 'DT', 'ND6', 'Nutritionist-Dietitian VI', 24],
            ['09-MH', 'DT', 'DAD', 'Dietary Adviser', 22],
            ['09-MH', 'DT', 'FTEC1', 'Food Technologist I', 10],
            ['09-MH', 'DT', 'FTEC2', 'Food Technologist II', 14],
            ['09-MH', 'DT', 'FTEC3', 'Food Technologist III', 18],
            ['09-MH', 'DT', 'NUTPC', 'Nutrition Program Coordinator', 25],
            ['09-MH', 'DT', 'NUTO1', 'Nutrition Officer I', 10],
            ['09-MH', 'DT', 'NUTO2', 'Nutrition Officer II', 14],
            ['09-MH', 'DT', 'NUTO3', 'Nutrition Officer III', 18],
            ['09-MH', 'DT', 'NUTO4', 'Nutrition Officer IV', 22],
            ['09-MH', 'DT', 'NUTO5', 'Nutrition Officer V', 24],

            // HS

            // Health and Sanitation
            [
                '09-MH',
                'HS',
                'DDRO1',
                'Dangerous Drugs Regulation Officer I',
                11,
            ],
            [
                '09-MH',
                'HS',
                'DDRO2',
                'Dangerous Drugs Regulation Officer II',
                15,
            ],
            [
                '09-MH',
                'HS',
                'DDRO3',
                'Dangerous Drugs Regulation Officer III',
                18,
            ],
            [
                '09-MH',
                'HS',
                'DDRO4',
                'Dangerous Drugs Regulation Officer IV',
                22,
            ],
            [
                '09-MH',
                'HS',
                'DDRO5',
                'Dangerous Drugs Regulation Officer V',
                24,
            ],
            ['09-MH', 'HS', 'FDI', 'Food-Drug Inspector', 8],
            ['09-MH', 'HS', 'FDRO1', 'Food-Drug Regulation Officer I', 11],
            ['09-MH', 'HS', 'FDRO2', 'Food-Drug Regulation Officer II', 15],
            ['09-MH', 'HS', 'FDRO3', 'Food-Drug Regulation Officer III', 18],
            ['09-MH', 'HS', 'FDRO4', 'Food-Drug Regulation Officer IV', 22],
            ['09-MH', 'HS', 'FDRO5', 'Food-Drug Regulation Officer V', 24],
            ['09-MH', 'HS', 'SI1', 'Sanitation Inspector I', 6],
            ['09-MH', 'HS', 'SI2', 'Sanitation Inspector II', 8],
            ['09-MH', 'HS', 'SI3', 'Sanitation Inspector III', 11],
            ['09-MH', 'HS', 'SI4', 'Sanitation Inspector IV', 13],
            ['09-MH', 'HS', 'SI5', 'Sanitation Inspector V', 15],
            ['09-MH', 'HS', 'SI6', 'Sanitation Inspector VI', 18],

            // HEP

            // Health Education and Promotion
            [
                '09-MH',
                'HEP',
                'HEPO1',
                'Health Education and Promotion Officer I',
                10,
            ],
            [
                '09-MH',
                'HEP',
                'HEPO2',
                'Health Education and Promotion Officer II',
                14,
            ],
            [
                '09-MH',
                'HEP',
                'HEPO3',
                'Health Education and Promotion Officer III',
                18,
            ],
            [
                '09-MH',
                'HEP',
                'HEPO4',
                'Health Education and Promotion Officer IV',
                22,
            ],
            [
                '09-MH',
                'HEP',
                'HEPO5',
                'Health Education and Promotion Officer V',
                24,
            ],
            [
                '09-MH',
                'HEP',
                'HEPA',
                'Health Education and Promotion Adviser',
                22,
            ],

            // HPD

            // Health Program Development
            ['09-MH', 'HPD', 'BHA', 'Barangay Health Aide', 4],
            ['09-MH', 'HPD', 'HPRA', 'Health Program Researcher Assistant', 7],
            ['09-MH', 'HPD', 'HPR', 'Health Program Researcher', 9],
            ['09-MH', 'HPD', 'HPO1', 'Health Program Officer I', 11],
            ['09-MH', 'HPD', 'HPO2', 'Health Program Officer II', 15],
            ['09-MH', 'HPD', 'SRHPO', 'Senior Health Program Officer', 18],
            ['09-MH', 'HPD', 'SVHPO', 'Supervising Health Program Officer', 22],
            ['09-MH', 'HPD', 'CHPO', 'Chief Health Program Officer', 24],

            // HA

            // Hospital Administration
            ['09-MH', 'HA', 'HAS', 'Hospital Administration Specialist', 22],
            ['09-MH', 'HA', 'CS1', 'Chief of Sanitarium I', 24],
            ['09-MH', 'HA', 'CS2', 'Chief of Sanitarium II', 25],
            ['09-MH', 'HA', 'CS3', 'Chief of Sanitarium III', 26],
            ['09-MH', 'HA', 'CH1', 'Chief of Hospital I', 24],
            ['09-MH', 'HA', 'CH2', 'Chief of Hospital II', 25],
            ['09-MH', 'HA', 'CH3', 'Chief of Hospital III', 26],
            ['09-MH', 'HA', 'MDC1', 'Medical Center Chief I', 26],
            ['09-MH', 'HA', 'MDC2', 'Medical Center Chief II', 27],

            // MT

            // Medical Technology
            ['09-MH', 'MT', 'AT', 'Acupressure Technician', 6],
            ['09-MH', 'MT', 'MLAB1', 'Medical Laboratory Technician I', 6],
            ['09-MH', 'MT', 'MLAB2', 'Medical Laboratory Technician II', 8],
            ['09-MH', 'MT', 'MLAB3', 'Medical Laboratory Technician III', 10],
            ['09-MH', 'MT', 'MDTK1', 'Medical Technologist I', 11],
            ['09-MH', 'MT', 'MDTK2', 'Medical Technologist II', 15],
            ['09-MH', 'MT', 'MDTK3', 'Medical Technologist III', 18],
            ['09-MH', 'MT', 'MDTK4', 'Medical Technologist IV', 20],
            ['09-MH', 'MT', 'MDTK5', 'Medical Technologist V', 22],
            ['09-MH', 'MT', 'RT1', 'Radiologic Technologist I', 11],
            ['09-MH', 'MT', 'RT2', 'Radiologic Technologist II', 15],
            ['09-MH', 'MT', 'RT3', 'Radiologic Technologist III', 18],
            ['09-MH', 'MT', 'RT4', 'Radiologic Technologist IV', 20],
            ['09-MH', 'MT', 'RT5', 'Radiologic Technologist V', 22],

            // M

            // Medical
            ['09-MH', 'M', 'MDOF1', 'Medical Officer I', 16],
            ['09-MH', 'M', 'MDOF2', 'Medical Officer II', 18],
            ['09-MH', 'M', 'MDOF3', 'Medical Officer III', 21],
            ['09-MH', 'M', 'MDOF4', 'Medical Officer IV', 23],
            ['09-MH', 'M', 'MDOF5', 'Medical Officer V', 25],
            ['09-MH', 'M', 'RHP', 'Rural Health Physician', 24],
            ['09-MH', 'M', 'MDLO1', 'Medico-Legal Officer I', 18],
            ['09-MH', 'M', 'MDLO2', 'Medico-Legal Officer II', 20],
            ['09-MH', 'M', 'MDLO3', 'Medico-Legal Officer III', 22],
            ['09-MH', 'M', 'MDLO4', 'Medico-Legal Officer IV', 24],
            ['09-MH', 'M', 'MDLO5', 'Medico-Legal Officer V', 25],
            ['09-MH', 'M', 'MDSP1', 'Medical Specialist I', 22],
            ['09-MH', 'M', 'MDSP2', 'Medical Specialist II', 23],
            ['09-MH', 'M', 'MDSP3', 'Medical Specialist III', 24],
            ['09-MH', 'M', 'MDSP4', 'Medical Specialist IV', 25],
            ['09-MH', 'M', 'MDSP5', 'Medical Specialist V', 26],
            ['09-MH', 'M', 'MDSP6', 'Medical Specialist VI', 28],
            ['09-MH', 'M', 'MDSP7', 'Medical Specialist VII', 30],
            [
                '09-MH',
                'M',
                'COMPS1',
                'Chief of Medical Professional Staff I',
                25,
            ],
            [
                '09-MH',
                'M',
                'COMPS2',
                'Chief of Medical Professional Staff II',
                26,
            ],
            ['09-MH', 'M', 'CHO1', 'City Health Officer I', 24],
            ['09-MH', 'M', 'CHO2', 'City Health Officer II', 25],
            ['09-MH', 'M', 'CHO3', 'City Health Officer III', 26],
            ['09-MH', 'M', 'DHO1', 'District Health Officer I', 25],
            ['09-MH', 'M', 'DHO2', 'District Health Officer II', 26],
            ['09-MH', 'M', 'PHO1', 'Provincial Health Officer I', 25],
            ['09-MH', 'M', 'PHO2', 'Provincial Health Officer II', 26],

            // N

            // Nursing
            ['09-MH', 'N', 'MDWF1', 'Midwife I', 9],
            ['09-MH', 'N', 'MDWF2', 'Midwife II', 11],
            ['09-MH', 'N', 'MDWF3', 'Midwife III', 13],
            ['09-MH', 'N', 'MDWF4', 'Midwife IV', 15],
            ['09-MH', 'N', 'MDWF5', 'Midwife V', 17],
            ['09-MH', 'N', 'MDWF6', 'Midwife VI', 19],
            ['09-MH', 'N', 'MWSP1', 'Midwifery School Principal I', 21],
            ['09-MH', 'N', 'MWSP2', 'Midwifery School Principal II', 23],
            ['09-MH', 'N', 'NATT1', 'Nursing Attendant I', 4],
            ['09-MH', 'N', 'NATT2', 'Nursing Attendant II', 6],
            ['09-MH', 'N', 'NURS1', 'Nurse I', 15],
            ['09-MH', 'N', 'NURS2', 'Nurse II', 16],
            ['09-MH', 'N', 'NURS3', 'Nurse III', 17],
            ['09-MH', 'N', 'NURS4', 'Nurse IV', 19],
            ['09-MH', 'N', 'NURS5', 'Nurse V', 20],
            ['09-MH', 'N', 'NURS6', 'Nurse VI', 22],
            ['09-MH', 'N', 'NURS7', 'Nurse VII', 24],
            ['09-MH', 'N', 'NUSP1', 'Nursing School Principal I', 21],
            ['09-MH', 'N', 'NUSP2', 'Nursing School Principal II', 22],
            ['09-MH', 'N', 'NUSP3', 'Nursing School Principal III', 23],
            ['09-MH', 'N', 'WARDA', 'Ward Assistant', 7],

            // OPST

            // Occupational, Physical and Speech Therapy
            ['09-MH', 'OPST', 'OTT1', 'Occupational Therapy Technician I', 6],
            ['09-MH', 'OPST', 'OTT2', 'Occupational Therapy Technician II', 8],
            ['09-MH', 'OPST', 'OT1', 'Occupational Therapist I', 11],
            ['09-MH', 'OPST', 'OT2', 'Occupational Therapist II', 15],
            ['09-MH', 'OPST', 'OT3', 'Occupational Therapist III', 18],
            ['09-MH', 'OPST', 'OT4', 'Occupational Therapist IV', 22],
            ['09-MH', 'OPST', 'PTT1', 'Physical Therapy Technician I', 6],
            ['09-MH', 'OPST', 'PTT2', 'Physical Therapy Technician II', 8],
            ['09-MH', 'OPST', 'PHT1', 'Physical Therapist I', 11],
            ['09-MH', 'OPST', 'PHT2', 'Physical Therapist II', 15],
            ['09-MH', 'OPST', 'PHT3', 'Physical Therapist III', 18],
            ['09-MH', 'OPST', 'PHT4', 'Physical Therapist IV', 22],
            ['09-MH', 'OPST', 'RSTH1', 'Respiratory Therapist I', 10],
            ['09-MH', 'OPST', 'RSTH2', 'Respiratory Therapist II', 14],
            ['09-MH', 'OPST', 'RSTH3', 'Respiratory Therapist III', 17],
            ['09-MH', 'OPST', 'STH1', 'Speech Therapist I', 10],
            ['09-MH', 'OPST', 'STH2', 'Speech Therapist II', 14],

            // O

            // Optometry
            ['09-MH', 'O', 'OPTO1', 'Optometrist I', 12],
            ['09-MH', 'O', 'OPTO2', 'Optometrist II', 16],

            // PC

            // Pest Control
            ['09-MH', 'PC', 'BPCO', 'Building Pest Control Officer', 7],
            ['09-MH', 'PC', 'FUM', 'Fumigator', 4],
            ['09-MH', 'PC', 'FUMF', 'Fumigator Foreman', 6],
            ['09-MH', 'PC', 'FUAS', 'Fumigation Assistant Supervisor', 9],
            ['09-MH', 'PC', 'FUMS', 'Fumigation Supervisor', 11],
            ['09-MH', 'PC', 'MCF', 'Malaria Control Foreman', 7],
            ['09-MH', 'PC', 'PCW1', 'Pest Control Worker I', 4],
            ['09-MH', 'PC', 'PCW2', 'Pest Control Worker II', 6],
            ['09-MH', 'PC', 'PCT', 'Pest Control Technician', 7],
            ['09-MH', 'PC', 'RZI', 'Rodent Zone Inspector', 6],

            // PY

            // Pharmacy
            ['09-MH', 'PY', 'PH1', 'Pharmacist I', 11],
            ['09-MH', 'PY', 'PH2', 'Pharmacist II', 15],
            ['09-MH', 'PY', 'PH3', 'Pharmacist III', 18],
            ['09-MH', 'PY', 'PH4', 'Pharmacist IV', 20],
            ['09-MH', 'PY', 'PH5', 'Pharmacist V', 22],
            ['09-MH', 'PY', 'PH6', 'Pharmacist VI', 24],
            ['09-MH', 'PY', 'PHPS', 'Pharmacy Program Supervisor', 22],
            ['09-MH', 'PY', 'PHA', 'Pharmacy Adviser', 22],

            // V

            // Veterinary
            ['09-MH', 'V', 'AFCO', 'Animal Feed Control Officer', 13],
            ['09-MH', 'V', 'BFPI', 'Biological and Feed Products Inspector', 8],
            ['09-MH', 'V', 'LIVI1', 'Livestock Inspector I', 6],
            ['09-MH', 'V', 'LIVI2', 'Livestock Inspector II', 8],
            ['09-MH', 'V', 'LIVI3', 'Livestock Inspector III', 11],
            ['09-MH', 'V', 'MITI1', 'Meat Inspector I', 6],
            ['09-MH', 'V', 'MITI2', 'Meat Inspector II', 8],
            ['09-MH', 'V', 'MITI3', 'Meat Inspector III', 11],
            ['09-MH', 'V', 'MCO1', 'Meat Control Officer I', 13],
            ['09-MH', 'V', 'MCO2', 'Meat Control Officer II', 16],
            ['09-MH', 'V', 'SRMCO', 'Senior Meat Control Officer', 19],
            ['09-MH', 'V', 'SVMCO', 'Supervising Meat Control Officer', 22],
            ['09-MH', 'V', 'CMCO', 'Chief Meat Control Officer', 24],
            ['09-MH', 'V', 'VET1', 'Veterinarian I', 13],
            ['09-MH', 'V', 'VET2', 'Veterinarian II', 16],
            ['09-MH', 'V', 'VET3', 'Veterinarian III', 19],
            ['09-MH', 'V', 'VET4', 'Veterinarian IV', 22],
            ['09-MH', 'V', 'VETS', 'Veterinarian V', 24],
            ['09-MH', 'V', 'VET6', 'Veterinarian VI', 26],
            ['09-MH', 'V', 'VET7', 'Veterinarian VII', 28],

            // 10-EL - EDUCATION, LIBRARY, MUSEUM AND ARCHIVAL SERVICE

            // ARV

            // Archival
            ['10-EL', 'ARV', 'ARV1', 'Archivist I', 10],
            ['10-EL', 'ARV', 'ARV2', 'Archivist II', 14],
            ['10-EL', 'ARV', 'SRARCH', 'Senior Archivist', 18],
            ['10-EL', 'ARV', 'SVARC', 'Supervising Archivist', 22],
            ['10-EL', 'ARV', 'CART', 'Chief Archivist', 24],

            // CRA

            // Culture and Arts
            ['10-EL', 'CRA', 'SCRAO', 'Culture and Arts Officer III', 18],

            // ERPS

            // Educational Research, Planning and Supervision
            ['10-EL', 'ERPS', 'CEDD1', 'Crafts Education Demonstrator I', 10],
            ['10-EL', 'ERPS', 'CEDD2', 'Crafts Education Demonstrator II', 12],
            ['10-EL', 'ERPS', 'EDRA1', 'Education Research Assistant I', 9],
            ['10-EL', 'ERPS', 'EDRA2', 'Education Research Assistant II', 10],
            ['10-EL', 'ERPS', 'EPS1', 'Education Program Specialist I', 12],
            ['10-EL', 'ERPS', 'EPS2', 'Education Program Specialist II', 16],
            [
                '10-EL',
                'ERPS',
                'SREPS',
                'Senior Education Program Specialist',
                19,
            ],
            [
                '10-EL',
                'ERPS',
                'SVEPS',
                'Supervising Education Program Specialist',
                22,
            ],
            ['10-EL', 'ERPS', 'CEPS', 'Chief Education Program Specialist', 24],
            ['10-EL', 'ERPS', 'ESUP1', 'Education Supervisor I', 19],
            ['10-EL', 'ERPS', 'ESUP2', 'Education Supervisor II', 20],
            ['10-EL', 'ERPS', 'EPSVR', 'Education Program Supervisor', 22],
            ['10-EL', 'ERPS', 'CES', 'Chief Education Supervisor', 24],
            ['10-EL', 'ERPS', 'TEXED', 'Textbook Editor', 11],
            ['10-EL', 'ERPS', 'SFD', 'School Farm Demonstrator', 10],
            ['10-EL', 'ERPS', 'SCE', 'School Credits Evaluator', 11],
            ['10-EL', 'ERPS', 'TAS', 'Teaching-Aids Specialist', 11],
            ['10-EL', 'ERPS', 'TCE1', 'Teacher Credentials Evaluator I', 13],
            ['10-EL', 'ERPS', 'TCE2', 'Teacher Credentials Evaluator II', 15],
            ['10-EL', 'ERPS', 'TCE3', 'Teacher Credentials Evaluator III', 18],
            [
                '10-EL',
                'ERPS',
                'VOCPC1',
                'Vocational Placement Coordinator I',
                13,
            ],
            [
                '10-EL',
                'ERPS',
                'VOCPC2',
                'Vocational Placement Coordinator II',
                15,
            ],
            [
                '10-EL',
                'ERPS',
                'VOCPC3',
                'Vocational Placement Coordinator III',
                18,
            ],
            [
                '10-EL',
                'ERPS',
                'ASST',
                'Assistant Supervisor of Student Teaching',
                15,
            ],
            ['10-EL', 'ERPS', 'SVST', 'Supervisor of Student Teaching', 18],
            [
                '10-EL',
                'ERPS',
                'VOCSDH',
                'Vocational School Department Head',
                20,
            ],

            // GS

            // Guidance Services
            ['10-EL', 'GS', 'GSA1', 'Guidance Services Associate I', 12],
            ['10-EL', 'GS', 'GSA2', 'Guidance Services Associate II', 14],
            ['10-EL', 'GS', 'GSS1', 'Guidance Services Specialist I', 16],
            ['10-EL', 'GS', 'GSS2', 'Guidance Services Specialist II', 18],
            ['10-EL', 'GS', 'GSS3', 'Guidance Services Specialist III', 20],
            ['10-EL', 'GS', 'GSS4', 'Guidance Services Specialist IV', 22],
            ['10-EL', 'GS', 'GSS5', 'Guidance Services Specialist V', 24],

            // HSD

            // Historic Sites Development
            [
                '10-EL',
                'HSD',
                'HISDO1',
                'Historic Sites Development Officer I',
                11,
            ],
            [
                '10-EL',
                'HSD',
                'HISDO2',
                'Historic Sites Development Officer II',
                15,
            ],
            [
                '10-EL',
                'HSD',
                'SRHSDO',
                'Senior Historic Sites Development Officer',
                18,
            ],
            [
                '10-EL',
                'HSD',
                'SVHSDO',
                'Supervising Historic Sites Development Officer',
                22,
            ],
            [
                '10-EL',
                'HSD',
                'CHSDO',
                'Chief Historic Sites Development Officer',
                24,
            ],

            // HR

            // History Research
            ['10-EL', 'HR', 'HTRYR1', 'History Researcher I', 10],
            ['10-EL', 'HR', 'HTRYR2', 'History Researcher II', 14],
            ['10-EL', 'HR', 'SRHR', 'Senior History Researcher', 18],
            ['10-EL', 'HR', 'SVHR', 'Supervising History Researcher', 22],
            ['10-EL', 'HR', 'CHR', 'Chief History Researcher', 24],

            // LRES

            // Language Researcher
            ['10-EL', 'LRES', 'LANRE1', 'Language Researcher I', 10],
            ['10-EL', 'LRES', 'LANRE2', 'Language Researcher II', 14],
            ['10-EL', 'LRES', 'SRLR', 'Senior Language Researcher', 18],
            ['10-EL', 'LRES', 'SVLR', 'Supervising Language Researcher', 22],
            ['10-EL', 'LRES', 'CLR', 'Chief Language Researcher', 24],
            ['10-EL', 'LRES', 'LIN', 'Linguistics Specialist', 23],

            // LIS

            // Library Services
            ['10-EL', 'LIS', 'CL1', 'College Librarian I', 13],
            ['10-EL', 'LIS', 'CL2', 'College Librarian II', 15],
            ['10-EL', 'LIS', 'CL3', 'College Librarian III', 18],
            ['10-EL', 'LIS', 'CL4', 'College Librarian IV', 22],
            ['10-EL', 'LIS', 'CL5', 'College Librarian V', 24],
            ['10-EL', 'LIS', 'SL1', 'School Librarian I', 11],
            ['10-EL', 'LIS', 'SL2', 'School Librarian II', 12],
            ['10-EL', 'LIS', 'SL3', 'School Librarian III', 13],
            ['10-EL', 'LIS', 'LIBA', 'Librarian Aide', 2],
            ['10-EL', 'LIS', 'LIB1', 'Librarian I', 11],
            ['10-EL', 'LIS', 'LIB2', 'Librarian II', 15],
            ['10-EL', 'LIS', 'LIB3', 'Librarian III', 18],
            ['10-EL', 'LIS', 'LIB4', 'Librarian IV', 22],
            ['10-EL', 'LIS', 'LIB5', 'Librarian V', 24],

            // MSC

            // Museum and Shrine Curation
            ['10-EL', 'MSC', 'MUSG', 'Museum Guide', 9],
            ['10-EL', 'MSC', 'MUST1', 'Museum Technician I', 6],
            ['10-EL', 'MSC', 'MUST2', 'Museum Technician II', 8],
            ['10-EL', 'MSC', 'MUSR1', 'Museum Researcher I', 10],
            ['10-EL', 'MSC', 'MUSR2', 'Museum Researcher II', 14],
            ['10-EL', 'MSC', 'SRMR', 'Senior Museum Researcher', 18],
            ['10-EL', 'MSC', 'MUSC1', 'Museum Curator I', 22],
            ['10-EL', 'MSC', 'MUSC2', 'Museum Curator II', 24],
            ['10-EL', 'MSC', 'SHRG', 'Shrine Guide', 6],
            ['10-EL', 'MSC', 'SC1', 'Shrine Curator I', 10],
            ['10-EL', 'MSC', 'SC2', 'Shrine Curator II', 14],
            ['10-EL', 'MSC', 'SRSC', 'Senior Shrine Curator', 18],
            ['10-EL', 'MSC', 'SVSC', 'Supervising Shrine Curator', 22],
            ['10-EL', 'MSC', 'CSC', 'Chief Shrine Curator', 24],

            // STCA

            // School, College, University and Training Center Administration
            ['10-EL', 'STCA', 'ASP1', 'Assistant School Principal I', 18],
            ['10-EL', 'STCA', 'ASP2', 'Assistant School Principal II', 19],
            ['10-EL', 'STCA', 'ASP3', 'Assistant School Principal III', 20],
            ['10-EL', 'STCA', 'SP1', 'School Principal I', 19],
            ['10-EL', 'STCA', 'SP2', 'School Principal II', 20],
            ['10-EL', 'STCA', 'SP3', 'School Principal III', 21],
            ['10-EL', 'STCA', 'SP4', 'School Principal IV', 22],
            ['10-EL', 'STCA', 'ASSP', 'Assistant Special School Principal', 18],
            ['10-EL', 'STCA', 'SPSP1', 'Special School Principal I', 19],
            ['10-EL', 'STCA', 'SPSP2', 'Special School Principal II', 20],
            ['10-EL', 'STCA', 'PSDS', 'Public Schools District Supervisor', 22],
            [
                '10-EL',
                'STCA',
                'ASDS',
                'Assistant Schools Division Superintendent',
                25,
            ],
            ['10-EL', 'STCA', 'SDS', 'Schools Division Superintendent', 26],
            [
                '10-EL',
                'STCA',
                'IPTS',
                'Industrial Project Training Supervisor',
                18,
            ],
            ['10-EL', 'STCA', 'CAD1', 'College Administrator I', 25],
            ['10-EL', 'STCA', 'CAD2', 'College Administrator II', 26],
            ['10-EL', 'STCA', 'CBM1', 'College Business Manager I', 16],
            ['10-EL', 'STCA', 'CBM2', 'College Business Manager II', 19],
            ['10-EL', 'STCA', 'CBM3', 'College Business Manager III', 22],
            ['10-EL', 'STCA', 'CBM4', 'College Business Manager IV', 24],
            ['10-EL', 'STCA', 'ACDH', 'Assistant College Department Head', 17],
            ['10-EL', 'STCA', 'CDH', 'College Department Head', 20],
            ['10-EL', 'STCA', 'R1', 'Registrar I', 11],
            ['10-EL', 'STCA', 'R2', 'Registrar II', 15],
            ['10-EL', 'STCA', 'R3', 'Registrar III', 18],
            ['10-EL', 'STCA', 'R4', 'Registrar IV', 22],
            ['10-EL', 'STCA', 'R5', 'Registrar V', 24],
            ['10-EL', 'STCA', 'SRE1', 'Student Records Evaluator I', 11],
            ['10-EL', 'STCA', 'SRE2', 'Student Records Evaluator II', 15],
            ['10-EL', 'STCA', 'SRE3', 'Student Records Evaluator III', 18],
            ['10-EL', 'STCA', 'SRE4', 'Student Records Evaluator IV', 22],
            [
                '10-EL',
                'STCA',
                'VOCSA1',
                'Vocational School Administrator I',
                22,
            ],
            [
                '10-EL',
                'STCA',
                'VOCSA2',
                'Vocational School Administrator II',
                23,
            ],
            [
                '10-EL',
                'STCA',
                'VOCSA3',
                'Vocational School Administrator III',
                24,
            ],
            ['10-EL', 'STCA', 'VOCSD', 'Vocational School Dean', 24],
            [
                '10-EL',
                'STCA',
                'VOCSS1',
                'Vocational School Superintendent I',
                25,
            ],
            [
                '10-EL',
                'STCA',
                'VOCSS2',
                'Vocational School Superintendent II',
                26,
            ],
            ['10-EL', 'STCA', 'UNISEC1', 'University Secretary I', 28],
            ['10-EL', 'STCA', 'UNISEC2', 'University Secretary II', 29],
            ['10-EL', 'STCA', 'CHL1', 'Chancellor I', 28],
            ['10-EL', 'STCA', 'CHL2', 'Chancellor II', 29],
            ['10-EL', 'STCA', 'CHL3', 'Chancellor III', 30],
            ['10-EL', 'STCA', 'PJATTY1', 'PHIUA Attorney I', 22],
            ['10-EL', 'STCA', 'PJATTY2', 'PHIUA Attorney II', 23],
            ['10-EL', 'STCA', 'PJATTY3', 'PHIUA Attorney III', 24],
            ['10-EL', 'STCA', 'PJATTY4', 'PHIUA Attorney IV', 25],
            ['10-EL', 'STCA', 'PJATTY5', 'PHIUA Attorney V', 26],
            ['10-EL', 'STCA', 'PJPROF1', 'PHIUA Professor I', 29],
            ['10-EL', 'STCA', 'PJPROF2', 'PHIUA Professor II', 30],
            ['10-EL', 'STCA', 'PJDEXS', 'PHIUA Deputy Executive Secretary', 28],
            ['10-EL', 'STCA', 'PJEXS', 'PHIUA Executive Secretary', 29],
            ['10-EL', 'STCA', 'PJVCHL', 'PHIUA Vice-Chancellor', 30],
            ['10-EL', 'STCA', 'PJCHL', 'PHIUA Chancellor', 31],
            ['10-EL', 'STCA', 'SUCVP1', 'SUC Vice-President I', 25],
            ['10-EL', 'STCA', 'SUCVP2', 'SUC Vice-President II', 26],
            ['10-EL', 'STCA', 'SUCVP3', 'SUC Vice-President III', 27],
            ['10-EL', 'STCA', 'SUCVP4', 'SUC Vice-President IV', 28],
            ['10-EL', 'STCA', 'UPVEEP', 'UP Vice-President', 29],
            ['10-EL', 'STCA', 'SUCVP', 'SUC Executive Vice-President', 29],
            ['10-EL', 'STCA', 'UPXVP', 'UP Executive Vice-President', 30],
            ['10-EL', 'STCA', 'SUCPRES1', 'SUC President I', 27],
            ['10-EL', 'STCA', 'SUCPRES2', 'SUC President II', 28],
            ['10-EL', 'STCA', 'SUCPRES3', 'SUC President III', 29],
            ['10-EL', 'STCA', 'SUCPRES4', 'SUC President IV', 30],
            ['10-EL', 'STCA', 'UPREX', 'UP President', 31],
            ['10-EL', 'STCA', 'TRNCS1', 'Training Center Superintendent I', 22],
            [
                '10-EL',
                'STCA',
                'TRNCS2',
                'Training Center Superintendent II',
                24,
            ],

            // SCUT

            // School/ College and University Teaching
            ['10-EL', 'SCUT', 'GUIDC1', 'Guidance Counselor I', 11],
            ['10-EL', 'SCUT', 'GUIDC2', 'Guidance Counselor II', 12],
            ['10-EL', 'SCUT', 'GUIDC3', 'Guidance Counselor III', 13],
            ['10-EL', 'SCUT', 'GCOOR1', 'Guidance Coordinator I', 14],
            ['10-EL', 'SCUT', 'GCOOR2', 'Guidance Coordinator II', 15],
            ['10-EL', 'SCUT', 'GCOOR3', 'Guidance Coordinator III', 16],
            ['10-EL', 'SCUT', 'TCH1', 'Teacher I', 11],
            ['10-EL', 'SCUT', 'TCH2', 'Teacher II', 12],
            ['10-EL', 'SCUT', 'TCH3', 'Teacher III', 13],
            ['10-EL', 'SCUT', 'HTEACH1', 'Head Teacher I', 14],
            ['10-EL', 'SCUT', 'HTEACH2', 'Head Teacher II', 15],
            ['10-EL', 'SCUT', 'HTEACH3', 'Head Teacher III', 16],
            ['10-EL', 'SCUT', 'HTEACH4', 'Head Teacher IV', 17],
            ['10-EL', 'SCUT', 'HTEACH5', 'Head Teacher V', 18],
            ['10-EL', 'SCUT', 'HTEACH6', 'Head Teacher VI', 19],
            ['10-EL', 'SCUT', 'MTCHR1', 'Master Teacher I', 18],
            ['10-EL', 'SCUT', 'MTCHR2', 'Master Teacher II', 19],
            ['10-EL', 'SCUT', 'MTCHR3', 'Master Teacher III', 20],
            ['10-EL', 'SCUT', 'MTCHR4', 'Master Teacher IV', 21],
            ['10-EL', 'SCUT', 'SPET1', 'Special Education Teacher I', 14],
            ['10-EL', 'SCUT', 'SPET2', 'Special Education Teacher II', 15],
            ['10-EL', 'SCUT', 'SPET3', 'Special Education Teacher III', 16],
            ['10-EL', 'SCUT', 'SPET4', 'Special Education Teacher IV', 17],
            ['10-EL', 'SCUT', 'SPET5', 'Special Education Teacher V', 18],
            ['10-EL', 'SCUT', 'SPST1', 'Special Science Teacher I', 13],
            ['10-EL', 'SCUT', 'SPST2', 'Special Science Teacher II', 16],
            ['10-EL', 'SCUT', 'SPST3', 'Special Science Teacher III', 19],
            ['10-EL', 'SCUT', 'SPST4', 'Special Science Teacher IV', 22],
            ['10-EL', 'SCUT', 'SPST5', 'Special Science Teacher V', 24],
            ['10-EL', 'SCUT', 'SFC1', 'School Farming Coordinator I', 13],
            ['10-EL', 'SCUT', 'SFC2', 'School Farming Coordinator II', 14],
            ['10-EL', 'SCUT', 'SFC3', 'School Farming Coordinator III', 15],
            [
                '10-EL',
                'SCUT',
                'VOCIS1',
                'Vocational Instruction Supervisor I',
                16,
            ],
            [
                '10-EL',
                'SCUT',
                'VOCIS2',
                'Vocational Instruction Supervisor II',
                17,
            ],
            [
                '10-EL',
                'SCUT',
                'VOCIS3',
                'Vocational Instruction Supervisor III',
                18,
            ],
            ['10-EL', 'SCUT', 'INST1', 'Instructor I', 12],
            ['10-EL', 'SCUT', 'INST2', 'Instructor II', 13],
            ['10-EL', 'SCUT', 'INST3', 'Instructor III', 14],
            ['10-EL', 'SCUT', 'AP1', 'Assistant Professor I', 15],
            ['10-EL', 'SCUT', 'AP2', 'Assistant Professor II', 16],
            ['10-EL', 'SCUT', 'AP3', 'Assistant Professor III', 17],
            ['10-EL', 'SCUT', 'AP4', 'Assistant Professor IV', 18],
            ['10-EL', 'SCUT', 'APRO1', 'Associate Professor I', 19],
            ['10-EL', 'SCUT', 'APRO2', 'Associate Professor II', 20],
            ['10-EL', 'SCUT', 'APRO3', 'Associate Professor III', 21],
            ['10-EL', 'SCUT', 'APRO4', 'Associate Professor IV', 22],
            ['10-EL', 'SCUT', 'APRO5', 'Associate Professor V', 23],
            ['10-EL', 'SCUT', 'PROF1', 'Professor I', 24],
            ['10-EL', 'SCUT', 'PROF2', 'Professor II', 25],
            ['10-EL', 'SCUT', 'PROF3', 'Professor III', 26],
            ['10-EL', 'SCUT', 'PROF4', 'Professor IV', 27],
            ['10-EL', 'SCUT', 'PROF5', 'Professor V', 28],
            ['10-EL', 'SCUT', 'PROF6', 'Professor VI', 29],
            ['10-EL', 'SCUT', 'CPROF', 'College Professor', 30],
            ['10-EL', 'SCUT', 'UNIPROF', 'University Professor', 30],

            // SES

            // Science Education Services
            ['10-EL', 'SES', 'SEA1', 'Science Education Associate I', 12],
            ['10-EL', 'SES', 'SEA2', 'Science Education Associate II', 14],
            ['10-EL', 'SES', 'SES1', 'Science Education Specialist I', 16],
            ['10-EL', 'SES', 'SES2', 'Science Education Specialist II', 18],
            ['10-EL', 'SES', 'SES3', 'Science Education Specialist III', 20],
            ['10-EL', 'SES', 'SES4', 'Science Education Specialist IV', 22],
            ['10-EL', 'SES', 'SES5', 'Science Education Specialist V', 24],

            // SPT

            // Specialized Training
            ['10-EL', 'SPT', 'TRNA', 'Training Assistant', 8],
            ['10-EL', 'SPT', 'TRNSP1', 'Training Specialist I', 11],
            ['10-EL', 'SPT', 'TRNSP2', 'Training Specialist II', 15],
            ['10-EL', 'SPT', 'TRNSP3', 'Training Specialist III', 18],
            ['10-EL', 'SPT', 'TRNSP4', 'Training Specialist IV', 22],
            ['10-EL', 'SPT', 'TRNSP5', 'Training Specialist V', 24],

            // TE

            // Technician Education
            ['10-EL', 'TE', 'TES1', 'Technician Education Specialist I', 11],
            ['10-EL', 'TE', 'TES2', 'Technician Education Specialist II', 15],
            ['10-EL', 'TE', 'TES3', 'Technician Education Specialist III', 18],
            ['10-EL', 'TE', 'TES4', 'Technician Education Specialist IV', 22],
            ['10-EL', 'TE', 'TES5', 'Technician Education Specialist V', 24],

            // UES

            // University Extension Services
            ['10-EL', 'UES', 'UEXA1', 'University Extension Associate I', 12],
            ['10-EL', 'UES', 'UEXA2', 'University Extension Associate II', 14],
            ['10-EL', 'UES', 'UEXSP1', 'University Extension Specialist I', 16],
            [
                '10-EL',
                'UES',
                'UEXSP2',
                'University Extension Specialist II',
                18,
            ],
            [
                '10-EL',
                'UES',
                'UEXSP3',
                'University Extension Specialist III',
                20,
            ],
            [
                '10-EL',
                'UES',
                'UEXSP4',
                'University Extension Specialist IV',
                22,
            ],
            ['10-EL', 'UES', 'UEXSP5', 'University Extension Specialist V', 24],

            // URS

            // University Research Services
            ['10-EL', 'URS', 'UNIRA1', 'University Research Associate I', 12],
            ['10-EL', 'URS', 'UNIRA2', 'University Research Associate II', 14],
            ['10-EL', 'URS', 'UNIR1', 'University Researcher I', 16],
            ['10-EL', 'URS', 'UNIR2', 'University Researcher II', 18],
            ['10-EL', 'URS', 'UNIR3', 'University Researcher III', 20],
            ['10-EL', 'URS', 'UNIR4', 'University Researcher IV', 22],
            ['10-EL', 'URS', 'UNIR5', 'University Researcher V', 24],

            // 11-AA - AGRARIAN, AGRICULTURAL AND ENVIRONMENT RESOURCES SERVICE

            // AGR

            // Agrarian
            [
                '11-AA',
                'AGR',
                'ARPT',
                'Agrarian Reform Program Technologist',
                10,
            ],
            [
                '11-AA',
                'AGR',
                'SARPT',
                'Senior Agrarian Reform Program Technologist',
                14,
            ],
            ['11-AA', 'AGR', 'ARPO1', 'Agrarian Reform Program Officer I', 11],
            ['11-AA', 'AGR', 'ARPO2', 'Agrarian Reform Program Officer II', 15],
            [
                '11-AA',
                'AGR',
                'SARPO',
                'Senior Agrarian Reform Program Officer',
                18,
            ],
            [
                '11-AA',
                'AGR',
                'SVARPO',
                'Supervising Agrarian Reform Program Officer',
                22,
            ],
            [
                '11-AA',
                'AGR',
                'CARPO',
                'Chief Agrarian Reform Program Officer',
                24,
            ],
            [
                '11-AA',
                'AGR',
                'MARPO',
                'Municipal Agrarian Reform Program Officer',
                20,
            ],
            [
                '11-AA',
                'AGR',
                'PARPO1',
                'Provincial Agrarian Reform Program Officer I',
                25,
            ],
            [
                '11-AA',
                'AGR',
                'PARPO2',
                'Provincial Agrarian Reform Program Officer II',
                26,
            ],
            [
                '11-AA',
                'AGR',
                'PARAD',
                'Provincial Agrarian Reform Adjudicator',
                27,
            ],
            [
                '11-AA',
                'AGR',
                'RARAD',
                'Regional Agrarian Reform Adjudicator',
                28,
            ],

            // AGD

            // Agricultural Development
            ['11-AA', 'AGD', 'AG1', 'Agriculturist I', 11],
            ['11-AA', 'AGD', 'AG2', 'Agriculturist II', 15],
            ['11-AA', 'AGD', 'SRAG', 'Senior Agriculturist', 18],
            ['11-AA', 'AGD', 'SVAG', 'Supervising Agriculturist', 22],
            ['11-AA', 'AGD', 'CAGR', 'Chief Agriculturist', 24],
            ['11-AA', 'AGD', 'ACC1', 'Agricultural Center Chief I', 18],
            ['11-AA', 'AGD', 'ACC2', 'Agricultural Center Chief II', 20],
            ['11-AA', 'AGD', 'ACC3', 'Agricultural Center Chief III', 22],
            ['11-AA', 'AGD', 'ACC4', 'Agricultural Center Chief IV', 24],
            ['11-AA', 'AGD', 'API1', 'Agricultural Products Inspector I', 6],
            ['11-AA', 'AGD', 'API2', 'Agricultural Products Inspector II', 8],
            ['11-AA', 'AGD', 'API3', 'Agricultural Products Inspector III', 11],
            ['11-AA', 'AGD', 'AGT1', 'Agricultural Technician I', 6],
            ['11-AA', 'AGD', 'AGT2', 'Agricultural Technician II', 8],
            ['11-AA', 'AGD', 'AGTG', 'Agricultural Technologist', 10],
            ['11-AA', 'AGD', 'FAWK1', 'Farm Worker I', 2],
            ['11-AA', 'AGD', 'FAWK2', 'Farm Worker II', 4],
            ['11-AA', 'AGD', 'FAFM', 'Farm Foreman', 6],
            ['11-AA', 'AGD', 'FASU', 'Farm Supervisor', 8],
            ['11-AA', 'AGD', 'FAS1', 'Farm Superintendent I', 11],
            ['11-AA', 'AGD', 'FAS2', 'Farm Superintendent II', 15],
            ['11-AA', 'AGD', 'FAS3', 'Farm Superintendent III', 18],
            ['11-AA', 'AGD', 'DPS', 'Dairy Plant Superintendent', 15],
            ['11-AA', 'AGD', 'MAGO', 'Municipal Agricultural Officer', 20],
            ['11-AA', 'AGD', 'PAO', 'Provincial Agricultural Officer', 26],

            // AQD

            // Aquacultural Developmen
            ['11-AA', 'AQD', 'AQT1', 'Aquacultural Technician I', 6],
            ['11-AA', 'AQD', 'AQT2', 'Aquacultural Technician II', 8],
            ['11-AA', 'AQD', 'AQTG', 'Aquacultural Technologist', 10],
            ['11-AA', 'AQD', 'AQ1', 'Aquaculturist I', 11],
            ['11-AA', 'AQD', 'AQ2', 'Aquaculturist II', 15],
            ['11-AA', 'AQD', 'SRAQ', 'Senior Aquaculturist', 18],
            ['11-AA', 'AQD', 'SVAQ', 'Supervising Aquaculturist', 22],
            ['11-AA', 'AQD', 'CAQT', 'Chief Aquaculturist', 24],
            ['11-AA', 'AQD', 'FISM', 'Fisherman', 3],
            ['11-AA', 'AQD', 'MFISH1', 'Master Fisherman I', 5],
            ['11-AA', 'AQD', 'MFISH2', 'Master Fisherman II', 8],
            ['11-AA', 'AQD', 'FIRO1', 'Fishing Regulations Officer I', 11],
            ['11-AA', 'AQD', 'FIRO2', 'Fishing Regulations Officer II', 15],
            ['11-AA', 'AQD', 'SRFRO', 'Senior Fishing Regulations Officer', 18],
            [
                '11-AA',
                'AQD',
                'SVFRO',
                'Supervising Fishing Regulations Officer',
                22,
            ],
            ['11-AA', 'AQD', 'CFHRO', 'Chief Fishing Regulations Officer', 24],

            // EERM

            // Ecosystems and Environment Management
            [
                '11-AA',
                'EERM',
                'ECOMS1',
                'Ecosystems Management Specialist I',
                11,
            ],
            [
                '11-AA',
                'EERM',
                'ECOMS2',
                'Ecosystems Management Specialist II',
                15,
            ],
            [
                '11-AA',
                'EERM',
                'SREMS',
                'Senior Ecosystems Management Specialist',
                18,
            ],
            [
                '11-AA',
                'EERM',
                'SVEMS',
                'Supervising Ecosystems Management Specialist',
                22,
            ],
            [
                '11-AA',
                'EERM',
                'CECMS',
                'Chief Ecosystems Management Specialist',
                24,
            ],
            ['11-AA', 'EERM', 'EMR', 'Environmental Management Researcher', 9],
            [
                '11-AA',
                'EERM',
                'EMS1',
                'Environmental Management Specialist I',
                11,
            ],
            [
                '11-AA',
                'EERM',
                'EMS2',
                'Environmental Management Specialist II',
                15,
            ],
            [
                '11-AA',
                'EERM',
                'SRENM',
                'Senior Environmental Management Specialist',
                18,
            ],
            [
                '11-AA',
                'EERM',
                'SVENMS',
                'Supervising Environmental Management Specialist',
                22,
            ],
            [
                '11-AA',
                'EERM',
                'CEVNMS',
                'Chief Environmental Management Specialist',
                24,
            ],
            [
                '11-AA',
                'EERM',
                'CENRO',
                'Community Environment and Natural Resources Officer',
                24,
            ],
            [
                '11-AA',
                'EERM',
                'PENRO',
                'Provincial Environment and Natural Resources Officer',
                26,
            ],

            // ER

            // Energy Regulation
            ['11-AA', 'ER', 'ERA', 'Energy Regulation Assistant', 8],
            ['11-AA', 'ER', 'ERO1', 'Energy Regulation Officer I', 11],
            ['11-AA', 'ER', 'ERO2', 'Energy Regulation Officer II', 15],
            ['11-AA', 'ER', 'SRERO', 'Senior Energy Regulation Officer', 18],
            [
                '11-AA',
                'ER',
                'SVRERO',
                'Supervising Energy Regulation Officer',
                22,
            ],
            ['11-AA', 'ER', 'CERO', 'Chief Energy Regulation Officer', 24],

            // FD

            // Fiber Development
            ['11-AA', 'FD', 'FIT', 'Fiber Technician', 6],
            ['11-AA', 'FD', 'FIDO1', 'Fiber Development Officer I', 11],
            ['11-AA', 'FD', 'FIDO2', 'Fiber Development Officer II', 15],
            ['11-AA', 'FD', 'SRFDO', 'Senior Fiber Development Officer', 18],
            [
                '11-AA',
                'FD',
                'SVFDO',
                'Supervising Fiber Development Officer',
                22,
            ],
            ['11-AA', 'FD', 'CFDO', 'Chief Fiber Development Officer', 24],

            // FA

            // Forestry Administration
            ['11-AA', 'FA', 'FORST1', 'Forester I', 11],
            ['11-AA', 'FA', 'FORST2', 'Forester II', 15],
            ['11-AA', 'FA', 'FORST3', 'Forester III', 18],
            ['11-AA', 'FA', 'FORST4', 'Forester IV', 22],
            ['11-AA', 'FA', 'FORST5', 'Forester V', 24],
            ['11-AA', 'FA', 'FMS1', 'Forest Management Specialist I', 11],
            ['11-AA', 'FA', 'FMS2', 'Forest Management Specialist II', 15],
            ['11-AA', 'FA', 'SRFMS', 'Senior Forest Management Specialist', 18],
            [
                '11-AA',
                'FA',
                'SVFMS',
                'Supervising Forest Management Specialist',
                22,
            ],
            ['11-AA', 'FA', 'CFMOS', 'Chief Forest Management Specialist', 24],
            ['11-AA', 'FA', 'FORT1', 'Forest Technician I', 6],
            ['11-AA', 'FA', 'FORT2', 'Forest Technician II', 8],
            ['11-AA', 'FA', 'TMRK', 'Tree Marker', 2],
            ['11-AA', 'FA', 'FORA', 'Forest Ranger', 4],
            ['11-AA', 'FA', 'LUMBG', 'Lumber Grader', 5],
            ['11-AA', 'FA', 'SC', 'Scaler', 5],

            // LM

            // Land Management
            ['11-AA', 'LM', 'LAMI', 'Land Management Inspector', 6],
            ['11-AA', 'LM', 'LAME', 'Land Management Examiner', 10],
            ['11-AA', 'LM', 'LAMO1', 'Land Management Officer I', 11],
            ['11-AA', 'LM', 'LAMO2', 'Land Management Officer II', 15],
            ['11-AA', 'LM', 'LAMO3', 'Land Management Officer III', 18],
            ['11-AA', 'LM', 'LAMO4', 'Land Management Officer IV', 22],
            ['11-AA', 'LM', 'LAMO5', 'Land Management Officer V', 24],

            // LREG

            // Land Registration
            [
                '11-AA',
                'LREG',
                'ALRE',
                'Assistant Land Registration Examiner',
                7,
            ],
            ['11-AA', 'LREG', 'LARE1', 'Land Registration Examiner I', 10],
            ['11-AA', 'LREG', 'LARE2', 'Land Registration Examiner II', 14],
            ['11-AA', 'LREG', 'DRI1', 'Deeds Registry Inspector I', 16],
            ['11-AA', 'LREG', 'DRI2', 'Deeds Registry Inspector II', 18],
            ['11-AA', 'LREG', 'DRI3', 'Deeds Registry Inspector III', 21],
            ['11-AA', 'LREG', 'DRI4', 'Deeds Registry Inspector IV', 23],
            ['11-AA', 'LREG', 'DRI5', 'Deeds Registry Inspector V', 25],
            ['11-AA', 'LREG', 'DRD1', 'Deputy Register of Deeds I', 19],
            ['11-AA', 'LREG', 'DRD2', 'Deputy Register of Deeds II', 21],
            ['11-AA', 'LREG', 'DRD3', 'Deputy Register of Deeds III', 23],
            ['11-AA', 'LREG', 'DRD4', 'Deputy Register of Deeds IV', 25],
            ['11-AA', 'LREG', 'RD1', 'Register of Deeds I', 21],
            ['11-AA', 'LREG', 'RD2', 'Register of Deeds II', 23],
            ['11-AA', 'LREG', 'RD3', 'Register of Deeds III', 25],
            ['11-AA', 'LREG', 'RD4', 'Register of Deeds IV', 27],

            // MCE

            // Mining Claims Examination
            ['11-AA', 'MCE', 'AMCE', 'Assistant Mining Claims Examiner', 7],
            ['11-AA', 'MCE', 'MINC1', 'Mining Claims Examiner I', 10],
            ['11-AA', 'MCE', 'MINC2', 'Mining Claims Examiner II', 14],
            ['11-AA', 'MCE', 'MINC3', 'Mining Claims Examiner III', 18],

            // RST

            // Remote Sensing Technology
            [
                '11-AA',
                'RST',
                'ARST',
                'Assistant Remote Sensing Technologist',
                8,
            ],
            ['11-AA', 'RST', 'RST1', 'Remote Sensing Technologist I', 11],
            ['11-AA', 'RST', 'RST2', 'Remote Sensing Technologist II', 15],
            ['11-AA', 'RST', 'SRST', 'Senior Remote Sensing Technologist', 18],
            [
                '11-AA',
                'RST',
                'SVRST',
                'Supervising Remote Sensing Technologist',
                22,
            ],
            ['11-AA', 'RST', 'CRST', 'Chief Remote Sensing Technologist', 24],

            // 12-TT - TRADE, TOURISM AND INDUSTRY SERVICE

            // CD

            // Cooperatives Development
            [
                '12-TT',
                'CD',
                'CODES1',
                'Cooperatives Development Specialist I',
                11,
            ],
            [
                '12-TT',
                'CD',
                'CODES2',
                'Cooperatives Development Specialist II',
                15,
            ],
            [
                '12-TT',
                'CD',
                'SRCDS',
                'Senior Cooperatives Development Specialist',
                18,
            ],
            [
                '12-TT',
                'CD',
                'SVCDS',
                'Supervising Cooperatives Development Specialist',
                22,
            ],
            [
                '12-TT',
                'CD',
                'CCDS',
                'Chief Cooperatives Development Specialist',
                24,
            ],

            // FPM

            // Fish Port Management
            ['12-TT', 'FPM', 'FPSUP', 'Fish Port Supervisor', 15],

            // IA

            // Investment Analysis
            ['12-TT', 'IA', 'IMENTA', 'Investments Analyst', 11],
            ['12-TT', 'IA', 'IMENTS', 'Investments Specialist', 15],
            ['12-TT', 'IA', 'SRIWS', 'Senior Investments Specialist', 18],
            ['12-TT', 'IA', 'SVINS', 'Supervising Investments Specialist', 22],
            ['12-TT', 'IA', 'CINS', 'Chief Investments Specialist', 24],

            // IR

            // Insurance Regulation
            ['12-TT', 'IR', 'AR', 'Actuarial Researcher', 9],
            ['12-TT', 'IR', 'INS1', 'Insurance Specialist I', 11],
            ['12-TT', 'IR', 'INS2', 'Insurance Specialist II', 15],
            ['12-TT', 'IR', 'SRIS', 'Senior Insurance Specialist', 18],
            ['12-TT', 'IR', 'SVIS', 'Supervising Insurance Specialist', 22],
            ['12-TT', 'IR', 'CIS', 'Chief Insurance Specialist', 24],

            // MOR

            // Market Operations and Research
            ['12-TT', 'MOR', 'MKTI1', 'Market Inspector I', 6],
            ['12-TT', 'MOR', 'MKTI2', 'Market Inspector II', 8],
            ['12-TT', 'MOR', 'MKTS1', 'Market Specialist I', 11],
            ['12-TT', 'MOR', 'MKTS2', 'Market Specialist II', 15],
            ['12-TT', 'MOR', 'MKTS3', 'Market Specialist III', 18],
            ['12-TT', 'MOR', 'MKTS4', 'Market Specialist IV', 22],
            ['12-TT', 'MOR', 'MKTS5', 'Market Specialist V', 24],
            ['12-TT', 'MOR', 'MSUP1', 'Market Supervisor I', 10],
            ['12-TT', 'MOR', 'MSUP2', 'Market Supervisor II', 14],
            ['12-TT', 'MOR', 'MSUP3', 'Market Supervisor III', 18],
            ['12-TT', 'MOR', 'MSUP4', 'Market Supervisor IV', 22],
            ['12-TT', 'MOR', 'MSUP5', 'Market Supervisor V', 24],
            ['12-TT', 'MOR', 'SHM1', 'Slaughterhouse Master I', 10],
            ['12-TT', 'MOR', 'SHM2', 'Slaughterhouse Master II', 14],
            ['12-TT', 'MOR', 'SHM3', 'Slaughterhouse Master III', 18],
            ['12-TT', 'MOR', 'SHM4', 'Slaughterhouse Master IV', 22],
            ['12-TT', 'MOR', 'SHS', 'Slaughterhouse Superintendent', 15],

            // PTCE

            // Patent, Trademark and Copyright Examination
            ['12-TT', 'PTCE', 'CPYE', 'Copyright Examiner', 11],
            [
                '12-TT',
                'PTCE',
                'IPRS1',
                'Intellectual Property Rights Specialist I',
                14,
            ],
            [
                '12-TT',
                'PTCE',
                'IPRS2',
                'Intellectual Property Rights Specialist II',
                17,
            ],
            [
                '12-TT',
                'PTCE',
                'IPRS3',
                'Intellectual Property Rights Specialist III',
                20,
            ],
            [
                '12-TT',
                'PTCE',
                'IPRS4',
                'Intellectual Property Rights Specialist IV',
                23,
            ],
            [
                '12-TT',
                'PTCE',
                'IPRS5',
                'Intellectual Property Rights Specialist V',
                25,
            ],

            // SPR

            // Sales Promotion
            ['12-TT', 'SPR', 'AVO1', 'Advertising Officer I', 10],
            ['12-TT', 'SPR', 'AVO2', 'Advertising Officer II', 14],
            ['12-TT', 'SPR', 'AVO3', 'Advertising Officer III', 18],
            ['12-TT', 'SPR', 'AVO4', 'Advertising Officer IV', 20],
            ['12-TT', 'SPR', 'SPS1', 'Sales and Promotion Supervisor I', 10],
            ['12-TT', 'SPR', 'SPS2', 'Sales and Promotion Supervisor II', 14],
            ['12-TT', 'SPR', 'SPS3', 'Sales and Promotion Supervisor III', 18],
            ['12-TT', 'SPR', 'SPS4', 'Sales and Promotion Supervisor IV', 22],
            ['12-TT', 'SPR', 'SPSS', 'Sales and Promotion Supervisor V', 24],
            ['12-TT', 'SPR', 'SR1', 'Sales Representative I', 6],
            ['12-TT', 'SPR', 'SR2', 'Sales Representative II', 8],
            ['12-TT', 'SPR', 'SR3', 'Sales Representative III', 10],
            ['12-TT', 'SPR', 'SR4', 'Sales Representative IV', 14],

            // SER

            // Securities and Exchange Regulation
            ['12-TT', 'SER', 'SECA', 'Securities and Exchange Analyst', 11],
            [
                '12-TT',
                'SER',
                'SECS1',
                'Securities and Exchange Specialist I',
                13,
            ],
            [
                '12-TT',
                'SER',
                'SECS2',
                'Securities and Exchange Specialist II',
                16,
            ],
            [
                '12-TT',
                'SER',
                'SRSECS',
                'Senior Securities and Exchange Specialist',
                19,
            ],
            [
                '12-TT',
                'SER',
                'SVSECS',
                'Supervising Securities and Exchange Specialist',
                22,
            ],
            [
                '12-TT',
                'SER',
                'CSES',
                'Chief Securities and Exchange Specialist',
                24,
            ],

            // TO

            // Tourism Operations
            ['12-TT', 'TO', 'TR1', 'Tourist Receptionist I', 8],
            ['12-TT', 'TO', 'TR2', 'Tourist Receptionist II', 10],
            ['12-TT', 'TO', 'TR3', 'Tourist Receptionist III', 13],
            ['12-TT', 'TO', 'TOA', 'Tourism Operations Assistant', 7],
            ['12-TT', 'TO', 'TOO1', 'Tourism Operations Officer I', 11],
            ['12-TT', 'TO', 'TOO2', 'Tourism Operations Officer II', 15],
            ['12-TT', 'TO', 'SRTOO', 'Senior Tourism Operations Officer', 18],
            [
                '12-TT',
                'TO',
                'SVTOO',
                'Supervising Tourism Operations Officer',
                22,
            ],
            ['12-TT', 'TO', 'CTOO', 'Chief Tourism Operations Officer', 24],

            // TIDR

            // Trade, Industry Development and Regulation
            ['12-TT', 'TIDR', 'TRCE1', 'Trade Control Examiner I', 11],
            ['12-TT', 'TIDR', 'TRCE2', 'Trade Control Examiner II', 15],
            ['12-TT', 'TIDR', 'TRCE3', 'Trade Control Examiner III', 18],
            [
                '12-TT',
                'TIDR',
                'TRIDA',
                'Trade-Industry Development Analyst',
                11,
            ],
            [
                '12-TT',
                'TIDR',
                'TRIDS',
                'Trade-Industry Development Specialist',
                15,
            ],
            [
                '12-TT',
                'TIDR',
                'SRTIDS',
                'Senior Trade-Industry Development Specialist',
                18,
            ],
            [
                '12-TT',
                'TIDR',
                'SVTIDS',
                'Supervising Trade-Industry Development Specialist',
                22,
            ],
            [
                '12-TT',
                'TIDR',
                'CTIDS',
                'Chief Trade-Industry Development Specialist',
                24,
            ],
            [
                '12-TT',
                'TIDR',
                'PTIO',
                'Provincial Trade and Industry Officer',
                26,
            ],
            ['12-TT', 'TIDR', 'TRCOM', 'Trade Commissioner', 29],

            // 13-MP - MATHEMATICS, PHYSICAL AND BIOLOGICAL SCIENCES SERVICE

            // BT

            // Bacteriology
            ['13-MP', 'BT', 'BARL1', 'Bacteriologist I', 11],
            ['13-MP', 'BT', 'BARL2', 'Bacteriologist II', 15],
            ['13-MP', 'BT', 'BARL3', 'Bacteriologist III', 18],
            ['13-MP', 'BT', 'BARL4', 'Bacteriologist IV', 22],
            ['13-MP', 'BT', 'BARL5', 'Bacteriologist V', 24],
            ['13-MP', 'BT', 'VIRO', 'Virologist', 11],

            // BL

            // BIOLOGY
            ['13-MP', 'BL', 'BIO1', 'Biologist I', 11],
            ['13-MP', 'BL', 'BIO2', 'Biologist II', 15],
            ['13-MP', 'BL', 'BIO3', 'Biologist III', 18],
            ['13-MP', 'BL', 'BOTA', 'Botanist', 11],
            ['13-MP', 'BL', 'EIROM', 'Electron Microscopist', 19],

            // C

            // Chemistry
            ['13-MP', 'C', 'CMT1', 'Chemist I', 11],
            ['13-MP', 'C', 'CMT2', 'Chemist II', 15],
            ['13-MP', 'C', 'CMT3', 'Chemist III', 18],
            ['13-MP', 'C', 'CMT4', 'Chemist IV', 22],
            ['13-MP', 'C', 'CMT5', 'Chemist V', 24],
            ['13-MP', 'C', 'TOX1', 'Toxicologist I', 11],
            ['13-MP', 'C', 'TOX2', 'Toxicologist II', 15],
            ['13-MP', 'C', 'TOX3', 'Toxicologist III', 18],

            // G

            // Geology
            ['13-MP', 'G', 'GEOLA', 'Geologic Aide', 4],
            ['13-MP', 'G', 'GEOL1', 'Geologist I', 11],
            ['13-MP', 'G', 'GEOL2', 'Geologist II', 15],
            ['13-MP', 'G', 'SRGEO', 'Senior Geologist', 18],
            ['13-MP', 'G', 'SVGEO', 'Supervising Geologist', 22],
            ['13-MP', 'G', 'CG', 'Chief Geologist', 24],
            ['13-MP', 'G', 'MINA', 'Mineral Analyst', 11],

            // GP

            // Geophysics
            ['13-MP', 'GP', 'GEOP1', 'Geophysicist I', 11],
            ['13-MP', 'GP', 'GEOP2', 'Geophysicist II', 15],
            ['13-MP', 'GP', 'GEOP3', 'Geophysicist III', 18],
            ['13-MP', 'GP', 'GEOP4', 'Geophysicist IV', 22],
            ['13-MP', 'GP', 'GEOP5', 'Geophysicist V', 24],

            // MM

            // Mathematics
            ['13-MP', 'MM', 'MTHA1', 'Mathematician Aide I', 6],
            ['13-MP', 'MM', 'MTHA2', 'Mathematician Aide II', 8],
            ['13-MP', 'MM', 'MTH1', 'Mathematician I', 10],
            ['13-MP', 'MM', 'MTH2', 'Mathematician II', 14],

            // ML

            // Metallurgy
            ['13-MP', 'ML', 'MTEK1', 'Metals Technologist I', 6],
            ['13-MP', 'ML', 'MTEK2', 'Metals Technologist II', 8],
            ['13-MP', 'ML', 'MTEK3', 'Metals Technologist III', 10],
            ['13-MP', 'ML', 'MTEK4', 'Metals Technologist IV', 12],
            ['13-MP', 'ML', 'MTEK5', 'Metals Technologist V', 14],
            ['13-MP', 'ML', 'MTLL1', 'Metallurgist I', 11],
            ['13-MP', 'ML', 'MTLL2', 'Metallurgist II', 15],
            ['13-MP', 'ML', 'SRMET', 'Senior Metallurgist', 18],
            ['13-MP', 'ML', 'SVM', 'Supervising Metallurgist', 22],
            ['13-MP', 'ML', 'CM', 'Chief Metallurgist', 24],
            ['13-MP', 'ML', 'MOO', 'Mining Operations Officer', 24],

            // OC

            // Oceanography
            ['13-MP', 'OC', 'O1', 'Oceanographer I', 11],
            ['13-MP', 'OC', 'O2', 'Oceanographer II', 15],
            ['13-MP', 'OC', 'O3', 'Oceanographer III', 18],
            ['13-MP', 'OC', 'O4', 'Oceanographer IV', 22],
            ['13-MP', 'OC', 'O5', 'Oceanographer V', 24],

            // P

            // Physics
            ['13-MP', 'P', 'HPT', 'Health Physics Technician', 6],
            ['13-MP', 'P', 'HPHY1', 'Health Physicist I', 15],
            ['13-MP', 'P', 'HPHY2', 'Health Physicist II', 18],
            ['13-MP', 'P', 'HPHY3', 'Health Physicist III', 22],
            ['13-MP', 'P', 'HPHY4', 'Health Physicist IV', 24],
            ['13-MP', 'P', 'PHY1', 'Physicist I', 11],
            ['13-MP', 'P', 'PHY2', 'Physicist II', 15],

            // SD

            // Science Development
            [
                '13-MP',
                'SD',
                'ISRO1',
                'International Science Relations Officer I',
                10,
            ],
            [
                '13-MP',
                'SD',
                'ISRO2',
                'International Science Relations Officer II',
                14,
            ],
            [
                '13-MP',
                'SD',
                'ISRO3',
                'International Science Relations Officer III',
                18,
            ],
            [
                '13-MP',
                'SD',
                'ISRO4',
                'International Science Relations Officer IV',
                22,
            ],
            [
                '13-MP',
                'SD',
                'ISRO5',
                'International Science Relations Officer V',
                24,
            ],
            ['13-MP', 'SD', 'SCA', 'Science Aide', 4],
            ['13-MP', 'SD', 'SRAS', 'Science Research Assistant', 9],
            ['13-MP', 'SD', 'SRAN', 'Science Research Analyst', 11],
            ['13-MP', 'SD', 'SRAS1', 'Science Research Specialist I', 13],
            ['13-MP', 'SD', 'SRAS2', 'Science Research Specialist II', 16],
            ['13-MP', 'SD', 'SRSRS', 'Senior Science Research Specialist', 19],
            [
                '13-MP',
                'SD',
                'SVSRS',
                'Supervising Science Research Specialist',
                22,
            ],
            ['13-MP', 'SD', 'CSRS', 'Chief Science Research Specialist', 24],
            ['13-MP', 'SD', 'SRT1', 'Science Research Technician I', 9],
            ['13-MP', 'SD', 'SRT2', 'Science Research Technician II', 11],
            ['13-MP', 'SD', 'SRT3', 'Science Research Technician III', 13],
            ['13-MP', 'SD', 'SRT4', 'Science Research Technician IV', 16],
            ['13-MP', 'SD', 'SDO1', 'Science Documentation Officer I', 10],
            ['13-MP', 'SD', 'SDO2', 'Science Documentation Officer II', 14],
            ['13-MP', 'SD', 'SDO3', 'Science Documentation Officer III', 18],
            ['13-MP', 'SD', 'SDO4', 'Science Documentation Officer IV', 22],
            ['13-MP', 'SD', 'SDO5', 'Science Documentation Officer V', 24],
            ['13-MP', 'SD', 'ATSCIEN', 'Assistant Scientist', 24],
            ['13-MP', 'SD', 'ASSCIEN', 'Associate Scientist', 25],
            ['13-MP', 'SD', 'SCIEN1', 'Scientist I', 26],
            ['13-MP', 'SD', 'SCIEN2', 'Scientist II', 27],
            ['13-MP', 'SD', 'SCIEN3', 'Scientist III', 28],
            ['13-MP', 'SD', 'SCIEN4', 'Scientist IV', 29],
            ['13-MP', 'SD', 'SCIEN5', 'Scientist V', 30],

            // WO

            // Weather Observation
            ['13-MP', 'WO', 'WOA', 'Weather Observation Aide', 4],
            ['13-MP', 'WO', 'WOB1', 'Weather Observer I', 9],
            ['13-MP', 'WO', 'WOB2', 'Weather Observer II', 11],
            ['13-MP', 'WO', 'WOB3', 'Weather Observer III', 13],
            ['13-MP', 'WO', 'WOB4', 'Weather Observer IV', 15],
            ['13-MP', 'WO', 'WFT1', 'Weather Facilities Technician I', 9],
            ['13-MP', 'WO', 'WFT2', 'Weather Facilities Technician II', 11],
            ['13-MP', 'WO', 'WFT3', 'Weather Facilities Technician III', 13],
            ['13-MP', 'WO', 'WFS1', 'Weather Facilities Specialist I', 15],
            ['13-MP', 'WO', 'WFS2', 'Weather Facilities Specialist II', 17],
            ['13-MP', 'WO', 'WFS3', 'Weather Facilities Specialist III', 19],
            [
                '13-MP',
                'WO',
                'SVWFS',
                'Supervising Weather Facilities Specialist',
                21,
            ],
            ['13-MP', 'WO', 'WSP1', 'Weather Specialist I', 15],
            ['13-MP', 'WO', 'WSP2', 'Weather Specialist II', 17],
            ['13-MP', 'WO', 'SRWS', 'Senior Weather Specialist', 19],
            ['13-MP', 'WO', 'SVWS', 'Supervising Weather Specialist', 21],
            ['13-MP', 'WO', 'AWSC', 'Assistant Weather Services Chief', 22],
            ['13-MP', 'WO', 'WSCH', 'Weather Services Chief', 24],

            // Z

            // Zoology
            ['13-MP', 'Z', 'AK1', 'Animal Keeper I', 4],
            ['13-MP', 'Z', 'AK2', 'Animal Keeper II', 6],
            ['13-MP', 'Z', 'AK3', 'Animal Keeper III', 9],
            ['13-MP', 'Z', 'ENTO1', 'Entomologist I', 11],
            ['13-MP', 'Z', 'ENTO2', 'Entomologist II', 15],
            ['13-MP', 'Z', 'ENTO3', 'Entomologist III', 18],
            ['13-MP', 'Z', 'MCL1', 'Malacologist I', 11],
            ['13-MP', 'Z', 'MCL2', 'Malacologist II', 15],
            ['13-MP', 'Z', 'ZOOT', 'Zoology Technician', 6],
            ['13-MP', 'Z', 'ZOOL1', 'Zoologist I', 11],
            ['13-MP', 'Z', 'ZOOL2', 'Zoologist II', 15],
            ['13-MP', 'Z', 'ZOOL3', 'Zoologist III', 18],
            ['13-MP', 'Z', 'ZOOL4', 'Zoologist IV', 22],
            ['13-MP', 'Z', 'ZOOL5', 'Zoologist V', 24],

            // 14-DS - DEFENSE AND SECURITY SERVICE

            // CDA

            // Civil Defense Administration
            ['14-DS', 'CDA', 'CDA', 'Civil Defense Assistant', 8],
            ['14-DS', 'CDA', 'CDO1', 'Civil Defense Officer I', 11],
            ['14-DS', 'CDA', 'CDO2', 'Civil Defense Officer II', 15],
            ['14-DS', 'CDA', 'CDO3', 'Civil Defense Officer III', 18],
            ['14-DS', 'CDA', 'CDO4', 'Civil Defense Officer IV', 22],
            ['14-DS', 'CDA', 'CDO5', 'Civil Defense Officer V', 24],

            // CSS

            // Civil Security Services
            ['14-DS', 'CSS', 'BALF1', 'Bailiff I', 5],
            ['14-DS', 'CSS', 'BALF2', 'Bailiff II', 7],
            ['14-DS', 'CSS', 'BALF3', 'Bailiff III', 10],
            ['14-DS', 'CSS', 'CGTK', 'Customs Gatekeeper', 3],
            ['14-DS', 'CSS', 'PRISG1', 'Prison Guard I', 5],
            ['14-DS', 'CSS', 'PRISG2', 'Prison Guard II', 7],
            ['14-DS', 'CSS', 'PRISG3', 'Prison Guard III', 10],
            ['14-DS', 'CSS', 'APW', 'Assistant Provincial Warden', 18],
            ['14-DS', 'CSS', 'PW', 'Provincial Warden', 22],
            ['14-DS', 'CSS', 'PISU', 'Penal Institution Supervisor', 18],
            ['14-DS', 'CSS', 'PIS1', 'Penal Institution Superintendent I', 20],
            ['14-DS', 'CSS', 'PIS2', 'Penal Institution Superintendent II', 22],
            [
                '14-DS',
                'CSS',
                'PIS3',
                'Penal Institution Superintendent III',
                24,
            ],
            ['14-DS', 'CSS', 'PIS4', 'Penal Institution Superintendent IV', 26],
            ['14-DS', 'CSS', 'SECG1', 'Security Guard I', 3],
            ['14-DS', 'CSS', 'SECG2', 'Security Guard II', 5],
            ['14-DS', 'CSS', 'SECG3', 'Security Guard III', 8],
            ['14-DS', 'CSS', 'SECAG1', 'Security Agent I', 8],
            ['14-DS', 'CSS', 'SECAG2', 'Security Agent II', 10],
            ['14-DS', 'CSS', 'SECO1', 'Security Officer I', 11],
            ['14-DS', 'CSS', 'SEC02', 'Security Officer II', 15],
            ['14-DS', 'CSS', 'SECO3', 'Security Officer III', 18],
            ['14-DS', 'CSS', 'SECO4', 'Security Officer IV', 22],
            ['14-DS', 'CSS', 'SECO5', 'Security Officer V', 24],
            ['14-DS', 'CSS', 'SGT1', 'Sergeant-At-Arms I', 24],
            ['14-DS', 'CSS', 'SGT2', 'Sergeant-At-Arms II', 26],
            ['14-DS', 'CSS', 'SGT3', 'Sergeant-At-Arms III', 28],
            ['14-DS', 'CSS', 'SGT4', 'Sergeant-At-Arms IV', 30],
            ['14-DS', 'CSS', 'SHE1', 'Sheriff I', 5],
            ['14-DS', 'CSS', 'SHE2', 'Sheriff II', 7],
            ['14-DS', 'CSS', 'SHE3', 'Sheriff III', 10],
            ['14-DS', 'CSS', 'SHE4', 'Sheriff IV', 12],
            ['14-DS', 'CSS', 'WARD1', 'Wardress I', 5],
            ['14-DS', 'CSS', 'WARD2', 'Wardress II', 7],
            ['14-DS', 'CSS', 'WCHM1', 'Watchman I', 2],
            ['14-DS', 'CSS', 'WCHM2', 'Watchman II', 4],
            ['14-DS', 'CSS', 'WCHM3', 'Watchman III', 7],

            // CI

            // Crime Investigation
            ['14-DS', 'CI', 'BALST1', 'Ballistician I', 10],
            ['14-DS', 'CI', 'BALST2', 'Ballistician II', 14],
            ['14-DS', 'CI', 'BALST3', 'Ballistician III', 18],
            ['14-DS', 'CI', 'BALST4', 'Ballistician IV', 22],
            ['14-DS', 'CI', 'BALST5', 'Ballistician V', 24],
            ['14-DS', 'CI', 'CRIG1', 'Crime Investigator I', 11],
            ['14-DS', 'CI', 'CRIG2', 'Crime Investigator II', 15],
            ['14-DS', 'CI', 'CRIG3', 'Crime Investigator III', 18],
            ['14-DS', 'CI', 'CRIG4', 'Crime Investigator IV', 22],
            ['14-DS', 'CI', 'CRIG5', 'Crime Investigator V', 24],
            ['14-DS', 'CI', 'INVA1', 'Investigation Agent I', 18],
            ['14-DS', 'CI', 'INVA2', 'Investigation Agent II', 20],
            ['14-DS', 'CI', 'INVA3', 'Investigation Agent III', 22],
            ['14-DS', 'CI', 'INVA4', 'Investigation Agent IV', 23],
            ['14-DS', 'CI', 'INVA5', 'Investigation Agent V', 24],
            ['14-DS', 'CI', 'INVA6', 'Investigation Agent VI', 25],
            ['14-DS', 'CI', 'POLEX1', 'Polygraph Examiner I', 10],
            ['14-DS', 'CI', 'POLEX2', 'Polygraph Examiner II', 14],
            ['14-DS', 'CI', 'POLEX3', 'Polygraph Examiner III', 18],
            ['14-DS', 'CI', 'POLEX4', 'Polygraph Examiner IV', 22],
            ['14-DS', 'CI', 'POLEX5', 'Polygraph Examiner V', 24],

            // DR

            // Defense Research
            ['14-DS', 'DR', 'DRO1', 'Defense Research Officer I', 11],
            ['14-DS', 'DR', 'DRO2', 'Defense Research Officer II', 15],
            ['14-DS', 'DR', 'SRDRO', 'Senior Defense Research Officer', 18],
            [
                '14-DS',
                'DR',
                'SVDRO',
                'Supervising Defense Research Officer',
                22,
            ],
            ['14-DS', 'DR', 'CDRO', 'Chief Defense Research Officer', 24],

            // FDE

            // Fingerprint and Document Examination
            ['14-DS', 'FDE', 'CYLY', 'Cryptanalyst', 11],
            ['14-DS', 'FDE', 'DOCEX1', 'Document Examiner I', 10],
            ['14-DS', 'FDE', 'DOCEX2', 'Document Examiner II', 14],
            ['14-DS', 'FDE', 'DOCEX3', 'Document Examiner III', 18],
            ['14-DS', 'FDE', 'DOCEX4', 'Document Examiner IV', 22],
            ['14-DS', 'FDE', 'DOCEX5', 'Document Examiner V', 24],
            ['14-DS', 'FDE', 'IDO1', 'Identification Officer I', 22],
            ['14-DS', 'FDE', 'IDO2', 'Identification Officer II', 24],
            ['14-DS', 'FDE', 'FPTA', 'Fingerprinting Aide', 4],
            ['14-DS', 'FDE', 'FPTEX1', 'Fingerprinting Examiner I', 7],
            ['14-DS', 'FDE', 'FPTEX2', 'Fingerprinting Examiner II', 9],
            ['14-DS', 'FDE', 'FPTEX3', 'Fingerprinting Examiner III', 11],
            ['14-DS', 'FDE', 'FPTEX4', 'Fingerprinting Examiner IV', 15],
            ['14-DS', 'FDE', 'FPTEX5', 'Fingerprinting Examiner V', 18],

            // F

            // Firefighting
            ['14-DS', 'F', 'FF1', 'Firefighter I', 6],
            ['14-DS', 'F', 'FF2', 'Firefighter II', 8],
            ['14-DS', 'F', 'FF3', 'Firefighter III', 10],
            ['14-DS', 'F', 'FF4', 'Firefighter IV', 14],
            ['14-DS', 'F', 'FM1', 'Fire Marshall I', 18],
            ['14-DS', 'F', 'FM2', 'Fire Marshall II', 22],

            // IN

            // Intelligence
            ['14-DS', 'IN', 'IAA', 'Intelligence Agent Aide', 4],
            ['14-DS', 'IN', 'IA1', 'Intelligence Agent I', 8],
            ['14-DS', 'IN', 'IA2', 'Intelligence Agent II', 10],
            ['14-DS', 'IN', 'INTELO1', 'Intelligence Officer I', 11],
            ['14-DS', 'IN', 'INTELO2', 'Intelligence Officer II', 15],
            ['14-DS', 'IN', 'INTELO3', 'Intelligence Officer III', 18],
            ['14-DS', 'IN', 'INTELO4', 'Intelligence Officer IV', 22],
            ['14-DS', 'IN', 'INTELO5', 'Intelligence Officer V', 24],

            // NI

            // National Intelligence
            ['14-DS', 'NI', 'NIA1', 'National Intelligence Assistant I', 8],
            ['14-DS', 'NI', 'NIA2', 'National Intelligence Assistant II', 10],
            ['14-DS', 'NI', 'NIS1', 'National Intelligence Specialist I', 11],
            ['14-DS', 'NI', 'NIS2', 'National Intelligence Specialist II', 15],
            ['14-DS', 'NI', 'NIS3', 'National Intelligence Specialist III', 18],
            ['14-DS', 'NI', 'NIS4', 'National Intelligence Specialist IV', 22],
            ['14-DS', 'NI', 'NIS5', 'National Intelligence Specialist V', 24],

            // NS

            // National Security
            ['14-DS', 'NS', 'NSS1', 'National Security Specialist I', 12],
            ['14-DS', 'NS', 'NSS2', 'National Security Specialist II', 16],
            ['14-DS', 'NS', 'NSS3', 'National Security Specialist III', 19],
            ['14-DS', 'NS', 'NSS4', 'National Security Specialist IV', 22],
            ['14-DS', 'NS', 'NSS5', 'National Security Specialist V', 24],

            // OMRR

            // Ordnance Manufacture, Regulation and Repair
            ['14-DS', 'OMRR', 'AW1', 'Ammunition Worker I', 2],
            ['14-DS', 'OMRR', 'AW2', 'Ammunition Worker II', 4],
            ['14-DS', 'OMRR', 'ARM1', 'Armorer I', 2],
            ['14-DS', 'OMRR', 'ARM2', 'Armorer II', 4],
            ['14-DS', 'OMRR', 'FEI1', 'Firearms and Explosives Inspector I', 6],
            [
                '14-DS',
                'OMRR',
                'FEI2',
                'Firearms and Explosives Inspector II',
                8,
            ],
            ['14-DS', 'OMRR', 'FEP1', 'Firearms and Explosives Processor I', 6],
            [
                '14-DS',
                'OMRR',
                'FEP2',
                'Firearms and Explosives Processor II',
                8,
            ],
            [
                '14-DS',
                'OMRR',
                'FEP3',
                'Firearms and Explosives Processor III',
                10,
            ],
            [
                '14-DS',
                'OMRR',
                'FEP4',
                'Firearms and Explosives Processor IV',
                14,
            ],
            [
                '14-DS',
                'OMRR',
                'FEPC',
                'Firearms and Explosives Production Coordinator',
                18,
            ],
            ['14-DS', 'OMRR', 'MO1', 'Munitions Operator I', 4],
            ['14-DS', 'OMRR', 'MO2', 'Munitions Operator II', 6],
            ['14-DS', 'OMRR', 'MOF', 'Munitions Operator Foreman', 9],
            ['14-DS', 'OMRR', 'MOGF', 'Munitions Operator General Foreman', 11],
            ['14-DS', 'OMRR', 'MUNPT1', 'Munitions Production Technician I', 6],
            [
                '14-DS',
                'OMRR',
                'MUNPT2',
                'Munitions Production Technician II',
                8,
            ],
            ['14-DS', 'OMRR', 'MUNPS', 'Munitions Production Supervisor', 12],
            ['14-DS', 'OMRR', 'ORDT1', 'Ordnance Technician I', 6],
            ['14-DS', 'OMRR', 'ORDT2', 'Ordnance Technician II', 8],
            ['14-DS', 'OMRR', 'ORDT3', 'Ordnance Technician III', 11],

            // PA

            // Police Administration
            [
                '14-DS',
                'PA',
                'LEEO1',
                'Law Enforcement Evaluation Officer I',
                11,
            ],
            [
                '14-DS',
                'PA',
                'LEEO2',
                'Law Enforcement Evaluation Officer II',
                15,
            ],
            [
                '14-DS',
                'PA',
                'LEEO3',
                'Law Enforcement Evaluation Officer III',
                18,
            ],
            [
                '14-DS',
                'PA',
                'LEEO4',
                'Law Enforcement Evaluation Officer IV',
                22,
            ],
            [
                '14-DS',
                'PA',
                'LEEO5',
                'Law Enforcement Evaluation Officer V',
                24,
            ],
            [
                '14-DS',
                'PA',
                'CPRAB',
                'Chairman, Police Regional Appellate Board',
                27,
            ],
            ['14-DS', 'PA', 'POL1', 'Police Inspector I', 11],
            ['14-DS', 'PA', 'POL2', 'Police Inspector II', 15],
            ['14-DS', 'PA', 'POL3', 'Police Inspector III', 18],
            ['14-DS', 'PA', 'POL4', 'Police Inspector IV', 22],
            ['14-DS', 'PA', 'POL5', 'Police Inspector V', 24],

            // SI

            // Special Investigation
            ['14-DS', 'SI', 'SPAG1', 'Special Agent I', 8],
            ['14-DS', 'SI', 'SPAG2', 'Special Agent II', 10],
            ['14-DS', 'SI', 'SPI1', 'Special Investigator I', 11],
            ['14-DS', 'SI', 'SPI2', 'Special Investigator II', 15],
            ['14-DS', 'SI', 'SPI3', 'Special Investigator III', 18],
            ['14-DS', 'SI', 'SPI4', 'Special Investigator IV', 22],
            ['14-DS', 'SI', 'SPI5', 'Special Investigator V', 24],

            // SPS

            // Special Police Service
            ['14-DS', 'SPS', '5PPOL', 'Special Policeman', 4],
            ['14-DS', 'SPS', 'SPC', 'Special Police Corporal', 6],
            ['14-DS', 'SPS', 'SPPSGT', 'Special Police Sergeant', 8],
            ['14-DS', 'SPS', 'SPL', 'Special Police Lieutenant', 11],
            ['14-DS', 'SPS', 'SPPC', 'Special Police Captain', 13],
            ['14-DS', 'SPS', 'SPPN', 'Special Police Major', 15],
            ['14-DS', 'SPS', 'SPATS', 'Sea Patrol Supervisor', 17],
            ['14-DS', 'SPS', 'SPPAS', 'Special Police Area Supervisor', 19],
            ['14-DS', 'SPS', 'SPPAC', 'Special Police Assistant Chief', 22],
            ['14-DS', 'SPS', 'SPPCH', 'Special Police Chief', 24],

            // TRO

            // Traffic Operations
            ['14-DS', 'TRO', 'TRFA1', 'Traffic Aide I', 3],
            ['14-DS', 'TRO', 'TRFA2', 'Traffic Aide II', 5],
            ['14-DS', 'TRO', 'TRFA3', 'Traffic Aide III', 7],
            ['14-DS', 'TRO', 'ATOO', 'Assistant Traffic Operations Officer', 8],
            ['14-DS', 'TRO', 'TRFOO1', 'Traffic Operations Officer I', 11],
            ['14-DS', 'TRO', 'TRFOO2', 'Traffic Operations Officer II', 15],
            ['14-DS', 'TRO', 'TRFOO3', 'Traffic Operations Officer III', 18],
            ['14-DS', 'TRO', 'TRFOO4', 'Traffic Operations Officer IV', 22],
            ['14-DS', 'TRO', 'TRFOO5', 'Traffic Operations Officer V', 24],

            // 15-U - LEGAL AND JUDICIAL SERVICE

            // ATTY

            // Attorneys
            ['15-U', 'ATTY', 'ATY1', 'Attorney I', 16],
            ['15-U', 'ATTY', 'ATY2', 'Attorney II', 18],
            ['15-U', 'ATTY', 'ATY3', 'Attorney III', 21],
            ['15-U', 'ATTY', 'ATY4', 'Attorney IV', 23],
            ['15-U', 'ATTY', 'ATY5', 'Attorney V', 25],
            ['15-U', 'ATTY', 'ATY6', 'Attorney VI', 26],

            // GCC

            // Government Corporate Counsels
            [
                '15-U',
                'GCC',
                'AGCA1',
                'Associate Government Corporate Attorney I',
                18,
            ],
            [
                '15-U',
                'GCC',
                'AGCA2',
                'Associate Government Corporate Attorney II',
                22,
            ],
            ['15-U', 'GCC', 'GOVCA1', 'Government Corporate Attorney I', 25],
            ['15-U', 'GCC', 'GOVCA2', 'Government Corporate Attorney II', 26],
            ['15-U', 'GCC', 'GOVCA3', 'Government Corporate Attorney III', 27],
            ['15-U', 'GCC', 'GOVCA4', 'Government Corporate Attorney IV', 28],
            [
                '15-U',
                'GCC',
                'AGCC',
                'Assistant Government Corporate Counsel',
                29,
            ],
            ['15-U', 'GCC', 'DGCC', 'Deputy Government Corporate Counsel', 29],
            ['15-U', 'GCC', 'GOVCOR', 'Government Corporate Counsel', 30],

            // GI

            // Graft Investigation and Prosecution
            [
                '15-U',
                'GI',
                'AGIO1',
                'Associate Graft Investigation Officer I',
                15,
            ],
            [
                '15-U',
                'GI',
                'AGIO2',
                'Associate Graft Investigation Officer II',
                18,
            ],
            [
                '15-U',
                'GI',
                'AGIO3',
                'Associate Graft Investigation Officer III',
                22,
            ],
            ['15-U', 'GI', 'GIO1', 'Graft Investigation Officer I', 26],
            ['15-U', 'GI', 'GIO2', 'Graft Investigation Officer II', 27],
            ['15-U', 'GI', 'GIO3', 'Graft Investigation Officer III', 28],
            [
                '15-U',
                'GI',
                'GIPO1',
                'Graft Investigation and Prosecution Officer I',
                25,
            ],
            [
                '15-U',
                'GI',
                'GIPO2',
                'Graft Investigation and Prosecution Officer II',
                26,
            ],
            [
                '15-U',
                'GI',
                'GIPO3',
                'Graft Investigation and Prosecution Officer III',
                27,
            ],
            [
                '15-U',
                'GI',
                'GIPO4',
                'Graft Investigation and Prosecution Officer IV',
                28,
            ],
            ['15-U', 'GI', 'AO', 'Assistant Ombudsman', 29],
            ['15-U', 'GI', 'DOMB', 'Deputy Ombudsman', 30],
            ['15-U', 'GI', 'ODO', 'Overall Deputy Ombudsman', 30],
            ['15-U', 'GI', 'OMB', 'Ombudsman', 31],

            // JJ

            // Judges and Justices
            ['15-U', 'JJ', 'MCTCJ', 'Municipal Circuit Trial Court Judge', 28],
            ['15-U', 'JJ', 'MTCJ', 'Municipal Trial Court Judge', 28],
            ['15-U', 'JJ', 'SCCJ', 'Sharia Circuit Court Judge', 28],
            ['15-U', 'JJ', 'CTCJ', 'City Trial Court Judge', 28],
            ['15-U', 'JJ', 'METCJ', 'Metro Trial Court Judge', 28],
            ['15-U', 'JJ', 'RTCJ', 'Regional Trial Court Judge', 29],
            ['15-U', 'JJ', 'SDCJ', 'Sharia District Court Judge', 29],
            ['15-U', 'JJ', 'AJ', 'Associate Justice', 30],
            ['15-U', 'JJ', 'AJS', 'Associate Justice, Sandiganbayan', 30],
            ['15-U', 'JJ', 'AJCA', 'Associate Justice, Court of Appeals', 30],
            ['15-U', 'JJ', 'PJ', 'Presiding Justice', 31],
            ['15-U', 'JJ', 'PJS', 'Presiding Justice, Sandiganbayan', 31],
            ['15-U', 'JJ', 'PJCA', 'Presiding Justice, Court of Appeals', 31],
            [
                '15-U',
                'JJ',
                'AJSC',
                'Associate Justice of the Supreme Court',
                31,
            ],
            ['15-U', 'JJ', 'CJSC', 'Chief Justice of the Supreme Court', 32],

            // JA

            // Judicial Administration
            ['15-U', 'JA', 'CKC1', 'Clerk of Court I', 15],
            ['15-U', 'JA', 'CKC2', 'Clerk of Court II', 18],
            ['15-U', 'JA', 'CKC3', 'Clerk of Court III', 22],
            ['15-U', 'JA', 'CKC4', 'Clerk of Court IV', 23],
            ['15-U', 'JA', 'CKC5', 'Clerk of Court V', 24],
            ['15-U', 'JA', 'CKC6', 'Clerk of Court VI', 25],
            ['15-U', 'JA', 'CKC7', 'Clerk of Court VII', 26],
            ['15-U', 'JA', 'CTAT1', 'Court Attorney I', 22],
            ['15-U', 'JA', 'CTAT2', 'Court Attorney II', 23],
            ['15-U', 'JA', 'CTAT3', 'Court Attorney III', 24],
            ['15-U', 'JA', 'CTAT4', 'Court Attorney IV', 25],
            ['15-U', 'JA', 'CTAT5', 'Court Attorney V', 26],
            ['15-U', 'JA', 'CTAT6', 'Court Attorney VI', 27],
            ['15-U', 'JA', 'CLR1', 'Court Legal Researcher I', 12],
            ['15-U', 'JA', 'CLR2', 'Court Legal Researcher II', 15],
            ['15-U', 'JA', 'CLR3', 'Court Legal Researcher III', 18],
            [
                '15-U',
                'JA',
                'DCET',
                'Deputy Clerk of the Electoral Tribunal',
                29,
            ],
            ['15-U', 'JA', 'CET', 'Clerk of the Electoral Tribunal', 30],
            ['15-U', 'JA', 'CAR1', 'Court of Appeals Reporter I', 27],
            ['15-U', 'JA', 'CAR2', 'Court of Appeals Reporter II', 28],
            ['15-U', 'JA', 'ECC1', 'Executive Clerk of Court I', 26],
            ['15-U', 'JA', 'ECC2', 'Executive Clerk of Court II', 27],
            ['15-U', 'JA', 'ECC3', 'Executive Clerk of Court III', 28],
            ['15-U', 'JA', 'ECC4', 'Executive Clerk of Court IV', 29],
            ['15-U', 'JA', 'ECC5', 'Executive Clerk of Court V', 30],
            [
                '15-U',
                'JA',
                'DCASC',
                'Deputy Court Administrator of the Supreme Court',
                30,
            ],
            [
                '15-U',
                'JA',
                'CASC',
                'Court Administrator of the Supreme Court',
                30,
            ],
            [
                '15-U',
                'JA',
                'ACASC',
                'Assistant Court Administrator of the Supreme Court',
                30,
            ],
            ['15-U', 'JA', 'JUCON', 'Jurisconsult', 30],

            // LAWE

            // Law Education
            ['15-U', 'LAWE', 'LES1', 'Law Education Specialist I', 16],
            ['15-U', 'LAWE', 'LES2', 'Law Education Specialist II', 18],
            ['15-U', 'LAWE', 'LES3', 'Law Education Specialist III', 20],
            ['15-U', 'LAWE', 'LES4', 'Law Education Specialist IV', 22],
            ['15-U', 'LAWE', 'LESS', 'Law Education Specialist V', 24],

            // LR

            // Law Reform
            ['15-U', 'LR', 'LWRA1', 'Law Reform Associate I', 12],
            ['15-U', 'LR', 'LWRA2', 'Law Reform Associate II', 14],
            ['15-U', 'LR', 'LWRS1', 'Law Reform Specialist I', 16],
            ['15-U', 'LR', 'LWRS2', 'Law Reform Specialist II', 18],
            ['15-U', 'LR', 'LWRS3', 'Law Reform Specialist III', 20],
            ['15-U', 'LR', 'LWRS4', 'Law Reform Specialist IV', 22],
            ['15-U', 'LR', 'LWRS5', 'Law Reform Specialist V', 24],
            ['15-U', 'LR', 'LWRS6', 'Law Reform Specialist VI', 26],

            // LC

            // Legal Assistance
            ['15-U', 'LC', 'LEAD', 'Legal Aide', 5],
            ['15-U', 'LC', 'LEA1', 'Legal Assistant I', 10],
            ['15-U', 'LC', 'LEA2', 'Legal Assistant II', 12],
            ['15-U', 'LC', 'LEA3', 'Legal Assistant III', 14],

            // PE

            // Prosecution
            ['15-U', 'PE', 'ASPRO1', 'Associate Prosecution Attorney I', 18],
            ['15-U', 'PE', 'ASPRO2', 'Associate Prosecution Attorney II', 22],
            ['15-U', 'PE', 'PROATTY', 'Prosecution Attorney', 25],
            ['15-U', 'PE', 'PROSEC1', 'Prosecutor I', 26],
            ['15-U', 'PE', 'PROSEC2', 'Prosecutor II', 27],
            ['15-U', 'PE', 'PROSEC3', 'Prosecutor III', 28],
            ['15-U', 'PE', 'PROSEC4', 'Prosecutor IV', 29],
            ['15-U', 'PE', 'PROSEC5', 'Prosecutor V', 30],
            ['15-U', 'PE', 'PROGEN', 'Prosecutor General', 30],

            // PAT

            // Public Attorneys
            ['15-U', 'PAT', 'ASPA1', 'Associate Public Attorney I', 18],
            ['15-U', 'PAT', 'ASPA2', 'Associate Public Attorney II', 22],
            ['15-U', 'PAT', 'PATTY1', 'Public Attorney I', 25],
            ['15-U', 'PAT', 'PATTY2', 'Public Attorney II', 26],
            ['15-U', 'PAT', 'PATTY3', 'Public Attorney III', 27],
            ['15-U', 'PAT', 'PATTY4', 'Public Attorney IV', 28],
            ['15-U', 'PAT', 'PATTY5', 'Public Attorney V', 29],
            ['15-U', 'PAT', 'DCPA', 'Deputy Chief Public Attorney', 29],
            ['15-U', 'PAT', 'CPATY', 'Chief Public Attorney', 30],

            // SL

            // Solicitors
            ['15-U', 'SL', 'ASOL1', 'Associate Solicitor I', 24],
            ['15-U', 'SL', 'ASOL2', 'Associate Solicitor II', 25],
            ['15-U', 'SL', 'ASOL3', 'Associate Solicitor III', 26],
            ['15-U', 'SL', 'SSOL1', 'State Solicitor I', 27],
            ['15-U', 'SL', 'SSOL2', 'State Solicitor II', 28],
            ['15-U', 'SL', 'SRSSOL', 'Senior State Solicitor', 29],
            ['15-U', 'SL', 'ASOLIGEN', 'Assistant Solicitor General', 30],
            ['15-U', 'SL', 'SOLIGEN', 'Solicitor General', 31],

            // SP

            // Special Prosecution
            [
                '15-U',
                'SP',
                'ASPO1',
                'Associate Special Prosecution Officer I',
                18,
            ],
            [
                '15-U',
                'SP',
                'ASPO2',
                'Associate Special Prosecution Officer II',
                22,
            ],
            ['15-U', 'SP', 'SPPO1', 'Special Prosecution Officer I', 26],
            ['15-U', 'SP', 'SPPO2', 'Special Prosecution Officer II', 27],
            ['15-U', 'SP', 'SPPO3', 'Special Prosecution Officer III', 28],
            ['15-U', 'SP', 'DSP', 'Deputy Special Prosecutor', 29],
            ['15-U', 'SP', 'SPPROS', 'Special Prosecutor', 30],

            // SC

            // State Counsels
            ['15-U', 'SC', 'ASC1', 'Associate State Counsel I', 18],
            ['15-U', 'SC', 'ASC2', 'Associate State Counsel II', 22],
            ['15-U', 'SC', 'STCL1', 'State Counsel I', 24],
            ['15-U', 'SC', 'STCL2', 'State Counsel II', 25],
            ['15-U', 'SC', 'STCL3', 'State Counsel III', 26],
            ['15-U', 'SC', 'STCL4', 'State Counsel IV', 27],
            ['15-U', 'SC', 'STCL5', 'State Counsel V', 28],
            ['15-U', 'SC', 'ACSC', 'Assistant Chief State Counsel', 29],
            ['15-U', 'SC', 'CSTC', 'Chief State Counsel', 30],

            // 16-FR - FOREIGN RELATIONS SERVICE

            // AS

            // Attache Service
            ['16-FR', 'AS', 'ACHE1', 'Attache I', 24],
            ['16-FR', 'AS', 'ACHE2', 'Attache II', 25],

            // FAR

            // Foreign Affairs Research
            [
                '16-FR',
                'FAR',
                'FOARS1',
                'Foreign Affairs Research Specialist I',
                11,
            ],
            [
                '16-FR',
                'FAR',
                'FOARS2',
                'Foreign Affairs Research Specialist II',
                15,
            ],
            [
                '16-FR',
                'FAR',
                'SRFARS',
                'Senior Foreign Affairs Research Specialist',
                18,
            ],
            [
                '16-FR',
                'FAR',
                'SVFARS',
                'Supervising Foreign Affairs Research Specialist',
                22,
            ],
            [
                '16-FR',
                'FAR',
                'CFARS',
                'Chief Foreign Affairs Research Specialist',
                24,
            ],

            // FS

            // Foreign Service
            ['16-FR', 'FS', 'CONSO1', 'Consular Officer I', 11],
            ['16-FR', 'FS', 'CONSO2', 'Consular Officer II', 13],
            ['16-FR', 'FS', 'CONSO3', 'Consular Officer III', 15],
            ['16-FR', 'FS', 'FSSE3', 'Foreign Service Staff Employee III', 7],
            ['16-FR', 'FS', 'FSSE2', 'Foreign Service Staff Employee II', 9],
            ['16-FR', 'FS', 'FSSE1', 'Foreign Service Staff Employee I', 11],
            ['16-FR', 'FS', 'FSSO4', 'Foreign Service Staff Officer IV', 13],
            ['16-FR', 'FS', 'FSSO3', 'Foreign Service Staff Officer III', 17],
            ['16-FR', 'FS', 'FSSO2', 'Foreign Service Staff Officer II', 20],
            ['16-FR', 'FS', 'FSSO1', 'Foreign Service Staff Officer I', 24],
            ['16-FR', 'FS', 'FSOC4', 'Foreign Service Officer, Class IV', 24],
            ['16-FR', 'FS', 'FSOC3', 'Foreign Service Officer, Class III', 25],
            ['16-FR', 'FS', 'FSOC2', 'Foreign Service Officer, Class II', 26],
            ['16-FR', 'FS', 'FSOC1', 'Foreign Service Officer, Class I', 27],
            ['16-FR', 'FS', 'CRMS', 'Career Minister', 28],
            ['16-FR', 'FS', 'CMIC2', 'Chief of Mission, Class II', 29],
            ['16-FR', 'FS', 'CMIC1', 'Chief of Mission, Class I', 30],
            ['16-FR', 'FS', 'FOAF1', 'Foreign Affairs Adviser', 22],
            ['16-FR', 'FS', 'SRFAA', 'Senior Foreign Affairs Adviser', 24],
            ['16-FR', 'FS', 'CSLR', 'Counsellor', 26],
            ['16-FR', 'FS', 'SPR', 'Special Presidential Representative', 29],

            // FTS

            // Foreign Trade Service
            [
                '16-FR',
                'FTS',
                'FTSSO',
                'Foreign Trade Service Staff Officer',
                15,
            ],
            [
                '16-FR',
                'FTS',
                'FTSOC4',
                'Foreign Trade Service Officer, Class IV',
                24,
            ],
            [
                '16-FR',
                'FTS',
                'FTSOC3',
                'Foreign Trade Service Officer, Class III',
                25,
            ],
            [
                '16-FR',
                'FTS',
                'FTSOC2',
                'Foreign Trade Service Officer, Class II',
                26,
            ],
            [
                '16-FR',
                'FTS',
                'FTSOC1',
                'Foreign Trade Service Officer, Class I',
                27,
            ],
            ['16-FR', 'FTS', 'SPTR', 'Special Trade Representative', 28],

            // 17-MS - MISCELLANEOUS SERVICE

            // BC

            // Barbering and Cosmetology
            ['17-MS', 'BC', 'BB', 'Barber', 2],
            ['17-MS', 'BC', 'MUPA', 'Make-up Artist', 2],

            // FOS

            // Food Service
            ['17-MS', 'FOS', 'COK1', 'Cook I', 3],
            ['17-MS', 'FOS', 'COK2', 'Cook II', 5],
            ['17-MS', 'FOS', 'ACF', 'Assistant Chef', 8],
            ['17-MS', 'FOS', 'CF', 'Chef', 11],
            ['17-MS', 'FOS', 'FOSS1', 'Food Service Supervisor I', 9],
            ['17-MS', 'FOS', 'FOSS2', 'Food Service Supervisor II', 11],
            ['17-MS', 'FOS', 'FOSS3', 'Food Service Supervisor III', 15],
            ['17-MS', 'FOS', 'FOSS4', 'Food Service Supervisor IV', 18],
            ['17-MS', 'FOS', 'FOSM', 'Food Service Manager', 22],
            ['17-MS', 'FOS', 'STEW', 'Steward', 5],
            ['17-MS', 'FOS', 'WAIT1', 'Waiter I', 2],
            ['17-MS', 'FOS', 'WAIT2', 'Waiter II', 4],

            // LW

            // Laundry Working
            ['17-MS', 'LW', 'LAW1', 'Laundry Worker I', 1],
            ['17-MS', 'LW', 'LAW2', 'Laundry Worker II', 3],
            ['17-MS', 'LW', 'LAW3', 'Laundry Worker III', 6],

            // LDS

            // Lodging Service
            ['17-MS', 'LDS', 'DORMA', 'Dormitory Attendant', 3],
            ['17-MS', 'LDS', 'DORMG1', 'Dormitory Manager I', 9],
            ['17-MS', 'LDS', 'DORMG2', 'Dormitory Manager II', 11],
            ['17-MS', 'LDS', 'DORMG3', 'Dormitory Manager III', 15],
            ['17-MS', 'LDS', 'DORMG4', 'Dormitory Manager IV', 18],
            ['17-MS', 'LDS', 'GUESTC', 'Guesthouse Caretaker', 2],
            ['17-MS', 'LDS', 'HHA1', 'Household Attendant I', 3],
            ['17-MS', 'LDS', 'HHA2', 'Household Attendant II', 5],
            ['17-MS', 'LDS', 'HHA3', 'Household Attendant III', 8],
            ['17-MS', 'LDS', 'HHM', 'Household Manager', 10],
            ['17-MS', 'LDS', 'HHKPER', 'Hospital Housekeeper', 8],
            ['17-MS', 'LDS', 'HP1', 'Houseparent I', 4],
            ['17-MS', 'LDS', 'HP2', 'Houseparent II', 6],
            ['17-MS', 'LDS', 'HP3', 'Houseparent III', 9],
            ['17-MS', 'LDS', 'HP4', 'Houseparent IV', 11],
            ['17-MS', 'LDS', 'NM1', 'Nurse Maid I', 2],
            ['17-MS', 'LDS', 'NM2', 'Nurse Maid II', 4],
            [
                '17-MS',
                'LDS',
                'ATCS',
                'Assistant Teachers\' Camp Superintendent',
                22,
            ],
            ['17-MS', 'LDS', 'TCSUP', 'Teachers\' Camp Superintendent', 24],

            // PTA

            // Park Administration
            ['17-MS', 'PTA', 'PA1', 'Park Attendant I', 2],
            ['17-MS', 'PTA', 'PA2', 'Park Attendant II', 4],
            ['17-MS', 'PTA', 'PA3', 'Park Attendant III', 6],
            ['17-MS', 'PTA', 'PMF', 'Park Maintenance Foreman', 8],
            ['17-MS', 'PTA', 'PMGF', 'Park Maintenance General Foreman', 10],
            ['17-MS', 'PTA', 'PMS', 'Park Maintenance Supervisor', 14],
            ['17-MS', 'PTA', 'POS1', 'Park Operations Superintendent I', 16],
            ['17-MS', 'PTA', 'POS2', 'Park Operations Superintendent II', 18],
            ['17-MS', 'PTA', 'POS3', 'Park Operations Superintendent III', 20],
            ['17-MS', 'PTA', 'POS4', 'Park Operations Superintendent IV', 22],
            ['17-MS', 'PTA', 'POS5', 'Park Operations Superintendent V', 24],

            // PO

            // Parking Operations
            ['17-MS', 'PO', 'PAID1', 'Parking Aide I', 2],
            ['17-MS', 'PO', 'PAID2', 'Parking Aide II', 4],
            ['17-MS', 'PO', 'PAID3', 'Parking Aide III', 6],
            ['17-MS', 'PO', 'PAID4', 'Parking Aide IV', 7],

            // PK

            // Poundkeeping
            ['17-MS', 'PK', 'PK1', 'Poundkeeper I', 3],
            ['17-MS', 'PK', 'PK2', 'Poundkeeper II', 6],

            // 18-ES - EXECUTIVE SERVICE

            // CE

            // Chief Executive
            ['18-ES', 'CE', 'VEEP', 'Vice President of the Philippines', 32],
            ['18-ES', 'CE', 'PRES', 'President of the Philippines', 33],

            // CES

            // Chief Executive Support
            ['18-ES', 'CES', 'AES', 'Assistant Executive Secretary', 29],
            ['18-ES', 'CES', 'DEXS', 'Deputy Executive Secretary', 30],
            ['18-ES', 'CES', 'EXECS', 'Executive Secretary', 31],
            ['18-ES', 'CES', 'ACS', 'Assistant Cabinet Secretary', 29],
            ['18-ES', 'CES', 'CABUS', 'Cabinet Undersecretary', 30],
            ['18-ES', 'CES', 'CABS', 'Cabinet Secretary', 31],
            ['18-ES', 'CES', 'CEXS', 'Chief Executive Staff', 28],
            ['18-ES', 'CES', 'ACSVP', 'Assistant Chief of Staff (OVP)', 29],
            ['18-ES', 'CES', 'CSFVP', 'Chief of Staff (OVP)', 30],
            ['18-ES', 'CES', 'PROTO', 'Presidential Protocol Officer', 28],
            ['18-ES', 'CES', 'PRAS1', 'Presidential Assistant I', 30],
            ['18-ES', 'CES', 'PRAS2', 'Presidential Assistant II', 31],
            ['18-ES', 'CES', 'PRLA', 'Presidential Legislative Assistant', 30],
            ['18-ES', 'CES', 'PRAD', 'Presidential Legislative Adviser', 30],
            [
                '18-ES',
                'CES',
                'PRALA',
                'Presidential Adviser on Legislative Affairs',
                31,
            ],
            ['18-ES', 'CES', 'PRADR', 'Presidential Adviser', 31],
            ['18-ES', 'CES', 'APSEC', 'Assistant Press Secretary', 29],
            ['18-ES', 'CES', 'DPSEC', 'Deputy Press Secretary', 30],
            ['18-ES', 'CES', 'PRESEC', 'Press Secretary', 31],
            ['18-ES', 'CES', 'PRESP', 'Presidential Spokesman', 31],

            // OM

            // Operating Management
            ['18-ES', 'OM', 'DTYAD1', 'Deputy Administrator I', 27],
            ['18-ES', 'OM', 'DTYAD2', 'Deputy Administrator II', 28],
            ['18-ES', 'OM', 'DTYAD3', 'Deputy Administrator III', 29],
            ['18-ES', 'OM', 'ADI', 'Administrator I', 28],
            ['18-ES', 'OM', 'AD2', 'Administrator II', 29],
            ['18-ES', 'OM', 'AD3', 'Administrator III', 30],
            ['18-ES', 'OM', 'CKCOM', 'Clerk of the Commission', 27],
            ['18-ES', 'OM', 'DCOM1', 'Deputy Commissioner I', 27],
            ['18-ES', 'OM', 'DCOM2', 'Deputy Commissioner II', 28],
            ['18-ES', 'OM', 'DCOM3', 'Deputy Commissioner III', 29],
            ['18-ES', 'OM', 'COM1', 'Commissioner I', 28],
            ['18-ES', 'OM', 'COM2', 'Commissioner II', 29],
            ['18-ES', 'OM', 'COM3', 'Commissioner III', 30],
            ['18-ES', 'OM', 'DED1', 'Deputy Executive Director I', 25],
            ['18-ES', 'OM', 'DED2', 'Deputy Executive Director II', 26],
            ['18-ES', 'OM', 'DED3', 'Deputy Executive Director III', 27],
            ['18-ES', 'OM', 'DED4', 'Deputy Executive Director IV', 28],
            ['18-ES', 'OM', 'DED5', 'Deputy Executive Director V', 29],
            ['18-ES', 'OM', 'EXED1', 'Executive Director I', 26],
            ['18-ES', 'OM', 'EXED2', 'Executive Director II', 27],
            ['18-ES', 'OM', 'EXED3', 'Executive Director III', 28],
            ['18-ES', 'OM', 'EXED4', 'Executive Director IV', 29],
            ['18-ES', 'OM', 'EXED5', 'Executive Director V', 30],
            ['18-ES', 'OM', 'DIR1', 'Director I', 25],
            ['18-ES', 'OM', 'DIR2', 'Director II', 26],
            ['18-ES', 'OM', 'DIR3', 'Director III', 27],
            ['18-ES', 'OM', 'DIR4', 'Director IV', 28],
            ['18-ES', 'OM', 'DIRS', 'Director V', 29],
            ['18-ES', 'OM', 'DIR6', 'Director VI', 30],
            ['18-ES', 'OM', 'IG', 'Inspector-General', 29],
            [
                '18-ES',
                'OM',
                'DLLO',
                'Department Legislative Liaison Officer',
                29,
            ],
            ['18-ES', 'OM', 'DTPH', 'Deputy Treasurer of the Philippines', 29],
            ['18-ES', 'OM', 'TREAS', 'Treasurer of the Philippines', 30],
            [
                '18-ES',
                'OM',
                'ASCOMIR',
                'Assistant Commissioner of Internal Revenue',
                27,
            ],
            [
                '18-ES',
                'OM',
                'DCIR',
                'Deputy Commissioner of Internal Revenue',
                28,
            ],
            ['18-ES', 'OM', 'CIR', 'Commissioner of Internal Revenue', 30],
            ['18-ES', 'OM', 'DCC', 'Deputy Commissioner of Customs', 28],
            ['18-ES', 'OM', 'CCTM', 'Commissioner of Customs', 30],
            ['18-ES', 'OM', 'AGM', 'Assistant General Manager', 29],
            ['18-ES', 'OM', 'GM', 'General Manager', 30],
            ['18-ES', 'OM', 'DPRCOM', 'Deputy Privacy Commissioner', 30],
            ['18-ES', 'OM', 'PRCOM', 'Privacy Commissioner', 31],
            ['18-ES', 'OM', 'HSACEXCO', 'HSAC Executive Commissioner', 30],
            ['18-ES', 'OM', 'BCORDDG', 'BUCOR Deputy Director-General', 29],
            ['18-ES', 'OM', 'BCORDG', 'BUCOR Director-General', 30],
            [
                '18-ES',
                'OM',
                'NM MDDG',
                'National Museum Deputy Director-General',
                29,
            ],
            ['18-ES', 'OM', 'NM DG', 'National Museum Director-General', 30],

            // PM

            // Project Management
            ['18-ES', 'PM', 'PM1', 'Project Manager I', 25],
            ['18-ES', 'PM', 'PM2', 'Project Manager II', 26],
            ['18-ES', 'PM', 'PM3', 'Project Manager III', 27],
            ['18-ES', 'PM', 'PM4', 'Project Manager IV', 28],

            // TMG

            // Top Management
            ['18-ES', 'TMG', 'CHPN', 'Chairperson', 31],
            ['18-ES', 'TMG', 'DASEC', 'Department Assistant Secretary', 29],
            ['18-ES', 'TMG', 'DEUSEC', 'Department Undersecretary', 30],
            ['18-ES', 'TMG', 'DESEC', 'Department Secretary', 31],
            [
                '18-ES',
                'TMG',
                'DSECGEN',
                'Deputy Secretary-General of the House of Representatives',
                30,
            ],
            [
                '18-ES',
                'TMG',
                'SECGEN',
                'Secretary-General of the House of Representatives',
                31,
            ],
            ['18-ES', 'TMG', 'DSECS', 'Deputy Secretary of the Senate', 30],
            ['18-ES', 'TMG', 'SECSEN', 'Secretary of the Senate', 31],
            [
                '18-ES',
                'TMG',
                'DSECCA',
                'Deputy Secretary of the Commission on Appointments',
                30,
            ],
            [
                '18-ES',
                'TMG',
                'SECCA',
                'Secretary of the Commission on Appointments',
                31,
            ],
            [
                '18-ES',
                'TMG',
                'DSECHET',
                'Deputy Secretary of the House Electoral Tribunal',
                29,
            ],
            [
                '18-ES',
                'TMG',
                'SECHET',
                'Secretary of the House Electoral Tribunal',
                30,
            ],
            [
                '18-ES',
                'TMG',
                'DSECSET',
                'Deputy Secretary of the Senate Electoral Tribunal',
                29,
            ],
            [
                '18-ES',
                'TMG',
                'SECSET',
                'Secretary of the Senate Electoral Tribunal',
                30,
            ],
            ['18-ES', 'TMG', 'ADG', 'Assistant Director-General', 29],
            ['18-ES', 'TMG', 'DDG', 'Deputy Director-General', 30],
            ['18-ES', 'TMG', 'DG', 'Director-General', 31],
            ['18-ES', 'TMG', 'BG', 'Board Governor', 29],
            [
                '18-ES',
                'TMG',
                'ACOM',
                'Assistant Commissioner, Constitutional Commission',
                29,
            ],
            [
                '18-ES',
                'TMG',
                'COMCC',
                'Commissioner, Constitutional Commission',
                30,
            ],
            ['18-ES', 'TMG', 'MCC', 'Member, Constitutional Commission', 30],
            [
                '18-ES',
                'TMG',
                'CCBC3',
                'Council/Commission/Board Chairman III',
                30,
            ],
            ['18-ES', 'TMG', 'CCCM', 'Chairman, Constitutional Commission', 31],
            ['18-ES', 'TMG', 'BOME1', 'Board Member I', 27],
            ['18-ES', 'TMG', 'BOME2', 'Board Member II', 28],
            ['18-ES', 'TMG', 'BOME3', 'Board Member III', 29],
            ['18-ES', 'TMG', 'BOME4', 'Board Member IV', 30],
            ['18-ES', 'TMG', 'BOCH1', 'Board Chairman I', 28],
            ['18-ES', 'TMG', 'BOCH2', 'Board Chairman II', 29],
            ['18-ES', 'TMG', 'BOCH3', 'Board Chairman III', 30],
            ['18-ES', 'TMG', 'BOCH4', 'Board Chairman IV', 31],
            ['18-ES', 'TMG', 'COME1', 'Commission Member I', 27],
            ['18-ES', 'TMG', 'COME2', 'Commission Member II', 28],
            ['18-ES', 'TMG', 'COME3', 'Commission Member III', 29],
            ['18-ES', 'TMG', 'COME4', 'Commission Member IV', 30],
            ['18-ES', 'TMG', 'COCH1', 'Commission Chairman I', 28],
            ['18-ES', 'TMG', 'COCH2', 'Commission Chairman II', 29],
            ['18-ES', 'TMG', 'COCH3', 'Commission Chairman III', 30],
            ['18-ES', 'TMG', 'COCH4', 'Commission Chairman IV', 31],
            ['18-ES', 'TMG', 'COUME1', 'Council Member I', 27],
            ['18-ES', 'TMG', 'COUME2', 'Council Member II', 28],
            ['18-ES', 'TMG', 'COUME3', 'Council Member III', 29],
            ['18-ES', 'TMG', 'COUME4', 'Council Member IV', 30],
            ['18-ES', 'TMG', 'COUCH1', 'Council Chairman I', 28],
            ['18-ES', 'TMG', 'COUCH2', 'Council Chairman II', 29],
            ['18-ES', 'TMG', 'COUCH3', 'Council Chairman III', 30],
            ['18-ES', 'TMG', 'COUCH4', 'Council Chairman IV', 31],

            // 19-LS - LEGISLATIVE SERVICE

            // CG

            // Congress
            [
                '19-LS',
                'CG',
                'MHREP',
                'Member of the House of Representatives',
                31,
            ],
            [
                '19-LS',
                'CG',
                'SPKHR',
                'Speaker of the House of Representatives',
                32,
            ],
            ['19-LS', 'CG', 'SEN', 'Senator', 31],
            ['19-LS', 'CG', 'PRESEN', 'President of the Senate', 32],

            // 20-CG CORPORATE GOVERNANCE

            // CGA

            // Corporate Governance Affairs
            ['20-CG', 'CGA', 'CGO1', 'Corporate Governance Officer I', 11],
            ['20-CG', 'CGA', 'CGO2', 'Corporate Governance Officer II', 15],
            ['20-CG', 'CGA', 'CGO3', 'Corporate Governance Officer III', 18],
            ['20-CG', 'CGA', 'CGO4', 'Corporate Governance Officer IV', 22],
            ['20-CG', 'CGA', 'CGO5', 'Corporate Governance Officer V', 24],
        ];

        foreach ($ios as $row) {
            Ios::create([
                'occupational_service_code' => $row[0],
                'occupational_group_code' => $row[1],
                'class_id' => $row[2],
                'class' => $row[3],
                'salary_grade' => $row[4],
            ]);
        }
    }
}
