import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'default' | 'danger';
    loading?: boolean;
    secondaryLabel?: string;
    onSecondary?: () => void;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    tone = 'default',
    loading = false,
    secondaryLabel,
    onSecondary,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    useEffect(() => {
        if (!open) return;
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !loading) onCancel();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open, loading, onCancel]);

    if (!open) return null;

    const confirmClass =
        tone === 'danger'
            ? 'bg-[#B91C1C] hover:bg-[#991B1B]'
            : 'bg-[#B45309] hover:bg-[#92400E]';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="presentation" onClick={loading ? undefined : onCancel}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl sm:p-6"
                onClick={(event) => event.stopPropagation()}
            >
                <h2 id="confirm-dialog-title" className="font-display text-lg font-semibold text-[#291D16]">
                    {title}
                </h2>
                <p className="mt-2 text-sm text-[#5C4A3E]">{message}</p>
                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-lg border border-[#EAE1D5] px-4 py-2 text-sm font-semibold text-[#5C4A3E] hover:bg-[#FAF7F2] disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    {secondaryLabel && onSecondary && (
                        <button
                            type="button"
                            onClick={onSecondary}
                            disabled={loading}
                            className="rounded-lg border border-[#B45309] px-4 py-2 text-sm font-semibold text-[#B45309] hover:bg-[#FAF3E8] disabled:opacity-50"
                        >
                            {secondaryLabel}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${confirmClass}`}
                    >
                        {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
