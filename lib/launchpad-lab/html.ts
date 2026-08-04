/**
 * Shared helpers for handling model-generated text and HTML documents.
 * Used by the analysis pipeline and widget mutations.
 */

/** Extract plain text from a LangChain message result (string or content parts). */
export function extractTextContent(result: unknown): string {
  if (typeof result === 'string') {
    return result;
  }

  if (result && typeof result === 'object' && 'content' in result) {
    const content = (result as { content: unknown }).content;

    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (typeof part === 'string') {
            return part;
          }

          if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
            return part.text;
          }

          return '';
        })
        .filter(Boolean)
        .join('\n');
    }
  }

  return '';
}

/**
 * Strip markdown fences and leading commentary from a model-generated HTML
 * document. Returns undefined when no <html> document remains.
 */
export function sanitizeHtmlDocument(rawText: string): string | undefined {
  let html = rawText.trim();

  if (!html) {
    return undefined;
  }

  html = html.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  const lower = html.toLowerCase();
  const doctypeIndex = lower.indexOf('<!doctype');
  const htmlIndex = lower.indexOf('<html');
  const startIndex = doctypeIndex >= 0 ? doctypeIndex : htmlIndex;

  if (startIndex > 0) {
    html = html.slice(startIndex).trim();
  }

  return html.includes('<html') ? html : undefined;
}
