export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  brand: string;
  brandStrong: string;
  brandInk: string;
  brand50: string;
  brand100: string;
  navy: string;
  ink: string;
  body: string;
  muted: string;
  faint: string;
  canvas: string;
  surface: string;
  line: string;
  lineSoft: string;
  accent: string;
  danger: string;
  sky: string;
  white: string;
  onBrand: string;
  background: string;
  primary: string;
  primaryDark: string;
  text: string;
  textMuted: string;
  border: string;
  placeholder: string;
};

export const lightColors: ThemeColors = {
  brand: '#0E9384',
  brandStrong: '#0B7A6E',
  brandInk: '#05463F',
  brand50: '#E7F7F4',
  brand100: '#CFF0EA',

  navy: '#0C1B33',
  ink: '#101828',
  body: '#475467',
  muted: '#667085',
  faint: '#98A2B3',

  canvas: '#F6F7F9',
  surface: '#FFFFFF',
  line: '#E4E7EC',
  lineSoft: '#EEF0F3',

  accent: '#F79009',
  danger: '#D92D20',
  sky: '#2E90FA',
  white: '#FFFFFF',
  onBrand: '#FFFFFF',

  background: '#F6F7F9',
  primary: '#0E9384',
  primaryDark: '#0B7A6E',
  text: '#101828',
  textMuted: '#475467',
  border: '#E4E7EC',
  placeholder: '#98A2B3',
};

export const darkColors: ThemeColors = {
  brand: '#2ED3BC',
  brandStrong: '#2ED3BC',
  brandInk: '#B8F2EA',
  brand50: '#0F2F2C',
  brand100: '#14403B',

  navy: '#EAF2F7',
  ink: '#E7EDF0',
  body: '#AAB6BF',
  muted: '#8C9AA5',
  faint: '#6E7C88',

  canvas: '#0B1419',
  surface: '#111C23',
  line: '#243039',
  lineSoft: '#1B262E',

  accent: '#FDB022',
  danger: '#F97066',
  sky: '#53B1FD',
  white: '#FFFFFF',
  onBrand: '#0B1419',

  background: '#0B1419',
  primary: '#2ED3BC',
  primaryDark: '#25B8A4',
  text: '#E7EDF0',
  textMuted: '#AAB6BF',
  border: '#243039',
  placeholder: '#6E7C88',
};

// Backward-compatible default export for any remaining static imports.
export const colors = darkColors;
