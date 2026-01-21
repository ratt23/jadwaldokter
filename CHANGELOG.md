# Changelog - Public Website (jadwaldokter)

All notable changes to the RSU Siloam Ambon public website.

## [2.0.0] - 2026-01-04

### Added - Dynamic Settings Integration
- **ConfigContext** - Global configuration provider fetching from Admin API
- **Dynamic Theme Color** - CSS variables from Admin Dashboard
  - `--primary-color` set on document root
  - `.bg-primary`, `.text-primary`, `.border-primary` utilities
  - Fallback to `#01007f` if API fails
  
- **Dynamic Menu** - Navigation from Admin configuration
  - Fetches `site_menu` JSON from API
  - Maps to React Router links
  - Fallback to default 4 menu items

- **Feature Toggles** - Controlled from Admin
  - Google Review (GMB) popup toggle
  - Polyclinic Today toggle
  - Doctor Leave display toggle

### Fixed - Component Styling
- `SpecialistList.jsx` - Specialist buttons use `bg-primary`
- `Header.jsx` - Navigation links & search with dynamic colors
- `Footer.jsx` - Footer background uses `bg-primary`
- `CategoryNav.jsx` - Sticky header uses `bg-primary`
- `GmbWidget.jsx` - Conditional render based on feature toggle

### Added - CSS Utilities
```css
.bg-primary { background-color: var(--primary-color, #01007f); }
.text-primary { color: var(--primary-color, #01007f); }
.border-primary { border-color: var(--primary-color, #01007f); }
.from-primary { --tw-gradient-from: var(--primary-color, #01007f); }
```

### Changed
- `.gitignore` - Added `schedule-project/` to prevent cross-repo contamination

## [1.8.0] - 2025-12-30

### Fixed - iOS Image Loading
- Lazy loading implementation for Cloudinary images
- CORS headers for image proxying
- PWA icon sizing for iOS 18
- Bandwidth optimization

## [1.7.0] - 2025-12-22

### Added - HomeCare & MCU Pages
- HomeCare page with tab navigation
- Medical Check Up (MCU) page with package showcase
- MCU package card component with expandable details
- MCU form modal for package selection
- Bottom navigation reordered

### Improved - Mobile UX
- Ticker layout optimization for iPhone 11
- Text truncation with ellipsis
- Compact spacing for small screens
- Typography fine-tuning

## [1.6.0] - 2025-12-22

### Added - Custom Doctor Ordering
- `doctorPriority.js` configuration file
- Doctor sorting per specialty
- Priority-based display in modal

## [1.5.0] - 2025-12-18

### Added - Mobile Preview Enhancements
- Maximized mobile preview size
- Advanced header styling controls
- Header text color, weight, spacing options
- Independent font sizes for header sections

## [1.4.0] - 2025-12-03

### Added - Sitemap Generation
- Dynamic sitemap.xml via Netlify Function
- Auto-includes all articles
- SEO-friendly URLs

### Fixed - Structured Data
- JSON-LD syntax errors
- Proper schema.org markup

## [1.3.0] - 2025-12-02

### Added - Pop-Up Ad System
- Dynamic pop-up ad from Admin Dashboard
- Fetch from `/popup-ad` API endpoint
- Toggle active/inactive from Admin

## [1.2.0] - 2025-11-25

### Added - Article System
- Article listing with categories
- Article detail pages
- Category navigation

### Added - Doctor Features
- Doctor modal with detailed info
- Weekly schedule display
- Specialty-based filtering
- Doctor leave ticker

## [1.1.0] - 2025-11-15

### Added - Core Features
- Home page with polyclinic schedule
- Doctor search functionality
- Responsive header & footer
- Category navigation
- HealthPopup component

## [1.0.0] - 2025-11-01

### Initial Release
- React + Vite setup
- Tailwind CSS styling
- React Router navigation
- Basic layout structure
- API integration skeleton
