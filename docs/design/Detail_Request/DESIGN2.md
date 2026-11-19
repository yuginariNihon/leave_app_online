---
name: Corporate Precision System
colors:
  surface: '#fcf8ff'
  surface-dim: '#d8d7fb'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#efecff'
  surface-container-high: '#e8e6ff'
  surface-container-highest: '#e2dfff'
  on-surface: '#181934'
  on-surface-variant: '#46464f'
  inverse-surface: '#2d2e4a'
  inverse-on-surface: '#f2efff'
  outline: '#777680'
  outline-variant: '#c7c5d0'
  surface-tint: '#575a8c'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131645'
  on-primary-container: '#7c80b4'
  inverse-primary: '#bfc2fb'
  secondary: '#b7102a'
  on-secondary: '#ffffff'
  secondary-container: '#db313f'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#191c1d'
  on-tertiary-container: '#828485'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bfc2fb'
  on-primary-fixed: '#131645'
  on-primary-fixed-variant: '#3f4273'
  secondary-fixed: '#ffdad8'
  secondary-fixed-dim: '#ffb3b1'
  on-secondary-fixed: '#410007'
  on-secondary-fixed-variant: '#92001c'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#fcf8ff'
  on-background: '#181934'
  surface-variant: '#e2dfff'
typography:
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: IBM Plex Sans
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 40px
  stack-sm: 4px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is engineered for corporate reliability and administrative clarity. It targets enterprise environments where speed of data processing and clarity of status are paramount. The aesthetic is **Corporate / Modern**, prioritizing a systematic, structured interface that reduces cognitive load for HR professionals and employees. 

The emotional response should be one of confidence, institutional stability, and efficiency. By utilizing a "High-Utility Minimalism" approach, the design system strips away unnecessary ornamentation to focus on functional hierarchy, crisp borders, and a rigorous adherence to grid-based alignment.

## Colors
The palette is anchored by a deep **Midnight Navy** (#000033), used for primary navigation, headers, and core brand accents to establish authority. **Signal Red** (#E63946) is reserved exclusively for negative actions (decline, delete, emergency) and critical alerts, providing a high-contrast functional trigger. 

The background remains a stark, clean white to ensure maximum legibility. A scale of cool grays is used for secondary text and structural borders to maintain the professional, clinical feel of the system without introducing visual noise.

## Typography
This design system utilizes **IBM Plex Sans** for its systematic and technical character. The typeface strikes a balance between the humanistic and the engineered, making it ideal for data-heavy enterprise applications. 

Headlines are set with tighter letter spacing and heavier weights to command attention, while body text uses generous line heights to ensure long-form lists and tables remain readable. All labels use a slightly increased letter spacing and semi-bold weights to clearly distinguish metadata from primary content.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for desktop, centered within a 1440px container to prevent excessive line lengths on ultra-wide monitors. A rigorous 8px base unit governs all dimensions.

The system uses a 12-column grid with 24px gutters. Dashboard views should prioritize a "Side-Nav + Header + Content" structure. Spacing between unrelated logical sections should be 32px (stack-lg), while internal component spacing should stay tight at 8px or 16px to maintain a compact, data-dense environment suitable for professional workflows.

## Elevation & Depth
Depth is communicated through **Low-contrast outlines** and subtle tonal layering rather than heavy shadows. This maintains the "flat" corporate aesthetic while providing necessary visual hierarchy.

- **Level 0 (Surface):** The main background, pure white or the lightest gray.
- **Level 1 (Cards/Sections):** Defined by a 1px solid border (#E2E8F0) with no shadow. 
- **Level 2 (Dropdowns/Modals):** These utilize a very soft, high-diffusion shadow (0px 4px 20px rgba(0, 0, 51, 0.08)) to lift them above the interface without breaking the professional tone.
- **Interactive States:** Buttons and inputs use a subtle 1px inset stroke or a slight background tint on hover to signal interactivity.

## Shapes
The shape language is conservative and disciplined. A **Soft** roundedness (4px) is applied to standard UI elements like buttons, input fields, and status tags. This provides a modern touch that prevents the UI from feeling dated or overly aggressive, while maintaining the structural integrity expected of a corporate system. Large containers or dashboard cards may use 8px (rounded-lg) to frame significant blocks of information.

## Components
- **Buttons:** Primary buttons are solid Midnight Navy with white text. Danger actions are solid Signal Red. Secondary buttons use a 1px Navy outline with no fill.
- **Input Fields:** High-contrast 1px borders. Focus states must use a 2px Midnight Navy ring. Labels are always positioned above the field in `label-md` style.
- **Status Chips:** Used for leave approval status. Use a light background tint of the status color (e.g., light green for approved, light red for rejected) with bold, dark text of the same hue.
- **Data Tables:** The core of the system. Use "Zebra striping" with a very light gray (#F8F9FA) for every second row. Headers should be sticky with a 2px Navy bottom border.
- **Navigation:** A vertical sidebar on the left, using the primary Navy color as the background, with high-contrast white or light gray icons and text. Active states should be indicated by a vertical bar on the left edge.
- **Cards:** Used for summary statistics (e.g., "Remaining Leave Days"). Cards should be white with a 1px border and a simple, large numerical display.