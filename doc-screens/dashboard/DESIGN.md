---
name: Precision Minimalism
colors:
  surface: '#12131a'
  surface-dim: '#12131a'
  surface-bright: '#383941'
  surface-container-lowest: '#0d0e15'
  surface-container-low: '#1a1b22'
  surface-container: '#1e1f26'
  surface-container-high: '#292931'
  surface-container-highest: '#33343c'
  on-surface: '#e3e1ec'
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#e3e1ec'
  inverse-on-surface: '#2f3038'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#732ee4'
  secondary: '#89ceff'
  on-secondary: '#00344d'
  secondary-container: '#00a2e6'
  on-secondary-container: '#00344e'
  tertiary: '#ffb784'
  on-tertiary: '#4f2500'
  tertiary-container: '#a15100'
  on-tertiary-container: '#ffe0cd'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb784'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#713700'
  background: '#12131a'
  on-background: '#e3e1ec'
  surface-variant: '#33343c'
typography:
  display-xl:
    fontFamily: Geist
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  caption:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  max-width: 1440px
---

## Brand & Style

The design system is built on the principles of **Precision Minimalism**. It is designed for high-performance productivity tools where clarity, speed, and focus are paramount. The aesthetic targets a sophisticated user base—developers, founders, and architects—who value a tool that feels as powerful as a command-line interface but as refined as a luxury editorial.

The UI evokes an emotional response of **composed control**. By utilizing a "Dark-First" philosophy with a "High-Contrast Light" counterpart, the system remains legible and professional. It leans heavily into the **Corporate Modern** movement, infused with **Glassmorphism** for depth and **Minimalism** for content prioritization. Visual noise is treated as a bug; every line, border, and pixel serves a functional purpose in the user's workflow.

## Colors

The color palette is engineered for high-end SaaS environments. The **Primary** color is a vibrant "Electric Violet," chosen for its visibility against deep blacks and its modern, energetic feel. The **Secondary** color is a "Cyber Blue," used sparingly for interactive cues and success states.

**Dark Mode (Primary):**
The foundation is a deep Charcoal/Graphite (#0A0A0A). Surfaces are built using subtle shifts in luminance rather than heavy grays, creating a sense of infinite depth. Accents are neon-influenced but refined.

**Light Mode:**
The system transitions to "Ice White" (#F9FAFB). Contrast is maintained through razor-thin borders (#E4E4E7) and deep slate typography, ensuring the interface feels airy but never washed out.

**Functional Accents:**
- **Success:** Emerald 500
- **Warning:** Amber 400
- **Error:** Rose 500

## Typography

This design system utilizes **Geist** exclusively to maintain a technical, clean, and highly legible interface. The typography follows a strict mathematical scale to ensure hierarchy is immediate.

**Headlines:**
Display and Large headlines use tighter letter spacing and heavier weights to create a "blocky," authoritative look. On mobile, headlines scale down aggressively to prevent awkward line breaks in dense SaaS dashboards.

**Body & Labels:**
Body text is optimized for long-form reading and data density. Labels use a slightly heavier weight and increased letter spacing to differentiate them from interactive body text. For code snippets or technical IDs, the monospace variant of the font should be used to signal "technical data."

## Layout & Spacing

The layout is governed by a **8px linear scale**, ensuring vertical and horizontal rhythm across all components.

**Grid Philosophy:**
A **Hybrid Fixed-Fluid Grid** is used. For complex dashboard views, the layout uses a fluid 12-column system with a 24px gutter. For marketing or document-based pages (Notion-style), the content is constrained to a fixed 800px-1000px central column to maximize readability.

**Breakpoints:**
- **Mobile (<768px):** Single column, 16px side margins. Sidebars collapse into bottom sheets or full-screen overlays.
- **Tablet (768px - 1024px):** 8-column grid, compact sidebars.
- **Desktop (>1024px):** 12-column grid, permanent left-hand navigation, 48px global margins.

## Elevation & Depth

Depth in this design system is created through **Tonal Layering** and **Subtle Glassmorphism** rather than heavy shadows.

1.  **Level 0 (Base):** The canvas background (#0A0A0A or #F9FAFB).
2.  **Level 1 (Cards/Sidebar):** A slightly elevated surface using a 1px border (Hex #ffffff10 in dark mode) and a subtle background tint.
3.  **Level 2 (Popovers/Modals):** These use **Backdrop Blurs** (20px-30px) with a semi-transparent fill. This allows the user to maintain context of the layer beneath while focusing on the active task.
4.  **Shadows:** Shadows are used only on the highest elevation levels (Modals/Dropdowns). They are "Ambient Shadows"—extremely diffused (30px-60px blur), low opacity (15%), and slightly tinted with the primary violet color to create a soft "glow" effect rather than a harsh black shadow.

## Shapes

The shape language is **"Soft-Tech."** It avoids the playfulness of fully rounded "pill" shapes in favor of precise, small-radius corners that feel architectural.

- **Standard Elements (Buttons, Inputs, Small Cards):** 0.25rem (4px). This provides a hint of softness while maintaining a sharp, professional grid.
- **Large Containers (Modals, Main Dashboard Cards):** 0.5rem (8px). 
- **Interactive States:** Hovering over list items or menu links should trigger a 4px rounded background highlight.

Consistency in corner radius is vital; mismatched radii are considered a break in the design system's "Precision" ethos.

## Components

**Buttons:**
Primary buttons use a solid Electric Violet fill with white text. Secondary buttons use a "ghost" style: a subtle 1px border that brightens on hover. All buttons feature a 150ms ease-in-out transition for background-color changes.

**Input Fields:**
Inputs are minimalist. In dark mode, they feature a dark-gray background with a bottom-only or subtle 1px border. On focus, the border transitions to the Primary Violet with a very soft outer glow (2px spread).

**Cards:**
Cards do not use shadows by default. They are defined by their 1px borders. In Dark Mode, the border color is `white / 10%`. In Light Mode, it is `black / 8%`.

**Glass Overlays (Sidebars & Header):**
The global navigation sidebar uses a `saturate(180%) blur(20px)` effect. This creates a high-end, futuristic feel common in 2026 SaaS aesthetics.

**Command-K Menu:**
A central component of the design system. It should be a centered modal with high-intensity backdrop blur, featuring a search input and list-based results with keyboard shortcut hints aligned to the right.

**Chips/Badges:**
Small, 4px rounded shapes with low-opacity background tints of the primary or functional colors (e.g., a "Success" badge is Emerald with 10% opacity).