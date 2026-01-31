# Cinematic Design System

## Overview

This repository contains a premium, cinematic dark-mode design system specifically tailored for AI-powered legal discovery and trial platforms. The system combines deep blacks, rich accents, and subtle atmospheric effects to create an interface that feels both luxurious and functional.

## Features

- **Cinematic Dark Mode**: Deep color palette with rich accent colors
- **Glassmorphism Effects**: Modern frosted glass UI components
- **Glowing Elements**: Neon accents for interactive elements
- **Typography System**: Carefully crafted font hierarchy
- **Component Library**: Reusable UI components with consistent styling
- **Animation System**: Smooth transitions and micro-interactions
- **Responsive Design**: Mobile-first approach with responsive utilities
- **Accessibility**: WCAG AA compliant color contrast and focus states

## File Structure

```
frontend/
├── src/
│   ├── styles/
│   │   ├── design-system.css       # Main design system styles
│   │   ├── cinematic-design-system.css  # Enhanced cinematic styles
│   │   └── index.css               # Main application styles
│   └── components/
│       └── CinematicDesignSystemDemo.tsx  # Demo component
├── docs/
│   ├── design-system.md            # Comprehensive documentation
│   ├── cinematic-design-system.md  # Enhanced cinematic documentation
│   ├── design-system-demo.html     # HTML demo page
│   └── design-system-README.md     # This file
```

## Getting Started

### Installation

The design system is already integrated into the project. To use it in your components:

1. Import the design system CSS in your main application file:
```css
@import './styles/design-system.css';
```

2. Use the utility classes in your components:
```html
<div class="ds-bg-panel ds-p-6 ds-radius-xl ds-shadow-lg">
  <h2 class="ds-text-primary ds-font-display ds-text-2xl">Card Title</h2>
  <p class="ds-text-secondary ds-mt-2">Card content...</p>
</div>
```

### Using Utility Classes

The design system provides a comprehensive set of utility classes for common styling needs:

#### Backgrounds
- `.ds-bg-canvas` - Main application background
- `.ds-bg-surface` - Cards, panels
- `.ds-bg-panel` - Elevated content

#### Text Colors
- `.ds-text-primary` - Headings, important text
- `.ds-text-secondary` - Body text, labels
- `.ds-text-tertiary` - Subtle text, placeholders

#### Spacing
- `.ds-p-{n}` - Padding (n = 1-12, 16, 20, 24, etc.)
- `.ds-m-{n}` - Margin (n = 1-12, 16, 20, 24, etc.)
- `.ds-px-{n}` - Horizontal padding
- `.ds-py-{n}` - Vertical padding

#### Borders & Radius
- `.ds-radius-xs` to `.ds-radius-full` - Border radius utilities
- `.ds-border-default` - Default border style

#### Typography
- `.ds-font-ui` - UI font family
- `.ds-font-display` - Display font family
- `.ds-font-mono` - Monospace font family
- `.ds-text-{size}` - Font size utilities (xs, sm, base, lg, xl, 2xl, etc.)

#### Components
- `.ds-card-cinematic` - Cinematic card component
- `.ds-btn-accent` - Accent button
- `.ds-node-glow` - Glowing node effect
- `.ds-glass` - Glassmorphism effect

## Color Palette

### Core Backgrounds
- **Canvas**: `#101217` - Main application background
- **Surface**: `#181a1e` - Cards, panels
- **Panel**: `#22232a` - Elevated content
- **Elevated**: `#2a2b32` - Floating elements
- **Overlay**: `#32333a` - Modal backgrounds

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

## Components

### Cards
```html
<div class="ds-card-cinematic ds-p-6">
  <h3 class="ds-text-primary ds-font-display ds-text-xl ds-mb-4">Card Title</h3>
  <p class="ds-text-secondary ds-mb-6">Card content...</p>
  <button class="ds-btn-accent">Action</button>
</div>
```

### Buttons
```html
<button class="ds-btn-accent">Primary Button</button>
```

### Progress Bar
```html
<progress class="ds-progress-cinematic ds-w-full" value="75" max="100"></progress>
```

### Status Indicators
```html
<div class="ds-status-indicator"></div>
<div class="ds-status-indicator ds-status-indicator--warning"></div>
<div class="ds-status-indicator ds-status-indicator--error"></div>
```

## Customization

To customize the design system for your specific needs:

1. Modify the CSS custom properties in `design-system.css`
2. Add new utility classes as needed
3. Extend the component library with project-specific components

## Accessibility

The design system follows WCAG 2.1 AA guidelines:
- Minimum 4.5:1 contrast ratio for text
- Focus states for interactive elements
- Semantic HTML structure
- Reduced motion support
- High contrast mode support

## Browser Support

The design system works in all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This design system is proprietary to the Co-Counsel Nexus project and should not be used outside of this project without explicit permission.