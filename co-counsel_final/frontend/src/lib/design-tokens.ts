// Design tokens mapping to our cinematic design system
export const designTokens = {
  colors: {
    background: {
      canvas: '#101217',
      surface: '#181a1e',
      panel: '#22232a',
      elevated: '#2a2b32',
      overlay: '#32333a',
      modal: '#1d1f25',
    },
    text: {
      primary: '#ececf0',
      secondary: '#bcc6cf',
      tertiary: '#8a919e',
      disabled: '#5a5f6e',
      inverse: '#0a0c10',
    },
    accent: {
      cyan: {
        100: '#e6fcff',
        200: '#b3f0ff',
        300: '#80e4ff',
        400: '#4dd7ff',
        500: '#18cafe', // Primary
        600: '#00b8e6',
        700: '#00a6cc',
        800: '#0094b3',
        900: '#008299',
      },
      violet: {
        100: '#f0e6ff',
        200: '#d9c7ff',
        300: '#c2a8ff',
        400: '#ab89ff',
        500: '#946aff', // Primary
        600: '#7d4bff',
        700: '#663ce6',
        800: '#4f2dcc',
        900: '#381eb3',
      },
      gold: '#ffd65a',
      red: '#ff204e',
      green: '#4ade80',
    },
    border: {
      default: '#383b44',
      subtle: '#2d2f38',
      strong: '#4a4d57',
    },
  },
  
  typography: {
    fonts: {
      ui: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      display: ['Quorum Std', 'Inter', 'system-ui', 'sans-serif'],
      mono: ['IBM Plex Mono', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace'],
    },
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem',  // 60px
    },
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },
  
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    7: '1.75rem',   // 28px
    8: '2rem',      // 32px
    9: '2.25rem',   // 36px
    10: '2.5rem',   // 40px
    11: '2.75rem',  // 44px
    12: '3rem',     // 48px
    14: '3.5rem',   // 56px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    28: '7rem',     // 112px
    32: '8rem',     // 128px
    36: '9rem',     // 144px
    40: '10rem',    // 160px
    44: '11rem',    // 176px
    48: '12rem',    // 192px
    52: '13rem',    // 208px
    56: '14rem',    // 224px
    60: '15rem',    // 240px
    64: '16rem',    // 256px
    72: '18rem',    // 288px
    80: '20rem',    // 320px
    96: '24rem',    // 384px
  },
  
  radius: {
    xs: '0.125rem',   // 2px
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.12)',
    sm: '0 4px 8px 0 rgba(0, 0, 0, 0.16)',
    md: '0 8px 16px 0 rgba(0, 0, 0, 0.20)',
    lg: '0 16px 32px 0 rgba(0, 0, 0, 0.24)',
    xl: '0 24px 48px 0 rgba(0, 0, 0, 0.28)',
  },
  
  glows: {
    'cyan-xs': '0 0 4px rgba(24, 202, 254, 0.2)',
    'cyan-sm': '0 0 8px rgba(24, 202, 254, 0.3)',
    'cyan-md': '0 0 16px rgba(24, 202, 254, 0.4)',
    'cyan-lg': '0 0 24px rgba(24, 202, 254, 0.5)',
    'violet-xs': '0 0 4px rgba(148, 106, 255, 0.2)',
    'violet-sm': '0 0 8px rgba(148, 106, 255, 0.3)',
    'violet-md': '0 0 16px rgba(148, 106, 255, 0.4)',
    'violet-lg': '0 0 24px rgba(148, 106, 255, 0.5)',
  },
  
  transitions: {
    timing: {
      'ease-in': 'cubic-bezier(0.32, 0, 0.67, 0)',
      'ease-out': 'cubic-bezier(0.33, 1, 0.68, 1)',
      'ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      'elastic': 'cubic-bezier(0.22, 1, 0.36, 1)',
    },
    duration: {
      fast: '150ms',
      medium: '250ms',
      slow: '400ms',
      slower: '600ms',
    },
  },
  
  zIndex: {
    backdrop: -1,
    surface: 1,
    panel: 10,
    dropdown: 100,
    sticky: 110,
    fixed: 120,
    modal: 1000,
    popover: 1010,
    tooltip: 1020,
  },
}

export default designTokens