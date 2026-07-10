---
name: Indigo Admin Logic
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#47464f'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#787680'
  outline-variant: '#c8c5d0'
  surface-tint: '#5b598c'
  primary: '#070235'
  on-primary: '#ffffff'
  primary-container: '#1e1b4b'
  on-primary-container: '#8683ba'
  inverse-primary: '#c4c1fb'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#080c0d'
  on-tertiary: '#ffffff'
  tertiary-container: '#1f2224'
  on-tertiary-container: '#86898b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c4c1fb'
  on-primary-fixed: '#181445'
  on-primary-fixed-variant: '#444173'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  table-header:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 24px
  gutter: 20px
---

## Brand & Style

The design system is engineered for administrative excellence, providing a high-trust, professional environment for management dashboards. The brand personality is authoritative yet approachable, prioritizing clarity and data integrity above all else. 

Drawing from **Corporate Modernism**, the style utilizes a structured grid, purposeful whitespace, and a deep indigo primary palette to establish a sense of stability and hierarchy. The visual language avoids decorative excess, focusing instead on functional aesthetics that reduce cognitive load during complex task management. The emotional response is one of organized efficiency—users should feel in total control of the data they manage.

## Colors

The palette is anchored by **Deep Indigo (#1E1B4B)**, used for primary navigation and high-level headers to establish instant authority. This is complemented by a vibrant Indigo secondary for interactive elements.

Data status is communicated through a refined semantic palette:
- **Active:** A soft forest green pairing that ensures legibility without overwhelming the row content.
- **Inactive/Neutral:** A grayscale pairing for de-emphasized states.
- **Error/Urgent:** A disciplined red for destructive actions or critical alerts.

Backgrounds utilize subtle slate tints to differentiate between the surface and the container, maintaining a clean, high-contrast environment for long-form reading.

## Typography

This design system uses **Hanken Grotesk** across all levels. It was chosen for its exceptional legibility in data-heavy environments and its contemporary, professional geometric construction.

- **Headers:** Use tighter letter-spacing and heavier weights to provide clear structural anchoring.
- **Table Data:** Relies on `body-md` for standard entries to maximize information density without sacrificing readability.
- **Labels:** Small caps or increased tracking is applied to labels and table headers to distinguish them from editable data.
- **Scaling:** For mobile views, `headline-lg` should scale down to 24px to ensure dashboard titles do not wrap awkwardly.

## Layout & Spacing

The system employs a **12-column fluid grid** for dashboard layouts, transitioning to a single-column stack on mobile devices. 

**Spacing Principles:**
- **Vertical Rhythm:** A 4px baseline grid ensures consistent alignment of text and components.
- **Table Density:** Standard tables use 16px vertical padding for rows to maintain a "breathable" corporate look. Compact modes can reduce this to 12px.
- **Margins:** A consistent 24px margin is maintained around the main content container to separate the workspace from the primary navigation rail.
- **Grouping:** Use the `lg` (24px) unit to separate distinct logical sections, and `sm` (12px) to group related input fields or controls.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows, maintaining a modern, flat aesthetic.

- **Level 0 (Canvas):** The base background uses a very light slate (#F8FAFC).
- **Level 1 (Cards/Tables):** Main content areas are white (#FFFFFF) with a subtle 1px border (#E2E8F0).
- **Level 2 (Dropdowns/Modals):** Floating elements use a soft, highly diffused shadow (0px 10px 15px -3px rgba(0, 0, 0, 0.05)) to suggest lift without feeling "heavy."
- **Interactive States:** Buttons and rows use subtle background color shifts (e.g., White to Slate-50) on hover to indicate interactivity.

## Shapes

The shape language is **Soft (0.25rem)**. This subtle rounding provides a modern touch that softens the "grid" feel of a dashboard while maintaining a serious, professional architecture.

- **Standard Elements:** Buttons, input fields, and checkboxes use the base 4px (0.25rem) radius.
- **Containers:** Large cards or table wrappers use `rounded-lg` (8px) to define the primary workspace.
- **Status Badges:** Use `rounded-xl` (12px) or full pill-shaping to distinguish them from interactive buttons.

## Components

### Buttons
Primary buttons use the Deep Indigo background with white text. Secondary buttons use a slate border with indigo text. Ghost buttons are reserved for table actions (Edit/Delete) to minimize visual noise until hover.

### Chips (Status Indicators)
As seen in the reference, these use a semi-transparent background of the semantic color with high-contrast text. They are pill-shaped to stand out from the rectangular grid of the table.

### Tables
- **Header:** Deep Indigo (#1E1B4B) background with White text, using `table-header` typography.
- **Rows:** White background with a 1px bottom border (#F1F5F9). Hover state changes background to #F8FAFC.
- **Actions:** Icons should be centered within a 32x32px hit area. Use Slate-400 for inactive icons and Primary Indigo/Error Red for hover states.

### Input Fields
Inputs feature a 1px border (#CBD5E1) and 12px horizontal padding. On focus, the border shifts to the secondary Indigo with a subtle 2px glow (ring).

### Cards
Cards are the primary layout container. They feature 24px padding, a white background, and a 1px Slate-200 border. Headings within cards should always use `headline-sm`.