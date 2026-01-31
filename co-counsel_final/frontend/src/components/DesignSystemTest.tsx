import React from 'react';

export const DesignSystemTest: React.FC = () => {
  return (
    <div className="ds-bg-canvas ds-min-h-screen ds-p-8">
      <div className="ds-max-w-4xl ds-mx-auto">
        <h1 className="ds-text-primary ds-font-display ds-text-4xl ds-mb-2">
          Design System Test
        </h1>
        <p className="ds-text-secondary ds-mb-8">
          Verifying that all design system components are working correctly.
        </p>

        {/* Color Palette Test */}
        <section className="ds-mb-8">
          <h2 className="ds-text-primary ds-font-display ds-text-2xl ds-mb-4">
            Color Palette
          </h2>
          <div className="ds-grid ds-grid-cols-2 md:ds-grid-cols-4 ds-gap-4">
            <div className="ds-bg-canvas ds-p-4 ds-rounded-lg ds-border ds-border-default">
              <div className="ds-w-12 ds-h-12 ds-rounded ds-bg-canvas ds-mb-2"></div>
              <p className="ds-text-secondary ds-text-sm">Canvas</p>
            </div>
            <div className="ds-bg-surface ds-p-4 ds-rounded-lg ds-border ds-border-default">
              <div className="ds-w-12 ds-h-12 ds-rounded ds-bg-surface ds-mb-2"></div>
              <p className="ds-text-secondary ds-text-sm">Surface</p>
            </div>
            <div className="ds-bg-panel ds-p-4 ds-rounded-lg ds-border ds-border-default">
              <div className="ds-w-12 ds-h-12 ds-rounded ds-bg-panel ds-mb-2"></div>
              <p className="ds-text-secondary ds-text-sm">Panel</p>
            </div>
            <div className="ds-bg-elevated ds-p-4 ds-rounded-lg ds-border ds-border-default">
              <div className="ds-w-12 ds-h-12 ds-rounded ds-bg-elevated ds-mb-2"></div>
              <p className="ds-text-secondary ds-text-sm">Elevated</p>
            </div>
          </div>
        </section>

        {/* Typography Test */}
        <section className="ds-mb-8">
          <h2 className="ds-text-primary ds-font-display ds-text-2xl ds-mb-4">
            Typography
          </h2>
          <div className="ds-bg-panel ds-p-6 ds-rounded-xl ds-border ds-border-default">
            <h1 className="ds-font-display ds-text-4xl ds-text-primary ds-mb-2">
              Display Heading (4xl)
            </h1>
            <h2 className="ds-font-display ds-text-2xl ds-text-primary ds-mb-2">
              Section Heading (2xl)
            </h2>
            <h3 className="ds-font-display ds-text-xl ds-text-primary ds-mb-2">
              Subheading (xl)
            </h3>
            <p className="ds-text-secondary ds-mb-2">
              Body text with secondary color for regular content. Uses Inter font family for optimal readability.
            </p>
            <p className="ds-font-mono ds-text-sm ds-text-tertiary">
              Monospace text for code or data displays.
            </p>
          </div>
        </section>

        {/* Component Test */}
        <section className="ds-mb-8">
          <h2 className="ds-text-primary ds-font-display ds-text-2xl ds-mb-4">
            Components
          </h2>
          <div className="ds-grid ds-grid-cols-1 md:ds-grid-cols-2 ds-gap-6">
            {/* Card Component */}
            <div className="ds-card-cinematic ds-p-6">
              <h3 className="ds-text-primary ds-font-display ds-text-xl ds-mb-4">
                Cinematic Card
              </h3>
              <p className="ds-text-secondary ds-mb-6">
                This is a card with the cinematic design system styling.
              </p>
              <button className="ds-btn-accent">Primary Button</button>
            </div>

            {/* Progress and Status */}
            <div className="ds-bg-panel ds-p-6 ds-rounded-xl ds-border ds-border-default">
              <h3 className="ds-text-primary ds-font-display ds-text-xl ds-mb-4">
                Progress & Status
              </h3>
              <div className="ds-mb-4">
                <label className="ds-text-sm ds-text-secondary ds-block ds-mb-2">
                  Progress Bar
                </label>
                <progress 
                  className="ds-progress-cinematic ds-w-full" 
                  value="65" 
                  max="100"
                ></progress>
              </div>
              <div className="ds-flex ds-gap-4 ds-items-center">
                <div>
                  <div className="ds-status-indicator ds-inline-block"></div>
                  <span className="ds-text-sm ds-text-secondary ds-ml-2">Active</span>
                </div>
                <div>
                  <div className="ds-status-indicator ds-status-indicator--warning ds-inline-block"></div>
                  <span className="ds-text-sm ds-text-secondary ds-ml-2">Warning</span>
                </div>
                <div>
                  <div className="ds-status-indicator ds-status-indicator--error ds-inline-block"></div>
                  <span className="ds-text-sm ds-text-secondary ds-ml-2">Error</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Special Effects Test */}
        <section>
          <h2 className="ds-text-primary ds-font-display ds-text-2xl ds-mb-4">
            Special Effects
          </h2>
          <div className="ds-grid ds-grid-cols-1 md:ds-grid-cols-2 ds-gap-6">
            {/* Glowing Elements */}
            <div className="ds-bg-panel ds-p-6 ds-rounded-xl ds-border ds-border-default">
              <h3 className="ds-text-primary ds-font-display ds-text-xl ds-mb-4">
                Glowing Elements
              </h3>
              <div className="ds-flex ds-gap-6 ds-justify-center ds-items-center">
                <div className="ds-node-glow ds-w-16 ds-h-16 ds-flex ds-items-center ds-justify-center">
                  <span className="ds-text-holo">AI</span>
                </div>
                <div className="ds-glow-cyan-xs ds-w-16 ds-h-16 ds-rounded-full"></div>
                <div className="ds-glow-violet-xs ds-w-16 ds-h-16 ds-rounded-full"></div>
              </div>
            </div>

            {/* Glass Effect */}
            <div className="ds-bg-panel ds-p-6 ds-rounded-xl ds-border ds-border-default">
              <h3 className="ds-text-primary ds-font-display ds-text-xl ds-mb-4">
                Glass Effect
              </h3>
              <div className="ds-flex ds-flex-col ds-gap-4">
                <div className="ds-glass ds-p-4 ds-rounded-lg">
                  <p>Glass effect with backdrop blur</p>
                </div>
                <div className="ds-glass-strong ds-p-4 ds-rounded-lg">
                  <p>Stronger glass effect</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};