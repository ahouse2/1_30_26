# Design System Usage Examples

## Overview

This document provides practical examples of how to use the Cinematic Design System in React components. These examples demonstrate best practices for implementing the design system in real-world scenarios.

## Basic Component Structure

All components should follow this basic structure:

```tsx
import React from 'react';

interface ComponentProps {
  // Define your props here
}

export const MyComponent: React.FC<ComponentProps> = ({ /* props */ }) => {
  return (
    <div className="ds-bg-panel ds-p-6 ds-radius-xl ds-shadow-md">
      {/* Component content */}
    </div>
  );
};
```

## Examples

### 1. Dashboard Metric Card

```tsx
import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  icon 
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
        {icon && <div className="ds-text-cyan">{icon}</div>}
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

### 2. Interactive Button with States

```tsx
import React, { useState } from 'react';

interface InteractiveButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export const InteractiveButton: React.FC<InteractiveButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      className={`ds-btn-accent ${isHovered ? 'ds-glow-cyan-sm' : ''} ${
        disabled ? 'ds-opacity-50 ds-cursor-not-allowed' : ''
      }`}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  );
};
```

### 3. Status Badge Component

```tsx
import React from 'react';

type StatusType = 'active' | 'warning' | 'error' | 'success';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const statusClasses = {
    active: 'ds-bg-cyan-500',
    warning: 'ds-bg-amber-400',
    error: 'ds-bg-red-500',
    success: 'ds-bg-green-500'
  };
  
  return (
    <span className={`ds-inline-flex ds-items-center ds-px-2 ds-py-1 ds-rounded-full ds-text-xs ds-font-medium ds-text-white ${statusClasses[status]}`}>
      <span className="ds-w-2 ds-h-2 ds-rounded-full ds-bg-white ds-mr-1"></span>
      {label}
    </span>
  );
};
```

### 4. Glowing Node Visualization

```tsx
import React, { useState } from 'react';

interface GlowingNodeProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const GlowingNode: React.FC<GlowingNodeProps> = ({ 
  label, 
  isActive = false, 
  onClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      className={`ds-node-glow ds-w-20 ds-h-20 ds-flex ds-items-center ds-justify-center ds-cursor-pointer ${
        (isActive || isHovered) ? 'ds-animate-node-glow' : ''
      }`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="ds-text-holo ds-font-display ds-text-lg">
        {label}
      </span>
    </div>
  );
};
```

### 5. Progress Tracker

```tsx
import React from 'react';

interface ProgressTrackerProps {
  steps: { label: string; completed: boolean }[];
  currentStep: number;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ 
  steps, 
  currentStep 
}) => {
  return (
    <div className="ds-w-full">
      <div className="ds-flex ds-justify-between ds-mb-4">
        {steps.map((step, index) => (
          <div key={index} className="ds-flex ds-flex-col ds-items-center">
            <div className={`ds-w-8 ds-h-8 ds-rounded-full ds-flex ds-items-center ds-justify-center ds-mb-2 ${
              index <= currentStep 
                ? 'ds-bg-cyan-500 ds-text-white' 
                : 'ds-bg-panel ds-text-secondary ds-border ds-border-default'
            }`}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            <span className={`ds-text-xs ds-text-center ${
              index <= currentStep ? 'ds-text-primary' : 'ds-text-secondary'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
      <div className="ds-w-full ds-bg-panel ds-rounded-full ds-h-2">
        <div 
          className="ds-bg-gradient-to-r ds-from-cyan-500 ds-to-violet-500 ds-h-2 ds-rounded-full ds-transition-all ds-duration-300"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};
```

### 6. Data Table with Cinematic Styling

```tsx
import React from 'react';

interface TableColumn {
  key: string;
  title: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: TableColumn[];
  data: any[];
}

export const DataTable: React.FC<DataTableProps> = ({ columns, data }) => {
  return (
    <div className="ds-overflow-hidden ds-rounded-xl ds-border ds-border-default">
      <table className="ds-w-full">
        <thead className="ds-bg-panel">
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key} 
                className="ds-py-3 ds-px-4 ds-text-left ds-text-secondary ds-text-sm ds-font-medium"
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className="ds-border-t ds-border-default hover:ds-bg-surface ds-transition-medium"
            >
              {columns.map((column) => (
                <td 
                  key={column.key} 
                  className="ds-py-3 ds-px-4 ds-text-primary"
                >
                  {column.render 
                    ? column.render(row[column.key], row) 
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### 7. Modal Dialog with Glass Effect

```tsx
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="ds-fixed ds-inset-0 ds-z-modal ds-flex ds-items-center ds-justify-center">
      <div 
        className="ds-fixed ds-inset-0 ds-bg-black ds-bg-opacity-70"
        onClick={onClose}
      ></div>
      <div className="ds-glass-strong ds-relative ds-rounded-2xl ds-max-w-2xl ds-w-full ds-mx-4 ds-max-h-[90vh] ds-overflow-hidden ds-flex ds-flex-col">
        <div className="ds-flex ds-justify-between ds-items-center ds-p-6 ds-border-b ds-border-default">
          <h2 className="ds-text-primary ds-font-display ds-text-xl">{title}</h2>
          <button 
            onClick={onClose}
            className="ds-text-secondary hover:ds-text-primary ds-transition-medium"
          >
            ✕
          </button>
        </div>
        <div className="ds-p-6 ds-overflow-y-auto">
          {children}
        </div>
        <div className="ds-p-6 ds-border-t ds-border-default ds-flex ds-justify-end ds-gap-3">
          <button 
            className="ds-px-4 ds-py-2 ds-rounded-lg ds-border ds-border-default ds-text-secondary hover:ds-bg-surface ds-transition-medium"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="ds-btn-accent">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 8. Search Input with Results

```tsx
import React, { useState } from 'react';

interface SearchResult {
  id: string;
  title: string;
  description: string;
}

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  results: SearchResult[];
}

export const SearchInput: React.FC<SearchInputProps> = ({ 
  placeholder = "Search...", 
  onSearch, 
  results 
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
    setIsOpen(value.length > 0);
  };
  
  return (
    <div className="ds-relative">
      <div className="ds-relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="ds-input-cinematic ds-w-full"
        />
        {query && (
          <button 
            className="ds-absolute ds-right-3 ds-top-1/2 ds-transform ds--translate-y-1/2 ds-text-secondary hover:ds-text-primary"
            onClick={() => handleSearch('')}
          >
            ✕
          </button>
        )}
      </div>
      
      {isOpen && results.length > 0 && (
        <div className="ds-absolute ds-top-full ds-mt-1 ds-w-full ds-z-dropdown ds-rounded-xl ds-overflow-hidden ds-shadow-lg">
          <div className="ds-glass ds-max-h-60 ds-overflow-y-auto">
            {results.map((result) => (
              <div 
                key={result.id}
                className="ds-p-3 ds-border-b ds-border-default last:ds-border-b-0 hover:ds-bg-surface ds-cursor-pointer ds-transition-medium"
              >
                <div className="ds-font-medium ds-text-primary">{result.title}</div>
                <div className="ds-text-sm ds-text-secondary ds-mt-1">
                  {result.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

## Best Practices

### 1. Component Composition
```tsx
// Good: Compose smaller components
const Dashboard = () => {
  return (
    <div className="ds-grid ds-grid-cols-1 md:ds-grid-cols-3 ds-gap-6">
      <MetricCard title="Cases" value="142" change={12} />
      <MetricCard title="Evidence" value="1,284" change={5.3} />
      <MetricCard title="Accuracy" value="94.7%" change={2.1} />
    </div>
  );
};

// Avoid: Repetitive styling
const Dashboard = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
      <div style={{ background: '#22232a', padding: '1.5rem', borderRadius: '0.75rem' }}>
        {/* ... */}
      </div>
      {/* ... */}
    </div>
  );
};
```

### 2. Responsive Design
```tsx
// Use responsive utility classes
<div className="ds-p-4 md:ds-p-6 lg:ds-p-8">
  <h2 className="ds-text-xl md:ds-text-2xl lg:ds-text-3xl">
    Responsive Heading
  </h2>
</div>
```

### 3. Accessibility
```tsx
// Ensure proper contrast and semantic HTML
<button 
  className="ds-btn-accent"
  aria-label="Submit form"
>
  Submit
</button>

// Use proper heading hierarchy
<h1 className="ds-font-display ds-text-4xl">Main Title</h1>
<h2 className="ds-font-display ds-text-2xl">Section Title</h2>
<h3 className="ds-font-display ds-text-xl">Subsection Title</h3>
```

### 4. Performance
```tsx
// Use CSS classes instead of inline styles
// Good
<div className="ds-bg-panel ds-p-4 ds-radius-lg"></div>

// Avoid
<div style={{ 
  backgroundColor: '#22232a', 
  padding: '1rem', 
  borderRadius: '0.5rem' 
}}></div>
```

## Customization Tips

### 1. Extending the Design System
```css
/* Add project-specific utilities */
.ds-bg-brand-primary { background-color: #your-brand-color; }
.ds-text-brand-primary { color: #your-brand-color; }
```

### 2. Theme Variations
```css
/* Dark theme (default) */
:root {
  --ds-color-bg-canvas: #101217;
}

/* Light theme variation */
[data-theme="light"] {
  --ds-color-bg-canvas: #ffffff;
  --ds-color-text-primary: #1a1a1a;
}
```

### 3. Component Variants
```tsx
// Create variants with modifier classes
const Button: React.FC<ButtonProps> = ({ variant = 'primary', children }) => {
  const variantClasses = {
    primary: 'ds-btn-accent',
    secondary: 'ds-btn-secondary', // You would define this class
    ghost: 'ds-btn-ghost' // You would define this class
  };
  
  return (
    <button className={variantClasses[variant]}>
      {children}
    </button>
  );
};
```

This documentation provides a comprehensive guide to using the Cinematic Design System in your React components. By following these examples and best practices, you can create consistent, accessible, and visually stunning user interfaces for your legal tech application.