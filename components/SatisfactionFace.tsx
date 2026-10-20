import { useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { palette } from '../constants/colors';
import { SATISFACTION_LABELS } from '../utils/ratingFormat';

/**
 * Caritas de satisfaccion de 1 a 5 (Figma "Cara/1 Muy mal" ... "Cara/5 Muy bien", Componentes),
 * con el mismo trazo en degradado que {@link MoodFace}. Trazos exportados del archivo de diseño
 * (40 x 40); cada uno lleva su desplazamiento dentro de la cara.
 */
type Stroke = { x: number; y: number; d: string };

const EYE = 'M3 2C3 3.1 2.33 4 1.5 4C0.67 4 0 3.1 0 2C0 0.9 0.67 0 1.5 0C2.33 0 3 0.9 3 2Z';
const EYES: Stroke[] = [
  { x: 13.5, y: 15.5, d: EYE },
  { x: 23.5, y: 15.5, d: EYE },
];

const FACES: Stroke[][] = [
  // 1 Muy mal: cejas caidas y boca hacia abajo
  [
    { x: 11.67, y: 11.04, d: 'M0 1.875C1.11 0.21 2.78 -0.35 5 0.21' },
    { x: 23.33, y: 11.04, d: 'M0 0.21C2.22 -0.35 3.89 0.21 5 1.875' },
    ...EYES,
    { x: 13.75, y: 25.21, d: 'M0 3.125C4.17 -1.04 8.33 -1.04 12.5 3.125' },
  ],
  // 2 Mal
  [...EYES, { x: 15, y: 25.62, d: 'M0 1.46C3.33 -0.49 6.67 -0.49 10 1.46' }],
  // 3 Regular
  [...EYES, { x: 15, y: 25.83, d: 'M0 0L10 0' }],
  // 4 Bien
  [...EYES, { x: 13.75, y: 24.17, d: 'M0 0C4.17 3.33 8.33 3.33 12.5 0' }],
  // 5 Muy bien: ojos felices y sonrisa abierta
  [
    { x: 11.67, y: 13.75, d: 'M0 2.08C1.67 -0.69 3.33 -0.69 5 2.08' },
    { x: 23.33, y: 13.75, d: 'M0 2.08C1.67 -0.69 3.33 -0.69 5 2.08' },
    { x: 10.42, y: 21.67, d: 'M0 0C6.39 1.67 12.78 1.67 19.17 0C18.61 6.39 15.42 9.58 9.58 9.58C3.75 9.58 0.56 6.39 0 0Z' },
    { x: 15, y: 27.21, d: 'M0 1.79C3.33 -0.6 6.67 -0.6 10 1.79' },
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
      {FACES[index].map((s, i) => (
        <Path
          key={i}
          d={s.d}
          x={s.x}
          y={s.y}
          stroke={stroke}
          strokeWidth={2.08}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
