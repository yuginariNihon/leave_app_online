---
name: Cyber-State Gaming
colors:
  surface: '#11131b'
  surface-dim: '#11131b'
  surface-bright: '#373942'
  surface-container-lowest: '#0c0e16'
  surface-container-low: '#191b23'
  surface-container: '#1d1f28'
  surface-container-high: '#282a32'
  surface-container-highest: '#33343d'
  on-surface: '#e1e1ed'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e1e1ed'
  inverse-on-surface: '#2e3039'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dbe7'
  primary: '#e1fdff'
  on-primary: '#00363a'
  primary-container: '#00f2ff'
  on-primary-container: '#006a71'
  inverse-primary: '#00696f'
  secondary: '#ecb2ff'
  on-secondary: '#520071'
  secondary-container: '#cf5cff'
  on-secondary-container: '#480063'
  tertiary: '#f8f6fe'
  on-tertiary: '#2f3036'
  tertiary-container: '#dbdae1'
  on-tertiary-container: '#5f5f66'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#74f5ff'
  primary-fixed-dim: '#00dbe7'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#f8d8ff'
  secondary-fixed-dim: '#ecb2ff'
  on-secondary-fixed: '#320047'
  on-secondary-fixed-variant: '#74009f'
  tertiary-fixed: '#e3e1e9'
  tertiary-fixed-dim: '#c7c6cd'
  on-tertiary-fixed: '#1a1b21'
  on-tertiary-fixed-variant: '#46464c'
  background: '#11131b'
  on-background: '#e1e1ed'
  surface-variant: '#33343d'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: 0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0.01em
  body-md:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  label-bold:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.1em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 20px
  margin: 32px
---

## Brand & Style
This design system targets a high-performance gaming audience, evoking feelings of immersion, technological superiority, and digital precision. The aesthetic is rooted in **Glassmorphism** and **High-Contrast Bold** movements, creating a "command center" interface that feels both premium and futuristic.

The brand personality is aggressive yet refined, utilizing dark-mode surfaces to allow neon accents to pop with maximum energy. The UI should feel like a localized HUD (Heads-Up Display), where depth is created through light streaks and translucent layering rather than traditional skeuomorphism.

## Colors
The palette is anchored by **Deep Navy (#0A0B10)** and **Charcoal (#12141C)** to create a multi-layered dark foundation. 

- **Primary (Neon Cyan):** Used for critical actions, active states, and primary glows. It represents high energy and connectivity.
- **Secondary (Electric Purple):** Used for accent details, progression, and secondary interactive elements. It provides a biological, high-tech contrast to the cold cyan.
- **Surface Tiers:** Backgrounds use deep navy. Containers use charcoal with varying levels of opacity (60-80%) to facilitate glassmorphism.
- **Accents:** All interactive elements utilize a 0-20px Gaussian blur "glow" in their respective primary or secondary colors to simulate light emission.

## Typography
**Space Grotesk** is the exclusive typeface for this design system. Its geometric construction and wide stance perfectly mirror futuristic tech interfaces. 

- **Headlines:** Should always be bold with tight line-heights and slight tracking increases to emphasize the "wide" tech aesthetic.
- **Labels:** Use uppercase for functional labels (e.g., input titles, small buttons) to enhance the "terminal" feel.
- **Body:** Maintains high legibility while retaining the technical character of the Grotesk font.

## Layout & Spacing
This design system utilizes a **12-column Fluid Grid** with generous margins for centered login modules. The rhythm is based on a 4px scale, favoring larger gaps (24px+) between distinct functional groups to maintain a clean, "uncluttered" high-tech appearance.

Alignment should be strictly mathematical and rigid. Elements are often grouped within high-contrast containers that use the `xl` padding (40px) to create an expansive, premium feel around interactive forms.

## Elevation & Depth
Depth is achieved through **Glassmorphism** and light-based layering rather than traditional drop shadows.

1.  **Background Layer:** Deepest navy with abstract geometric light streaks (10-20% opacity).
2.  **Base Layer:** Semi-transparent charcoal surfaces with a 12px backdrop-blur and a 1px border at 20% white opacity.
3.  **Active Layer:** Interaction brings elements forward using "Outer Glows" (Primary or Secondary colors at 30-50% opacity) rather than black shadows.
4.  **Overlay Layer:** Modals and tooltips feature a 2px stroke using a gradient from Cyan to Purple to define edges against the dark background.

## Shapes
The shape language is defined by **Sharp Corners (0px)**. This reinforces the aggressive, "cut-from-crystal" or "machined" look of high-end gaming hardware.

To prevent the UI from feeling dated, visual softness is introduced exclusively through **light and color gradients**, never through corner rounding. Angular 45-degree chamfers may be used on buttons or decorative borders to further the futuristic theme.

## Components

- **Buttons:** Sharp-edged with a subtle vertical gradient (e.g., Primary Cyan to a slightly darker shade). On hover, apply a 15px outer glow of the same color and increase the brightness of the text.
- **Input Fields:** Dark charcoal background with a 1px bottom-border only (Cyan). On focus, the border should glow, and a subtle Cyan-to-transparent gradient should fill the bottom 20% of the input field.
- **Cards/Containers:** Glassmorphic panels with `backdrop-filter: blur(12px)`. Use a 1px border at `rgba(255, 255, 255, 0.1)` to define the edges.
- **Checkboxes:** Square, sharp corners. When active, they should be filled with a Secondary Purple and emit a soft purple glow.
- **Chips/Badges:** Small, outlined boxes with monospaced-style labels. Use for "Server Status" or "Beta" tags.
- **Loading States:** Linear progress bars featuring a "scanning" light effect that moves from left to right, utilizing both Cyan and Purple gradients.