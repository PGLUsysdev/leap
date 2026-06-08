export interface ScopedPermission {
    key: string;
    label: string;
    scopes: string[];
    disableOption?: boolean;
}

export interface PermissionNode {
    key: string;
    label: string;
    permissions: string[];
    scopedPermissions?: ScopedPermission[];
    children?: PermissionNode[];
}

export const permissionTree: PermissionNode[] = [
    {
        key: 'user',
        label: 'User',
        permissions: [],
        scopedPermissions: [
            { key: 'view', label: 'View', scopes: [], disableOption: true },
            { key: 'show', label: 'Show', scopes: ['own', 'all'] },
            {
                key: 'edit',
                label: 'Edit',
                scopes: ['own', 'all'],
                disableOption: true,
            },
            {
                key: 'edit.office',
                label: 'Edit Office',
                scopes: ['own', 'all'],
                disableOption: true,
            },
            {
                key: 'edit.role',
                label: 'Edit Role',
                scopes: ['own', 'all'],
                disableOption: true,
            },
        ],
    },
    {
        key: 'funding-source',
        label: 'Funding Source',
        permissions: [],
        scopedPermissions: [
            { key: 'view', label: 'View', scopes: [], disableOption: true },
            { key: 'add', label: 'Add', scopes: [], disableOption: true },
            { key: 'edit', label: 'Edit', scopes: [], disableOption: true },
            { key: 'delete', label: 'Delete', scopes: [], disableOption: true },
        ],
    },
    {
        key: 'chart-of-account',
        label: 'Chart of Account',
        permissions: [],
        scopedPermissions: [
            { key: 'view', label: 'View', scopes: [], disableOption: true },
            { key: 'add', label: 'Add', scopes: [], disableOption: true },
            { key: 'edit', label: 'Edit', scopes: [], disableOption: true },
            { key: 'delete', label: 'Delete', scopes: [], disableOption: true },
        ],
    },
    {
        key: 'ppmp-category',
        label: 'PPMP Category',
        permissions: [],
        scopedPermissions: [
            { key: 'view', label: 'View', scopes: [], disableOption: true },
            { key: 'add', label: 'Add', scopes: [], disableOption: true },
            { key: 'edit', label: 'Edit', scopes: [], disableOption: true },
            { key: 'delete', label: 'Delete', scopes: [], disableOption: true },
        ],
    },
    {
        key: 'price-list',
        label: 'Price List',
        permissions: [],
        scopedPermissions: [
            { key: 'view', label: 'View', scopes: [], disableOption: true },
            { key: 'add', label: 'Add', scopes: [], disableOption: true },
            { key: 'edit', label: 'Edit', scopes: [], disableOption: true },
            { key: 'delete', label: 'Delete', scopes: [], disableOption: true },
            { key: 'move', label: 'Move', scopes: [], disableOption: true },
        ],
    },
    {
        key: 'office-type',
        label: 'Office Type',
        permissions: [],
        scopedPermissions: [
            { key: 'view', label: 'View', scopes: [], disableOption: true },
            { key: 'add', label: 'Add', scopes: [], disableOption: true },
            { key: 'edit', label: 'Edit', scopes: [], disableOption: true },
            { key: 'delete', label: 'Delete', scopes: [], disableOption: true },
        ],
    },
    {
        key: 'lgu-level',
        label: 'LGU Level',
        permissions: [],
        scopedPermissions: [
            { key: 'view', label: 'View', scopes: [], disableOption: true },
            { key: 'add', label: 'Add', scopes: [], disableOption: true },
            { key: 'edit', label: 'Edit', scopes: [], disableOption: true },
            { key: 'delete', label: 'Delete', scopes: [], disableOption: true },
        ],
    },
    {
        key: 'sector',
        label: 'Sector',
        permissions: [],
        scopedPermissions: [
            { key: 'view', label: 'View', scopes: [], disableOption: true },
            { key: 'add', label: 'Add', scopes: [], disableOption: true },
            { key: 'edit', label: 'Edit', scopes: [], disableOption: true },
            { key: 'delete', label: 'Delete', scopes: [], disableOption: true },
        ],
    },
    {
        key: 'office',
        label: 'Office',
        permissions: [],
        scopedPermissions: [
            { key: 'view', label: 'View', scopes: [], disableOption: true },
            { key: 'show', label: 'Show', scopes: ['own', 'all'] },
            {
                key: 'create.office',
                label: 'Create Office',
                scopes: [],
                disableOption: true,
            },
            {
                key: 'edit.office',
                label: 'Edit Office',
                scopes: ['own', 'all'],
                disableOption: true,
            },
            {
                key: 'delete.office',
                label: 'Delete Office',
                scopes: [],
                disableOption: true,
            },
            {
                key: 'create.sub-unit',
                label: 'Create Sub Unit',
                scopes: ['own', 'all'],
                disableOption: true,
            },
            {
                key: 'edit.sub-unit',
                label: 'Edit Sub Unit',
                scopes: ['own', 'all'],
                disableOption: true,
            },
            {
                key: 'delete.sub-unit',
                label: 'Delete Sub Unit',
                scopes: ['own', 'all'],
                disableOption: true,
            },
        ],
    },
    {
        key: 'ppa',
        label: 'PPA',
        permissions: [],
        scopedPermissions: [
            { key: 'view', label: 'View', scopes: [], disableOption: true },
            { key: 'show', label: 'Show', scopes: ['own', 'all'] },
            { key: 'create', label: 'Create', scopes: [], disableOption: true },
            { key: 'edit', label: 'Edit', scopes: [], disableOption: true },
            { key: 'delete', label: 'Delete', scopes: [], disableOption: true },
            { key: 'move', label: 'Move', scopes: [], disableOption: true },
            { key: 'import', label: 'Import', scopes: [], disableOption: true },
        ],
    },
    {
        key: 'fiscal-year',
        label: 'AIP',
        permissions: [],
        scopedPermissions: [
            { key: 'view', label: 'View', scopes: [], disableOption: true },
            { key: 'create', label: 'Create', scopes: [], disableOption: true },
            {
                key: 'edit.status',
                label: 'Edit',
                scopes: [],
                disableOption: true,
            },
            {
                key: 'generate-app',
                label: 'Generate App',
                scopes: ['own', 'all'],
                disableOption: true,
            },
            {
                key: 'aip-summary',
                label: 'Open AIP Summary',
                scopes: [],
                disableOption: true,
            },
        ],
    },
    {
        key: 'aip-summary',
        label: 'AIP Summary',
        permissions: [],
        scopedPermissions: [
            { key: 'view', label: 'View', scopes: [], disableOption: true },
            { key: 'show', label: 'Show', scopes: ['own', 'all'] },
            { key: 'import', label: 'Import', scopes: [], disableOption: true },
            { key: 'edit', label: 'Edit', scopes: [], disableOption: true },
            {
                key: 'edit.funding-source',
                label: 'Edit Funding Source',
                scopes: [],
                disableOption: true,
            },
            { key: 'delete', label: 'Delete', scopes: [], disableOption: true },
            {
                key: 'create.supplemental',
                label: 'Create Supplemental',
                scopes: [],
                disableOption: true,
            },
            {
                key: 'delete.supplemental',
                label: 'Delete Supplemental',
                scopes: [],
                disableOption: true,
            },
            {
                key: 'view.supplemental',
                label: 'View Supplemental',
                scopes: [],
                disableOption: true,
            },
        ],
    },
    {
        key: 'ppmp',
        label: 'PPMP',
        permissions: [],
        scopedPermissions: [
            { key: 'view', label: 'View', scopes: [], disableOption: true },
            { key: 'export', label: 'Export', scopes: [], disableOption: true },
            {
                key: 'edit.price-list-quantity',
                label: 'Edit',
                scopes: [],
                disableOption: true,
            },
            {
                key: 'delete.price-list',
                label: 'Delete',
                scopes: [],
                disableOption: true,
            },
            {
                key: 'add.price-list',
                label: 'Add',
                scopes: [],
                disableOption: true,
            },
            {
                key: 'view.supplemental',
                label: 'View Supplemental',
                scopes: [],
                disableOption: true,
            },
            {
                key: 'generate-summary',
                label: 'Generate Summary',
                scopes: [],
                disableOption: true,
            },
        ],
    },
    {
        key: 'ppmp-summary',
        label: 'PPMP Summary',
        permissions: [],
        scopedPermissions: [
            { key: 'view', label: 'View', scopes: [], disableOption: true },
        ],
    },
    {
        key: 'role',
        label: 'Roles',
        permissions: [],
        scopedPermissions: [
            { key: 'view', label: 'View', scopes: [], disableOption: true },
            { key: 'add', label: 'Add', scopes: [], disableOption: true },
            {
                key: 'edit.name',
                label: 'Edit',
                scopes: [],
                disableOption: true,
            },
            {
                key: 'edit.permissions',
                label: 'Edit Permissions',
                scopes: [],
                disableOption: true,
            },
            { key: 'delete', label: 'Delete', scopes: [], disableOption: true },
        ],
    },
];
