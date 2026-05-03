// hanimo Brand & Theme tokens
// Honey amber (꿀벌) + warm cream (모돌 화이트)

export const BRAND = {
  honey50: '#FFF8E7', honey100: '#FCEBC1', honey200: '#F8DA8C', honey300: '#F2C257',
  honey400: '#E5A63B', honey500: '#D08A1F', honey600: '#A66B14', honey700: '#7A4E0E',
  modol50: '#FCFBF7', modol100: '#F7F3E9', modol200: '#EFE8D6',
  charcoal: '#2A2218',
};

export interface ThemeTokens {
  name: string;
  appBg: string; surface: string; surface2: string; border: string; borderSoft: string;
  text: string; textMuted: string; textDim: string; textFaint: string;
  accent: string; accentText: string;
  brand: string; brandText: string; brandBg: string; brandBgStrong: string; brandBorder: string;
  sidebarBg: string; codeBg: string; codeText: string; codeBorder: string;
  chipBg: string; chipText: string;
  success: string; successBg: string;
  danger: string; dangerBg: string;
  blue: string; blueBg: string;
  amber: string; amberBg: string;
  purple: string; purpleBg: string;
}

export const THEME: Record<string, ThemeTokens> = {
  light: {
    name: 'light',
    appBg: '#FAFAFA', surface: '#FFFFFF', surface2: '#FAFAFA', border: '#E5E5E5', borderSoft: '#F0F0F0',
    text: '#0A0A0A', textMuted: '#525252', textDim: '#737373', textFaint: '#A3A3A3',
    accent: '#0A0A0A', accentText: '#FFFFFF',
    brand: BRAND.honey400, brandText: '#FFFFFF', brandBg: BRAND.honey50, brandBgStrong: BRAND.honey100, brandBorder: BRAND.honey200,
    sidebarBg: '#FFFFFF', codeBg: '#0A0A0A', codeText: '#E5E5E5', codeBorder: '#262626',
    chipBg: '#F5F5F5', chipText: '#525252',
    success: '#16A34A', successBg: '#F0FDF4',
    danger: '#DC2626', dangerBg: '#FEF2F2',
    blue: '#2563EB', blueBg: '#EFF6FF',
    amber: '#D97706', amberBg: '#FFFBEB',
    purple: '#7C3AED', purpleBg: '#F5F3FF',
  },
  dark: {
    name: 'dark',
    appBg: '#0A0A0A', surface: '#111111', surface2: '#0F0F0F', border: '#262626', borderSoft: '#1F1F1F',
    text: '#FAFAFA', textMuted: '#A3A3A3', textDim: '#737373', textFaint: '#525252',
    accent: '#FAFAFA', accentText: '#0A0A0A',
    brand: BRAND.honey300, brandText: '#0A0A0A', brandBg: '#2A1F0A', brandBgStrong: '#3D2D0E', brandBorder: '#5C4416',
    sidebarBg: '#0F0F0F', codeBg: '#000000', codeText: '#E5E5E5', codeBorder: '#1F1F1F',
    chipBg: '#1F1F1F', chipText: '#A3A3A3',
    success: '#22C55E', successBg: '#052E16',
    danger: '#EF4444', dangerBg: '#2A0A0A',
    blue: '#60A5FA', blueBg: '#0C1F3D',
    amber: '#FBBF24', amberBg: '#2A1A05',
    purple: '#A78BFA', purpleBg: '#1A0F2E',
  },
  honey: {
    name: 'honey',
    appBg: BRAND.modol50, surface: '#FFFFFF', surface2: BRAND.modol100, border: BRAND.modol200, borderSoft: '#F0EAD8',
    text: BRAND.charcoal, textMuted: '#5C4E33', textDim: '#7A6B4E', textFaint: '#A89674',
    accent: BRAND.honey400, accentText: '#FFFFFF',
    brand: BRAND.honey400, brandText: '#FFFFFF', brandBg: BRAND.honey50, brandBgStrong: BRAND.honey100, brandBorder: BRAND.honey200,
    sidebarBg: '#FFFDF7', codeBg: BRAND.charcoal, codeText: '#F7F3E9', codeBorder: '#3D3424',
    chipBg: BRAND.honey50, chipText: BRAND.honey700,
    success: '#15803D', successBg: '#F0FDF4',
    danger: '#B91C1C', dangerBg: '#FEF2F2',
    blue: '#1D4ED8', blueBg: '#EFF6FF',
    amber: BRAND.honey500, amberBg: BRAND.honey50,
    purple: '#6D28D9', purpleBg: '#F5F3FF',
  },
};
