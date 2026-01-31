# Extending the Design System

## Overview

This guide explains how to extend the Cinematic Design System with project-specific components, utilities, and customizations while maintaining consistency with the core design language.

## When to Extend

You should extend the design system when:

1. **Project-Specific Components**: You need components that are unique to your application
2. **Custom Utilities**: You require utility classes not provided by the core system
3. **Theming Variations**: You need to support different themes or modes
4. **Domain-Specific Patterns**: You have UI patterns specific to legal tech or your business domain

## Extension Principles

When extending the design system, follow these principles:

1. **Consistency**: Maintain visual consistency with existing components
2. **Naming Convention**: Follow the established naming patterns
3. **Accessibility**: Ensure all extensions meet accessibility standards
4. **Performance**: Optimize for performance and minimal CSS
5. **Documentation**: Document all extensions for team usage

## File Structure for Extensions

```
frontend/
├── src/
│   ├── styles/
│   │   ├── design-system.css          # Core design system
│   │   ├── project-extensions.css     # Project-specific extensions
│   │   └── index.css                  # Main application styles
│   └── components/
│       ├── DesignSystemExtensions/    # Directory for extended components
│       │   ├── CustomBadge.tsx
│       │   ├── CustomAlert.tsx
│       │   └── CustomSwitch.tsx
│       └── ...
```

## Extending CSS Custom Properties

To add new design tokens, extend the `:root` selector in your project extensions file:

```css
:root {
  /* Project-specific colors */
  --ds-color-brand-primary: #your-brand-color;
  --ds-color-brand-secondary: #your-secondary-color;
  
  /* Project-specific spacing */
  --ds-space-xxxl: 20rem;
  --ds-space-xxxxl: 24rem;
  
  /* Project-specific z-index */
  --ds-z-custom-component: 2000;
}
```

## Creating Custom Utility Classes

When creating custom utility classes, follow the existing naming convention:

```css
/* Good: Follows existing pattern */
.ds-w-1\/7 { width: calc(100% / 7); }
.ds-text-brand-primary { color: var(--ds-color-brand-primary); }

/* Avoid: Inconsistent naming */
.width-seventh { width: calc(100% / 7); }
.brandText { color: var(--ds-color-brand-primary); }
```

## Creating Custom Components

### 1. Custom Badge Component

```css
/* In project-extensions.css */
.ds-badge-priority {
  display: inline-flex;
  align-items: center;
  padding: var(--ds-space-1) var(--ds-space-2);
  border-radius: var(--ds-radius-full);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  background: rgba(255, 32, 78, 0.15);
  color: var(--ds-color-accent-red);
  border: 1px solid rgba(255, 32, 78, 0.25);
}

.ds-badge-priority.high {
  background: rgba(255, 32, 78, 0.25);
  color: var(--ds-color-accent-red);
  border-color: rgba(255, 32, 78, 0.4);
}

.ds-badge-priority.medium {
  background: rgba(255, 214, 90, 0.15);
  color: var(--ds-color-accent-gold);
  border: 1px solid rgba(255, 214, 90, 0.25);
}

.ds-badge-priority.low {
  background: rgba(74, 222, 128, 0.15);
  color: var(--ds-color-accent-green);
  border: 1px solid rgba(74, 222, 128, 0.25);
}
```

Usage:
```html
<span class="ds-badge-priority high">High Priority</span>
<span class="ds-badge-priority medium">Medium Priority</span>
<span class="ds-badge-priority low">Low Priority</span>
```

### 2. Custom Alert Component

```css
.ds-alert {
  padding: var(--ds-space-4);
  border-radius: var(--ds-radius-lg);
  border: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-panel);
}

.ds-alert.info {
  border-left: 4px solid var(--ds-color-accent-cyan-500);
}

.ds-alert.warning {
  border-left: 4px solid var(--ds-color-accent-gold);
}

.ds-alert.error {
  border-left: 4px solid var(--ds-color-accent-red);
}

.ds-alert.success {
  border-left: 4px solid var(--ds-color-accent-green);
}
```

Usage:
```html
<div class="ds-alert error">
  <h3 class="ds-font-display ds-text-lg ds-text-primary">Error</h3>
  <p class="ds-text-secondary ds-mt-1">There was an error processing your request.</p>
</div>
```

### 3. Custom Switch Component

```css
.ds-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.ds-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.ds-switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--ds-color-bg-surface);
  transition: .4s;
  border-radius: 34px;
  border: 1px solid var(--ds-color-border-default);
}

.ds-switch-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: var(--ds-color-text-tertiary);
  transition: .4s;
  border-radius: 50%;
}

.ds-switch input:checked + .ds-switch-slider {
  background: linear-gradient(135deg, var(--ds-color-accent-violet-600), var(--ds-color-accent-cyan-500));
  border-color: transparent;
}

.ds-switch input:checked + .ds-switch-slider:before {
  background-color: white;
  transform: translateX(20px);
}
```

Usage:
```html
<label class="ds-switch">
  <input type="checkbox" checked>
  <span class="ds-switch-slider"></span>
</label>
```

## Creating Custom Animations

Add project-specific animations to your extensions file:

```css
/* Custom bounce animation */
@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.ds-animate-bounce-subtle {
  animation: bounce-subtle 2s infinite;
}

/* Custom fade in up animation */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ds-animate-fade-in-up {
  animation: fade-in-up 0.3s ease-out forwards;
}
```

## Responsive Extensions

Add custom responsive utilities following the existing pattern:

```css
/* Custom breakpoints */
@media (min-width: 640px) {
  .sm\:ds-w-96 { width: 24rem; }
}

@media (min-width: 768px) {
  .md\:ds-w-1\/3 { width: 33.333333%; }
  .md\:ds-w-2\/3 { width: 66.666667%; }
}

@media (min-width: 1024px) {
  .lg\:ds-w-1\/4 { width: 25%; }
  .lg\:ds-w-3\/4 { width: 75%; }
}

@media (min-width: 1280px) {
  .xl\:ds-w-1\/5 { width: 20%; }
  .xl\:ds-w-4\/5 { width: 80%; }
}
```

## Theme Extensions

Support additional themes or modes:

```css
/* High contrast theme */
@media (prefers-contrast: high) {
  .ds-high-contrast-text {
    color: #ffffff;
  }
  
  .ds-high-contrast-bg {
    background-color: #000000;
  }
  
  .ds-high-contrast-border {
    border-color: #ffffff;
  }
}

/* Reduced motion theme */
@media (prefers-reduced-motion: reduce) {
  .ds-reduced-motion-transition {
    transition: none;
  }
  
  .ds-reduced-motion-animation {
    animation: none;
  }
}
```

## React Component Extensions

Create React components that utilize your extended design system:

```tsx
// CustomBadge.tsx
import React from 'react';

interface CustomBadgeProps {
  priority: 'low' | 'medium' | 'high';
  children: React.ReactNode;
}

export const CustomBadge: React.FC<CustomBadgeProps> = ({ 
  priority, 
  children 
}) => {
  return (
    <span className={`ds-badge-priority ${priority}`}>
      {children}
    </span>
  );
};
```

```tsx
// CustomAlert.tsx
import React from 'react';

interface CustomAlertProps {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  children: React.ReactNode;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({ 
  type, 
  title, 
  children 
}) => {
  return (
    <div className={`ds-alert ${type}`}>
      <h3 className="ds-font-display ds-text-lg ds-text-primary">{title}</h3>
      <p className="ds-text-secondary ds-mt-1">{children}</p>
    </div>
  );
};
```

## Best Practices for Extensions

### 1. Maintain Consistency
```css
/* Good: Follows existing spacing system */
.ds-space-x-10 > * + * {
  margin-left: 2.5rem; /* 40px, consistent with 4px base */
}

/* Avoid: Inconsistent spacing */
.ds-space-x-custom > * + * {
  margin-left: 37px; /* Doesn't follow the 4px base system */
}
```

### 2. Use CSS Custom Properties
```css
/* Good: Uses design system tokens */
.ds-custom-component {
  background-color: var(--ds-color-brand-primary);
  padding: var(--ds-space-4);
  border-radius: var(--ds-radius-lg);
}

/* Avoid: Hardcoded values */
.ds-custom-component {
  background-color: #ff0000;
  padding: 1rem;
  border-radius: 8px;
}
```

### 3. Document Extensions
```css
/* 
 * Custom Badge Component
 * Used for displaying priority levels in case management
 * Variants: low, medium, high
 */
.ds-badge-priority {
  /* ... */
}
```

### 4. Test Extensions
Create a test component to verify your extensions work correctly:

```tsx
// DesignSystemExtensionsTest.tsx
import React from 'react';
import { CustomBadge } from './CustomBadge';
import { CustomAlert } from './CustomAlert';

export const DesignSystemExtensionsTest: React.FC = () => {
  return (
    <div className="ds-bg-canvas ds-p-8">
      <h1 className="ds-text-primary ds-font-display ds-text-3xl ds-mb-6">
        Design System Extensions Test
      </h1>
      
      <section className="ds-mb-8">
        <h2 className="ds-text-primary ds-font-display ds-text-xl ds-mb-4">
          Custom Badges
        </h2>
        <div className="ds-flex ds-gap-4">
          <CustomBadge priority="low">Low Priority</CustomBadge>
          <CustomBadge priority="medium">Medium Priority</CustomBadge>
          <CustomBadge priority="high">High Priority</CustomBadge>
        </div>
      </section>
      
      <section>
        <h2 className="ds-text-primary ds-font-display ds-text-xl ds-mb-4">
          Custom Alerts
        </h2>
        <div className="ds-flex ds-flex-col ds-gap-4">
          <CustomAlert type="info" title="Information">
            This is an informational message.
          </CustomAlert>
          <CustomAlert type="warning" title="Warning">
            This is a warning message.
          </CustomAlert>
          <CustomAlert type="error" title="Error">
            This is an error message.
          </CustomAlert>
          <CustomAlert type="success" title="Success">
            This is a success message.
          </CustomAlert>
        </div>
      </section>
    </div>
  );
};
```

## Version Control and Collaboration

When extending the design system:

1. **Create Feature Branches**: Work on extensions in separate branches
2. **Document Changes**: Update documentation when adding new extensions
3. **Code Reviews**: Have team members review extensions for consistency
4. **Versioning**: Consider versioning major extensions
5. **Migration Guides**: Provide migration guides when making breaking changes

By following these guidelines, you can effectively extend the Cinematic Design System while maintaining its integrity and consistency. This approach ensures that your project-specific components integrate seamlessly with the core design system, providing a cohesive user experience.