# Design System Setup Guide

## Overview

This guide explains how to set up and use the Cinematic Design System in your React application. The design system provides a comprehensive set of CSS custom properties, utility classes, and components to create a premium dark-mode interface for legal tech applications.

## Installation

The design system is already integrated into the project. To use it in your application:

1. Ensure the design system CSS is imported in your main application file (usually `main.tsx` or `index.tsx`):

```typescript
import './styles/design-system.css';
```

2. If you're using the enhanced cinematic design system, also import:

```typescript
import './styles/cinematic-design-system.css';
```

## Project Structure

The design system files are organized as follows:

```
frontend/
├── src/
│   ├── styles/
│   │   ├── design-system.css          # Main design system
│   │   ├── cinematic-design-system.css # Enhanced cinematic version
│   │   └── index.css                  # Main application styles
│   └── components/
│       └── CinematicDesignSystemDemo.tsx # Demo component
```

## CSS Custom Properties

The design system uses CSS custom properties for all design tokens. You can access these properties in your components:

```css
.my-component {
  background-color: var(--ds-color-bg-panel);
  color: var(--ds-color-text-primary);
  border-radius: var(--ds-radius-lg);
  padding: var(--ds-space-4);
}
```

## Utility Classes

The design system provides a comprehensive set of utility classes for common styling needs. These follow a consistent naming convention:

### Background Colors
```html
<div class="ds-bg-canvas">Canvas background</div>
<div class="ds-bg-surface">Surface background</div>
<div class="ds-bg-panel">Panel background</div>
```

### Text Colors
```html
<p class="ds-text-primary">Primary text</p>
<p class="ds-text-secondary">Secondary text</p>
<p class="ds-text-tertiary">Tertiary text</p>
```

### Spacing
```html
<div class="ds-p-4">Padding of 1rem</div>
<div class="ds-m-2">Margin of 0.5rem</div>
<div class="ds-px-3">Horizontal padding of 0.75rem</div>
```

### Typography
```html
<h1 class="ds-font-display ds-text-4xl">Display heading</h1>
<p class="ds-font-ui ds-text-base">UI text</p>
<code class="ds-font-mono ds-text-sm">Monospace text</code>
```

### Layout
```html
<div class="ds-flex ds-items-center ds-justify-between">
  <div>Left content</div>
  <div>Right content</div>
</div>

<div class="ds-grid ds-grid-cols-3 ds-gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>
```

## Components

The design system includes several pre-styled components that you can use directly:

### Cards
```html
<div class="ds-card-cinematic ds-p-6">
  <h3 class="ds-text-primary ds-font-display ds-text-xl">Card Title</h3>
  <p class="ds-text-secondary ds-mt-2">Card content...</p>
</div>
```

### Buttons
```html
<button class="ds-btn-accent">Primary Button</button>
```

### Progress Bars
```html
<progress class="ds-progress-cinematic ds-w-full" value="75" max="100"></progress>
```

### Status Indicators
```html
<div class="ds-status-indicator"></div>
<div class="ds-status-indicator ds-status-indicator--warning"></div>
<div class="ds-status-indicator ds-status-indicator--error"></div>
```

## React Component Example

Here's a complete example of how to use the design system in a React component:

```tsx
import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string;
  change: number;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  value, 
  change 
}) => {
  const isPositive = change >= 0;
  
  return (
    <div className="ds-card-cinematic ds-p-5">
      <div className="ds-flex ds-justify-between ds-items-start">
        <div>
          <p className="ds-text-secondary ds-text-sm">{title}</p>
          <p className="ds-font-display ds-text-3xl ds-text-primary ds-mt-1">
            {value}
          </p>
        </div>
        <div className="ds-status-indicator"></div>
      </div>
      <div className="ds-flex ds-items-center ds-mt-3">
        <span className={`ds-text-xs ${isPositive ? 'ds-text-green' : 'ds-text-red'}`}>
          {isPositive ? '+' : ''}{change}%
        </span>
        <span className="ds-text-xs ds-text-secondary ds-ml-2">from last week</span>
      </div>
    </div>
  );
};
```

## Customization

To customize the design system for your specific needs:

1. **Modify CSS Custom Properties**: Update the values in `design-system.css` to change the design tokens.

2. **Add New Utility Classes**: Create new utility classes following the existing naming convention.

3. **Extend Components**: Build upon existing components to create project-specific variations.

## Accessibility

The design system follows WCAG 2.1 AA guidelines:

- Minimum 4.5:1 contrast ratio for text
- Focus states for interactive elements
- Semantic HTML structure
- Reduced motion support
- High contrast mode support

To ensure your components remain accessible:

```tsx
// Good: Proper semantic HTML and ARIA attributes
<button 
  className="ds-btn-accent"
  aria-label="Submit form"
>
  Submit
</button>

// Good: Proper heading hierarchy
<h1 className="ds-font-display ds-text-4xl">Main Title</h1>
<h2 className="ds-font-display ds-text-2xl">Section Title</h2>
```

## Performance

To ensure optimal performance:

1. **Use Utility Classes**: Prefer utility classes over custom CSS when possible.

2. **Minimize Custom CSS**: Only write custom CSS when utility classes aren't sufficient.

3. **Optimize Animations**: Use hardware-accelerated CSS properties (transform, opacity) for animations.

4. **Lazy Load**: Implement lazy loading for heavy components.

## Responsive Design

The design system includes responsive utility classes:

```html
<!-- Responsive padding -->
<div class="ds-p-4 md:ds-p-6 lg:ds-p-8">
  Content with responsive padding
</div>

<!-- Responsive grid -->
<div class="ds-grid ds-grid-cols-1 md:ds-grid-cols-2 lg:ds-grid-cols-3">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

## Browser Support

The design system works in all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Troubleshooting

### 1. Styles Not Applying
- Ensure the CSS file is properly imported
- Check for typos in class names
- Verify the CSS file is being loaded in the browser dev tools

### 2. Custom Properties Not Working
- Check browser support for CSS custom properties
- Verify the property names match exactly
- Ensure the `:root` selector is not being overridden

### 3. Animations Not Working
- Check if `prefers-reduced-motion` is enabled in the user's system settings
- Verify the animation class names are correct
- Ensure the element has the proper positioning for animations

## Best Practices

1. **Consistency**: Use the same components and patterns throughout the application

2. **Semantic HTML**: Use appropriate HTML elements for their intended purpose

3. **Accessibility**: Ensure proper color contrast and keyboard navigation

4. **Performance**: Use utility classes instead of custom CSS when possible

5. **Responsive Design**: Use responsive utility classes for different screen sizes

6. **Animation**: Use animations sparingly and purposefully

7. **Typography**: Maintain a clear hierarchy with the typography system

By following this setup guide and best practices, you can effectively implement the Cinematic Design System in your React application and create a premium dark-mode interface for your legal tech platform.