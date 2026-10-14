/** Resolve image paths returned by the API without breaking absolute or data URLs. */
export function resolveImageUrl(path?: string | null): string | undefined {
    const value = path?.trim();
    if (!value) return undefined;

    if (/^(https?:|data:|blob:)/i.test(value)) return value;

    const apiOrigin = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080')
        .trim()
        .replace(/\/+$/, '');
    const relativePath = value.replace(/^\/+/, '');

    try {
        return new URL(relativePath, `${apiOrigin}/`).toString();
    } catch {
        return undefined;
    }
}
