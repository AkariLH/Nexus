import { useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { palette } from '../constants/colors';
import { SATISFACTION_LABELS } from '../utils/ratingFormat';

/**
 * Caritas de satisfaccion de 1 a 5 (Figma "Cara/1 Muy mal" ... "Cara/5 Muy bien", Componentes),
 * con el mismo trazo en degradado que {@link MoodFace}. Trazos exportados del archivo de diseño y
 * ya colocados en la cara de 40 x 40 (en web los desplazamientos x/y de Path no se aplican).
 */
const EYES = [
  'M16.5 17.5C16.5 18.6 15.83 19.5 15 19.5C14.17 19.5 13.5 18.6 13.5 17.5C13.5 16.4 14.17 15.5 15 15.5C15.83 15.5 16.5 16.4 16.5 17.5Z',
  'M26.5 17.5C26.5 18.6 25.83 19.5 25 19.5C24.17 19.5 23.5 18.6 23.5 17.5C23.5 16.4 24.17 15.5 25 15.5C25.83 15.5 26.5 16.4 26.5 17.5Z',
];

const FACES: string[][] = [
  // 1 Muy mal: cejas caidas y boca hacia abajo
  [
    'M11.67 12.91C12.78 11.25 14.45 10.69 16.67 11.25',
    'M23.33 11.25C25.55 10.69 27.22 11.25 28.33 12.91',
    ...EYES,
    'M13.75 28.34C17.92 24.17 22.08 24.17 26.25 28.34',
  ],
  // 2 Mal
  [...EYES, 'M15 27.08C18.33 25.13 21.67 25.13 25 27.08'],
  // 3 Regular
  [...EYES, 'M15 25.83L25 25.83'],
  // 4 Bien
  [...EYES, 'M13.75 24.17C17.92 27.5 22.08 27.5 26.25 24.17'],
  // 5 Muy bien: ojos felices y sonrisa abierta
  [
    'M11.67 15.83C13.34 13.06 15 13.06 16.67 15.83',
    'M23.33 15.83C25 13.06 26.66 13.06 28.33 15.83',
    'M10.42 21.67C16.81 23.34 23.2 23.34 29.59 21.67C29.03 28.06 25.84 31.25 20 31.25C14.17 31.25 10.98 28.06 10.42 21.67Z',
    'M15 29C18.33 26.61 21.67 26.61 25 29',
  ],
];

interface SatisfactionFaceProps {
  /** 1 (muy mal) a 5 (muy bien). */
  score: number;
  size?: number;
}

export function SatisfactionFace({ score, size = 40 }: SatisfactionFaceProps) {
  const gradientId = `sat${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const index = Math.min(Math.max(Math.round(score), 1), 5) - 1;
  const stroke = `url(#${gradientId})`;

  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none" accessibilityLabel={SATISFACTION_LABELS[index]}>
      <Defs>
        <LinearGradient id={gradientId} x1="3.3" y1="20" x2="36.7" y2="20" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={palette.primary} />
          <Stop offset="1" stopColor={palette.secondary} />
        </LinearGradient>
      </Defs>
      <Circle cx={20} cy={20} r={16.67} stroke={stroke} strokeWidth={2.08} />
      {FACES[index].map((d) => (
        <Path key={d} d={d} stroke={stroke} strokeWidth={2.08} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}
