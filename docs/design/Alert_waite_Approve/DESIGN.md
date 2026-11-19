---
name: Corporate HR Mobile System
colors:
  surface: '#fcf8fd'
  surface-dim: '#dcd9de'
  surface-bright: '#fcf8fd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f2f7'
  surface-container: '#f0edf2'
  surface-container-high: '#eae7ec'
  surface-container-highest: '#e5e1e6'
  on-surface: '#1b1b1f'
  on-surface-variant: '#46464f'
  inverse-surface: '#303034'
  inverse-on-surface: '#f3eff4'
  outline: '#777680'
  outline-variant: '#c7c5d0'
  surface-tint: '#575a8c'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131645'
  on-primary-container: '#7c80b4'
  inverse-primary: '#bfc2fb'
  secondary: '#026e00'
  on-secondary: '#ffffff'
  secondary-container: '#00f900'
  on-secondary-container: '#026d00'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#370e09'
  on-tertiary-container: '#b47369'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bfc2fb'
  on-primary-fixed: '#131645'
  on-primary-fixed-variant: '#3f4273'
  secondary-fixed: '#77ff61'
  secondary-fixed-dim: '#02e600'
  on-secondary-fixed: '#002200'
  on-secondary-fixed-variant: '#015300'
  tertiary-fixed: '#ffdad4'
  tertiary-fixed-dim: '#ffb4a8'
  on-tertiary-fixed: '#370e09'
  on-tertiary-fixed-variant: '#6d3830'
  background: '#fcf8fd'
  on-background: '#1b1b1f'
  surface-variant: '#e5e1e6'
typography:
  display:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  margin-mobile: 20px
  gutter: 16px
  card-padding: 24px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is built on the principles of **Corporate Modernism**. It prioritizes clarity, efficiency, and professional trust, essential for HR environments where employees manage sensitive personal data. 

The aesthetic is characterized by a high-contrast relationship between deep navy and pure white, accented by a vibrant green for positive feedback loops. The visual mood is authoritative yet accessible, utilizing generous whitespace and a strict geometric grid to reduce cognitive load during administrative tasks.

## Colors

The palette is anchored by **Deep Navy**, used primarily for high-level navigation, headers, and primary actions to establish a sense of institutional stability. 

**Vibrant Green** is reserved strictly for success states, status icons, and completion indicators to provide unmistakable confirmation of successful user intent. The background remains **Pure White** to maximize legibility and provide a "blank canvas" feel that makes the content the priority. Neutral greys are tiered: **Dark Grey** for immediate hierarchy in headings and **Medium Grey** for supporting body text and metadata.

## Typography

The design system utilizes **Inter** for its neutral, highly legible characteristics. The typographic scale is optimized for mobile density.

- **Status Headings:** Use `headline-lg` or `headline-md` with bold weights to signify state changes or section starts.
- **Body Content:** Use `body-md` for standard information. 
- **Metadata:** Smaller labels should maintain a medium weight to ensure legibility against white backgrounds even at reduced sizes. 
- **Thai Language Support:** While Inter is the primary typeface, system fallbacks should prioritize sans-serif faces with similar x-heights (like Sukhumvit Set) to maintain the modern geometric appearance.

## Layout & Spacing

The layout follows a **fluid mobile grid** based on an 8px base unit. 

On mobile devices, a standard **4-column grid** is used with 20px outer margins. Elements should typically span the full width of the container or follow a 2-column split for smaller card modules. 

Spacing between vertical elements is strictly enforced: 16px for related items and 32px for distinct sections. This "breathable" spacing ensures the interface remains "clean" despite the potentially data-heavy nature of HR applications.

## Elevation & Depth

This design system uses a **low-contrast depth model** to maintain its clean, modern aesthetic. 

- **Cards:** Elevated from the background using a very soft, diffused shadow (Hex: #000000 at 5% opacity, 12px blur, 4px Y-offset). There are no harsh borders on cards; the shadow defines the edge.
- **Header:** The Deep Navy header is treated as the base layer of the application (Level 0), while content cards sit at Level 1.
- **Modals:** Use a Level 2 elevation with a slightly more pronounced shadow and a 20% dimming overlay on the background content.

## Shapes

The shape language is consistently **Rounded** (8px / 0.5rem) across all interactive elements.

- **Cards:** 16px (rounded-lg) corner radius to create a soft, welcoming container for information.
- **Buttons & Inputs:** 8px (rounded) corner radius to balance professional structure with modern touch-friendliness.
- **Status Indicators:** Success circles (like checkmarks) should be fully pill-shaped (circular) to stand out from the rectangular grid of the rest of the UI.

## Components

### Buttons
- **Primary Action:** Solid Deep Navy background with white text.
- **Secondary/Cancel:** White background with a 1px thin border in `#333333` and dark grey text.
- **Touch Targets:** All buttons must have a minimum height of 48px to ensure accessibility on mobile devices.

### Cards
- Use for all list items, request summaries, and profile modules.
- Padding should be a consistent 24px to prevent content from feeling cramped.
- Background is always `#FFFFFF` with the defined subtle shadow.

### Status Indicators
- **Success Icons:** Large, circular Vibrant Green (#00FF00) icons with white glyphs.
- **Status Text:** Always paired with a bold heading to provide immediate context of the application state.

### Input Fields
- Outlined style with a 1px border (#E0E0E0).
- On focus, the border transitions to Deep Navy.
- Labels are positioned above the field in `label-bold` style for maximum clarity.