/**
 * Paleta de la app. El color principal es el degradado rosa -> morado (`gradients.primary`); el
 * resto de los colores se derivan de sus dos extremos. Las pantallas no escriben colores a mano:
 * usan estos nombres.
 *
 * Contraste (WCAG AA): el rosa solo alcanza 3:1 sobre blanco, asi que se usa en rellenos, bordes e
 * iconos; el texto de acento va en morado (`textAccent`, 6:1). Los grises llevan un tinte morado
 * leve y todos los de texto pasan 4.5:1 sobre `surface` y `surfaceMuted`.
 */
import { Platform } from 'react-native';

export const palette = {
  // Marca
  primary: '#FF4F81',
  secondary: '#8A2BE2',
  textAccent: '#8A2BE2',
  onPrimary: '#FFFFFF',
  onPrimarySoft: 'rgba(255, 255, 255, 0.9)',
  onPrimaryFaint: 'rgba(255, 255, 255, 0.25)',

  // Tintes de marca
  primarySoft: '#FFF0F5',
  primaryBorder: '#FFC9D9',
  primaryDisabled: '#FFB3C6',
  secondarySoft: '#F4ECFD',
  secondaryBorder: '#DCC6F7',
  secondaryDisabled: '#C9A8E8',

  // Texto e iconos
  text: '#1F1A29',
  textSecondary: '#5B5566',
  textMuted: '#6F697A',
  icon: '#8A8496',
  iconDisabled: '#CFCAD8',

  // Superficies
  background: '#FAF9FC',
  surface: '#FFFFFF',
  surfaceMuted: '#F5F3F8',
  border: '#E4E0EB',
  divider: '#EFECF4',

  // Estados
  error: '#DC2626',
  errorSoft: '#FEECEC',
  errorBorder: '#FBCFCF',
  success: '#0A7F57',
  successSoft: '#E6F6EF',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  info: '#2563EB',

  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

/**
 * Colores de los interruptores. En web el estado encendido usa un color propio (verde azulado)
 * si no se indica `activeThumbColor`; en el telefono esa propiedad se ignora.
 */
export const switchColors = {
  trackColor: { false: palette.border, true: palette.primary },
  thumbColor: palette.surface,
  ...(Platform.OS === 'web' ? { activeThumbColor: palette.surface } : {}),
};

export const gradients = {
  primary: [palette.primary, palette.secondary],
  primaryReversed: [palette.secondary, palette.primary],
  soft: [palette.primarySoft, palette.secondarySoft],
  disabled: [palette.primaryDisabled, palette.secondaryDisabled],
  danger: ['#EF4444', palette.error],
  locked: [palette.iconDisabled, palette.icon],
} as const;
