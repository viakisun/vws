# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.2] - 2025-10-16

### Added
- **Product References System**: Complete reference management system for planner products
  - Support for file uploads (PDF, images, documents) via S3 integration
  - Support for external links with automatic type detection
  - Drag-and-drop reordering functionality for references
  - Reference cards with type-specific icons and colors

- **Extended Link Type Detection**: Added support for popular collaboration and productivity tools
  - **YouTube** links (youtube.com, youtu.be)
  - **Slack** workspace and channel links
  - **Discord** server and channel links  
  - **Meeting platforms** (Zoom, Google Meet, Microsoft Teams)
  - **Project management** (Trello, Jira)
  - **Design tools** (Miro, Adobe Creative Cloud, Behance, Dribbble)

- **Database Schema Updates**:
  - New `planner_product_references` table
  - Updated activity log constraints to support reference activity tracking
  - Migration files for seamless database updates

### Enhanced
- **Reference Management UI**:
  - Horizontal card layout for better readability
  - Improved title display with 2-line clamping and tooltips
  - Enhanced action button styling with primary action highlighting
  - Visual feedback for drag-and-drop operations

- **API Endpoints**:
  - CRUD operations for product references
  - S3 presigned URL generation for secure file uploads/downloads
  - Reference reordering endpoint with batch updates
  - Comprehensive error handling and validation

### Technical Improvements
- **Svelte 5 Compatibility**: Updated components to use latest runes syntax
- **Type Safety**: Comprehensive TypeScript definitions for all new features
- **Testing**: Unit tests for link detection and API endpoints
- **Accessibility**: Proper ARIA roles and keyboard navigation support

### Fixed
- Activity log constraint violations for new reference types
- Type detection accuracy for various URL patterns
- UI responsiveness and visual consistency

## [0.6.1] - Previous release
- Initial implementation of core features
