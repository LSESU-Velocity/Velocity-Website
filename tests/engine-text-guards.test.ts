import { describe, expect, it } from 'vitest';
import { isOptOut, sanitizeFollowUpText } from '../lib/automation-intake/engine.js';

describe('sanitizeFollowUpText', () => {
  it('accepts a clean single question', () => {
    expect(sanitizeFollowUpText('Which tool owns the final approval step?')).toBe(
      'Which tool owns the final approval step?',
    );
  });

  it('rejects text without a question mark', () => {
    expect(sanitizeFollowUpText('Tell me more about your tools.')).toBeNull();
  });

  it('rejects markdown, HTML, and URLs', () => {
    expect(sanitizeFollowUpText('```code``` what next?')).toBeNull();
    expect(sanitizeFollowUpText('<b>What</b> tools do you use?')).toBeNull();
    expect(sanitizeFollowUpText('See https://evil.example, which tools?')).toBeNull();
  });

  it('rejects overlong questions instead of truncating mid-sentence', () => {
    expect(sanitizeFollowUpText(`${'word '.repeat(50)}?`)).toBeNull();
  });

  it('rejects list formatting', () => {
    expect(sanitizeFollowUpText('- What tools do you use?')).toBeNull();
    expect(sanitizeFollowUpText('1. What tools do you use?')).toBeNull();
  });

  it('strips filler openers but keeps the question', () => {
    expect(sanitizeFollowUpText('Great! Which team owns this workflow?')).toBe(
      'Which team owns this workflow?',
    );
  });

  it('collapses internal newlines', () => {
    expect(sanitizeFollowUpText('Which tools\nrun the workflow?')).toBe(
      'Which tools run the workflow?',
    );
  });
});

describe('isOptOut', () => {
  it.each(['no', 'Nope.', 'skip', "that's all", 'move on', 'idk', "I'm done"])(
    'treats %j as an opt-out',
    (input) => {
      expect(isOptOut(input)).toBe(true);
    },
  );

  it('does NOT treat substantive answers starting with "no" as opt-outs', () => {
    expect(isOptOut("No, we don't use AI yet because of compliance concerns")).toBe(false);
  });

  it('does not opt out on long messages', () => {
    expect(isOptOut(`no ${'more detail '.repeat(20)}`)).toBe(false);
  });

  it('does not opt out on empty input', () => {
    expect(isOptOut('')).toBe(false);
  });
});
