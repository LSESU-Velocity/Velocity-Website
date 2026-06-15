import React, { useEffect, useState } from 'react';
import {
    ARTIFACT_PREVIEW_MAX_AGE_MS,
    ARTIFACT_PREVIEW_STORAGE_PREFIX,
    submitArtifactForm,
} from './ArtifactFrame';

interface StoredArtifactPreview {
    createdAt: number;
    html: string;
}

function readStoredPreview(): StoredArtifactPreview | null {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!/^[a-zA-Z0-9.-]+$/.test(id)) {
        return null;
    }

    const storageKey = `${ARTIFACT_PREVIEW_STORAGE_PREFIX}${id}`;
    const raw = localStorage.getItem(storageKey);
    localStorage.removeItem(storageKey);

    if (!raw) {
        return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredArtifactPreview>;
    if (
        typeof parsed.html !== 'string' ||
        typeof parsed.createdAt !== 'number' ||
        Date.now() - parsed.createdAt > ARTIFACT_PREVIEW_MAX_AGE_MS
    ) {
        return null;
    }

    return {
        createdAt: parsed.createdAt,
        html: parsed.html,
    };
}

export const ArtifactPreviewRedirect: React.FC = () => {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const preview = readStoredPreview();
            if (!preview) {
                setError('This preview link expired. Open the artifact again from Launchpad.');
                return;
            }

            submitArtifactForm(preview.html, '_self');
        } catch {
            setError('This preview could not be opened. Return to Launchpad and try again.');
        }
    }, []);

    return (
        <section className="min-h-screen bg-black px-6 py-32 text-white">
            <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="font-sans text-sm text-white/70">
                    {error || 'Opening preview...'}
                </p>
            </div>
        </section>
    );
};
