export interface ScopedPermission {
    key: string;
    label: string;
    scopes: string[];
}

export interface PermissionNode {
    key: string;
    label: string;
    permissions: string[];
    scopedPermissions?: ScopedPermission[];
    children?: PermissionNode[];
}

export const permissionTree: PermissionNode[] = [
    { key: 'user', label: 'User', permissions: ['view', 'edit'] },
    { key: 'funding-source', label: 'Funding Source', permissions: ['view', 'add', 'edit', 'delete'] },
    { key: 'chart-of-account', label: 'Chart of Account', permissions: ['view', 'add', 'edit', 'delete'] },
    { key: 'ppmp-category', label: 'PPMP Category', permissions: ['view', 'add', 'edit', 'delete'] },
    { key: 'price-list', label: 'Price List', permissions: ['view', 'add', 'edit', 'delete', 'move'] },
    { key: 'office-type', label: 'Office Type', permissions: ['view', 'add', 'edit', 'delete'] },
    { key: 'lgu-level', label: 'LGU Level', permissions: ['view', 'add', 'edit', 'delete'] },
    { key: 'sector', label: 'Sector', permissions: ['view', 'add', 'edit', 'delete'] },
    {
        key: 'office',
        label: 'Office',
        permissions: ['view'],
        scopedPermissions: [
            { key: 'show', label: 'Show', scopes: ['own', 'all'] },
            { key: 'add-office', label: 'Add Office', scopes: ['own', 'all'] },
            { key: 'add-sub-unit', label: 'Add Sub Unit', scopes: ['own', 'all'] },
            { key: 'edit-office', label: 'Edit Office', scopes: ['own', 'all'] },
            { key: 'edit-sub-unit', label: 'Edit Sub Unit', scopes: ['own', 'all'] },
            { key: 'delete-office', label: 'Delete Office', scopes: ['own', 'all'] },
            { key: 'delete-sub-unit', label: 'Delete Sub Unit', scopes: ['own', 'all'] },
        ],
    },
    { key: 'ppa', label: 'PPA', permissions: ['view', 'create', 'edit', 'delete'] },
    {
        key: 'aip',
        label: 'AIP',
        permissions: ['view', 'create', 'edit', 'delete'],
        children: [
            {
                key: 'aip-summary',
                label: 'AIP Summary',
                permissions: ['view', 'create', 'edit', 'delete'],
                children: [
                    { key: 'ppmp', label: 'PPMP', permissions: ['view', 'create', 'edit', 'delete'] },
                ],
            },
            { key: 'ppmp-summary', label: 'PPMP Summary', permissions: ['view', 'create', 'edit', 'delete'] },
        ],
    },
];

export function getPermissionKey(moduleKey: string, permission: string): string {
    return `${moduleKey}.${permission}`;
}

export function getSubtreeKeys(node: PermissionNode): string[] {
    const keys: string[] = [];
    for (const perm of node.permissions) {
        keys.push(getPermissionKey(node.key, perm));
    }
    if (node.scopedPermissions) {
        for (const sp of node.scopedPermissions) {
            for (const scope of sp.scopes) {
                keys.push(`${node.key}.${sp.key}.${scope}`);
            }
        }
    }
    if (node.children) {
        for (const child of node.children) {
            keys.push(...getSubtreeKeys(child));
        }
    }
    return keys;
}
