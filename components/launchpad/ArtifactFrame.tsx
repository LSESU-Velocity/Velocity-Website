/**
 * CSP-safe artifact previews.
 *
 * Generated artifacts rely on inline styles/scripts and CDN assets, which the
 * site's strict CSP blocks inside srcdoc iframes (they inherit the parent
 * policy). Instead, the HTML is form-POSTed to /api/artifact-preview, which
 * echoes it back as a standalone response carrying its own
 * `Content-Security-Policy: sandbox` header — an opaque origin with no
 * access to this app, its storage, or its cookies.
 */
import React, { useEffect, useId, useRef } from 'react';

const PREVIEW_ENDPOINT = '/api/artifact-preview';

export function openArtifactInNewTab(html: string) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = PREVIEW_ENDPOINT;
    form.target = '_blank';
    form.rel = 'noopener';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'html';
    input.value = html;
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
    form.remove();
}

export function downloadHtml(html: string, filename: string) {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/** Rewrites CDN reveal.js references to the self-hosted copies. */
export function normalizePitchDeckHtml(pitchDeckHtml: string) {
    let html = pitchDeckHtml.trim();

    html = html
        .replace(/https?:\/\/cdn\.jsdelivr\.net\/npm\/reveal\.js@[^"' )]+\/dist\/reveal\.css/gi, '/reveal/reveal.css')
        .replace(/https?:\/\/cdn\.jsdelivr\.net\/npm\/reveal\.js@[^"' )]+\/dist\/theme\/black\.css/gi, '/reveal/theme/black.css')
        .replace(/https?:\/\/cdn\.jsdelivr\.net\/npm\/reveal\.js@[^"' )]+\/dist\/reveal\.js/gi, '/reveal/reveal.js');

    if (!/\/reveal\/reveal\.css/i.test(html)) {
        html = html.replace('</head>', '<link rel="stylesheet" href="/reveal/reveal.css" /></head>');
    }

    if (!/\/reveal\/theme\/black\.css/i.test(html)) {
        html = html.replace('</head>', '<link rel="stylesheet" href="/reveal/theme/black.css" /></head>');
    }

    html = html.replace(/<script\b[^>]*>[\s\S]*?Reveal\.initialize[\s\S]*?<\/script>/gi, '');

    if (!/\/reveal\/reveal\.js/i.test(html)) {
        html = html.replace('</body>', '<script src="/reveal/reveal.js"></script></body>');
    }

    if (!/\/deck-runtime\.js/i.test(html)) {
        html = html.replace('</body>', '<script src="/deck-runtime.js"></script></body>');
    }

    return html;
}

interface ArtifactFrameProps {
    html: string;
    title: string;
    className?: string;
}

export const ArtifactFrame: React.FC<ArtifactFrameProps> = ({ html, title, className }) => {
    const frameName = `artifact-frame-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        formRef.current?.submit();
    }, [html]);

    return (
        <>
            <form
                ref={formRef}
                method="POST"
                action={PREVIEW_ENDPOINT}
                target={frameName}
                className="hidden"
                aria-hidden="true"
            >
                <input type="hidden" name="html" value={html} readOnly />
            </form>
            <iframe
                name={frameName}
                title={title}
                className={className}
                sandbox="allow-scripts allow-forms"
            />
        </>
    );
};
