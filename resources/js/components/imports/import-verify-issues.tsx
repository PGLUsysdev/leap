// resources/js/components/imports/import-verify-issues.tsx

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type VerifyIssue = {
    row: number;
    message: string;
};

interface ImportVerifyIssuesProps {
    errors: VerifyIssue[];
    warnings?: VerifyIssue[];
    details?: string[];
    message?: string;
    valid?: boolean;
    warningsHint?: string;
    className?: string;
    maxHeightClassName?: string;
}

function IssueList({
    issues,
    emptyText,
    tone,
}: {
    issues: VerifyIssue[];
    emptyText: string;
    tone: 'error' | 'warning';
}) {
    if (issues.length === 0) {
        return (
            <p className="text-muted-foreground py-6 text-center text-sm">
                {emptyText}
            </p>
        );
    }

    const textTone =
        tone === 'error'
            ? 'text-destructive'
            : 'text-amber-700 dark:text-amber-500';

    return (
        <ul
            className={`flex flex-col gap-1 overflow-y-auto text-sm ${textTone}`}
        >
            {issues.map((issue, i) => (
                <li
                    key={`${issue.row}-${i}`}
                    className="flex gap-2 leading-relaxed"
                >
                    <span className="shrink-0 pt-0.5 font-mono text-xs opacity-70">
                        Row {issue.row}:
                    </span>
                    <span className="min-w-0 flex-1">{issue.message}</span>
                </li>
            ))}
        </ul>
    );
}

export function ImportVerifyIssues({
    errors,
    warnings = [],
    details = [],
    message,
    valid,
    warningsHint,
    className,
    maxHeightClassName = 'max-h-64',
}: ImportVerifyIssuesProps) {
    const hasErrors = errors.length > 0;
    const hasWarnings = warnings.length > 0;

    const [active, setActive] = useState<string>(
        hasErrors ? 'errors' : hasWarnings ? 'warnings' : 'errors',
    );

    // Keep the active tab on a populated one when the shape changes.
    // Both populated → leave the user's choice alone.
    useEffect(() => {
        if (hasErrors && hasWarnings) return;
        if (hasErrors) setActive('errors');
        else if (hasWarnings) setActive('warnings');
        else setActive('errors');
    }, [hasErrors, hasWarnings]);

    return (
        <div
            className={`flex flex-col gap-3 rounded-md border p-3 ${className ?? ''}`}
        >
            {message && (
                <p
                    className={`text-sm font-medium ${
                        valid === false
                            ? 'text-destructive'
                            : valid
                              ? 'text-green-600'
                              : 'text-foreground'
                    }`}
                >
                    {valid === true ? '✅ ' : valid === false ? '❌ ' : ''}
                    {message}
                </p>
            )}

            <Tabs value={active} onValueChange={setActive}>
                <TabsList>
                    <TabsTrigger value="errors" disabled={!hasErrors}>
                        Errors
                        <span
                            className={`ml-1 rounded px-1.5 py-0.5 text-xs ${
                                hasErrors
                                    ? 'bg-destructive text-destructive-foreground'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            {errors.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="warnings" disabled={!hasWarnings}>
                        Warnings
                        <span
                            className={`ml-1 rounded px-1.5 py-0.5 text-xs ${
                                hasWarnings
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            {warnings.length}
                        </span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent
                    value="errors"
                    className={`mt-3 ${maxHeightClassName} overflow-y-auto rounded border p-2`}
                >
                    <IssueList
                        issues={errors}
                        emptyText="No errors."
                        tone="error"
                    />
                </TabsContent>

                <TabsContent
                    value="warnings"
                    className={`mt-3 ${maxHeightClassName} overflow-y-auto rounded border p-2`}
                >
                    {hasWarnings && warningsHint && (
                        <p className="mb-2 text-xs font-medium text-amber-600">
                            ⚠ {warnings.length} warning
                            {warnings.length === 1 ? '' : 's'} — {warningsHint}
                        </p>
                    )}
                    {hasWarnings && !warningsHint && (
                        <p className="mb-2 text-xs font-medium text-amber-600">
                            ⚠ {warnings.length} warning
                            {warnings.length === 1 ? '' : 's'}
                        </p>
                    )}
                    <IssueList
                        issues={warnings}
                        emptyText="No warnings."
                        tone="warning"
                    />
                </TabsContent>
            </Tabs>

            {details.length > 0 && (
                <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
                    {details.map((d, i) => (
                        <li key={i}>{d}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}
