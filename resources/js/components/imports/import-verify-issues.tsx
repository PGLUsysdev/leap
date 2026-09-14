// resources/js/components/imports/import-verify-issues.tsx
//
// Shared verify issue viewer used by all import flows.
// - Displays two issue severities as inner tabs: Errors (blocking) | Warnings (non-blocking)
// - Empty severity tabs are rendered disabled with count 0 per design decision
// - Verification logic stays separate per file-input family (PPMP vs AIP Summary);
//   this component only owns the list rendering. PPMP callers pass warnings=[];
//   AIP callers pass both arrays (see `verify.ts:35-44` — errors block, warnings pass).
// - Sheet picker / Run Verify button / gating remain in the page; this component
//   renders the selected sheet's result.

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
    /** Optional header hint for warnings (AIP: "formatting only, sheet still passes"). Omit for PPMP. */
    warningsHint?: string;
    className?: string;
    /** Max height for scrollable issue lists */
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
                    <span className="font-mono text-xs opacity-70 shrink-0 pt-0.5">
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
    const bothEmpty = !hasErrors && !hasWarnings;

    const defaultTab = hasErrors ? 'errors' : hasWarnings ? 'warnings' : 'errors';
    const [active, setActive] = useState<string>(defaultTab);

    useEffect(() => {
        if (bothEmpty) {
            setActive('errors');
            return;
        }
        if (hasErrors && hasWarnings) return; // keep user choice
        if (hasErrors && active === 'warnings') setActive('errors');
        if (hasWarnings && active === 'errors' && !hasErrors) setActive('warnings');
        if (!hasErrors && !hasWarnings) setActive('errors');
    }, [hasErrors, hasWarnings, active, bothEmpty]);

    if (bothEmpty) {
        const showStandaloneMessage = !!message || details.length > 0;

        if (!showStandaloneMessage) {
            // Embedded use (PPMP) — outer card already shows Format OK; just show disabled tabs placeholder
            return (
                <div
                    className={`flex flex-col gap-2 rounded-md border p-2 ${className ?? ''}`}
                >
                    <div className="flex gap-2">
                        <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs">
                            Errors (0)
                        </span>
                        <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs opacity-60">
                            Warnings (0)
                        </span>
                    </div>
                    <p className="text-muted-foreground py-4 text-center text-xs">
                        No warnings or errors — sheet passes.
                    </p>
                </div>
            );
        }

        return (
            <div
                className={`flex flex-col gap-2 rounded-md border p-3 ${className ?? ''}`}
            >
                {message && (
                    <p
                        className={`text-sm font-medium ${valid === false ? 'text-destructive' : 'text-green-600'}`}
                    >
                        {valid === false ? '❌ ' : '✅ '}
                        {message}
                    </p>
                )}
                {!message && (
                    <p className="text-sm font-medium text-green-600">
                        ✅ No issues — sheet passes
                    </p>
                )}
                {details.length > 0 && (
                    <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
                        {details.map((d, i) => (
                            <li key={i}>{d}</li>
                        ))}
                    </ul>
                )}
                <div className="flex gap-2 pt-2">
                    <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs">
                        Errors (0)
                    </span>
                    <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs opacity-60">
                        Warnings (0)
                    </span>
                </div>
                <p className="text-muted-foreground text-xs">
                    No warnings or errors detected.
                </p>
            </div>
        );
    }

    return (
        <div
            className={`flex flex-col gap-3 rounded-md border p-3 ${className ?? ''}`}
        >
            {message && (
                <p
                    className={`text-sm font-medium ${valid === false ? 'text-destructive' : valid ? 'text-green-600' : 'text-foreground'}`}
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
                            className={`ml-1 rounded px-1.5 py-0.5 text-xs ${hasErrors ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'}`}
                        >
                            {errors.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="warnings" disabled={!hasWarnings}>
                        Warnings
                        <span
                            className={`ml-1 rounded px-1.5 py-0.5 text-xs ${hasWarnings ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'}`}
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
                            {warnings.length === 1 ? '' : 's'} —{' '}
                            {warningsHint}
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
