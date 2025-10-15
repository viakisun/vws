/**
 * Link Type Detection Utility
 * Automatically detects the type of external links based on URL patterns
 */

import type { ProductReferenceType } from '$lib/planner/types'

/**
 * Detects the type of reference based on URL patterns
 * @param url - The URL to analyze
 * @param filename - Optional filename to help with detection
 * @returns The detected reference type
 */
export function detectLinkType(url: string, filename?: string): ProductReferenceType {
  if (!url || typeof url !== 'string') {
    return 'other'
  }

  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    const pathname = urlObj.pathname.toLowerCase()
    const searchParams = urlObj.searchParams

    // File extension detection SHOULD come FIRST to override service-specific detection
    // PDF detection - check extension or explicit file type
    const fullUrl = url.toLowerCase()
    const hasPdfExtension =
      pathname.toLowerCase().endsWith('.pdf') ||
      searchParams.get('format') === 'pdf' ||
      searchParams.get('filename')?.toLowerCase().endsWith('.pdf') ||
      searchParams.get('name')?.toLowerCase().endsWith('.pdf') ||
      filename?.toLowerCase().endsWith('.pdf') ||
      (fullUrl.includes('.pdf') && (fullUrl.includes('filename=') || fullUrl.includes('name=')))

    if (hasPdfExtension) {
      return 'pdf'
    }

    // Image detection
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff']
    if (
      imageExtensions.some((ext) => pathname.toLowerCase().endsWith(ext)) ||
      imageExtensions.some((ext) => filename?.toLowerCase().endsWith(ext))
    ) {
      return 'image'
    }

    // Check for other common file types that should be treated as files
    const fileExtensions = [
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.ppt',
      '.pptx',
      '.txt',
      '.rtf',
      '.csv',
      '.zip',
      '.rar',
      '.7z',
      '.tar',
      '.gz',
      '.mp3',
      '.mp4',
      '.avi',
      '.mov',
      '.wav',
      '.psd',
      '.ai',
      '.eps',
      '.sketch',
    ]
    if (
      fileExtensions.some((ext) => pathname.toLowerCase().endsWith(ext)) ||
      fileExtensions.some((ext) => filename?.toLowerCase().endsWith(ext))
    ) {
      return 'file'
    }

    // Service-specific detection comes AFTER file extension detection
    // Figma links
    if (hostname.includes('figma.com')) {
      return 'figma'
    }

    // Notion links
    if (hostname.includes('notion.so') || hostname.includes('notion.site')) {
      return 'notion'
    }

    // Google Docs/Drive links
    if (hostname.includes('docs.google.com') || hostname.includes('drive.google.com')) {
      return 'google_docs'
    }

    // GitHub links
    if (hostname.includes('github.com') || hostname.includes('github.io')) {
      return 'github'
    }

    // YouTube links
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube'
    }

    // Slack links
    if (hostname.includes('slack.com') || hostname.includes('app.slack.com')) {
      return 'slack'
    }

    // Discord links
    if (hostname.includes('discord.com') || hostname.includes('discord.gg')) {
      return 'discord'
    }

    // Zoom/Meet links
    if (
      hostname.includes('zoom.us') ||
      hostname.includes('meet.google.com') ||
      hostname.includes('teams.microsoft.com')
    ) {
      return 'zoom'
    }

    // Trello links
    if (hostname.includes('trello.com')) {
      return 'trello'
    }

    // Jira links (Atlassian)
    if (hostname.includes('atlassian.net') || hostname.includes('jira.')) {
      return 'jira'
    }

    // Miro links
    if (hostname.includes('miro.com')) {
      return 'miro'
    }

    // Adobe links (Creative Cloud, etc.)
    if (
      hostname.includes('adobe.com') ||
      hostname.includes('behance.net') ||
      hostname.includes('dribbble.com')
    ) {
      return 'adobe'
    }

    // If it's a valid URL but doesn't match any specific patterns
    return 'url'
  } catch {
    // If URL parsing fails, try to detect from filename
    if (filename) {
      const lowerFilename = filename.toLowerCase()

      if (lowerFilename.endsWith('.pdf')) {
        return 'pdf'
      }

      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff']
      if (imageExtensions.some((ext) => lowerFilename.endsWith(ext))) {
        return 'image'
      }

      const fileExtensions = [
        '.doc',
        '.docx',
        '.xls',
        '.xlsx',
        '.ppt',
        '.pptx',
        '.txt',
        '.rtf',
        '.csv',
        '.zip',
        '.rar',
        '.7z',
        '.tar',
        '.gz',
        '.mp3',
        '.mp4',
        '.avi',
        '.mov',
        '.wav',
        '.psd',
        '.ai',
        '.eps',
        '.sketch',
      ]
      if (fileExtensions.some((ext) => lowerFilename.endsWith(ext))) {
        return 'file'
      }
    }

    return 'other'
  }
}

/**
 * Determines if a URL is a file that should be uploaded or if it's an external link
 * @param url - The URL to check
 * @returns true if it should be treated as a file upload, false if it's a link
 */
export function isFileUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.toLowerCase()

    // Check for file extensions that should be uploaded
    const fileExtensions = [
      '.pdf',
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.svg',
      '.bmp',
      '.tiff',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.ppt',
      '.pptx',
      '.zip',
      '.rar',
      '.7z',
      '.tar',
      '.gz',
    ]

    return fileExtensions.some((ext) => pathname.endsWith(ext))
  } catch {
    return false
  }
}

/**
 * Validates if a URL is properly formatted
 * @param url - The URL to validate
 * @returns true if the URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Extracts domain name from URL for display purposes
 * @param url - The URL to extract domain from
 * @returns The domain name or null if invalid
 */
export function extractDomain(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }

  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return null
  }
}

/**
 * Gets a human-readable label for the reference type
 * @param type - The reference type
 * @returns A human-readable label
 */
export function getReferenceTypeLabel(type: ProductReferenceType): string {
  const labels: Record<ProductReferenceType, string> = {
    file: 'File',
    url: 'Link',
    figma: 'Figma',
    notion: 'Notion',
    google_docs: 'Google Docs',
    pdf: 'PDF',
    image: 'Image',
    github: 'GitHub',
    youtube: 'YouTube',
    slack: 'Slack',
    discord: 'Discord',
    zoom: 'Meeting',
    trello: 'Trello',
    jira: 'Jira',
    miro: 'Miro',
    adobe: 'Adobe',
    other: 'Other',
  }

  return labels[type] || 'Unknown'
}
