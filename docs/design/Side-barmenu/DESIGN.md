---
name: Executive Precision
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
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fd'
  on-secondary-container: '#57657b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
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
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system is engineered for high-stakes enterprise environments where clarity, speed of cognition, and professional trust are paramount. The brand personality is authoritative yet approachable, utilizing a **Modern Corporate** aesthetic that leans heavily into **Minimalism**.

The visual narrative prioritizes high-contrast readability and "breathable" interfaces. By using expansive whitespace and a disciplined color application, the design system reduces cognitive load for power users who interact with complex data for extended periods. The emotional response should be one of calm control and systematic reliability.

## Colors
The palette is anchored by a deep slate/navy primary (`#0F172A`), providing a strong foundation for navigation and primary actions. Surfaces primarily utilize a crisp white (`#FFFFFF`) to ensure maximum contrast against text, while the global background uses a soft gray (`#F8FAFC`) to define the workspace boundaries without causing eye strain.

Secondary and tertiary slates are used for supporting UI elements and metadata. A vibrant blue accent is reserved for interactive states (links, focus rings) to provide clear affordance within the monochrome-leaning enterprise environment.

## Typography
This design system utilizes **Inter** for all roles to maintain a systematic, utilitarian feel that excels in digital legibility. The hierarchy is characterized by generous line heights (typically 1.5x for body text) to facilitate scanning of dense information.

Headlines use semi-bold weights and tight letter-spacing to create a sense of structural importance. Body text is kept at a comfortable 16px base for standard desktop use, scaling down to 14px only for auxiliary information or dense data grids. Labels are distinctly smaller and occasionally use higher weights to differentiate them from interactive body content.

## Layout & Spacing
The layout follows a **Fluid Grid** model with strict adherence to an 8px spacing rhythm. For desktop views, a 12-column grid is employed with 24px gutters. Margins are generous (40px+) to reinforce the minimalist philosophy and prevent the UI from feeling cramped.

On mobile devices, the grid collapses to 4 columns with 16px margins. Components should prioritize vertical stacking. Spacing between major sections should use the `2xl` (48px) or `3xl` (64px) tokens to create "visual islands" of content, ensuring that different functional areas of the enterprise dashboard are clearly separated without the need for heavy lines.

## Elevation & Depth
Elevation in this design system is expressed through **Ambient Shadows** and **Tonal Layers**. Instead of harsh borders, surfaces are separated by soft, extra-diffused shadows that use a slight navy tint (`#0F172A` at 5-8% opacity) to feel integrated with the brand colors.

- **Level 0 (Background):** The `#F8FAFC` base layer.
- **Level 1 (Cards/Surfaces):** White surfaces with a 1px border in `#E2E8F0` or a very soft 4px blur shadow.
- **Level 2 (Dropdowns/Modals):** White surfaces with a more pronounced 12px-16px blur shadow to indicate clear separation from the workspace.

Avoid using heavy inner shadows or gradients; depth should feel natural, like paper resting on a desk.

## Shapes
The shape language is defined by **Rounded** geometry. A base radius of 12px (`0.75rem`) is the standard for most components, while larger containers like cards and modals utilize 16px (`1rem`) to appear approachable and modern.

This softness offsets the professional rigidity of the slate color palette, making the software feel modern and user-friendly. Smaller elements like checkboxes or tags may scale down to a 4px radius to maintain visual proportion without losing the overall rounded character.

## Components

### Buttons
Primary buttons use the `#0F172A` background with white text, featuring 12px rounded corners and a 16px/24px padding ratio. Hover states should subtly lighten the background to `#1E293B`.

### Input Fields
Inputs are defined by a white background and a 1px border in `#CBD5E1`. On focus, the border transitions to the accent blue (`#2563EB`) with a soft 3px outer glow. Labels are always positioned above the field in `label-md` style for maximum accessibility.

### Cards
Cards are the primary container for data. They feature a white background, 16px corner radius, and a subtle `#E2E8F0` border. Padding inside cards should be a minimum of 24px (`lg`).

### Chips & Tags
Used for status and categorization. These use a light tint of the primary or semantic color (e.g., a soft blue background with dark blue text) and a slightly smaller corner radius (6px) to distinguish them from primary buttons.

### Lists & Data Tables
Rows should have a minimum height of 52px to ensure touch-targets and readability. Use subtle horizontal dividers in `#F1F5F9` rather than full grid borders to maintain the "clean" aesthetic.