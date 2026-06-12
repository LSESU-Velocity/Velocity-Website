/**
 * Shared user-input sanitizer for Launchpad API handlers.
 * Strips prompt-injection framing before text is embedded in prompts.
 */

const DANGEROUS_PATTERNS = [
  /```/g,
  /"""/g,
  /\n\s*---+\s*\n/g,
  /\n\s*===+\s*\n/g,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<\|.*?\|>/g,
  /<<SYS>>|<<\/SYS>>/gi,
  /IGNORE\s+(ALL\s+)?(PREVIOUS|ABOVE|PRIOR)\s+INSTRUCTIONS?/gi,
  /DISREGARD\s+(ALL\s+)?(PREVIOUS|ABOVE|PRIOR)\s+INSTRUCTIONS?/gi,
  /FORGET\s+(ALL\s+)?(PREVIOUS|ABOVE|PRIOR)\s+INSTRUCTIONS?/gi,
  /NEW\s+INSTRUCTIONS?\s*:/gi,
  /SYSTEM\s*:/gi,
  /ASSISTANT\s*:/gi,
  /USER\s*:/gi,
  /HUMAN\s*:/gi,
];

export function sanitizeUserInput(input: string, maxLength = 500): string {
  let sanitized = input;

  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, ' ');
  }

  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}
