type ConfirmDialogProps = {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
};

export default function ConfirmDialog({
                                          open,
                                          title,
                                          message,
                                          confirmText = "Confirm",
                                          cancelText = "Cancel",
                                          onConfirm,
                                          onCancel,
                                          isLoading = false,
                                      }: ConfirmDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            >
                <h2
                    id="confirm-dialog-title"
                    className="text-lg font-semibold text-gray-900"
                >
                    {title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-600">{message}</p>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        {isLoading ? "Please wait..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}