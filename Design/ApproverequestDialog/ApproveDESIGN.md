---
name: Stratos Enterprise
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#47464e'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#77767e'
  outline-variant: '#c8c5ce'
  surface-tint: '#5b5b7e'
  primary: '#020220'
  on-primary: '#ffffff'
  primary-container: '#1a1b3a'
  on-primary-container: '#8383a8'
  inverse-primary: '#c3c3eb'
  secondary: '#006c48'
  on-secondary: '#ffffff'
  secondary-container: '#55fbb4'
  on-secondary-container: '#00714b'
  tertiary: '#00031b'
  on-tertiary: '#ffffff'
  tertiary-container: '#00155a'
  on-tertiary-container: '#5b7bff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c3c3eb'
  on-primary-fixed: '#171837'
  on-primary-fixed-variant: '#434465'
  secondary-fixed: '#58feb7'
  secondary-fixed-dim: '#2fe19c'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005235'
  tertiary-fixed: '#dde1ff'
  tertiary-fixed-dim: '#b8c4ff'
  on-tertiary-fixed: '#001355'
  on-tertiary-fixed-variant: '#0036bc'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
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
  gutter: 20px
  margin: 24px
---

## Brand & Style

This design system is built for enterprise-grade efficiency, specifically tailored for complex approval workflows. The brand personality is **authoritative, precise, and dependable**. It utilizes a **Corporate / Modern** style that prioritizes data density without sacrificing legibility. 

The aesthetic focuses on structural clarity through a refined grid and tonal layering. It avoids unnecessary decoration, instead using subtle color cues—like vibrant greens for positive status and soft blues for workflow progression—to guide the user's eye through multi-step administrative processes. The result is a high-trust environment that feels both high-tech and incredibly stable.

## Colors

The palette is anchored by a deep **Navy Primary**, used for headers and critical navigation to establish authority. The **Vibrant Green** is reserved strictly for "Active" or "Approved" states, ensuring high-contrast visibility against the clean white background. 

For workflow elements, a **Soft Blue** spectrum is used to denote steps and progress indicators, preventing them from competing with the primary actions. Neutrals are kept cool-toned to maintain a crisp, professional atmosphere. Surfaces use a layered approach: white for primary cards and light grey for secondary container backgrounds.

## Typography

This design system uses **Hanken Grotesk** for its sharp, contemporary geometry and exceptional readability in data-heavy contexts. 

- **Headlines:** Use Bold weights with tight letter spacing for a structured, professional look.
- **Data Rows:** Standard body text is set at 14px to balance density and clarity.
- **Labels:** Uppercase styles are utilized for table headers and status chips to create a clear visual distinction from dynamic content.
- **Mobile:** Headline sizes scale down to 24px, while body text remains consistent at 14px to ensure legibility across devices.

## Layout & Spacing

The system employs a **Fluid Grid** with fixed outer margins. It follows a 4px baseline shift to ensure all components—especially table rows and input fields—align perfectly.

- **Desktop:** A 12-column grid with 20px gutters. Horizontal data tables should utilize the full width of the container.
- **Tablet:** 8-column grid with 16px margins. 
- **Mobile:** 4-column grid with 16px margins. In mobile views, complex multi-step indicators should reflow into vertical lists or truncated scrollable carousels to maintain tap targets.
- **Rhythm:** Consistent 16px padding within card containers and 8px spacing between related inline elements (like step arrows).

## Elevation & Depth

To maintain a "Professional / Modern" feel, depth is created through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Level 0 (Background):** Neutral light grey (#F8FAFC).
- **Level 1 (Cards/Containers):** Pure white with a 1px border (#E2E8F0). No shadow.
- **Level 2 (Dropdowns/Modals):** Pure white with a soft, ambient shadow (0px 4px 12px, 5% opacity) to denote interaction priority.
- **Interactions:** Hover states on rows or buttons should use a subtle background tint change (e.g., Neutral 100 to Neutral 200) rather than an elevation increase.

## Shapes

The shape language is **Soft (0.25rem)**. This provides a clean, modern aesthetic that feels approachable while maintaining the structural integrity required for enterprise software. 

- **Standard Elements:** Buttons, inputs, and chips use a 4px (0.25rem) radius.
- **Containers:** Large card containers use 8px (0.5rem) to soften the layout.
- **Status Chips:** Use a slightly higher radius (12px or pill-shaped) to distinguish them as non-interactive status indicators.

## Components

### Buttons
- **Primary:** Dark navy background with white text. 4px roundedness.
- **Secondary:** Soft blue border and text with a transparent or white background.
- **Ghost:** No border, primary color text; used for secondary actions like "Cancel."

### Status Chips (Active/Pending)
- **Active:** `status_active_bg` with a small 6px solid circle of `status_active_text` followed by "Active" label.
- **Inactive:** Light grey background with dark grey text and dot.

### Step Indicators
- **Style:** Pill-shaped containers with `step_indicator_bg` and a subtle `step_indicator_border`.
- **Flow:** Connected by a light grey chevron icon or arrow to show directional progression.
- **Active Step:** Thicker border or slightly darker blue text to indicate current status in a live workflow.

### Card Containers
- **Main List:** A white surface with a thin `neutral` border. The header of the main list uses the Dark Navy primary color with white typography for high-impact categorization.
- **Row Styling:** Subtle 1px horizontal dividers between items. Alternating row colors (zebra striping) are discouraged; use hover states instead.

### Input Fields
- Standard 40px height with a 1px border. Focus states must use the `tertiary_color_hex` (Soft Blue) for the border to indicate activity without being as aggressive as the dark primary color.