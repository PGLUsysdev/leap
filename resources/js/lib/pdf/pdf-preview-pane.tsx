// resources\js\lib\pdf\pdf-preview-pane.tsx

import { Spinner } from '@/components/ui/spinner';
import type { PdfPreviewStatus } from './use-pdf-preview';

interface PdfPreviewPaneProps {
    url: string | null;
    status: PdfPreviewStatus;
    busy?: boolean;
    title?: string;
}

/**
 * Renders the current state of a PDF preview: the generated document inside an
 * iframe, a spinner/caption placeholder while it is still being generated, or
 * an error message. Consumers own the positioning wrapper (a `relative`
 * container) so the translucent busy overlay covers exactly their area.
 */
export function PdfPreviewPane({
    url,
    status,
    busy = false,
    title = 'PDF Preview',
}: PdfPreviewPaneProps) {
    if (url) {
        return (
            <>
                <iframe
                    src={url}
                    title={title}
                    className="h-full w-full border-none"
                />

                {busy && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[1px]">
                        <Spinner />
                    </div>
                )}
            </>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex h-full items-center justify-center">
                <span className="text-sm">
                    Failed to generate the PDF preview. Please try again.
                </span>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col items-center justify-center gap-3">
            <Spinner className="h-10 w-10 animate-spin" />

            <span className="text-sm">Generating preview...</span>
        </div>
    );
}
