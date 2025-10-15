/**
 * Link Type Detection Utility
 * Automatically detects the type of external links based on URL patterns
 */

import type { ProductReferenceType } from '$lib/planner/types'

// File extension constants
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff']

const FILE_EXTENSIONS = [
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

// Service hostname patterns
const SERVICE_PATTERNS = {
  figma: ['figma.com'],
  notion: ['notion.so', 'notion.site'],
  google_docs: ['docs.google.com', 'drive.google.com'],
  github: ['github.com', 'github.io'],
  youtube: ['youtube.com', 'youtu.be'],
  slack: ['slack.com', 'app.slack.com'],
  discord: ['discord.com', 'discord.gg'],
  zoom: ['zoom.us', 'meet.google.com', 'teams.microsoft.com'],
  trello: ['trello.com'],
  jira: ['atlassian.net', 'jira.'],
  miro: ['miro.com'],
  adobe: ['adobe.com', 'behance.net', 'dribbble.com'],
} as const

/**
 * Helper function to check if a string ends with any of the given extensions
 */
function hasExtension(str: string, extensions: readonly string[]): boolean {
  const lowerStr = str.toLowerCase()
  return extensions.some((ext) => lowerStr.endsWith(ext))
}

/**
 * Helper function to detect PDF from various sources
 */
function detectPdfType(
  pathname: string,
  searchParams: URLSearchParams,
  filename?: string,
  fullUrl?: string,
): boolean {
  return (
    hasExtension(pathname, ['.pdf']) ||
    searchParams.get('format') === 'pdf' ||
    Boolean(
      searchParams.get('filename') && hasExtension(searchParams.get('filename')!, ['.pdf']),
    ) ||
    Boolean(searchParams.get('name') && hasExtension(searchParams.get('name')!, ['.pdf'])) ||
    Boolean(filename && hasExtension(filename, ['.pdf'])) ||
    Boolean(
      fullUrl &&
        fullUrl.includes('.pdf') &&
        (fullUrl.includes('filename=') || fullUrl.includes('name=')),
    )
  )
}

/**
 * Helper function to detect service type from hostname
 */
function detectServiceType(hostname: string): ProductReferenceType | null {
  for (const [service, patterns] of Object.entries(SERVICE_PATTERNS)) {
    if (patterns.some((pattern) => hostname.includes(pattern))) {
      return service as ProductReferenceType
    }
  }
  return null
}

/**
 * Helper function to detect file type from filename (fallback)
 */
function detectFileTypeFromFilename(filename: string): ProductReferenceType {
  const lowerFilename = filename.toLowerCase()

  if (lowerFilename.endsWith('.pdf')) {
    return 'pdf'
  }

  if (hasExtension(lowerFilename, IMAGE_EXTENSIONS)) {
    return 'image'
  }

  if (hasExtension(lowerFilename, FILE_EXTENSIONS)) {
    return 'file'
  }

  return 'other'
}

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

    // File extension detection comes FIRST to override service-specific detection
    // 1. PDF detection
    if (detectPdfType(pathname, searchParams, filename, url.toLowerCase())) {
      return 'pdf'
    }

    // 2. Image detection
    if (
      hasExtension(pathname, IMAGE_EXTENSIONS) ||
      (filename && hasExtension(filename, IMAGE_EXTENSIONS))
    ) {
      return 'image'
    }

    // 3. Other file types detection
    if (
      hasExtension(pathname, FILE_EXTENSIONS) ||
      (filename && hasExtension(filename, FILE_EXTENSIONS))
    ) {
      return 'file'
    }

    // Service-specific detection comes AFTER file extension detection
    const serviceType = detectServiceType(hostname)
    if (serviceType) {
      return serviceType
    }

    // Default fallback for valid URLs
    return 'url'
  } catch {
    // URL parsing failed, try to detect from filename only
    if (filename) {
      return detectFileTypeFromFilename(filename)
    }

    return 'other'
  }
}

// Combined extensions for file upload detection
const UPLOADABLE_EXTENSIONS = [
  '.pdf',
  ...IMAGE_EXTENSIONS,
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
] as const

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
    return hasExtension(urlObj.pathname, UPLOADABLE_EXTENSIONS)
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
