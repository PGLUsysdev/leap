import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface FormDialogShellProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: React.ReactNode;
    isLoading?: boolean;
    children: React.ReactNode;
    // Footer actions
    onReset?: () => void;
    onCancel: () => void;
    submitLabel: string;
    submittingLabel: string;
    formId: string;
    className?: string;
    submitDisabled?: boolean;
    extraFooter?: React.ReactNode;
}

export function FormDialogShell({
    open,
    onOpenChange,
    title,
    description,
    isLoading = false,
    children,
    onReset,
    onCancel,
    submitLabel,
    submittingLabel,
    formId,
    className,
    submitDisabled = false,
    extraFooter,
}: FormDialogShellProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    'flex max-h-[90vh] flex-col sm:max-w-2xl',
                    className,
                )}
                onPointerDownOutside={(e) => {
                    const target = e.target as HTMLElement;

                    // If submitting, always prevent closing
                    if (isLoading) {
                        e.preventDefault();
                        return;
                    }

                    // Ignore pointer events from Radix portal elements
                    // (Select dropdowns, Tooltips, etc.) — they render outside
                    // DialogContent and would otherwise trigger an outside click.
                    if (
                        target?.closest('[data-radix-select-content]') ||
                        target?.closest('[role="listbox"]') ||
                        target?.closest('.z-50')
                    ) {
                        e.preventDefault();
                    }
                }}
                onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {children}

                <DialogFooter>
                    {extraFooter}

                    {onReset && (
                        <Button
                            variant="outline"
                            type="button"
                            onClick={onReset}
                            disabled={isLoading}
                        >
                            Reset
                        </Button>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        form={formId}
                        disabled={isLoading || submitDisabled}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-1">
                                <Spinner />
                                {submittingLabel}
                            </span>
                        ) : (
                            submitLabel
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
