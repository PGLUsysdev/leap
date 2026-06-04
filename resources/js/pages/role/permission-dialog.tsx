import { useState, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Collapsible,
    CollapsibleContent,
} from '@/components/ui/collapsible';
import { ChevronRight, ChevronDown } from 'lucide-react';
import {
    permissionTree,
    getPermissionKey,
    getSubtreeKeys,
} from '@/lib/permissions';
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

    return { selected, toggle, toggleAll };
}

function getSelectionState(
    node: PermissionNode,
    selected: Set<string>,
): boolean | 'indeterminate' {
    const keys = getSubtreeKeys(node);
    const checkedCount = keys.filter((k) => selected.has(k)).length;
    if (checkedCount === 0) return false;
    if (checkedCount === keys.length) return true;
    return 'indeterminate';
}

interface PermissionRowProps {
    node: PermissionNode;
    depth: number;
    selected: Set<string>;
    expandedKeys: Set<string>;
    onToggle: (key: string) => void;
    onToggleAll: (keys: string[], checked: boolean) => void;
    onToggleExpand: (key: string) => void;
}

function PermissionRow({
    node,
    depth,
    selected,
    expandedKeys,
    onToggle,
    onToggleAll,
    onToggleExpand,
}: PermissionRowProps) {
    const isExpanded = expandedKeys.has(node.key);
    const subtreeKeys = getSubtreeKeys(node);
    const selectAllState = getSelectionState(node, selected);
    const hasChildren = node.children && node.children.length > 0;

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

                <Checkbox
                    checked={selectAllState}
                    onCheckedChange={(checked) =>
                        onToggleAll(
                            subtreeKeys,
                            checked === true || checked === 'indeterminate'
                                ? false
                                : true,
                        )
                    }
                    aria-label={`Select all ${node.label} permissions`}
                />
            </div>

            <div
                className="flex flex-wrap gap-3 pb-2"
                style={{ paddingLeft: (depth + 1) * 24 + 24 }}
            >
                {node.permissions.map((perm) => {
                    const key = getPermissionKey(node.key, perm);
                    return (
                        <label
                            key={key}
                            className="flex items-center gap-1.5 cursor-pointer text-sm"
                        >
                            <Checkbox
                                checked={selected.has(key)}
                                onCheckedChange={() => onToggle(key)}
                            />
                            <span className="capitalize text-muted-foreground">
                                {perm.replace(/-/g, ' ')}
                            </span>
                        </label>
                    );
                })}

                {node.scopedPermissions?.map((sp) => (
                    <div key={sp.key} className="flex items-center gap-2 py-0.5 w-full">
                        <span className="text-sm text-muted-foreground min-w-[110px]">
                            {sp.label}
                        </span>
                        {sp.scopes.map((scope) => {
                            const key = `${node.key}.${sp.key}.${scope}`;
                            return (
                                <label
                                    key={key}
                                    className="flex items-center gap-1 cursor-pointer text-sm"
                                >
                                    <Checkbox
                                        checked={selected.has(key)}
                                        onCheckedChange={() => onToggle(key)}
                                    />
                                    <span className="capitalize text-muted-foreground">
                                        {scope}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                ))}
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
    const { selected, toggle, toggleAll } = usePermissionState();
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
        new Set(['aip']),
    );

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
                        onClick={() => onOpenChange(false)}
                    >
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
