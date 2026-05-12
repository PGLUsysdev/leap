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
                onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
                onPointerDownOutside={(e) => isLoading && e.preventDefault()}
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
