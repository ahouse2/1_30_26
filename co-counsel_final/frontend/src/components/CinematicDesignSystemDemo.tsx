import { useState } from 'react';

export function CinematicDesignSystemDemo() {
  const [isGlowing, setIsGlowing] = useState(false);
  const [progress, setProgress] = useState(65);

  return (
    <div className="ds-app-cinematic">
      <div className="ds-bg-parallax" aria-hidden="true" />
      
      <header className="ds-header-cinematic">
        <div>
          <h1 className="ds-text-primary ds-font-display ds-text-4xl">Cinematic Design System</h1>
          <p className="ds-text-secondary ds-mt-2">Showcasing premium dark-mode UI components</p>
        </div>
        <div className="ds-flex ds-gap-3">
          <button 
            className="ds-btn-accent"
            onMouseEnter={() => setIsGlowing(true)}
            onMouseLeave={() => setIsGlowing(false)}
          >
            Interactive Button
          </button>
        </div>
      </header>

      <div className="ds-body-cinematic">
        <nav className="ds-nav-cinematic">
          <ul className="ds-flex ds-flex-col ds-gap-2">
            <li>
              <button className="ds-w-full ds-text-left ds-p-3 ds-bg-surface ds-rounded-lg ds-text-primary ds-border ds-border-default hover:ds-bg-panel ds-transition-medium">
                Dashboard
              </button>
            </li>
            <li>
              <button className="ds-w-full ds-text-left ds-p-3 ds-bg-surface ds-rounded-lg ds-text-primary ds-border ds-border-default hover:ds-bg-panel ds-transition-medium">
                Evidence
              </button>
            </li>
            <li>
              <button className="ds-w-full ds-text-left ds-p-3 ds-bg-surface ds-rounded-lg ds-text-primary ds-border ds-border-default hover:ds-bg-panel ds-transition-medium">
                Graph Explorer
              </button>
            </li>
          </ul>
        </nav>

        <main className="ds-main-cinematic">
          <div className="ds-grid ds-grid-cols-1 md:ds-grid-cols-2 ds-gap-8">
            {/* Color Palette Showcase */}
            <div className="ds-card-cinematic ds-p-6">
              <h2 className="ds-text-primary ds-font-display ds-text-2xl ds-mb-4">Color Palette</h2>
              
              <div className="ds-grid ds-grid-cols-2 ds-gap-4">
                <div className="ds-flex ds-flex-col ds-gap-2">
                  <div className="ds-text-xs ds-text-secondary">Backgrounds</div>
                  <div className="ds-flex ds-flex-col ds-gap-2">
                    <div className="ds-flex ds-items-center ds-gap-2">
                      <div className="ds-w-8 ds-h-8 ds-rounded ds-bg-canvas"></div>
                      <span className="ds-text-sm ds-text-secondary">#101217</span>
                    </div>
                    <div className="ds-flex ds-items-center ds-gap-2">
                      <div className="ds-w-8 ds-h-8 ds-rounded ds-bg-surface"></div>
                      <span className="ds-text-sm ds-text-secondary">#181a1e</span>
                    </div>
                    <div className="ds-flex ds-items-center ds-gap-2">
                      <div className="ds-w-8 ds-h-8 ds-rounded ds-bg-panel"></div>
                      <span className="ds-text-sm ds-text-secondary">#22232a</span>
                    </div>
                  </div>
                </div>
                
                <div className="ds-flex ds-flex-col ds-gap-2">
                  <div className="ds-text-xs ds-text-secondary">Accents</div>
                  <div className="ds-flex ds-flex-col ds-gap-2">
                    <div className="ds-flex ds-items-center ds-gap-2">
                      <div className="ds-w-8 ds-h-8 ds-rounded ds-bg-cyan-500"></div>
                      <span className="ds-text-sm ds-text-secondary">Cyan</span>
                    </div>
                    <div className="ds-flex ds-items-center ds-gap-2">
                      <div className="ds-w-8 ds-h-8 ds-rounded ds-bg-violet-500"></div>
                      <span className="ds-text-sm ds-text-secondary">Violet</span>
                    </div>
                    <div className="ds-flex ds-items-center ds-gap-2">
                      <div className="ds-w-8 ds-h-8 ds-rounded ds-bg-amber-400"></div>
                      <span className="ds-text-sm ds-text-secondary">Gold</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Typography Showcase */}
            <div className="ds-card-cinematic ds-p-6">
              <h2 className="ds-text-primary ds-font-display ds-text-2xl ds-mb-4">Typography</h2>
              
              <div className="ds-flex ds-flex-col ds-gap-3">
                <h1 className="ds-font-display ds-text-4xl ds-text-primary">Display Heading</h1>
                <h2 className="ds-font-display ds-text-2xl ds-text-primary">Section Heading</h2>
                <p className="ds-text-secondary">
                  Body text with secondary color for regular content. Uses Inter font family for optimal readability.
                </p>
                <p className="ds-font-mono ds-text-sm ds-text-tertiary">
                  Monospace text for code or data displays.
                </p>
              </div>
            </div>

            {/* Component Showcase */}
            <div className="ds-card-cinematic ds-p-6">
              <h2 className="ds-text-primary ds-font-display ds-text-2xl ds-mb-4">Interactive Components</h2>
              
              <div className="ds-flex ds-flex-col ds-gap-4">
                <div className="ds-flex ds-flex-col ds-gap-2">
                  <label className="ds-text-sm ds-text-secondary">Input Field</label>
                  <input 
                    type="text" 
                    className="ds-input-cinematic" 
                    placeholder="Enter case details..."
                  />
                </div>
                
                <div className="ds-flex ds-flex-col ds-gap-2">
                  <label className="ds-text-sm ds-text-secondary">Progress Indicator</label>
                  <progress 
                    className="ds-progress-cinematic ds-w-full" 
                    value={progress} 
                    max="100"
                  />
                  <div className="ds-flex ds-justify-between ds-text-xs ds-text-tertiary">
                    <span>0%</span>
                    <span>{progress}%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                <div className="ds-flex ds-gap-3 ds-items-center">
                  <div className="ds-status-indicator"></div>
                  <span className="ds-text-sm ds-text-secondary">Active Case</span>
                  
                  <div className="ds-status-indicator ds-status-indicator--warning ds-ml-4"></div>
                  <span className="ds-text-sm ds-text-secondary">Review Needed</span>
                  
                  <div className="ds-status-indicator ds-status-indicator--error ds-ml-4"></div>
                  <span className="ds-text-sm ds-text-secondary">Urgent</span>
                </div>
              </div>
            </div>

            {/* Glowing Elements */}
            <div className="ds-card-cinematic ds-p-6">
              <h2 className="ds-text-primary ds-font-display ds-text-2xl ds-mb-4">Glowing Effects</h2>
              
              <div className="ds-flex ds-flex-col ds-gap-6 ds-items-center ds-justify-center ds-h-full">
                <div 
                  className={`ds-node-glow ds-w-24 ds-h-24 ds-flex ds-items-center ds-justify-center ${
                    isGlowing ? 'ds-animate-node-glow' : ''
                  }`}
                >
                  <span className="ds-text-holo ds-font-display ds-text-xl">AI</span>
                </div>
                
                <div className="ds-flex ds-gap-4">
                  <div className="ds-glow-cyan-xs ds-w-12 ds-h-12 ds-rounded-full"></div>
                  <div className="ds-glow-violet-xs ds-w-12 ds-h-12 ds-rounded-full"></div>
                  <div className="ds-glow-cyan-md ds-w-12 ds-h-12 ds-rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width Showcase */}
          <div className="ds-card-cinematic ds-p-6 ds-mt-8">
            <h2 className="ds-text-primary ds-font-display ds-text-2xl ds-mb-4">Dashboard Metrics</h2>
            
            <div className="ds-grid ds-grid-cols-1 md:ds-grid-cols-4 ds-gap-6">
              <div className="ds-bg-panel ds-rounded-xl ds-p-5 ds-border ds-border-default">
                <div className="ds-flex ds-justify-between ds-items-start">
                  <div>
                    <p className="ds-text-secondary ds-text-sm">Cases Processed</p>
                    <p className="ds-font-display ds-text-3xl ds-text-primary ds-mt-1">142</p>
                  </div>
                  <div className="ds-status-indicator"></div>
                </div>
                <div className="ds-flex ds-items-center ds-mt-3">
                  <span className="ds-text-xs ds-text-green-400">+12%</span>
                  <span className="ds-text-xs ds-text-secondary ds-ml-2">from last week</span>
                </div>
              </div>
              
              <div className="ds-bg-panel ds-rounded-xl ds-p-5 ds-border ds-border-default">
                <div className="ds-flex ds-justify-between ds-items-start">
                  <div>
                    <p className="ds-text-secondary ds-text-sm">Evidence Files</p>
                    <p className="ds-font-display ds-text-3xl ds-text-primary ds-mt-1">1,284</p>
                  </div>
                  <div className="ds-status-indicator ds-status-indicator--warning"></div>
                </div>
                <div className="ds-flex ds-items-center ds-mt-3">
                  <span className="ds-text-xs ds-text-amber-400">+5.3%</span>
                  <span className="ds-text-xs ds-text-secondary ds-ml-2">from last week</span>
                </div>
              </div>
              
              <div className="ds-bg-panel ds-rounded-xl ds-p-5 ds-border ds-border-default">
                <div className="ds-flex ds-justify-between ds-items-start">
                  <div>
                    <p className="ds-text-secondary ds-text-sm">AI Accuracy</p>
                    <p className="ds-font-display ds-text-3xl ds-text-primary ds-mt-1">94.7%</p>
                  </div>
                  <div className="ds-status-indicator"></div>
                </div>
                <div className="ds-flex ds-items-center ds-mt-3">
                  <span className="ds-text-xs ds-text-green-400">+2.1%</span>
                  <span className="ds-text-xs ds-text-secondary ds-ml-2">from last week</span>
                </div>
              </div>
              
              <div className="ds-bg-panel ds-rounded-xl ds-p-5 ds-border ds-border-default">
                <div className="ds-flex ds-justify-between ds-items-start">
                  <div>
                    <p className="ds-text-secondary ds-text-sm">Team Productivity</p>
                    <p className="ds-font-display ds-text-3xl ds-text-primary ds-mt-1">87%</p>
                  </div>
                  <div className="ds-status-indicator"></div>
                </div>
                <div className="ds-flex ds-items-center ds-mt-3">
                  <span className="ds-text-xs ds-text-green-400">+8.4%</span>
                  <span className="ds-text-xs ds-text-secondary ds-ml-2">from last week</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}