# Component Library

## Overview

This document provides documentation for the reusable components available in the Cinematic Design System. All components are built with accessibility, performance, and consistency in mind.

## Available Components

### 1. Cinematic Card (`.ds-card-cinematic`)

A versatile card component with cinematic styling, featuring a gradient background, rounded corners, and subtle shadow.

```html
<div class="ds-card-cinematic ds-p-6">
  <h3 class="ds-text-primary ds-font-display ds-text-xl ds-mb-4">Card Title</h3>
  <p class="ds-text-secondary ds-mb-6">Card content...</p>
  <button class="ds-btn-accent">Action</button>
</div>
```

**Features:**
- Hover effect with elevation
- Gradient background
- Responsive padding options
- Accessible color contrast

### 2. Accent Button (`.ds-btn-accent`)

A prominent button with a gradient background and glowing effect.

```html
<button class="ds-btn-accent">Click Me</button>
```

**Features:**
- Gradient background (violet to cyan)
- Subtle glow effect
- Hover and active states
- Smooth transitions

### 3. Glowing Node (`.ds-node-glow`)

A circular element with a glowing effect, perfect for representing nodes in a graph or status indicators.

```html
<div class="ds-node-glow ds-w-16 ds-h-16">
  <span class="ds-text-holo">AI</span>
</div>
```

**Features:**
- Circular shape
- Gradient glow effect
- Pulsing animation available (`.ds-animate-node-glow`)
- Customizable size

### 4. Progress Bar (`.ds-progress-cinematic`)

A stylish progress bar with gradient fill.

```html
<progress class="ds-progress-cinematic ds-w-full" value="75" max="100"></progress>
```

**Features:**
- Gradient fill
- Smooth transitions
- Responsive width
- Accessible

### 5. Status Indicators (`.ds-status-indicator`)

Small circular indicators for showing status.

```html
<!-- Default (success) -->
<div class="ds-status-indicator"></div>

<!-- Warning -->
<div class="ds-status-indicator ds-status-indicator--warning"></div>

<!-- Error -->
<div class="ds-status-indicator ds-status-indicator--error"></div>
```

**Features:**
- Three status variations
- Glowing effect
- Consistent sizing
- Accessible color contrast

### 6. Glass Panel (`.ds-glass`, `.ds-glass-strong`)

Frosted glass effect panels for modern UI.

```html
<!-- Light glass effect -->
<div class="ds-glass ds-p-4 ds-radius-lg">
  <p>Content with light glass effect</p>
</div>

<!-- Strong glass effect -->
<div class="ds-glass-strong ds-p-4 ds-radius-lg">
  <p>Content with strong glass effect</p>
</div>
```

**Features:**
- Backdrop blur effect
- Semi-transparent background
- Border with subtle opacity
- Two intensity levels

### 7. Holographic Text (`.ds-text-holo`)

Text with a holographic gradient effect.

```html
<h2 class="ds-text-holo">Holographic Text</h2>
```

**Features:**
- Cyan to violet gradient
- Works on dark backgrounds
- Bold font weight recommended

### 8. Cinematic Badge (`.ds-badge-cinematic`)

Small badge component for labeling and categorization.

```html
<span class="ds-badge-cinematic">New</span>
```

**Features:**
- Pill-shaped
- Violet accent color
- Subtle border
- Compact size

### 9. Divider (`.ds-divider-cinematic`)

Stylish divider with a glowing center point.

```html
<hr class="ds-divider-cinematic">
```

**Features:**
- Gradient line
- Center glow point
- Consistent spacing
- Responsive

### 10. Input Field (`.ds-input-cinematic`)

Stylish input field with focus states.

```html
<input type="text" class="ds-input-cinematic" placeholder="Enter text...">
```

**Features:**
- Frosted glass background
- Focus glow effect
- Consistent padding
- Accessible

### 11. Tooltip (`.ds-tooltip-cinematic`)

Contextual tooltip component.

```html
<div class="ds-tooltip-cinematic">
  Hover me
  <span class="ds-tooltip-text">This is a tooltip</span>
</div>
```

**Features:**
- Position above element
- Glass effect styling
- Smooth fade in/out
- Accessible

## Layout Components

### Cinematic App Container (`.ds-app-cinematic`)

Main application container with grid layout.

```html
<div class="ds-app-cinematic">
  <!-- App content -->
</div>
```

### Cinematic Header (`.ds-header-cinematic`)

Sticky header with gradient background.

```html
<header class="ds-header-cinematic">
  <!-- Header content -->
</header>
```

### Cinematic Navigation (`.ds-nav-cinematic`)

Sidebar navigation with glass effect.

```html
<nav class="ds-nav-cinematic">
  <!-- Navigation content -->
</nav>
```

### Cinematic Main Content (`.ds-main-cinematic`)

Main content area with padding and overflow handling.

```html
<main class="ds-main-cinematic">
  <!-- Main content -->
</main>
```

## Animation Classes

### Fade Animations
- `.ds-animate-fade-in` - Fade in effect
- `.ds-animate-fade-out` - Fade out effect

### Scale Animations
- `.ds-animate-scale-in` - Scale in with fade
- `.ds-animate-scale-out` - Scale out with fade

### Slide Animations
- `.ds-animate-slide-in-right` - Slide in from right
- `.ds-animate-slide-out-right` - Slide out to right

### Special Animations
- `.ds-animate-pulse` - Gentle pulsing effect
- `.ds-animate-glow` - Glowing effect
- `.ds-animate-node-pulse` - Node pulsing effect
- `.ds-animate-node-glow` - Node glowing effect

## Utility Classes

### Backgrounds
- `.ds-bg-canvas` - Main background color
- `.ds-bg-surface` - Surface color
- `.ds-bg-panel` - Panel color
- `.ds-bg-elevated` - Elevated surface color
- `.ds-bg-overlay` - Overlay color

### Text Colors
- `.ds-text-primary` - Primary text color
- `.ds-text-secondary` - Secondary text color
- `.ds-text-tertiary` - Tertiary text color
- `.ds-text-disabled` - Disabled text color
- `.ds-text-inverse` - Inverse text color
- `.ds-text-cyan` - Cyan accent color
- `.ds-text-violet` - Violet accent color
- `.ds-text-gold` - Gold accent color
- `.ds-text-red` - Red accent color
- `.ds-text-green` - Green accent color

### Borders
- `.ds-border-default` - Default border
- `.ds-border-subtle` - Subtle border
- `.ds-border-strong` - Strong border

### Shadows
- `.ds-shadow-xs` - Extra small shadow
- `.ds-shadow-sm` - Small shadow
- `.ds-shadow-md` - Medium shadow
- `.ds-shadow-lg` - Large shadow
- `.ds-shadow-xl` - Extra large shadow

### Glows
- `.ds-glow-cyan-xs` - Extra small cyan glow
- `.ds-glow-cyan-sm` - Small cyan glow
- `.ds-glow-cyan-md` - Medium cyan glow
- `.ds-glow-cyan-lg` - Large cyan glow
- `.ds-glow-violet-xs` - Extra small violet glow
- `.ds-glow-violet-sm` - Small violet glow
- `.ds-glow-violet-md` - Medium violet glow
- `.ds-glow-violet-lg` - Large violet glow

### Typography
- `.ds-font-ui` - UI font family
- `.ds-font-display` - Display font family
- `.ds-font-mono` - Monospace font family

### Spacing
- `.ds-p-{n}` - Padding (n = 1-12, 16, 20, 24, etc.)
- `.ds-m-{n}` - Margin (n = 1-12, 16, 20, 24, etc.)
- `.ds-px-{n}` - Horizontal padding
- `.ds-py-{n}` - Vertical padding
- `.ds-mx-{n}` - Horizontal margin
- `.ds-my-{n}` - Vertical margin

### Radius
- `.ds-radius-xs` - Extra small radius
- `.ds-radius-sm` - Small radius
- `.ds-radius-md` - Medium radius
- `.ds-radius-lg` - Large radius
- `.ds-radius-xl` - Extra large radius
- `.ds-radius-2xl` - 2x large radius
- `.ds-radius-3xl` - 3x large radius
- `.ds-radius-full` - Full radius (circle)

### Transitions
- `.ds-transition-fast` - Fast transition (150ms)
- `.ds-transition-medium` - Medium transition (250ms)
- `.ds-transition-slow` - Slow transition (400ms)

### Flexbox
- `.ds-flex` - Display flex
- `.ds-flex-col` - Flex direction column
- `.ds-flex-row` - Flex direction row
- `.ds-items-center` - Align items center
- `.ds-items-start` - Align items start
- `.ds-items-end` - Align items end
- `.ds-justify-center` - Justify content center
- `.ds-justify-between` - Justify content between
- `.ds-justify-around` - Justify content around
- `.ds-gap-{n}` - Gap (n = 1-6)

### Grid
- `.ds-grid` - Display grid
- `.ds-grid-cols-{n}` - Grid columns (n = 1-4)

### Positioning
- `.ds-relative` - Position relative
- `.ds-absolute` - Position absolute
- `.ds-fixed` - Position fixed
- `.ds-sticky` - Position sticky

### Sizing
- `.ds-w-full` - Width 100%
- `.ds-h-full` - Height 100%
- `.ds-w-screen` - Width 100vw
- `.ds-h-screen` - Height 100vh

### Overflow
- `.ds-overflow-hidden` - Overflow hidden
- `.ds-overflow-auto` - Overflow auto
- `.ds-overflow-x-hidden` - Overflow x hidden
- `.ds-overflow-y-hidden` - Overflow y hidden

### Text Alignment
- `.ds-text-left` - Text align left
- `.ds-text-center` - Text align center
- `.ds-text-right` - Text align right

### Font Weights
- `.ds-font-light` - Font weight 300
- `.ds-font-normal` - Font weight 400
- `.ds-font-medium` - Font weight 500
- `.ds-font-semibold` - Font weight 600
- `.ds-font-bold` - Font weight 700
- `.ds-font-extrabold` - Font weight 800

### Font Sizes
- `.ds-text-xs` - Font size 0.75rem
- `.ds-text-sm` - Font size 0.875rem
- `.ds-text-base` - Font size 1rem
- `.ds-text-lg` - Font size 1.125rem
- `.ds-text-xl` - Font size 1.25rem
- `.ds-text-2xl` - Font size 1.5rem
- `.ds-text-3xl` - Font size 1.875rem
- `.ds-text-4xl` - Font size 2.25rem
- `.ds-text-5xl` - Font size 3rem
- `.ds-text-6xl` - Font size 3.75rem

### Line Heights
- `.ds-leading-tight` - Line height 1.25
- `.ds-leading-snug` - Line height 1.375
- `.ds-leading-normal` - Line height 1.5
- `.ds-leading-relaxed` - Line height 1.625
- `.ds-leading-loose` - Line height 2

### Letter Spacing
- `.ds-tracking-tighter` - Letter spacing -0.05em
- `.ds-tracking-tight` - Letter spacing -0.025em
- `.ds-tracking-normal` - Letter spacing 0
- `.ds-tracking-wide` - Letter spacing 0.025em
- `.ds-tracking-wider` - Letter spacing 0.05em
- `.ds-tracking-widest` - Letter spacing 0.1em

## Best Practices

1. **Consistency**: Use the same components and patterns throughout the application
2. **Accessibility**: Ensure proper color contrast and semantic HTML
3. **Performance**: Use utility classes instead of custom CSS when possible
4. **Responsive Design**: Use responsive utility classes for different screen sizes
5. **Animation**: Use animations sparingly and purposefully
6. **Typography**: Maintain a clear hierarchy with the typography system

## Customization

To customize components for your specific needs:

1. Modify the CSS custom properties in `design-system.css`
2. Add new utility classes as needed
3. Extend the component library with project-specific components
4. Maintain consistency with the existing design language