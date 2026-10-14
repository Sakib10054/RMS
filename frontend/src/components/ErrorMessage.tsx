type ErrorMessageProps = {
    message: string;
    onRetry?: () => void;
};

export default function ErrorMessage({
                                         message,
                                         onRetry,
                                     }: ErrorMessageProps) {
    return (
        <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
            <p>{message}</p>

            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-3 rounded-md bg-red-600 px-3 py-2 font-medium text-white hover:bg-red-700"
                >
                    Try Again
                </button>
            )}
        </div>
    );
}