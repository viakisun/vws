import type { ProductReferenceType } from '$lib/planner/types'
import {
    detectLinkType,
    extractDomain,
    getReferenceTypeLabel,
    isFileUrl,
    isValidUrl,
} from '$lib/utils/link-detector'
import { describe, expect, it } from 'vitest'

describe('link-detector', () => {
  describe('detectLinkType', () => {
    it('should detect Figma links', () => {
      expect(detectLinkType('https://www.figma.com/file/abc123/Design-System')).toBe('figma')
      expect(detectLinkType('https://figma.com/project/xyz789')).toBe('figma')
    })

    it('should detect Notion links', () => {
      expect(detectLinkType('https://www.notion.so/company/Document-123')).toBe('notion')
      expect(detectLinkType('https://company.notion.site/Page-abc')).toBe('notion')
    })

    it('should detect Google Docs links', () => {
      expect(detectLinkType('https://docs.google.com/document/d/123/edit')).toBe('google_docs')
      expect(detectLinkType('https://drive.google.com/file/d/456/view')).toBe('google_docs')
    })

    it('should detect GitHub links', () => {
      expect(detectLinkType('https://github.com/company/repo')).toBe('github')
      expect(detectLinkType('https://company.github.io/docs')).toBe('github')
    })

    it('should detect YouTube links', () => {
      expect(detectLinkType('https://www.youtube.com/watch?v=abc123')).toBe('youtube')
      expect(detectLinkType('https://youtu.be/abc123')).toBe('youtube')
    })

    it('should detect Slack links', () => {
      expect(detectLinkType('https://app.slack.com/client/T123/C456')).toBe('slack')
      expect(detectLinkType('https://company.slack.com/archives/C123')).toBe('slack')
    })

    it('should detect Discord links', () => {
      expect(detectLinkType('https://discord.com/channels/123/456')).toBe('discord')
      expect(detectLinkType('https://discord.gg/abc123')).toBe('discord')
    })

    it('should detect meeting links', () => {
      expect(detectLinkType('https://zoom.us/j/123456789')).toBe('zoom')
      expect(detectLinkType('https://meet.google.com/abc-defg-hij')).toBe('zoom')
      expect(detectLinkType('https://teams.microsoft.com/l/meetup-join/...')).toBe('zoom')
    })

    it('should detect Trello links', () => {
      expect(detectLinkType('https://trello.com/b/abc123/board-name')).toBe('trello')
      expect(detectLinkType('https://www.trello.com/c/123456')).toBe('trello')
    })

    it('should detect Jira links', () => {
      expect(detectLinkType('https://company.atlassian.net/jira/software/projects/PROJ')).toBe('jira')
      expect(detectLinkType('https://jira.company.com/browse/PROJ-123')).toBe('jira')
    })

    it('should detect Miro links', () => {
      expect(detectLinkType('https://miro.com/app/board/abc123/')).toBe('miro')
      expect(detectLinkType('https://www.miro.com/miroverse/template/...')).toBe('miro')
    })

    it('should detect Adobe/Creative links', () => {
      expect(detectLinkType('https://www.behance.net/gallery/123456/Project')).toBe('adobe')
      expect(detectLinkType('https://dribbble.com/shots/1234567-design')).toBe('adobe')
      expect(detectLinkType('https://adobe.com/products/creativecloud.html')).toBe('adobe')
    })

    it('should detect PDF files', () => {
      expect(detectLinkType('https://example.com/document.pdf')).toBe('pdf')
      expect(detectLinkType('https://company.com/report.pdf?version=1')).toBe('pdf')
      expect(detectLinkType('https://example.com/file.txt', 'document.pdf')).toBe('pdf')
      expect(detectLinkType('https://docs.google.com/viewer?url=xxx')).toBe('google_docs')
    })

    it('should detect image files', () => {
      expect(detectLinkType('https://example.com/image.jpg')).toBe('image')
      expect(detectLinkType('https://cdn.example.com/photo.png')).toBe('image')
      expect(detectLinkType('https://example.com/file', 'screenshot.webp')).toBe('image')
      
      const imageExts = ['.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tiff']
      imageExts.forEach(ext => {
        expect(detectLinkType(`https://example.com/image${ext}`)).toBe('image')
      })
    })

    it('should detect generic URLs', () => {
      expect(detectLinkType('https://example.com/page')).toBe('url')
      expect(detectLinkType('https://docs.company.com/guide')).toBe('url')
      expect(detectLinkType('http://localhost:3000/page')).toBe('url')
    })

    it('should handle invalid inputs', () => {
      expect(detectLinkType('')).toBe('other')
      expect(detectLinkType(null as any)).toBe('other')
      expect(detectLinkType(undefined as any)).toBe('other')
      expect(detectLinkType('not-a-url')).toBe('other')
    })

    it('should handle URLs that cannot be parsed', () => {
      expect(detectLinkType('invalid://url with spaces')).toBe('other')
      // But still try to detect from filename if provided
      expect(detectLinkType('invalid://url', 'report.pdf')).toBe('pdf')
      expect(detectLinkType('invalid://url', 'image.jpg')).toBe('image')
    })
  })

  describe('isFileUrl', () => {
    it('should identify file URLs by extension', () => {
      expect(isFileUrl('https://example.com/document.pdf')).toBe(true)
      expect(isFileUrl('https://cdn.example.com/image.jpg')).toBe(true)
      expect(isFileUrl('https://files.company.com/data.xlsx')).toBe(true)
      expect(isFileUrl('https://downloads.org/archive.zip')).toBe(true)
    })

    it('should return false for non-file URLs', () => {
      expect(isFileUrl('https://example.com/page')).toBe(false)
      expect(isFileUrl('https://github.com/user/repo')).toBe(false)
      expect(isFileUrl('https://figma.com/design/123')).toBe(false)
    })

    it('should handle invalid inputs', () => {
      expect(isFileUrl('')).toBe(false)
      expect(isFileUrl(null as any)).toBe(false)
      expect(isFileUrl('invalid-url')).toBe(false)
    })
  })

  describe('isValidUrl', () => {
    it('should validate proper URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://localhost:3000')).toBe(true)
      expect(isValidUrl('https://subdomain.example.com/path?param=value')).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(isValidUrl('')).toBe(false)
      expect(isValidUrl('not-a-url')).toBe(false)
      expect(isValidUrl('ftp://example.com')).toBe(true) // FTP URLs are technically valid
      expect(isValidUrl(null as any)).toBe(false)
      expect(isValidUrl(undefined as any)).toBe(false)
    })
  })

  describe('extractDomain', () => {
    it('should extract domain from URLs', () => {
      expect(extractDomain('https://example.com/page')).toBe('example.com')
      expect(extractDomain('https://subdomain.example.com')).toBe('subdomain.example.com')
      expect(extractDomain('http://localhost:3000')).toBe('localhost')
    })

    it('should handle invalid inputs', () => {
      expect(extractDomain('')).toBe(null)
      expect(extractDomain('invalid-url')).toBe(null)
      expect(extractDomain(null as any)).toBe(null)
    })
  })

  describe('getReferenceTypeLabel', () => {
    it('should return correct labels for all types', () => {
      const typeLabels: Array<[ProductReferenceType, string]> = [
        ['file', 'File'],
        ['url', 'Link'],
        ['figma', 'Figma'],
        ['notion', 'Notion'],
        ['google_docs', 'Google Docs'],
        ['pdf', 'PDF'],
        ['image', 'Image'],
        ['github', 'GitHub'],
        ['youtube', 'YouTube'],
        ['slack', 'Slack'],
        ['discord', 'Discord'],
        ['zoom', 'Meeting'],
        ['trello', 'Trello'],
        ['jira', 'Jira'],
        ['miro', 'Miro'],
        ['adobe', 'Adobe'],
        ['other', 'Other']
      ]

      typeLabels.forEach(([type, expectedLabel]) => {
        expect(getReferenceTypeLabel(type)).toBe(expectedLabel)
      })
    })

    it('should handle unknown types gracefully', () => {
      // This tests the fallback behavior - though TypeScript should prevent this
      expect(getReferenceTypeLabel('unknown' as any)).toBe('Unknown')
    })
  })
})
