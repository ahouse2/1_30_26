# Cinematic, Premium-Grade Dark-Mode Design System
## For AI-Powered Legal Discovery & Trial Platform

---

## Visual Language

### Cinematic Dark-Mode Aesthetics: Principles and Inspirations

To engineer a truly premium, cinematic dark-mode experience for legal technology, it is vital to go beyond "dark SaaS" conventions. Instead, the interface should immediately evoke luxury, power, and intelligence—conveying to the user not just clarity, but gravitas. Inspiration is drawn from Apple Pro apps such as Logic Pro and Motion, Unreal Engine's editor, and from cyber-chic UI motifs in works like "The Batman" (2022) and "Ghost in the Shell".

These systems merge deep, rich blacks and charcoal with gradated soft shadows, glowing accents, dynamic blurs, and micro-textures. Layering, blur, and atmospheric effects cultivate depth and subtle tactility—a classic hallmark of cinematic interfaces. The core mood is thus quiet yet potent, focused and minimal, yet visually alive.

### Color Palette and Accent Lighting

**Foundational Palette**: The base uses "not-quite-black" (around #101217), deep charcoals, and blue-black tones. Secondary layers introduce gradients to convey soft depth. Surfaces and elements are stacked to form a hierarchy, supporting atmospheric UI with subtle glass or metal reflections.

#### Core Background Colors
- **Superdark Canvas**: `#101217` - Main app background, modals
- **Surface 1**: `#181a1e` - Cards, panels
- **Surface 2**: `#22232a` - Emphasized containers
- **Elevated Surface**: `#2a2b32` - Floating elements
- **Overlay Surface**: `#32333a` - Modal backgrounds

#### Text & Content Colors
- **Primary Text**: `#ececf0` - Headings, live metrics
- **Secondary Text**: `#bcc6cf` - Subtext, labels
- **Tertiary Text**: `#8a919e` - Less emphasis content
- **Disabled Text**: `#5a5f6e` - Inactive elements
- **Inverse Text**: `#0a0c10` - Text on light backgrounds

#### Accent Lighting Colors
Sparing, pinpoint accent colors create luminous zones of focus and drama:

**Neon Cyan Palette**:
- 100: `#e6fcff`
- 200: `#b3f0ff`
- 300: `#80e4ff`
- 400: `#4dd7ff`
- 500: `#18cafe` (Primary)
- 600: `#00b8e6`
- 700: `#00a6cc`
- 800: `#0094b3`
- 900: `#008299`

**Violet/Amethyst Palette**:
- 100: `#f0e6ff`
- 200: `#d9c7ff`
- 300: `#c2a8ff`
- 400: `#ab89ff`
- 500: `#946aff` (Primary)
- 600: `#7d4bff`
- 700: `#663ce6`
- 800: `#4f2dcc`
- 900: `#381eb3`

**Support Accents**:
- **Electric Gold**: `#ffd65a` - Win/success, status dots
- **Crimson**: `#ff204e` - Errors, high-urgency badges
- **Success Green**: `#4ade80` - Confirmations, positive actions

#### Border & Divider Colors
- **Default Border**: `#383b44` - Standard borders
- **Subtle Border**: `#2d2f38` - Light dividers
- **Strong Border**: `#4a4d57` - Emphasized borders

#### Glow Effects
Glow is never flat: accent zones utilize outside/inside dropshadows, layered glows, and subtle "bloom":

- **Cyan Glow XS**: `0 0 4px rgba(24, 202, 254, 0.2)`
- **Cyan Glow SM**: `0 0 8px rgba(24, 202, 254, 0.3)`
- **Cyan Glow MD**: `0 0 16px rgba(24, 202, 254, 0.4)`
- **Cyan Glow LG**: `0 0 24px rgba(24, 202, 254, 0.5)`
- **Violet Glow XS**: `0 0 4px rgba(148, 106, 255, 0.2)`
- **Violet Glow SM**: `0 0 8px rgba(148, 106, 255, 0.3)`
- **Violet Glow MD**: `0 0 16px rgba(148, 106, 255, 0.4)`
- **Violet Glow LG**: `0 0 24px rgba(148, 106, 255, 0.5)`

**Best Practices**:
- Do not use accent colors in large fields—restrict glow and neon to micro-highlights and actionable or attention-critical elements.
- Use high contrast between dark bg and accent; neon on black for pop, but with soft blur for less harshness.
- For accessibility, ensure at least 4.5:1 contrast ratio for all important text, using off-white for text on blacks.

### Typography for Luxury and Precision

Cinematic, minimal interfaces depend on type choices that are both legible and commanding. For this platform, opt for a system that pairs a geometric sans (for UI/exploratory elements) with a modern serif or display face (for cinematic impact). Priority is on clarity, hierarchy, and balanced drama.

#### Font Families
- **Primary Sans (UI/Body)**: `Inter`, `IBM Plex Sans`, or `SF Pro Display` - These fonts have crisp contrast at small sizes and adapt well to dense legal data.
- **Display/Cinematic Headings**: `Quorum`, `Givena`, `Making`, or select cinematic fonts with tall x-heights and variably weighted strokes for dashboards and hero metrics.
- **Monospace**: `JetBrains Mono`, `SF Mono`, or `Dank Mono` - For data, logs, or AI summaries which work well in dark themes.

#### Type System

| Role            | Font                | Weight(s)    | Line Height | Letter Spacing | Size              |
|-----------------|---------------------|--------------|-------------|---------------|-------------------|
| Headline        | Quorum / Inter      | 600–800      | 1.15        | -0.01em       | 2.5–3.5rem        |
| Subheading      | Inter / Plex Sans   | 500–600      | 1.25        | 0             | 1.25–1.5rem       |
| UI/Body         | Inter, IBM Plex     | 400–500      | 1.6         | 0             | 1rem              |
| Data/Numeric    | IBM Plex Mono       | 500–700      | 1.2         | 0.01em        | 0.9–1.125rem      |
| Caption         | Inter / Plex Sans   | 400          | 1.4         | 0.02em        | 0.8125rem         |

#### Font Sizes (rem)
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

#### Font Weights
- **Light**: 300
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700
- **Extrabold**: 800

#### Line Heights
- **Tight**: 1.25
- **Snug**: 1.375
- **Normal**: 1.5
- **Relaxed**: 1.625
- **Loose**: 2

#### Letter Spacing
- **Tighter**: -0.05em
- **Tight**: -0.025em
- **Normal**: 0
- **Wide**: 0.025em
- **Wider**: 0.05em
- **Widest**: 0.1em

**Characteristics**:
- Large headlines for hero sections: bold, semibold or ultra (700–900), lots of space above/below, sharp tracking.
- Letterforms must read crisp on dark: avoid ultra-light weights or delicate serifs, especially at small sizes.
- All-caps or small-caps for tags, section navigation, or microlabels.
- Occasional use of display font for zone names or cinematic UI "signage" (e.g., trial arena, graph explorer).
- Use variable font styles for subtle motion and weight shift transitions in navigation, especially on focus or action.

**Luxury Touches**:
- Employ modest stylized ligatures for section/signage titles only—never in dense legal or data content.
- For "holoscreen" effect in video/academy sections, use extended tracking, all-caps, and animating outline-to-fill transitions.

### Depth, Texture, and Tactility

Achieving an interface that feels "tactile" and "alive" demands more than color and type. It requires thoughtful layering, gradients, blur, shadows, and atmospheric surfaces:

#### Glass, Frost, and Grain
- Use `backdrop-filter: blur(8–32px)` for floating layers, combined with soft linear or radial gradients.
- Fine noise overlays: A subtle semi-transparent grain/noise texture (1–2%) ensures a non-flat look, echoing the UI grain in Apple Pro apps and Unreal Engine editors.

#### Inset Surfaces
- Slight inset shadows under input fields, data tiles, and panels evoke depth and handheld tactility.

#### Faint Highlight Edges
- For active fields or node outlines, a slim neon or white highlight at the top edge suggests "lit" hardware or virtual hologram edge-lighting.

#### Drop Shadows
- Use semi-transparent black with spread (16-36px, opacity 10-20%) for floated side panels, major modals, and drag zones.
- Inner shadows for low layer elevation.

#### Depth Cues
Depth is also communicated through overlapping cards, modals, and 3D effect edges—never opaque "flat" containers. Use z-order and drop-shadows for "cinematic stacking" and foreground separation.

### Brand, Trust, and the Legality of Luxury

Legal tech UIs must foster trust and precision. The blend of cinematic drama and reserved professional minimalism is crucial:
- Avoid exaggerated skeuomorphism or distracting flourishes.
- All "embossing" effects, gradients, and shines should be subtle, not glossy.
- Rely on bold section lines, modular cards, and surface shadows to divide content and create a sense of controlled, manageable complexity.

Use micro-animations on accent color zones, not multicolor gradients. Reserve gold/crimson for true alerts, signals, or major milestones.

---

## Core Components

### Dashboard Hub: Cinematic Depth, Live Metrics

**Structure & Principles**:
- Full-bleed dark canvas with deep, blurred vignette at edges. Parallax backgrounds activate on mouse/scroll.
- Layered modules (cards, panels) float, with out-of-focus shadows.
- Live metrics (case progress, evidence status, trial schedule) use neon accent digits and animated count-ups.

#### Hero Area
- Large, cinematic headline with case/litigation summary.
- Background blur and layered "film grain."

#### Metrics Strip
- Animated counters, visualizer bars, sparklines with neon glow for live-tracking (cyan/violet).

#### Collapsing Sidebar
- Outline icons, subtle active-glow, floating reveal with slide-over animation.
- Tabs for Dossiers, Evidence, Analytics, Recent Activity.

#### Action Buttons
- Primary actions in neon highlight with subtle glow.
- On hover, animate soft bloom and outline.

#### Micro-interactions
- Subtle highlight on tile hover, corner accent glows for actionable sections, ripple feedback on press.

#### Notification Tray
- Bottom-up slide, blur-glass, badge highlights for urgent events (court date, deposition order, new evidence flagged).

**Depth cues & Feedback**:
- Use gaussian blur vignette to emphasize center. Dim edges for focus.
- Modules elevate with dynamic shadow/inset glow during drag or active state.
- On updates, "counter" metrics softly pulse (low-frequency opacity change, not bright flash).

### Evidence Upload & File Intelligence: Drag-and-Drop, AI Summaries

**Layout**:
- Central large drop zone framed by blurred glass border, faint grain texture, and animated "undulating" neon rim.
- Prominent, bold file icon (cine-style minimal SVG), pulsing accent glow when drag hover detected.
- Zone text uses mono or custom type ("Upload Files or Drop Here"), with micro-animation (shimmer, keypad tape effect).

#### Upload Process
- Upon upload, instant progress-arc in accent color, trailing glow.
- AI summary tile appears with smooth holo-pop; summary text is monospaced or subtly outlined, translucent bg.
- Each evidence file entry: Elevator card with micro-glassmorphism, floating badge for file type, clickable to expand AI summary, flag, or pin.

**AI-Driven Feedback**:
- Uploaded file "zones" surface clusters or smart tags—chips animate into view with "fade-glow."
- AI summary in left/right panel with cinematic vertical "roll-in" (think Star Wars crawl but micro-speed).
- If error or file unsupported: animated neon-edged popover in crimson or gold.

**Micro-interactions**:
- Drag to reorder uploads: subtle "parallax lift," drop shadow moves with pointer.
- On hover, animate a low-opacity cyan inner glow.
- "Process file" action animates with "sparkle line" passing behind the text, invoking intelligence/precision.

**Accessibility**:
- All drag states are clearly visualized; keyboard and screen reader support by zone highlighting and ARIA live regions.

### Graph Explorer: 3D Cluster Visualization with Glowing Animations

**3D Cluster Visualization**:
- Full-canvas 3D force-directed graph (React Three Fiber or similar).
- Background: animated starfield, soft blur/fog effects, deep-space vignette (think "Unreal Engine Outliner" in space).

#### Nodes
- Spherical/glassy nodes with neon core glow (cyan/violet for sub-clusters).
- Selected/focused node: Glows, gently pulses (1s repeating fade), emits radial "light rays."

#### Edges
- "Light wire" effect, low opacity, on hover animate with highlight luminance, fade-out for low-importance connections.

#### Node Interactions
- Node drag: Parallax + inertia, elastic animation as node moves and returns/settles.
- Cluster expansion/collapse: Expanding cluster nodes animate outward, with a "ripple" neon highlight, depth shadow appears.

#### Camera Controls
- Zoom/pan: Smooth inertial transitions, camera lens blur (subtly) at extremes; graph rotates and resettles with "inertia" effect.

#### Tooltips
- On hover, glassmorphic card with AI annotation, soft drop shadow—pops in/out quickly with dissolve.

**Metrics/Filters Overlay**:
- Modular glass panel over 3D scene: accent-lit sliders, toggles, transparent panels for filtering, coloring, node type selection.
- Search bar: Neon blue focus ring, typewriter animation on query input.

### Trial University: Modular Video Lessons with Holoscreen Styling

**Design Motifs**:
- Video playing area: Offset-glass holo "screen" with edge-light, faint grain, blur gradient vignette.
- Module cards: Each lesson as floating glass tile, neon vertical accent at left, soft shadow, subtle pulse on selection.

#### Interactive Elements
- Interactive subtitles: Overlay text, animated with fade-in and out, possible color-shift on "active" transcript.
- Navigation: Horizontal scroll of modules (carrousel), each animates forward/back with "magnetic" edge bounce.

#### Progress Tracking
- Ratings/Progress: Glowing bar fills, micro animation on completion.

#### UI Chrome
- Large typography for "Lesson Title," small-caps for section, ghosted icons for notes, comments, quiz.

**Interactivity**:
- Drag-and-drop rearrangement of lessons for custom tracks.
- Hover reveals additional module data with light slide or fade.
- Embedded quizzes: Modal holo-panel, glowing accent border, vertical list of options that briefly "wink" on answer.

### Mock Trial Arena: Live Video Chat & Draggable Exhibits

**Live Video Element**:
- Video chat tiles float in a parallax space, each enclosed in a movie frame/holo border (glass, neon rim at base).
- Participant name and status overlay (gradient mask/frosted glass).
- Audio levels visualized as glow pulsing around avatar tile, not garish bars.

#### Exhibit Drag
- Exhibit Drag: Legal evidence cards can be dragged into a "spotlight" zone; when dropped, expand with cinematic scale and slight glow.

#### Controls
- Microphone/camera controls: Neon-lit buttons, click gives "plip" micro-interaction and short color pulse for feedback.
- Chat transcript panel: Flicks in from right, blurred glass, auto-scroll, soft highlighting for speaker.

**Motion and Arena Flow**:
- Entering the arena: Dramatic left-to-right slide-in with "focus" vignette as participant is "seated."
- Timer/progress: Circular glowing meter around video pane, gradually fills or ticks based on event state.

### Live Co-Counsel Chat: Streaming Captions & Transcript Playback

**Chat/Transcript UI**:
- Floating chat panel with glassmorphism and soft drop shadow.
- Message bubbles: Outlined, translucent, parade up with inertia/fade.
- Live captions: Display as large overlay (cinematic "terminal" effect), subtle glow to each new phrase, fade after 2–3s.
- AI Response: Distinct color/accent, appears with soft expand/morph effect.
- Searchable transcript: Fixed bottom/floating drawer, type-to-filter with real-time scroll-to-highlight (motion trail behind selected line).

**Playback & Jump Points**:
- Playback timeline: Glowing accent bar, draggable handle with halo on hover; jump between time points animates "spotlight" flash on transcript.
- User-cued highlights: Drag through transcript to select text, which is momentarily "lit up" in accent color and saved.

#### Export
- Export: Share button with electric pulse animation, exports styled PDF with dark/glassy background.

**Accessibility & Control**:
- Option for high-contrast mode, transcript options for font size/spacing, keyboard navigation, screenreader ARIA.

---

## Motion & Transitions

### Cinematic Motion System

**Philosophy**: All motion is purposeful, elegant, and subtle, reflecting the "F1 of litigation software." Use motion to cue user focus, clarify relationships, and evoke cinematic depth—never for pure flair or distraction.

#### Micro-motion Principles
- **Parallax**: Subtle parallax layers on major containers and backdrops, reflecting depth as user scrolls or mouse moves.
- **Inertia/Ease**: Animate all transitions (open/close, modals, drag-drop) with physicality: extra 30–100ms ease-out, "slide with snap."
- **Glass/Glow**: When opening overlays or floating panels, blur and glow animate in behind. Drop shadows soften dynamically as objects lift/elevate.
- **Page Transitions**: Fade-through-black with a soft "bloom"/glow (milliseconds), echoing film reel transitions; layers stagger/fade over 250–400ms.
- **Node Motion (Graph)**: In 3D graph, nodes animate with elastic spring behavior, glowing ripple travels the edge when nodes are connected.
- **Hover States**: All actionable controls "soft lift" or gradient "sweep" upon hover/active—avoid abrupt color-state jumps.
- **Live Metrics**: Numbers in dashboards animate up with configurable "spring" or counter roll motion for drama.
- **Exhibit/Media**: Dragging evidence or dragging a lesson triggers a low-frequency "trailing" shadow, subtle "magnetic snap" to drop zones.

### Motion Tools and Implementation

#### Framer Motion (for React UIs)
- Declarative animations, page transitions, micro-interaction states, gesture-based triggers, spring physics.
- Best for UI-anchored motion, drag, tap, hover effects, and layout transitions.

#### GSAP (when ultra-precise timing, scroll triggers, and complex multi-step timelines are required)
- Especially useful for graph explorer, onboarding sequences.

#### Implementation Guidelines
- Prefer Framer Motion for React-based UI; use GSAP for 3D/Canvas and cross-framework scenes.
- Always adhere to high-performance practices: throttle heavy/complex scenes, minimize repaint costs, test on low-power hardware.

#### Motion Tokens Examples

| Name              | Animation                              | Example Use                |
|-------------------|----------------------------------------|----------------------------|
| animate-glow      | Soft blur+opacity in/out, 250ms        | Accent button focus, nodes |
| animate-parallax  | Slight translateY/X, ease-in, 500ms    | BG panels                  |
| animate-inertia   | Fade+slide with 100ms overshoot, 350ms | Card, tile open/close      |
| animate-pulse     | Key color glow pulse, 1.5s             | Live metric alert          |
| animate-elastic   | Spring out/in, bounce 15% then settle  | Drag/Drop cards, graph     |

#### Best Practices
- Never animate background color fill/brightness abruptly; use fade or blur-to-glow then "light up."
- Every actionable state should have at least 2 intermediate frames: rest → focus/hover → active; for keyboard nav and pointer.
- Motions must be interruptible and reversible—never block or force users to wait unless required for clarity.

---

## Technical Design Notes

### Stack Rationalization

#### UI Frameworks
- **React (Next.js/Vite)**: Ensures top performance, dynamic routing, and server/client rendering suitable for secure legal tech.
- **TailwindCSS**: Utility classes enable granular control over dark-mode, spacing, and surface effects; supports tokenization for easy, scalable theming.
- **shadcn/ui**: Modern, accessible, composable React unstyled UI components; allows for deep customization of motion, dark-mode, and tokens. Accessible and ready for legal-grade environments (WCAG).
- **Framer Motion**: Micro-interactions, animation states, drag-drop gesture support through motion values and hooks.
- **GSAP**: For timeline, scroll, or advanced 3D/interfacing, especially in explorer.
- **Radix UI primitives**: Used via shadcn, for a11y, composibility, and React "ownership" of components.

#### 3D and Visualization
- **React Three Fiber** or Three.js for graph explorer. Allows for custom node rendering, bloom, depth of field, inertia/drag.

#### Real-Time and Collaboration
- **WebRTC** for live video, low-latency co-counsel chat, mock trial arena.
- **Streaming captions** and transcript playback built on WebRTC+AI Speech-to-Text pipelines.

#### Design Token System
- Tailwind's support for tokenized CSS variables makes color, radii, shadow, and animation tokens manageable across dark/light and theme modes.
- Use of **design token generation tools** (e.g., Figma Tokens, Style Dictionary) to maintain parity between Figma (as source of truth) and codebase; synchronize tokens periodically for design/dev harmony.

#### Component Customization
- All shadcn/ui and Radix components should use dark tokens and fully support advanced slotting: glass backgrounds, accent border, neon/glow box shadows, motion presets.
- Drag-and-drop UX leverages micro-motion, "ghost" previews, touch-optimized targets, and full a11y (incl. keyboard movement, live ARIA updates).

#### Accessibility & Performance
- Each component and page passes WCAG AA (color contrast, focus order, ARIA roles).
- All glass/blur effects degrade gracefully for devices without backdrop-filter; fallback is solid/gradient BG.
- Animations are "prefers-reduced-motion" aware—motion optional for those who need minimized motion.

### Tokenization and Theme Management

Implement a design system based on CSS custom properties and utility classes. Core reasons:
- Legal SaaS platforms need multi-client deploys (white labeling, branding, light/dark, compliance).
- Tokens abstract color, spacing, radii, font, and motion parameters from implementation; allow seamless updates in both Figma and code.
- Use design token pipeline: Figma Tokens → Style Dictionary → CSS custom properties.

---

## Design Token Reference

### Color Tokens

#### Background Colors
```css
--cds-color-bg-canvas: #101217;
--cds-color-bg-surface: #181a1e;
--cds-color-bg-panel: #22232a;
--cds-color-bg-elevated: #2a2b32;
--cds-color-bg-overlay: #32333a;
--cds-color-bg-modal: #1d1f25;
```

#### Text Colors
```css
--cds-color-text-primary: #ececf0;
--cds-color-text-secondary: #bcc6cf;
--cds-color-text-tertiary: #8a919e;
--cds-color-text-disabled: #5a5f6e;
--cds-color-text-inverse: #0a0c10;
```

#### Accent Colors (Cyan)
```css
--cds-color-accent-cyan-100: #e6fcff;
--cds-color-accent-cyan-200: #b3f0ff;
--cds-color-accent-cyan-300: #80e4ff;
--cds-color-accent-cyan-400: #4dd7ff;
--cds-color-accent-cyan-500: #18cafe;
--cds-color-accent-cyan-600: #00b8e6;
--cds-color-accent-cyan-700: #00a6cc;
--cds-color-accent-cyan-800: #0094b3;
--cds-color-accent-cyan-900: #008299;
```

#### Accent Colors (Violet)
```css
--cds-color-accent-violet-100: #f0e6ff;
--cds-color-accent-violet-200: #d9c7ff;
--cds-color-accent-violet-300: #c2a8ff;
--cds-color-accent-violet-400: #ab89ff;
--cds-color-accent-violet-500: #946aff;
--cds-color-accent-violet-600: #7d4bff;
--cds-color-accent-violet-700: #663ce6;
--cds-color-accent-violet-800: #4f2dcc;
--cds-color-accent-violet-900: #381eb3;
```

#### Support Accents
```css
--cds-color-accent-gold: #ffd65a;
--cds-color-accent-red: #ff204e;
--cds-color-accent-green: #4ade80;
```

#### Border Colors
```css
--cds-color-border-default: #383b44;
--cds-color-border-subtle: #2d2f38;
--cds-color-border-strong: #4a4d57;
```

### Shadow & Glow Tokens

#### Shadows
```css
--cds-shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.12);
--cds-shadow-sm: 0 4px 8px 0 rgba(0, 0, 0, 0.16);
--cds-shadow-md: 0 8px 16px 0 rgba(0, 0, 0, 0.20);
--cds-shadow-lg: 0 16px 32px 0 rgba(0, 0, 0, 0.24);
--cds-shadow-xl: 0 24px 48px 0 rgba(0, 0, 0, 0.28);
```

#### Glows
```css
--cds-glow-cyan-xs: 0 0 4px rgba(24, 202, 254, 0.2);
--cds-glow-cyan-sm: 0 0 8px rgba(24, 202, 254, 0.3);
--cds-glow-cyan-md: 0 0 16px rgba(24, 202, 254, 0.4);
--cds-glow-cyan-lg: 0 0 24px rgba(24, 202, 254, 0.5);
--cds-glow-violet-xs: 0 0 4px rgba(148, 106, 255, 0.2);
--cds-glow-violet-sm: 0 0 8px rgba(148, 106, 255, 0.3);
--cds-glow-violet-md: 0 0 16px rgba(148, 106, 255, 0.4);
--cds-glow-violet-lg: 0 0 24px rgba(148, 106, 255, 0.5);
```

### Typography Tokens

#### Font Families
```css
--cds-font-ui: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--cds-font-display: 'Quorum Std', 'Inter', system-ui, sans-serif;
--cds-font-mono: 'IBM Plex Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
```

#### Font Sizes
```css
--cds-font-size-xs: 0.75rem;    /* 12px */
--cds-font-size-sm: 0.875rem;   /* 14px */
--cds-font-size-base: 1rem;     /* 16px */
--cds-font-size-lg: 1.125rem;   /* 18px */
--cds-font-size-xl: 1.25rem;    /* 20px */
--cds-font-size-2xl: 1.5rem;    /* 24px */
--cds-font-size-3xl: 1.875rem;  /* 30px */
--cds-font-size-4xl: 2.25rem;   /* 36px */
--cds-font-size-5xl: 3rem;      /* 48px */
--cds-font-size-6xl: 3.75rem;   /* 60px */
```

#### Font Weights
```css
--cds-font-weight-light: 300;
--cds-font-weight-normal: 400;
--cds-font-weight-medium: 500;
--cds-font-weight-semibold: 600;
--cds-font-weight-bold: 700;
--cds-font-weight-extrabold: 800;
```

#### Line Heights
```css
--cds-line-height-tight: 1.25;
--cds-line-height-snug: 1.375;
--cds-line-height-normal: 1.5;
--cds-line-height-relaxed: 1.625;
--cds-line-height-loose: 2;
```

#### Letter Spacing
```css
--cds-tracking-tighter: -0.05em;
--cds-tracking-tight: -0.025em;
--cds-tracking-normal: 0;
--cds-tracking-wide: 0.025em;
--cds-tracking-wider: 0.05em;
--cds-tracking-widest: 0.1em;
```

### Spacing System

The spacing system uses a consistent 4px base unit:
```css
--cds-space-0: 0;
--cds-space-1: 0.25rem;   /* 4px */
--cds-space-2: 0.5rem;    /* 8px */
--cds-space-3: 0.75rem;   /* 12px */
--cds-space-4: 1rem;      /* 16px */
--cds-space-5: 1.25rem;   /* 20px */
--cds-space-6: 1.5rem;    /* 24px */
--cds-space-7: 1.75rem;   /* 28px */
--cds-space-8: 2rem;      /* 32px */
--cds-space-9: 2.25rem;   /* 36px */
--cds-space-10: 2.5rem;   /* 40px */
--cds-space-11: 2.75rem;  /* 44px */
--cds-space-12: 3rem;     /* 48px */
--cds-space-14: 3.5rem;   /* 56px */
--cds-space-16: 4rem;     /* 64px */
--cds-space-20: 5rem;     /* 80px */
--cds-space-24: 6rem;     /* 96px */
--cds-space-28: 7rem;     /* 112px */
--cds-space-32: 8rem;     /* 128px */
--cds-space-36: 9rem;     /* 144px */
--cds-space-40: 10rem;    /* 160px */
--cds-space-44: 11rem;    /* 176px */
--cds-space-48: 12rem;    /* 192px */
--cds-space-52: 13rem;    /* 208px */
--cds-space-56: 14rem;    /* 224px */
--cds-space-60: 15rem;    /* 240px */
--cds-space-64: 16rem;    /* 256px */
--cds-space-72: 18rem;    /* 288px */
--cds-space-80: 20rem;    /* 320px */
--cds-space-96: 24rem;    /* 384px */
```

### Border Radius

```css
--cds-radius-xs: 0.125rem;   /* 2px */
--cds-radius-sm: 0.25rem;    /* 4px */
--cds-radius-md: 0.375rem;   /* 6px */
--cds-radius-lg: 0.5rem;     /* 8px */
--cds-radius-xl: 0.75rem;    /* 12px */
--cds-radius-2xl: 1rem;      /* 16px */
--cds-radius-3xl: 1.5rem;    /* 24px */
--cds-radius-full: 9999px;
```

### Transitions & Animations

#### Timing Functions
```css
--cds-ease-in: cubic-bezier(0.32, 0, 0.67, 0);
--cds-ease-out: cubic-bezier(0.33, 1, 0.68, 1);
--cds-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
--cds-ease-elastic: cubic-bezier(0.22, 1, 0.36, 1);
```

#### Duration
```css
--cds-duration-fast: 150ms;
--cds-duration-medium: 250ms;
--cds-duration-slow: 400ms;
--cds-duration-slower: 600ms;
```

#### Animation Keys
```css
--cds-animation-fade-in: fade-in 250ms var(--cds-ease-out);
--cds-animation-fade-out: fade-out 250ms var(--cds-ease-out);
--cds-animation-scale-in: scale-in 250ms var(--cds-ease-elastic);
--cds-animation-scale-out: scale-out 250ms var(--cds-ease-elastic);
--cds-animation-slide-in-right: slide-in-right 250ms var(--cds-ease-elastic);
--cds-animation-slide-out-right: slide-out-right 250ms var(--cds-ease-elastic);
--cds-animation-pulse: pulse 1.5s infinite;
--cds-animation-glow: glow 2s infinite;
--cds-animation-node-pulse: node-pulse 2s infinite;
--cds-animation-node-glow: node-glow 3s infinite;
```

### Z-Index Scale

```css
--cds-z-backdrop: -1;
--cds-z-surface: 1;
--cds-z-panel: 10;
--cds-z-dropdown: 100;
--cds-z-sticky: 110;
--cds-z-fixed: 120;
--cds-z-modal: 1000;
--cds-z-popover: 1010;
--cds-z-tooltip: 1020;
```

---

## Component Styles

### Glassmorphism Effects

```css
/* Basic Glass Effect */
.cds-glass {
  background: rgba(34, 35, 42, 0.78);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Strong Glass Effect */
.cds-glass-strong {
  background: rgba(28, 30, 37, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
```

### Cinematic Card

```css
.cds-card-cinematic {
  background: linear-gradient(160deg, rgba(34, 36, 45, 0.95), rgba(20, 22, 29, 0.75));
  border-radius: var(--cds-radius-xl);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 45px -32px rgba(0, 0, 0, 0.65);
  transition: all var(--cds-duration-medium) var(--cds-ease-elastic);
}

.cds-card-cinematic:hover {
  transform: translateY(-4px);
  box-shadow: 0 32px 64px -40px rgba(0, 0, 0, 0.75);
}
```

### Accent Button

```css
.cds-btn-accent {
  background: linear-gradient(135deg, var(--cds-color-accent-violet-600), var(--cds-color-accent-cyan-500));
  color: white;
  border: none;
  border-radius: var(--cds-radius-lg);
  padding: var(--cds-space-3) var(--cds-space-5);
  font-weight: var(--cds-font-weight-semibold);
  cursor: pointer;
  transition: all var(--cds-duration-fast) var(--cds-ease-in-out);
  box-shadow: 0 0 16px rgba(24, 202, 254, 0.3);
}

.cds-btn-accent:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 24px rgba(24, 202, 254, 0.5);
}

.cds-btn-accent:active {
  transform: translateY(0);
  box-shadow: 0 0 8px rgba(24, 202, 254, 0.3);
}
```

### Node Glow Effect

```css
.cds-node-glow {
  position: relative;
  border-radius: 50%;
  background: var(--cds-color-bg-panel);
  box-shadow: 0 0 8px rgba(24, 202, 254, 0.3);
}

.cds-node-glow::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, var(--cds-color-accent-cyan-500), var(--cds-color-accent-violet-500));
  border-radius: 50%;
  z-index: -1;
  opacity: 0.7;
  filter: blur(4px);
}
```

### Holographic Text

```css
.cds-text-holo {
  background: linear-gradient(90deg, var(--cds-color-accent-cyan-400), var(--cds-color-accent-violet-400));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  font-weight: var(--cds-font-weight-bold);
}
```

### Gradient Border

```css
.cds-border-gradient {
  position: relative;
  border: none;
  background: linear-gradient(var(--cds-color-bg-canvas), var(--cds-color-bg-canvas)) padding-box,
              linear-gradient(135deg, var(--cds-color-accent-cyan-500), var(--cds-color-accent-violet-500)) border-box;
  border-radius: var(--cds-radius-lg);
  border-width: 2px;
  border-style: solid;
}
```

### Parallax Background

```css
.cds-bg-parallax {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at 12% 18%, rgba(24, 224, 252, 0.1), transparent 60%),
    radial-gradient(circle at 82% 12%, rgba(139, 93, 255, 0.12), transparent 50%),
    radial-gradient(circle at 24% 82%, rgba(255, 214, 90, 0.08), transparent 60%),
    linear-gradient(180deg, rgba(10, 12, 18, 0.95) 0%, rgba(15, 18, 24, 0.9) 100%);
  filter: saturate(1.15);
  pointer-events: none;
  z-index: var(--cds-z-backdrop);
}
```

### Cinematic Divider

```css
.cds-divider-cinematic {
  position: relative;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--cds-color-border-default), transparent);
  margin: var(--cds-space-6) 0;
}

.cds-divider-cinematic::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 4px;
  background: var(--cds-color-accent-cyan-500);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--cds-color-accent-cyan-500);
}
```

### Status Indicator

```css
.cds-status-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cds-color-accent-green);
  box-shadow: 0 0 4px var(--cds-color-accent-green);
}

.cds-status-indicator--warning {
  background: var(--cds-color-accent-gold);
  box-shadow: 0 0 4px var(--cds-color-accent-gold);
}

.cds-status-indicator--error {
  background: var(--cds-color-accent-red);
  box-shadow: 0 0 4px var(--cds-color-accent-red);
}
```

### Cinematic Badge

```css
.cds-badge-cinematic {
  display: inline-flex;
  align-items: center;
  padding: var(--cds-space-1) var(--cds-space-2);
  border-radius: var(--cds-radius-full);
  font-size: var(--cds-font-size-xs);
  font-weight: var(--cds-font-weight-medium);
  background: rgba(148, 106, 255, 0.15);
  color: var(--cds-color-accent-violet-300);
  border: 1px solid rgba(148, 106, 255, 0.25);
}
```

### Progress Bar - Cinematic

```css
.cds-progress-cinematic {
  height: 6px;
  background: var(--cds-color-bg-panel);
  border-radius: var(--cds-radius-full);
  overflow: hidden;
  position: relative;
}

.cds-progress-cinematic::-webkit-progress-bar {
  background: var(--cds-color-bg-panel);
  border-radius: var(--cds-radius-full);
}

.cds-progress-cinematic::-webkit-progress-value {
  background: linear-gradient(90deg, var(--cds-color-accent-cyan-500), var(--cds-color-accent-violet-500));
  border-radius: var(--cds-radius-full);
  transition: width var(--cds-duration-medium) var(--cds-ease-elastic);
}

.cds-progress-cinematic::-moz-progress-bar {
  background: linear-gradient(90deg, var(--cds-color-accent-cyan-500), var(--cds-color-accent-violet-500));
  border-radius: var(--cds-radius-full);
}
```

### Input Field - Cinematic

```css
.cds-input-cinematic {
  background: rgba(34, 35, 42, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--cds-radius-md);
  padding: var(--cds-space-3);
  color: var(--cds-color-text-primary);
  font-family: var(--cds-font-ui);
  transition: all var(--cds-duration-fast) var(--cds-ease-in-out);
}

.cds-input-cinematic:focus {
  outline: none;
  border-color: var(--cds-color-accent-violet-500);
  box-shadow: 0 0 0 2px rgba(148, 106, 255, 0.2);
}
```

### Tooltip - Cinematic

```css
.cds-tooltip-cinematic {
  position: relative;
  display: inline-block;
}

.cds-tooltip-cinematic .cds-tooltip-text {
  visibility: hidden;
  background: var(--cds-color-bg-overlay);
  color: var(--cds-color-text-primary);
  text-align: center;
  border-radius: var(--cds-radius-md);
  padding: var(--cds-space-2) var(--cds-space-3);
  position: absolute;
  z-index: var(--cds-z-tooltip);
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity var(--cds-duration-fast) var(--cds-ease-in-out);
  font-size: var(--cds-font-size-sm);
  white-space: nowrap;
  box-shadow: var(--cds-shadow-md);
  border: 1px solid var(--cds-color-border-default);
}

.cds-tooltip-cinematic:hover .cds-tooltip-text {
  visibility: visible;
  opacity: 1;
}

.cds-tooltip-cinematic .cds-tooltip-text::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: var(--cds-color-bg-overlay) transparent transparent transparent;
}
```

---

## Layout Components

### Cinematic App Container

```css
.cds-app-cinematic {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  overflow-x: hidden;
  background: var(--cds-color-bg-canvas);
}
```

### Cinematic Header

```css
.cds-header-cinematic {
  position: sticky;
  top: 0;
  z-index: var(--cds-z-sticky);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--cds-space-7) var(--cds-space-10) var(--cds-space-5);
  background: linear-gradient(180deg, rgba(9, 12, 18, 0.95), rgba(9, 12, 18, 0.75));
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 28px 40px -40px rgba(0, 0, 0, 0.8);
}
```

### Cinematic Body

```css
.cds-body-cinematic {
  display: grid;
  grid-template-columns: minmax(260px, 280px) 1fr;
  min-height: calc(100vh - 220px);
}
```

### Cinematic Navigation

```css
.cds-nav-cinematic {
  position: relative;
  padding: var(--cds-space-8) var(--cds-space-6) var(--cds-space-10);
  background: rgba(12, 14, 20, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}
```

### Cinematic Main Content

```css
.cds-main-cinematic {
  padding: var(--cds-space-8);
  overflow-y: auto;
}
```

---

## Implementation Guidelines

### CSS Custom Properties
All design tokens are implemented as CSS custom properties for easy theming and maintenance:
```css
:root {
  --cds-color-bg-canvas: #101217;
  --cds-font-ui: 'Inter', system-ui;
  --cds-radius-lg: 0.5rem;
}
```

### Utility Classes
The design system includes utility classes for common styling needs:
```html
<div class="cds-bg-surface cds-p-4 cds-radius-lg cds-shadow-md">
  <h2 class="cds-text-primary cds-font-display cds-text-2xl">Card Title</h2>
  <p class="cds-text-secondary cds-mt-2">Card content...</p>
</div>
```

### Responsive Design
Use the spacing system with responsive utilities:
```html
<div class="cds-p-4 cds-md:p-6 cds-lg:p-8">
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
  --cds-color-brand-primary: #your-brand-color;
  --cds-spacing-section: 5rem;
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
<div class="cds-card-cinematic cds-p-6">
  <h3 class="cds-text-primary cds-font-display cds-text-xl cds-mb-4">Case Summary</h3>
  <p class="cds-text-secondary cds-mb-6">Key details about the litigation...</p>
  <button class="cds-btn-accent">View Details</button>
</div>
```

### Implementing a Glowing Node
```html
<div class="cds-node-glow cds-w-16 cds-h-16 cds-animate-node-glow">
  <!-- Node content -->
</div>
```

### Building a Progress Indicator
```html
<progress class="cds-progress-cinematic cds-w-full" value="75" max="100"></progress>
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