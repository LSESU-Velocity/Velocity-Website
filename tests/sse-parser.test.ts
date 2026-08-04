import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnalysisInterruptError, generateAnalysisStream } from '../lib/api.js';

/** Build a Response whose body arrives in the given chunks. */
function streamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream, { status: 200 });
}

const RESULT = { identity: { name: 'TestCo', tagline: 'Testing' } };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('generateAnalysisStream SSE parsing', () => {
  it('parses progress events and returns the result', async () => {
    const body = [
      'event: progress\ndata: {"node":"classifyIdea","status":"running"}\n\n',
      'event: progress\ndata: {"node":"classifyIdea","status":"done"}\n\n',
      `event: result\ndata: ${JSON.stringify(RESULT)}\n\n`,
    ];
    vi.stubGlobal('fetch', vi.fn(async () => streamResponse(body)));

    const progress: string[] = [];
    const result = await generateAnalysisStream('an idea', 'key', (event) => {
      progress.push(`${event.node}:${event.status}`);
    });

    expect(progress).toEqual(['classifyIdea:running', 'classifyIdea:done']);
    expect(result).toEqual(RESULT);
  });

  it('handles a single event split across network chunks', async () => {
    const payload = `event: result\ndata: ${JSON.stringify(RESULT)}\n\n`;
    // Split mid-line to simulate real chunking of a large result event.
    const cut = payload.indexOf('"tagline"');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => streamResponse([payload.slice(0, cut), payload.slice(cut)])),
    );

    const result = await generateAnalysisStream('an idea', 'key', () => {});
    expect(result).toEqual(RESULT);
  });

  it('throws AnalysisInterruptError on interrupt events', async () => {
    const interrupt = {
      reason: 'Needs detail',
      questions: [{ field: 'domain', question: 'What area?' }],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => streamResponse([`event: interrupt\ndata: ${JSON.stringify(interrupt)}\n\n`])),
    );

    await expect(generateAnalysisStream('an idea', 'key', () => {})).rejects.toBeInstanceOf(
      AnalysisInterruptError,
    );
  });

  it('throws the server error message on error events', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => streamResponse(['event: error\ndata: {"error":"Key rejected"}\n\n'])),
    );

    await expect(generateAnalysisStream('an idea', 'key', () => {})).rejects.toThrow('Key rejected');
  });

  it('throws when the stream ends without a result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => streamResponse(['event: progress\ndata: {"node":"x","status":"running"}\n\n'])),
    );

    await expect(generateAnalysisStream('an idea', 'key', () => {})).rejects.toThrow(
      'Stream ended without a result event',
    );
  });
});
