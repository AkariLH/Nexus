import { useId } from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { palette } from '../constants/colors';

/**
 * Caritas de animo de contorno con trazo en degradado rosa -> morado (Figma "Ánimo/*", elegidas por
 * la usuaria el 2026-10-16 en lugar de emojis). Trazos exportados del archivo de diseño.
 */
const FACES: Record<string, string[]> = {
  Feliz: [
    'M14 19C16 15.6667 18 15.6667 20 19',
    'M28 19C30 15.6667 32 15.6667 34 19',
    'M12.5 26C20.1667 28 27.8333 28 35.5 26C34.8333 33.6667 31 37.5 24 37.5C17 37.5 13.1667 33.6667 12.5 26Z',
    'M18 34.8C22 31.9333 26 31.9333 30 34.8',
  ],
  'Emocionado/a': [
    'M17 13L18.29 16.22L21.76 16.45L19.09 18.68L19.94 22.05L17 20.2L14.06 22.05L14.91 18.68L12.24 16.45L15.71 16.22L17 13Z',
    'M31 13L32.29 16.22L35.76 16.45L33.09 18.68L33.94 22.05L31 20.2L28.06 22.05L28.91 18.68L26.24 16.45L29.71 16.22L31 13Z',
    'M12.5 26C20.1667 28 27.8333 28 35.5 26C34.8333 33.6667 31 37.5 24 37.5C17 37.5 13.1667 33.6667 12.5 26Z',
    'M18 34.8C22 31.9333 26 31.9333 30 34.8',
  ],
  'Tranquilo/a': [
    'M13 15.5C15 13.8333 17.1667 13.3333 19.5 14',
    'M28.5 14C30.8333 13.3333 33 13.8333 35 15.5',
    'M14 20C16 22.3333 18 22.3333 20 20',
    'M28 20C30 22.3333 32 22.3333 34 20',
    'M19 30C22.3333 32.6667 25.6667 32.6667 29 30',
  ],
  'En calma': ['M14 20C16 17 18 17 20 20', 'M28 20C30 17 32 17 34 20', 'M15 28C21 33 27 33 33 28'],
  'Cansado/a': [
    'M36 3H41L36 9H41',
    'M29.5 9H33L29.5 13.5H33',
    'M14 22C16 24 18 24 20 22',
    'M28 22C30 24 32 24 34 22',
    'M24 36C25.6569 36 27 34.2091 27 32C27 29.7909 25.6569 28 24 28C22.3431 28 21 29.7909 21 32C21 34.2091 22.3431 36 24 36Z',
  ],
  Triste: [
    'M14 15.5C15.3333 13.5 17.3333 12.8333 20 13.5',
    'M28 13.5C30.6667 12.8333 32.6667 13.5 34 15.5',
    'M18 23.4C18.9941 23.4 19.8 22.3255 19.8 21C19.8 19.6745 18.9941 18.6 18 18.6C17.0059 18.6 16.2 19.6745 16.2 21C16.2 22.3255 17.0059 23.4 18 23.4Z',
    'M30 23.4C30.9941 23.4 31.8 22.3255 31.8 21C31.8 19.6745 30.9941 18.6 30 18.6C29.0059 18.6 28.2 19.6745 28.2 21C28.2 22.3255 29.0059 23.4 30 23.4Z',
    'M15.5 26C13.5 29 13.5 30.8333 15.5 31.5C17.5 30.8333 17.5 29 15.5 26Z',
    'M19.5 33.5C22.8333 30.1667 26.6667 29.8333 31 32.5',
  ],
  'Estresado/a': [
    'M13.5 14C15.1667 12.6667 17 12.3333 19 13',
    'M29 13C31 12.3333 32.8333 12.6667 34.5 14',
    'M14 18L19.5 20.5L14 23',
    'M34 18L28.5 20.5L34 23',
    'M15 31.5C21 27.1667 27 27.1667 33 31.5C33.6667 34.5 30.6667 35.3333 24 34C17.3334 35.3333 14.3334 34.5 15 31.5Z',
  ],
  'Enojado/a': [
    'M13 15.5L20 18.5',
    'M35 15.5L28 18.5',
    'M17.5 24.4C18.4941 24.4 19.3 23.3255 19.3 22C19.3 20.6745 18.4941 19.6 17.5 19.6C16.5059 19.6 15.7 20.6745 15.7 22C15.7 23.3255 16.5059 24.4 17.5 24.4Z',
    'M30.5 24.4C31.4941 24.4 32.3 23.3255 32.3 22C32.3 20.6745 31.4941 19.6 30.5 19.6C29.5059 19.6 28.7 20.6745 28.7 22C28.7 23.3255 29.5059 24.4 30.5 24.4Z',
    'M17 33C21.6667 29.3333 26.3333 29.3333 31 33',
  ],
};

const HEAD = 'M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z';
/** "Cansado/a" deja la cabeza abierta arriba a la derecha para las "z". */
const SLEEPY_HEAD =
  'M34.5 7.2C30.36 4.66 25.43 3.71 20.64 4.53C15.84 5.36 11.52 7.9 8.46 11.69C5.41 15.47 3.84 20.24 4.05 25.1C4.26 29.96 6.23 34.58 9.6 38.09C12.96 41.59 17.49 43.76 22.34 44.17C27.18 44.58 32.01 43.22 35.92 40.32C39.83 37.43 42.56 33.22 43.58 28.46C44.61 23.71 43.87 18.75 41.5 14.5';

export const MOOD_LABELS = Object.keys(FACES);

interface MoodFaceProps {
  label: string;
  size?: number;
}

export function MoodFace({ label, size = 48 }: MoodFaceProps) {
  const gradientId = `mood${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const strokes = FACES[label] ?? FACES['En calma'];
  const head = label === 'Cansado/a' ? SLEEPY_HEAD : HEAD;
  const stroke = `url(#${gradientId})`;

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none" accessibilityLabel={label}>
      <Defs>
        <LinearGradient id={gradientId} x1="4" y1="24" x2="44" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={palette.primary} />
          <Stop offset="1" stopColor={palette.secondary} />
        </LinearGradient>
      </Defs>
      {[head, ...strokes].map((d) => (
        <Path key={d} d={d} stroke={stroke} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}
