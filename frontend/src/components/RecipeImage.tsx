import { useState } from 'react';
import { Utensils } from 'lucide-react';
import { resolveImageUrl } from '../lib/imageUrl';

type RecipeImageProps = {
    src?: string | null;
    alt: string;
    className?: string;
    fallbackClassName?: string;
    iconSize?: number;
};

/** A consistent recipe image with safe URL resolution and a graceful fallback. */
export default function RecipeImage({
    src,
    alt,
    className = 'h-full w-full object-cover',
    fallbackClassName = 'flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-violet-50 text-emerald-300',
    iconSize = 42,
}: RecipeImageProps) {
    const [failedUrl, setFailedUrl] = useState<string>();
    const imageUrl = resolveImageUrl(src);

    if (!imageUrl || failedUrl === imageUrl) {
        return <div role="img" aria-label={alt || 'Food image unavailable'} className={fallbackClassName}>
            <Utensils size={iconSize} aria-hidden="true" />
        </div>;
    }

    return <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailedUrl(imageUrl)}
        className={className}
    />;
}
