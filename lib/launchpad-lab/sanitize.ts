/**
 * Shared user-input sanitizer for Launchpad API handlers.
 * Strips prompt-injection framing before text is embedded in prompts.
 */

const DANGEROUS_PATTERNS = [
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  /<[^>]+>/g,
  /\bon\w+\s*=/gi,
  /javascript\s*:/gi,
  /document\s*\.\s*cookie/gi,
  /localStorage\s*\.\s*[a-zA-Z0-9_$]+/g,
  /sessionStorage\s*\.\s*[a-zA-Z0-9_$]+/g,
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

const CREDENTIAL_THEFT_PATTERNS = [
  /\b(?:silently|secretly|covertly|without\s+(?:user\s+)?consent)\b.{0,140}\b(?:copy|copies|copied|copying|collects?|collected|collecting|steals?|stole|stolen|stealing|scrapes?|scraped|scraping|exfiltrat\w*|sends?|sent|sending|uploads?|uploaded|uploading|harvests?|harvested|harvesting)\b.{0,140}\b(?:api\s*keys?|passwords?|tokens?|cookies?|credentials?|browser\s+storage|local\s*storage|session\s*storage)\b/i,
  /\b(?:copy|copies|copied|copying|collects?|collected|collecting|steals?|stole|stolen|stealing|scrapes?|scraped|scraping|exfiltrat\w*|harvests?|harvested|harvesting)\b.{0,140}\b(?:api\s*keys?|passwords?|tokens?|cookies?|credentials?|browser\s+storage|local\s*storage|session\s*storage)\b.{0,140}\b(?:webhook|attacker|external\s+server|third[-\s]?party)\b/i,
  /\b(?:api\s*keys?|passwords?|tokens?|cookies?|credentials?)\b.{0,140}\b(?:webhook|attacker|external\s+server|third[-\s]?party)\b.{0,140}\b(?:without\s+(?:user\s+)?consent|silently|secretly|covertly)\b/i,
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

export function getLaunchpadInputSafetyIssue(input: string): string | null {
  if (CREDENTIAL_THEFT_PATTERNS.some((pattern) => pattern.test(input))) {
    return 'Launchpad cannot evaluate ideas or instructions involving credential theft or covert data exfiltration. Reframe the idea around consent-based, privacy-safe user value.';
  }

  return null;
}
