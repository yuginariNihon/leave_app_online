---
name: Corporate Leave Interface
colors:
  surface: '#fcf8fc'
  surface-dim: '#dcd9dd'
  surface-bright: '#fcf8fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f2f6'
  surface-container: '#f0edf1'
  surface-container-high: '#ebe7eb'
  surface-container-highest: '#e5e1e5'
  on-surface: '#1c1b1e'
  on-surface-variant: '#47464e'
  inverse-surface: '#313033'
  inverse-on-surface: '#f3eff4'
  outline: '#78767f'
  outline-variant: '#c8c5cf'
  surface-tint: '#5a5a84'
  primary: '#020027'
  on-primary: '#ffffff'
  primary-container: '#1a1a40'
  on-primary-container: '#8382af'
  inverse-primary: '#c3c2f2'
  secondary: '#006e25'
  on-secondary: '#ffffff'
  secondary-container: '#80f98b'
  on-secondary-container: '#007327'
  tertiary: '#150001'
  on-tertiary: '#ffffff'
  tertiary-container: '#46000a'
  on-tertiary-container: '#f24653'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c2f2'
  on-primary-fixed: '#17173d'
  on-primary-fixed-variant: '#43436b'
  secondary-fixed: '#83fc8e'
  secondary-fixed-dim: '#66df75'
  on-secondary-fixed: '#002106'
  on-secondary-fixed-variant: '#00531a'
  tertiary-fixed: '#ffdad9'
  tertiary-fixed-dim: '#ffb3b2'
  on-tertiary-fixed: '#410008'
  on-tertiary-fixed-variant: '#92001f'
  background: '#fcf8fc'
  on-background: '#1c1b1e'
  surface-variant: '#e5e1e5'
typography:
  display-lg:
    fontFamily: Sarabun
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Sarabun
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  title-sm:
    fontFamily: Sarabun
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-base:
    fontFamily: Sarabun
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Sarabun
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Sarabun
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  status-label:
    fontFamily: Sarabun
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1.0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style

This design system is built on a foundation of **Minimalist Corporate** aesthetics. It prioritizes clarity, administrative efficiency, and institutional trust. The visual language uses a disciplined grid, heavy whitespace, and high-contrast typography to ensure that complex leave data is easily digestible.

The emotional response should be one of reliability and order. Subtle geometric accents—such as precision-line dividers and structured containers—reinforce a sense of professional stability. The interface avoids unnecessary decorative elements, focusing instead on functional status indicators and streamlined workflows.

## Colors

The palette is anchored by **Navy Blue (#1A1A40)**, used for primary branding, headings, and key structural elements to convey authority. **Professional Green (#28A745)** and **Warning Red (#DC3545)** are reserved strictly for semantic feedback: approvals, successes, denials, and critical alerts.

The background uses a soft **Light Gray (#F8F9FA)** to reduce eye strain during prolonged use, while pure white is used for card surfaces and input fields to create a clear layering effect. High contrast ratios (meeting WCAG AA standards) are maintained between all text and background combinations to ensure maximum readability for all employees.

## Typography

The design system exclusively utilizes **Sarabun**, a clean, professional sans-serif that excels in both Thai and Latin scripts. 

- **Headlines:** Use Bold weights in Navy Blue to establish hierarchy.
- **Body Text:** Set in Regular weight with generous line height (1.6) to facilitate scanning of tabular data.
- **Labels:** Small caps or bolded labels are used for table headers and form captions to distinguish them from user-generated content.
- **Readability:** All font sizes are optimized for screen legibility, with a minimum size of 12px for secondary metadata.

## Layout & Spacing

The layout follows a **Fixed Grid** system for desktop (max-width 1200px) and transitions to a fluid model for tablets and mobile devices. A consistent 8px base unit (the "spacing rhythm") governs all dimensions.

- **Tables:** Use "Comfortable" density with 16px vertical padding per row to ensure data rows are distinct.
- **Margins:** Page margins are set to 40px (lg) on large screens to create a focused, centralized content area.
- **Grouping:** Related form elements use 12px (sm) spacing, while distinct sections are separated by 40px (lg).

## Elevation & Depth

This design system utilizes **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows to maintain a minimalist look.

- **Level 0 (Background):** Light Gray (#F8F9FA) surface.
- **Level 1 (Cards/Containers):** White background with a 1px solid border (#E2E2E9). No shadow.
- **Level 2 (Dropdowns/Modals):** White background with a very soft, diffused ambient shadow (0px 4px 20px rgba(26, 26, 64, 0.08)) to indicate temporary interaction layers.
- **Geometric Accents:** Subtle 2px Navy Blue accents are applied to the left edge of "Active" cards or selected navigation items to provide depth without clutter.

## Shapes

The shape language is primarily **Soft (0.25rem)**. This slight rounding takes the "edge" off the corporate environment while maintaining a structured, architectural feel.

- **Standard Buttons & Inputs:** 4px (0.25rem) border radius.
- **Status Badges/Chips:** 16px (1rem) or fully pill-shaped to contrast against the rectangular grid of the tables.
- **Data Cards:** 8px (0.5rem) radius for a more prominent container feel.

## Components

### Buttons
- **Primary:** Solid Navy Blue with white text. 
- **Secondary:** White background, 1px Navy Blue border, Navy Blue text.
- **Semantic:** Solid Green or Red for final destructive or affirmative actions.

### Status Indicators
- **Approved:** Professional Green text on a 10% opacity Green background.
- **Rejected:** Warning Red text on a 10% opacity Red background.
- **Pending:** Navy Blue text on a 10% opacity Navy background.

### Input Fields
- Fixed-height (44px) with a light gray border. Focus state is indicated by a 2px Navy Blue bottom border or a subtle Navy outer glow.

### Data Tables
- Header row uses a Navy Blue background with white bolded text.
- Alternating row stripes are not used; instead, use thin 1px horizontal dividers (#E2E2E9) to maintain a clean aesthetic.

### Leave Calendar
- A specialized component using a grid of squares. "Approved Leave" days are marked with solid Green blocks, while "Company Holidays" use light Navy patterns.