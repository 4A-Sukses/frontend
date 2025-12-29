/**
 * Utility function to strip HTML tags from content for preview purposes
 * @param html - HTML string to strip
 * @param maxLength - Optional max length for preview text
 * @returns Plain text string
 */
export function stripHtml(html: string, maxLength?: number): string {
    if (!html) return ''

    // Remove HTML tags
    let text = html
        .replace(/<[^>]*>/g, '')  // Remove HTML tags
        .replace(/&nbsp;/g, ' ')   // Replace &nbsp; with space
        .replace(/&amp;/g, '&')    // Replace &amp; with &
        .replace(/&lt;/g, '<')     // Replace &lt; with <
        .replace(/&gt;/g, '>')     // Replace &gt; with >
        .replace(/&quot;/g, '"')   // Replace &quot; with "
        .replace(/&#039;/g, "'")   // Replace &#039; with '
        .replace(/\s+/g, ' ')      // Replace multiple whitespace with single space
        .trim()

    // Truncate if maxLength is provided
    if (maxLength && text.length > maxLength) {
        text = text.substring(0, maxLength).trim() + '...'
    }

    return text
}

/**
 * Check if content contains HTML tags
 * @param content - String to check
 * @returns boolean indicating if HTML tags are present
 */
export function hasHtmlContent(content: string): boolean {
    return /<[^>]*>/.test(content)
}
