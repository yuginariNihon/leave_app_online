---
name: Secure Modernity
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#464554'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#767586'
  outline-variant: '#c7c4d7'
  surface-tint: '#494bd6'
  primary: '#4648d4'
  on-primary: '#ffffff'
  primary-container: '#6063ee'
  on-primary-container: '#fffbff'
  inverse-primary: '#c0c1ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#904900'
  on-tertiary: '#ffffff'
  tertiary-container: '#b55d00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703700'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
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
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  container-padding: 1.5rem
  gutter: 1rem
---

## Brand & Style

This design system is built on the principles of **Corporate Modernism** with a focus on trust, clarity, and efficiency. It leverages a clean, high-utility aesthetic to ensure that sensitive actions—like password resets—feel secure and straightforward. 

The visual language is defined by ample whitespace, a crisp neutral palette, and a singular vibrant accent that directs user attention to primary actions. The emotional response is intended to be professional and reassuring, minimizing cognitive load through predictable layouts and high-legibility typography.

## Colors

The palette is anchored by **Vibrant Indigo** (#6366f1), used exclusively for primary calls to action, active states, and critical brand touchpoints. This is balanced by a sophisticated range of **Slate Grays** that manage information hierarchy.

- **Primary:** Used for the main "Confirm" or "Submit" buttons.
- **Secondary:** A muted slate (#64748b) used for secondary buttons, borders, and sub-text.
- **Surface:** Pure white (#ffffff) for modals and cards to maintain a "clean" feel, with a very light gray (#f8fafc) used for page backgrounds to provide subtle contrast against white containers.
- **Text:** Deep slate (#1e293b) for headings to ensure maximum readability, and medium slate for body copy.

## Typography

The system utilizes **Inter** for its exceptional legibility and neutral, professional character. For Thai language support, **Kanit** is recommended as a secondary pairing, as its geometric qualities align perfectly with Inter’s structure.

- **Headings:** Use tighter letter-spacing and heavier weights (600-700) to create a sense of authority.
- **Body:** Standardized at 14px and 16px to ensure readability across all device types.
- **Hierarchy:** High contrast in weight (Bold vs. Regular) is preferred over excessive variations in font size to maintain a compact, "app-like" feel.

## Layout & Spacing

The design system employs a **Fluid Grid** model centered on an 8px (0.5rem) base unit. 

- **Modals & Dialogs:** Use a maximum width of 480px on desktop, centering automatically. Internal padding is fixed at `space-lg` (24px) to ensure content breathes.
- **Desktop:** A 12-column grid with 24px margins.
- **Mobile:** A 4-column grid with 16px margins.
- **Vertical Rhythm:** Elements within a component (like a modal title and its body text) should use `space-sm` (8px), while distinct sections or button groups should use `space-md` (16px) or `space-lg` (24px).

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layering**. 

- **Level 0 (Background):** Solid `#f8fafc`.
- **Level 1 (Cards/Inputs):** Solid `#ffffff` with a fine 1px border in `#e2e8f0`.
- **Level 2 (Modals/Popovers):** Solid `#ffffff` with a soft, diffused shadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`.
- **Interactive States:** Buttons use a slight shadow on hover to simulate physical "lift," while inputs use a primary-colored glow (`0 0 0 3px rgba(99, 102, 241, 0.2)`) when focused.

## Shapes

The shape language is consistently **Rounded**, using a medium corner radius to soften the professional aesthetic and make the interface feel more approachable.

- **Components (Buttons, Inputs, Small Cards):** 0.5rem (8px) radius.
- **Large Containers (Modals):** 1rem (16px) radius to emphasize the "enclosed" nature of the dialog.
- **Checkboxes:** 0.25rem (4px) to maintain a crisp, functional look.

## Components

### Buttons
- **Primary:** Solid `#6366f1` background with white text. 0.5rem border radius. High-contrast sans-serif label.
- **Secondary/Ghost:** White background with a `#e2e8f0` border. Text in `#1e293b`. This is used for "Cancel" or "Back" actions to prevent visual competition with the primary action.

### Input Fields
- **Default:** White background, `#e2e8f0` border, 0.5rem radius.
- **Focus:** Border changes to `#6366f1` with a subtle 3px outer glow in the primary color at 20% opacity.

### Modals
- **Structure:** A clear header with `headline-md`, followed by body text in `body-md`. 
- **Action Bar:** Buttons are right-aligned on desktop and full-width (stacked) on mobile. The primary action is always placed on the far right (or top when stacked).

### Chips/Badges
- Used for status or tags. Small text, `label-sm`, with 1rem (pill) radius and low-saturation background tints of the primary color.