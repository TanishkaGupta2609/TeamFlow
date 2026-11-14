/**
 * TeamFlow Design Tokens
 * Centralized design system constants matching the mandatory visual identity:
 * Primary forest green: #173F35
 * Secondary forest green: #285747
 * Warm ivory background: #F7F6F2
 * White surface: #FFFFFF
 * Muted sage: #A9B8A5
 * Amber accent: #D49A52
 * Charcoal text: #242B27
 * Secondary text: #747B73
 * Border: #E9E7E0
 * Success: #477A5B
 * Warning: #D49A52
 * Danger: #C66A5A
 */

export const colors = {
  primary: {
    forest: '#173F35',
    secondary: '#285747',
    hover: '#13352C',
    dark: '#0E2721',
    light: '#235043',
  },
  surface: {
    ivory: '#F7F6F2',
    white: '#FFFFFF',
    ivoryMuted: '#EFECE6',
    subtle: '#F9F8F5',
  },
  accent: {
    amber: '#D49A52',
    amberLight: '#FBF2E7',
    amberDark: '#B87F3B',
    sage: '#A9B8A5',
    sageLight: '#E8EFE6',
    sageDark: '#5E6F5A',
  },
  neutral: {
    charcoal: '#242B27',
    secondary: '#747B73',
    muted: '#8A9289',
    border: '#E9E7E0',
    borderDark: '#D8D5CD',
  },
  semantic: {
    success: '#477A5B',
    successBg: '#EBF3EE',
    warning: '#D49A52',
    warningBg: '#FAF3EA',
    danger: '#C66A5A',
    dangerBg: '#F8ECE9',
    info: '#285747',
    infoBg: '#EBF1EE',
  },
};

export const typography = {
  fonts: {
    heading: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
  },
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(36, 43, 39, 0.04)',
  DEFAULT: '0 2px 4px 0 rgba(36, 43, 39, 0.06), 0 1px 2px -1px rgba(36, 43, 39, 0.06)',
  md: '0 4px 6px -1px rgba(36, 43, 39, 0.08), 0 2px 4px -2px rgba(36, 43, 39, 0.06)',
  lg: '0 10px 15px -3px rgba(36, 43, 39, 0.08), 0 4px 6px -4px rgba(36, 43, 39, 0.04)',
};

export const radii = {
  none: '0',
  sm: '0.25rem',  // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem',   // 8px
  xl: '0.75rem',  // 12px
  full: '9999px',
};

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
};

export default {
  colors,
  typography,
  shadows,
  radii,
  transitions,
};
