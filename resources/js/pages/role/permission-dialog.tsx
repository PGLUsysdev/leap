import { useState, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Collapsible,
    CollapsibleContent,
} from '@/components/ui/collapsible';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { router } from '@inertiajs/react';
import { permissionTree } from '@/lib/permissions';
import type { PermissionNode } from '@/lib/permissions';
import type { Role } from '@/types/global';

interface PermissionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role?: Role | null;
}

function usePermissionState() {
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const toggle = useCallback((key: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }, []);

    const toggleAll = useCallback((keys: string[], checked: boolean) => {
        setSelected((prev) => {
            const next = new Set(prev);
            for (const key of keys) {
                if (checked) {
                    next.add(key);
                } else {
                    next.delete(key);
                }
            }
            return next;
        });
    }, []);

    const toggleSingle = useCallback(
        (groupKeys: string[], selectedKey: string) => {
            setSelected((prev) => {
                const next = new Set(prev);
                for (const k of groupKeys) {
                    next.delete(k);
                }
                if (selectedKey) {
                    next.add(selectedKey);
                }
                return next;
            });
        },
        [],
    );

    return { selected, setSelected, toggle, toggleAll, toggleSingle };
}

function getScopedPermissionKeys(node: PermissionNode): string[] {
    const keys: string[] = [];
    if (!node.scopedPermissions) return keys;
    for (const sp of node.scopedPermissions) {
        if (sp.scopes.length === 0) {
            keys.push(`${node.key}.${sp.key}`);
        } else {
            for (const scope of sp.scopes) {
                keys.push(`${node.key}.${sp.key}.${scope}`);
            }
        }
    }
    return keys;
}

interface PermissionRowProps {
    node: PermissionNode;
    depth: number;
    selected: Set<string>;
    expandedKeys: Set<string>;
    onToggle: (key: string) => void;
    onToggleAll: (keys: string[], checked: boolean) => void;
    onToggleSingle: (groupKeys: string[], selectedKey: string) => void;
    onToggleExpand: (key: string) => void;
}

function PermissionRow({
    node,
    depth,
    selected,
    expandedKeys,
    onToggle,
    onToggleAll,
    onToggleSingle,
    onToggleExpand,
}: PermissionRowProps) {
    const isExpanded = expandedKeys.has(node.key);
    const hasChildren = node.children && node.children.length > 0;

    const hasViewGate =
        node.scopedPermissions?.some((sp) => sp.key === 'view') &&
        !!node.scopedPermissions?.length;
    const viewKey = hasViewGate ? `${node.key}.view` : null;
    const isViewEnabled = viewKey ? selected.has(viewKey) : true;

    const hasShowToggle = node.scopedPermissions?.some(
        (sp) => sp.key === 'show' && sp.scopes.includes('own') && sp.scopes.includes('all'),
    );
    const isOwnMode = hasShowToggle ? selected.has(`${node.key}.show.own`) : false;

    useEffect(() => {
        if (!viewKey) return;
        const viewOn = selected.has(viewKey);
        const scopedKeys = getScopedPermissionKeys(node);
        const hasScoped = scopedKeys.some((k) => selected.has(k));

        if (!viewOn) {
            if (hasScoped) {
                onToggleAll(scopedKeys, false);
            }
            return;
        }

        if (hasShowToggle) {
            const showOwnKey = `${node.key}.show.own`;
            const showAllKey = `${node.key}.show.all`;
            const showOwnOn = selected.has(showOwnKey);
            const showAllOn = selected.has(showAllKey);

            if (!showOwnOn && !showAllOn) {
                onToggle(showOwnKey);
            }

            if ((node.key === 'office' || node.key === 'user') && showOwnOn && !showAllOn) {
                const globalKeys = (node.scopedPermissions || [])
                    .filter((sp) => sp.scopes.length === 0 && sp.key !== 'view')
                    .map((sp) => `${node.key}.${sp.key}`);
                const hasGlobal = globalKeys.some((k) => selected.has(k));
                if (hasGlobal) {
                    onToggleAll(globalKeys, false);
                }

                const subUnitAllKeys = (node.scopedPermissions || [])
                    .filter((sp) => sp.disableOption)
                    .map((sp) => `${node.key}.${sp.key}.all`);
                const hasSubUnitAll = subUnitAllKeys.some((k) => selected.has(k));
                if (hasSubUnitAll) {
                    onToggleAll(subUnitAllKeys, false);
                }
            }
        }
    }, [viewKey, selected, node, onToggleAll, onToggle]);

    return (
        <div>
            <div
                className="flex items-center gap-2 py-1.5"
                style={{ paddingLeft: depth * 24 }}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        onClick={() => onToggleExpand(node.key)}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                        {isExpanded ? (
                            <ChevronDown className="size-4" />
                        ) : (
                            <ChevronRight className="size-4" />
                        )}
                    </button>
                ) : (
                    <span className="size-4 shrink-0" />
                )}

                <span className="text-sm font-medium flex-1">{node.label}</span>
            </div>

            <div
                className="flex flex-wrap gap-3 pb-2"
                style={{ paddingLeft: (depth + 1) * 24 + 24 }}
            >
                {node.scopedPermissions?.filter((sp) => {
                        const isToggleScope =
                            (sp.scopes.length === 0 && sp.disableOption) ||
                            (sp.scopes.length === 2 &&
                                sp.scopes.includes('own') &&
                                sp.scopes.includes('all'));
                        return isToggleScope;
                    }).map((sp) => {
                        const options = sp.disableOption
                            ? ['disabled', ...(sp.scopes.length > 0 ? sp.scopes : ['enable'])]
                            : sp.scopes;

                        let currentSelected: string;
                        if (sp.scopes.length === 0) {
                            const key = `${node.key}.${sp.key}`;
                            currentSelected = selected.has(key) ? 'enable' : '';
                        } else {
                            currentSelected =
                                sp.scopes.find((s) =>
                                    selected.has(`${node.key}.${sp.key}.${s}`),
                                ) || '';
                        }

                        return (
                            <div key={sp.key} className="flex items-center gap-2 py-0.5 w-full">
                                <span className="text-sm text-muted-foreground min-w-[110px]">
                                    {sp.label}
                                </span>
                                <ToggleGroup
                                    type="single"
                                    size="sm"
                                    variant="outline"
                                    value={currentSelected || (sp.disableOption && (sp.key === 'view' || isViewEnabled) ? 'disabled' : '')}
                                    onValueChange={(value) => {
                                        if (sp.key === 'show' && !value) return;
                                        if (sp.scopes.length === 0) {
                                            const key = `${node.key}.${sp.key}`;
                                            if (value === 'enable' && !selected.has(key)) {
                                                onToggle(key);
                                            } else if (value === 'disabled' && selected.has(key)) {
                                                onToggle(key);
                                            }
                                        } else {
                                            const groupKeys = sp.scopes.map(
                                                (s) => `${node.key}.${sp.key}.${s}`,
                                            );
                                            const selectedKey =
                                                value && value !== 'disabled'
                                                    ? `${node.key}.${sp.key}.${value}`
                                                    : '';
                                            onToggleSingle(groupKeys, selectedKey);
                                        }
                                    }}
                                >
                                    {options.map((scope) => {
                                        const label =
                                            scope === 'disabled'
                                                ? 'Disabled'
                                                : scope === 'enable'
                                                    ? 'Enable'
                                                    : scope;
                                        return (
                                            <ToggleGroupItem
                                                key={scope}
                                                value={scope}
                                                disabled={
                                                    sp.key === 'view'
                                                        ? false
                                                        : scope === 'disabled'
                                                            ? !isViewEnabled
                                                            : scope === 'enable'
                                                                ? !isViewEnabled || (isOwnMode && (node.key === 'office' || node.key === 'user'))
                                                                : !isViewEnabled || (isOwnMode && sp.key !== 'show' && scope === 'all')
                                                }
                                                className="capitalize text-xs"
                                            >
                                                {label}
                                            </ToggleGroupItem>
                                        );
                                    })}
                                </ToggleGroup>
                            </div>
                        );
                    })}
            </div>

            {hasChildren && (
                <Collapsible open={isExpanded}>
                    <CollapsibleContent>
                        {node.children!.map((child) => (
                            <PermissionRow
                                key={child.key}
                                node={child}
                                depth={depth + 1}
                                selected={selected}
                                expandedKeys={expandedKeys}
                                onToggle={onToggle}
                                onToggleAll={onToggleAll}
                                onToggleSingle={onToggleSingle}
                                onToggleExpand={onToggleExpand}
                            />
                        ))}
                    </CollapsibleContent>
                </Collapsible>
            )}
        </div>
    );
}

export default function PermissionDialog({
    open,
    onOpenChange,
    role,
}: PermissionDialogProps) {
    const { selected, setSelected, toggle, toggleAll, toggleSingle } = usePermissionState();
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
        new Set(),
    );
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!open || !role) return;

        setIsLoading(true);
        fetch(`/roles/${role.id}/permissions`, {
            headers: { Accept: 'application/json' },
        })
            .then((res) => res.json())
            .then((data) => {
                setSelected(new Set(data.permissions));
            })
            .finally(() => setIsLoading(false));
    }, [open, role, setSelected]);

    const handleSave = useCallback(() => {
        if (!role) return;

        setIsLoading(true);
        router.post(`/roles/${role.id}/permissions`, {
            permissions: Array.from(selected),
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsLoading(false);
                onOpenChange(false);
            },
            onError: () => {
                setIsLoading(false);
            },
        });
    }, [role, selected, onOpenChange]);

    const handleToggleExpand = useCallback((key: string) => {
        setExpandedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }, []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Manage Permissions</DialogTitle>
                    <DialogDescription>
                        {role
                            ? `Configure permissions for role: ${role.name}.`
                            : 'Select a role to manage permissions.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0">
                    <ScrollArea className="max-h-[60vh] w-full pr-4">
                        {permissionTree.map((node) => (
                            <PermissionRow
                                key={node.key}
                                node={node}
                                depth={0}
                                selected={selected}
                                expandedKeys={expandedKeys}
                                onToggle={toggle}
                                onToggleAll={toggleAll}
                                onToggleSingle={toggleSingle}
                                onToggleExpand={handleToggleExpand}
                            />
                        ))}
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
