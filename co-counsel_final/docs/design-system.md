# Cinematic Dark Mode Design System
## AI-Powered Legal Discovery & Trial Platform

---

## Overview

This design system establishes a premium, cinematic dark-mode interface for an AI-powered legal discovery and trial platform. Drawing inspiration from Apple Pro apps, Unreal Engine's editor, and sci-fi UI motifs, it combines deep blacks, rich accents, and subtle atmospheric effects to create an interface that feels both luxurious and functional.

---

## Color Palette

### Core Backgrounds
- **Canvas**: `#101217` - Main application background
- **Surface**: `#181a1e` - Cards, panels
- **Panel**: `#22232a` - Elevated content
- **Elevated**: `#2a2b32` - Floating elements
- **Overlay**: `#32333a` - Modal backgrounds

### Text & Content
- **Primary**: `#ececf0` - Headings, important text
- **Secondary**: `#bcc6cf` - Body text, labels
- **Tertiary**: `#8a919e` - Subtle text, placeholders
- **Disabled**: `#5a5f6e` - Inactive elements
- **Inverse**: `#0a0c10` - Text on light backgrounds

### Accent Colors

#### Cyan (Primary Accent)
- 100: `#e6fcff`
- 200: `#b3f0ff`
- 300: `#80e4ff`
- 400: `#4dd7ff`
- 500: `#18cafe` (Primary)
- 600: `#00b8e6`
- 700: `#00a6cc`
- 800: `#0094b3`
- 900: `#008299`

#### Violet (Secondary Accent)
- 100: `#f0e6ff`
- 200: `#d9c7ff`
- 300: `#c2a8ff`
- 400: `#ab89ff`
- 500: `#946aff` (Primary)
- 600: `#7d4bff`
- 700: `#663ce6`
- 800: `#4f2dcc`
- 900: `#381eb3`

#### Support Accents
- **Gold**: `#ffd65a` - Success, highlights
- **Red**: `#ff204e` - Errors, warnings
- **Green**: `#4ade80` - Success, confirmations

### Borders & Dividers
- **Default**: `#383b44`
- **Subtle**: `#2d2f38`
- **Strong**: `#4a4d57`

---

## Typography

### Font Families
- **UI/Body**: `Inter`, system-ui
- **Display/Headings**: `Quorum Std`, `Inter`
- **Monospace**: `IBM Plex Mono`

### Font Sizes
- **xs**: 0.75rem (12px)
- **sm**: 0.875rem (14px)
- **base**: 1rem (16px)
- **lg**: 1.125rem (18px)
- **xl**: 1.25rem (20px)
- **2xl**: 1.5rem (24px)
- **3xl**: 1.875rem (30px)
- **4xl**: 2.25rem (36px)
- **5xl**: 3rem (48px)
- **6xl**: 3.75rem (60px)

### Font Weights
- **Light**: 300
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700
- **Extrabold**: 800

---

## Spacing System

The spacing system uses a consistent 4px base unit:
- **0**: 0
- **1**: 0.25rem (4px)
- **2**: 0.5rem (8px)
- **3**: 0.75rem (12px)
- **4**: 1rem (16px)
- **5**: 1.25rem (20px)
- **6**: 1.5rem (24px)
- **8**: 2rem (32px)
- **10**: 2.5rem (40px)
- **12**: 3rem (48px)
- **16**: 4rem (64px)
- **20**: 5rem (80px)
- **24**: 6rem (96px)

---

## Border Radius

- **xs**: 0.125rem (2px)
- **sm**: 0.25rem (4px)
- **md**: 0.375rem (6px)
- **lg**: 0.5rem (8px)
- **xl**: 0.75rem (12px)
- **2xl**: 1rem (16px)
- **3xl**: 1.5rem (24px)
- **full**: 9999px

---

## Shadows & Glows

### Shadows
- **xs**: `0 1px 2px 0 rgba(0, 0, 0, 0.12)`
- **sm**: `0 4px 8px 0 rgba(0, 0, 0, 0.16)`
- **md**: `0 8px 16px 0 rgba(0, 0, 0, 0.20)`
- **lg**: `0 16px 32px 0 rgba(0, 0, 0, 0.24)`
- **xl**: `0 24px 48px 0 rgba(0, 0, 0, 0.28)`

### Glows
- **Cyan XS**: `0 0 4px rgba(24, 202, 254, 0.2)`
- **Cyan SM**: `0 0 8px rgba(24, 202, 254, 0.3)`
- **Cyan MD**: `0 0 16px rgba(24, 202, 254, 0.4)`
- **Cyan LG**: `0 0 24px rgba(24, 202, 254, 0.5)`
- **Violet XS**: `0 0 4px rgba(148, 106, 255, 0.2)`
- **Violet SM**: `0 0 8px rgba(148, 106, 255, 0.3)`
- **Violet MD**: `0 0 16px rgba(148, 106, 255, 0.4)`
- **Violet LG**: `0 0 24px rgba(148, 106, 255, 0.5)`

---

## Transitions & Animations

### Timing Functions
- **Ease In**: `cubic-bezier(0.32, 0, 0.67, 0)`
- **Ease Out**: `cubic-bezier(0.33, 1, 0.68, 1)`
- **Ease In Out**: `cubic-bezier(0.65, 0, 0.35, 1)`
- **Elastic**: `cubic-bezier(0.22, 1, 0.36, 1)`

### Duration
- **Fast**: 150ms
- **Medium**: 250ms
- **Slow**: 400ms
- **Slower**: 600ms

### Animation Keys
- **Fade In**: `fade-in 250ms ease-out`
- **Fade Out**: `fade-out 250ms ease-out`
- **Scale In**: `scale-in 250ms elastic`
- **Scale Out**: `scale-out 250ms elastic`
- **Slide In Right**: `slide-in-right 250ms elastic`
- **Slide Out Right**: `slide-out-right 250ms elastic`
- **Pulse**: `pulse 1.5s infinite`
- **Glow**: `glow 2s infinite`

---

## Z-Index Scale

- **Backdrop**: -1
- **Surface**: 1
- **Panel**: 10
- **Dropdown**: 100
- **Sticky**: 110
- **Fixed**: 120
- **Modal**: 1000
- **Popover**: 1010
- **Tooltip**: 1020

---

## Component Styles

### Glassmorphism
```css
.ds-glass {
  background: rgba(34, 35, 42, 0.78);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### Cinematic Card
```css
.ds-card-cinematic {
  background: linear-gradient(160deg, rgba(34, 36, 45, 0.95), rgba(20, 22, 29, 0.75));
  border-radius: var(--ds-radius-xl);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 45px -32px rgba(0, 0, 0, 0.65);
}
```

### Accent Button
```css
.ds-btn-accent {
  background: linear-gradient(135deg, var(--ds-color-accent-violet-600), var(--ds-color-accent-cyan-500));
  color: white;
  border: none;
  border-radius: var(--ds-radius-lg);
  box-shadow: 0 0 16px rgba(24, 202, 254, 0.3);
}
```

### Node Glow Effect
```css
.ds-node-glow {
  position: relative;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(24, 202, 254, 0.3);
}
```

---

## Implementation Guidelines

### CSS Custom Properties
All design tokens are implemented as CSS custom properties for easy theming and maintenance:
```css
:root {
  --ds-color-bg-canvas: #101217;
  --ds-font-ui: 'Inter', system-ui;
  --ds-radius-lg: 0.5rem;
}
```

### Utility Classes
The design system includes utility classes for common styling needs:
```html
<div class="ds-bg-surface ds-p-4 ds-radius-lg ds-shadow-md">
  <h2 class="ds-text-primary ds-font-display ds-text-2xl">Card Title</h2>
  <p class="ds-text-secondary ds-mt-2">Card content...</p>
</div>
```

### Responsive Design
Use the spacing system with responsive utilities:
```html
<div class="ds-p-4 ds-md:p-6 ds-lg:p-8">
  <!-- Content that increases padding on larger screens -->
</div>
```

### Accessibility
- All color combinations meet WCAG 2.1 AA contrast requirements
- Focus states are clearly visible with accent colors
- Reduced motion preferences are respected
- High contrast mode support is included

---

## Motion Design Principles

### Philosophy
All motion should be purposeful, elegant, and subtle. Use motion to:
- Cue user focus
- Clarify relationships
- Evolve cinematic depth
- Never distract or overwhelm

### Micro-motion Principles
- **Parallax**: Subtle depth effects on scroll/mouse move
- **Inertia/Ease**: Physical animation with elastic behavior
- **Glass/Glow**: Blur and glow effects on state changes
- **Page Transitions**: Fade-through-black with soft bloom
- **Node Motion**: Elastic spring behavior in graphs
- **Hover States**: Soft lift or gradient sweep effects

---

## Component Architecture

### Dashboard Hub
- Full-bleed dark canvas with blurred vignette
- Layered modules with glassmorphism
- Live metrics with neon accent digits
- Collapsing sidebar with floating reveal

### Evidence Upload
- Central drop zone with animated neon rim
- Progress visualization with accent colors
- AI summary tiles with holo-pop effect
- File cards with micro-glassmorphism

### Graph Explorer
- 3D force-directed graph with React Three Fiber
- Spherical nodes with core glow
- Light wire edges with hover effects
- Glass panel overlays for controls

### Trial University
- Modular video lessons with holoscreen styling
- Floating glass tiles with neon accents
- Interactive subtitles with fade effects
- Progress visualization with glowing bars

### Mock Trial Arena
- Video chat tiles with holo borders
- Exhibit drag-and-drop with spotlight effect
- Audio visualization with glow pulsing
- Transcript panel with cinematic overlay

---

## Technical Implementation

### Stack
- **React** (Vite) for UI components
- **TailwindCSS** for utility classes
- **Framer Motion** for micro-interactions
- **React Three Fiber** for 3D visualization
- **WebRTC** for real-time collaboration

### Tokenization
Design tokens are managed through CSS custom properties and can be easily extended or modified:
```css
/* Extend the system with project-specific tokens */
:root {
  --ds-color-brand-primary: #your-brand-color;
  --ds-spacing-section: 5rem;
}
```

### Performance Considerations
- Glass effects degrade gracefully on unsupported devices
- Animations respect `prefers-reduced-motion` settings
- Efficient CSS transforms for smooth performance
- Lazy loading for heavy components

---

## Usage Examples

### Creating a Cinematic Card
```html
<div class="ds-card-cinematic ds-p-6">
  <h3 class="ds-text-primary ds-font-display ds-text-xl ds-mb-4">Case Summary</h3>
  <p class="ds-text-secondary ds-mb-6">Key details about the litigation...</p>
  <button class="ds-btn-accent">View Details</button>
</div>
```

### Implementing a Glowing Node
```html
<div class="ds-node-glow ds-w-16 ds-h-16 ds-animate-node-glow">
  <!-- Node content -->
</div>
```

### Building a Progress Indicator
```html
<progress class="ds-progress-cinematic ds-w-full" value="75" max="100"></progress>
```

---

## Future Extensions

This design system is built to evolve with the platform:
- Light mode variant
- High contrast theme
- Reduced motion theme
- Custom branding options
- Additional component patterns
- Advanced 3D visualization components
- Voice UI components
- Mobile-specific adaptations

---

## References

This design system draws inspiration from:
- Apple Pro applications (Logic Pro, Motion)
- Unreal Engine editor interface
- "The Batman" (2022) UI design
- "Ghost in the Shell" cyber-chic aesthetics
- Modern legal tech platforms
- Enterprise SaaS design best practices

The system balances cinematic drama with legal tech precision, ensuring interfaces feel intelligent and powerful while maintaining clarity and trust.