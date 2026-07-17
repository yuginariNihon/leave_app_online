---
name: Executive Calendar System
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
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#191c1e'
  on-tertiary-container: '#818486'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Manrope
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
    fontWeight: '600'
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
  unit: 4px
  container-padding: 32px
  grid-gutter: 1px
  calendar-cell-min-height: 120px
  margin-sm: 8px
  margin-md: 16px
  margin-lg: 24px
---

## Brand & Style

The design system is engineered for high-stakes enterprise environments where clarity, reliability, and precision are paramount. It adopts a **Corporate Modern** aesthetic—blending the structured discipline of traditional finance with the airy, functional minimalism of modern SaaS. 

The visual narrative focuses on "Efficiency through Clarity." By utilizing a refined grayscale foundation punctuated by authoritative deep blues, the interface minimizes cognitive load while maximizing the visibility of critical schedule data. The emotional response is one of calm control and professional competence.

## Colors

The palette is built on a "Navy & Slate" foundation. 
- **Primary (#0F172A):** Used for primary headings and navigation to establish authority.
- **Secondary (#2563EB):** Used for interaction states, primary buttons, and highlighting "today" in the calendar grid.
- **Tertiary/Surface (#F8FAFC):** A clean, off-white background that reduces glare during long periods of use.
- **Status Colors:** High-contrast tokens specifically for leave types. These are paired with 10% opacity backgrounds for calendar "chips" to ensure text remains legible while color coding is distinct.

## Typography

This design system utilizes a dual-font strategy: **Manrope** for structural headings to provide a modern, geometric feel, and **Inter** for all data-dense areas (calendar numbers, labels, body text) due to its exceptional legibility at small sizes.

- **Scale:** Use `display-lg` for month titles. 
- **Calendar Grid:** Day numbers use `body-md` bolded, while day-of-week headers use `label-bold` in uppercase to distinguish from data.
- **Accessibility:** Line heights are kept generous (1.5x) to ensure schedules remain readable even when multiple events overlap in a single day view.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. The main calendar container is fluid to maximize screen real estate on ultra-wide monitors, while the sidebar (for filters and legend) remains fixed at 280px.

A strict 4px baseline grid is used. The calendar itself is a 7-column grid with a 1px "ghost border" gutter to create the visual effect of separate cells without heavy lines.
- **Desktop:** 32px outer margins.
- **Tablet:** 24px outer margins, calendar cells collapse height to 80px.
- **Mobile:** Single column list-view of upcoming events replaces the grid.

## Elevation & Depth

To maintain a "Professional/Clean" feel, this design system avoids heavy shadows. Instead, it uses **Tonal Layering** and **Low-Contrast Outlines**:
- **Level 0 (Background):** #F8FAFC.
- **Level 1 (Calendar Sheet):** White surface with a 1px #E2E8F0 border.
- **Level 2 (Active/Hover):** A subtle `0px 4px 12px rgba(15, 23, 42, 0.05)` shadow is applied only to active modals or expanded event cards to indicate focus.
- **Depth:** Elements like "today" are indicated by a subtle secondary-color wash (#EFF6FF) rather than physical elevation.

## Shapes

The shape language is "Soft-Modern."
- **Standard UI Elements:** 8px (0.5rem) corner radius for buttons and input fields.
- **Calendar Container:** 12px (0.75rem) corner radius to soften the large grid.
- **Status Indicators:** Pills (full rounding) are used for leave type chips to contrast against the sharp-cornered calendar cells.

## Components

### Calendar Cells
Each cell consists of a top-aligned date label. Hovering over a cell reveals a subtle "+" icon to add a new entry. Today's date is indicated by a circular background behind the number using the Secondary color.

### Leave Chips
Status indicators for leave types should be styled as "ghost chips": a solid 2px left-border of the status color, a 10% opacity background of the same color, and dark slate text. This ensures accessibility and high visibility.

### Navigation Controls
Month navigation (Prev/Next) should use icon-only ghost buttons with 24px hit targets. The "Jump to Today" button should be a secondary-style button (outline or solid blue).

### Filter Sidebar
Use checkboxes for toggling visibility of different leave types. Each checkbox should be color-coordinated with the status color it represents to create a mental map between the filter and the grid.

### Event Modals
Modals for event details should use the Level 2 elevation, centered on screen, with a backdrop blur (8px) to maintain context while focusing the user's attention.