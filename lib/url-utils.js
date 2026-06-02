/**
 * Validates if a URL is from an allowed domain
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if the URL is from an allowed domain
 */
export function isSafeUrl(url) {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    const allowedDomains = [
      'system.gotsport.com',
      'google.com',
      'weather.com',
      'shotsbyryanq.pixieset.com'
    ];

    return allowedDomains.some(domain =>
      parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Sanitizes a URL for display purposes
 * @param {string} url - The URL to sanitize
 * @returns {string} - The sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url) {
  if (!isSafeUrl(url)) return '';
  return url;
}